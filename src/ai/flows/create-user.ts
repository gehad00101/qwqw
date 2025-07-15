// This file is the entry point for the client-side to call the user creation flow.
// It should NOT contain any server-side code like 'firebase-admin'.
'use server';

/**
 * @fileOverview Creates a new user in Firebase Authentication and their profile in Firestore.
 * This is the client-facing function that invokes the secure backend flow.
 * - createUser - A function to create a user.
 * - CreateUserInput - The input type for the createUser function.
 * - CreateUserOutput - The return type for the createUser function.
 */

import { z } from 'zod';
import { createUserFlow } from './create-user-flow';

// Define schemas using Zod. These are shared between client and server.
export const CreateUserInputSchema = z.object({
  email: z.string().email().describe("The user's email address."),
  password: z.string().min(6).describe("The user's password (at least 6 characters)."),
  role: z.enum(['accountant', 'manager']).describe("The role of the user."),
  branchId: z.string().optional().describe("The branch ID, required if the role is 'manager'."),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const CreateUserOutputSchema = z.object({
  uid: z.string().describe("The new user's unique ID."),
  success: z.boolean().describe("Indicates if the user was created successfully."),
  error: z.string().optional().describe("An error message if creation failed."),
});
export type CreateUserOutput = z.infer<typeof CreateUserOutputSchema>;

// Main exported function that the client component calls.
// This function in turn calls the actual flow which runs on the server.
export async function createUser(input: CreateUserInput): Promise<CreateUserOutput> {
  return createUserFlow(input);
}
