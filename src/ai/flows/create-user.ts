// This flow is intended to be run on a secure server environment
// where Firebase Admin SDK can be initialized.
'use server';

/**
 * @fileOverview Creates a new user in Firebase Authentication and their profile in Firestore.
 * This should be run in a secure server-side environment.
 * - createUser - A function to create a user.
 * - CreateUserInput - The input type for the createUser function.
 * - CreateUserOutput - The return type for the createUser function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeApp, getApps, App, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Define schemas using Zod
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

// Main exported function that calls the flow
export async function createUser(input: CreateUserInput): Promise<CreateUserOutput> {
  return createUserFlow(input);
}

// Helper function to initialize Firebase Admin SDK
function initializeFirebaseAdmin(): App {
    if (getApps().length > 0) {
        return getApp();
    }
    const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
    if (!serviceAccount) {
        throw new Error("FIREBASE_ADMIN_SERVICE_ACCOUNT environment variable is not set.");
    }
    try {
        const serviceAccountJson = JSON.parse(serviceAccount);
        return initializeApp({
            credential: cert(serviceAccountJson),
        });
    } catch (e: any) {
        throw new Error(`Failed to parse FIREBASE_ADMIN_SERVICE_ACCOUNT: ${e.message}`);
    }
}

// Define the Genkit flow
const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: CreateUserOutputSchema,
  },
  async (input) => {
    try {
      const adminApp = initializeFirebaseAdmin();
      const adminAuth = getAuth(adminApp);
      const adminDb = getFirestore(adminApp);

      // Create user in Firebase Authentication
      const userRecord = await adminAuth.createUser({
        email: input.email,
        password: input.password,
        emailVerified: true, // Or false, depending on your flow
        disabled: false,
      });

      // Create user profile in Firestore
      const userProfile = {
        uid: userRecord.uid,
        email: input.email,
        role: input.role,
        ...(input.role === 'manager' && input.branchId && { branchId: input.branchId }),
      };

      await adminDb.collection('users').doc(userRecord.uid).set(userProfile);

      return {
        uid: userRecord.uid,
        success: true,
      };
    } catch (error: any) {
        console.error("Error in createUserFlow:", error);
        // Map common Firebase Admin SDK errors to user-friendly messages
        let errorMessage = 'An unexpected error occurred.';
        if (error.code === 'auth/email-already-exists') {
            errorMessage = 'هذا البريد الإلكتروني مسجل بالفعل.';
        } else if (error.code === 'auth/invalid-password') {
            errorMessage = 'كلمة المرور ضعيفة جدًا.';
        }
      return {
        uid: '',
        success: false,
        error: errorMessage,
      };
    }
  }
);
