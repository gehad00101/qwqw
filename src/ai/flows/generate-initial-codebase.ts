// use server'
'use server';

/**
 * @fileOverview Generates a basic accounting code structure based on user input.
 *
 * - generateInitialCodebase - A function that generates the initial codebase.
 * - GenerateInitialCodebaseInput - The input type for the generateInitialCodebase function.
 * - GenerateInitialCodebaseOutput - The return type for the generateInitialCodebase function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitialCodebaseInputSchema = z.object({
  accountingSystemDescription: z
    .string()
    .describe('The description of the accounting system to create.'),
});
export type GenerateInitialCodebaseInput = z.infer<
  typeof GenerateInitialCodebaseInputSchema
>;

const GenerateInitialCodebaseOutputSchema = z.object({
  codebase: z
    .string()
    .describe('The generated basic code structure for the accounting system.'),
});
export type GenerateInitialCodebaseOutput = z.infer<
  typeof GenerateInitialCodebaseOutputSchema
>;

export async function generateInitialCodebase(
  input: GenerateInitialCodebaseInput
): Promise<GenerateInitialCodebaseOutput> {
  return generateInitialCodebaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInitialCodebasePrompt',
  input: {schema: GenerateInitialCodebaseInputSchema},
  output: {schema: GenerateInitialCodebaseOutputSchema},
  prompt: `You are an expert accounting software engineer.

You will generate a basic code structure for an accounting system based on the user's description.

Description: {{{accountingSystemDescription}}}

Ensure the generated codebase is well-structured and includes essential components for the described accounting system.`,
});

const generateInitialCodebaseFlow = ai.defineFlow(
  {
    name: 'generateInitialCodebaseFlow',
    inputSchema: GenerateInitialCodebaseInputSchema,
    outputSchema: GenerateInitialCodebaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
