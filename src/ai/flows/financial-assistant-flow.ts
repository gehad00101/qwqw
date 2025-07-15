'use server';
/**
 * @fileOverview A financial assistant AI agent that can answer questions about financial data.
 *
 * - askFinancialAssistant - A function that handles the financial assistant query process.
 * - AskFinancialAssistantInput - The input type for the askFinancialAssistant function.
 * - AskFinancialAssistantOutput - The return type for the askFinancialAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, query, where, getDocs, type Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Helper function to get today's date in YYYY-MM-DD format
const getTodaysDate = () => new Date().toISOString().split('T')[0];

const FinancialDataSchema = z.object({
  branchId: z.string().describe('The ID of the branch to query data for.'),
  startDate: z.string().optional().describe('The start date for the query in YYYY-MM-DD format.'),
  endDate: z.string().optional().describe('The end date for the query in YYYY-MM-DD format.'),
});

const getFinancialData = ai.defineTool(
  {
    name: 'getFinancialData',
    description: 'Retrieves financial data (sales and expenses) for a specific branch within a given date range.',
    inputSchema: FinancialDataSchema,
    outputSchema: z.object({
      totalSales: z.number(),
      totalExpenses: z.number(),
      netProfit: z.number(),
      salesCount: z.number(),
      expensesCount: z.number(),
      topExpenseCategory: z.string().optional(),
    }),
  },
  async ({ branchId, startDate, endDate }) => {
    if (!db) throw new Error('Firestore is not initialized.');

    let totalSales = 0;
    let salesCount = 0;
    let totalExpenses = 0;
    let expensesCount = 0;
    const expenseCategories = new Map<string, number>();

    // Fetch Sales
    const salesQueryConstraints = [where('branchId', '==', branchId)];
    if (startDate) salesQueryConstraints.push(where('date', '>=', startDate));
    if (endDate) salesQueryConstraints.push(where('date', '<=', endDate));
    const salesQuery = query(collection(db, 'sales'), ...salesQueryConstraints);
    const salesSnapshot = await getDocs(salesQuery);
    salesSnapshot.forEach(doc => {
      totalSales += doc.data().amount;
      salesCount++;
    });

    // Fetch Expenses
    const expensesQueryConstraints = [where('branchId', '==', branchId)];
    if (startDate) expensesQueryConstraints.push(where('date', '>=', startDate));
    if (endDate) expensesQueryConstraints.push(where('date', '<=', endDate));
    const expensesQuery = query(collection(db, 'expenses'), ...expensesQueryConstraints);
    const expensesSnapshot = await getDocs(expensesQuery);
    expensesSnapshot.forEach(doc => {
      const data = doc.data();
      totalExpenses += data.amount;
      expensesCount++;
      const category = data.category || 'غير محدد';
      expenseCategories.set(category, (expenseCategories.get(category) || 0) + data.amount);
    });

    const netProfit = totalSales - totalExpenses;
    const topExpenseCategory = [...expenseCategories.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    return { totalSales, totalExpenses, netProfit, salesCount, expensesCount, topExpenseCategory };
  }
);

const AskFinancialAssistantInputSchema = z.object({
  question: z.string().describe('The user\'s question about their financial data.'),
  branchId: z.string().describe('The ID of the branch the user is asking about.'),
});
export type AskFinancialAssistantInput = z.infer<typeof AskFinancialAssistantInputSchema>;

const AskFinancialAssistantOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user\'s question.'),
});
export type AskFinancialAssistantOutput = z.infer<typeof AskFinancialAssistantOutputSchema>;

export async function askFinancialAssistant(input: AskFinancialAssistantInput): Promise<AskFinancialAssistantOutput> {
  return financialAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialAssistantPrompt',
  input: { schema: AskFinancialAssistantInputSchema },
  output: { schema: AskFinancialAssistantOutputSchema },
  tools: [getFinancialData],
  prompt: `You are a friendly and helpful financial assistant for a cafe owner.
Your role is to answer questions about their business finances based on the data provided by the 'getFinancialData' tool.
The user is asking from the context of a specific branch. You MUST use the provided branchId in your tool calls.
Today's date is ${getTodaysDate()}.
When a user asks a vague time-related question (e.g., "this month", "last week"), you must determine the correct 'startDate' and 'endDate' to pass to the tool.
Provide clear, concise, and easy-to-understand answers in Arabic.
If you use the tool and it returns no data (e.g., zero sales), say that you couldn't find any data for that period.
Do not invent or hallucinate data. Only use the information returned by the tool.

User Question: {{{question}}}
Branch ID: {{{branchId}}}`,
});

const financialAssistantFlow = ai.defineFlow(
  {
    name: 'financialAssistantFlow',
    inputSchema: AskFinancialAssistantInputSchema,
    outputSchema: AskFinancialAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        return { answer: "عذراً، لم أتمكن من إيجاد إجابة على سؤالك. حاول طرحه بطريقة مختلفة." };
    }
    return output;
  }
);
