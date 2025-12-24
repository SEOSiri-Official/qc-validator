// src/lib/storage.ts
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export async function uploadImageAndGetURL(base64: string, userId: string): Promise<string> {
  if (!base64.startsWith('data:image')) {
    throw new Error("Invalid Base64 string for image upload.");
  }
  const fileRef = ref(storage, `evidence/${userId}/${Date.now()}.webp`);
  const snapshot = await uploadString(fileRef, base64, 'data_url');
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}