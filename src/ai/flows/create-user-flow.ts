// This flow is intended to be run ONLY on a secure server environment
// where the Firebase Admin SDK can be initialized.
'use server';

/**
 * @fileOverview Contains the actual server-side logic for creating a user.
 * This file uses 'firebase-admin' and should never be imported directly by a client component.
 */

import { ai } from '@/ai/genkit';
import { getApps, initializeApp, getApp, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { CreateUserInputSchema, CreateUserOutputSchema, type CreateUserInput } from './create-user';

// Helper function to initialize Firebase Admin SDK
// This must only be run on the server.
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
export const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: CreateUserOutputSchema,
  },
  async (input: CreateUserInput) => {
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
