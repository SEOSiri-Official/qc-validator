import { cookies } from 'next/headers';
import { admin } from '@/lib/firebase-admin';

export async function getCurrentUser() {
  try {
const cookieStore = await cookies(); // Wait for the promise to resolve
const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
      return null;
    }

    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    return null;
  }
}