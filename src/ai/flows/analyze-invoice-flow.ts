'use server';
/**
 * @fileOverview An AI flow for analyzing expense invoices from images.
 *
 * - analyzeInvoice - A function that handles the invoice analysis process.
 * - AnalyzeInvoiceInput - The input type for the analyzeInvoice function.
 * - AnalyzeInvoiceOutput - The return type for the analyzeInvoice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeInvoiceInputSchema = z.object({
  invoiceImageUri: z
    .string()
    .describe(
      "An image of an invoice, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeInvoiceInput = z.infer<typeof AnalyzeInvoiceInputSchema>;

const AnalyzeInvoiceOutputSchema = z.object({
  amount: z.number().describe('The total amount found on the invoice.'),
  date: z.string().describe('The date of the invoice in YYYY-MM-DD format.'),
  category: z.enum(['إيجار', 'رواتب', 'مشتريات', 'فواتير', 'صيانة', 'تسويق', 'أخرى']).describe('The most relevant expense category for the invoice items.'),
  description: z.string().describe('A brief summary or description of the items on the invoice.'),
});
export type AnalyzeInvoiceOutput = z.infer<typeof AnalyzeInvoiceOutputSchema>;


export async function analyzeInvoice(input: AnalyzeInvoiceInput): Promise<AnalyzeInvoiceOutput> {
  return analyzeInvoiceFlow(input);
}


const prompt = ai.definePrompt({
  name: 'analyzeInvoicePrompt',
  input: {schema: AnalyzeInvoiceInputSchema},
  output: {schema: AnalyzeInvoiceOutputSchema},
  prompt: `You are an expert accounting assistant. Your task is to analyze an image of an invoice and extract key information.

Analyze the provided invoice image. Extract the total amount, the date of the invoice (format it as YYYY-MM-DD), and generate a brief, clear description of the purchase.

Based on the invoice content, determine the most appropriate expense category from the following list: ['إيجار', 'رواتب', 'مشتريات', 'فواتير', 'صيانة', 'تسويق', 'أخرى'].
- If the invoice is for raw materials, food supplies, coffee beans, milk, etc., use 'مشتريات'.
- If it's for electricity, water, or internet bills, use 'فواتير'.
- If it's for rent, use 'إيجار'.
- If it's for employee salaries, use 'رواتب'.
- If it's for repairing equipment, use 'صيانة'.
- If it's for advertising or social media, use 'تسويق'.
- For anything else, use 'أخرى'.

Return the extracted information in the specified JSON format.

Invoice Image: {{media url=invoiceImageUri}}`,
});


const analyzeInvoiceFlow = ai.defineFlow(
  {
    name: 'analyzeInvoiceFlow',
    inputSchema: AnalyzeInvoiceInputSchema,
    outputSchema: AnalyzeInvoiceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
