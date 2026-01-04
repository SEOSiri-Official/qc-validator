import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

// This is the ONLY upload function we need. It's generic and reliable.
export async function uploadImageAndGetURL(base64: string, folder: string, userId: string): Promise<string> {
  if (!base64.startsWith('data:image')) {
    throw new Error("Invalid Base64 string for image upload.");
  }
  // Use a dynamic folder path
  const filePath = `${folder}/${userId}/${Date.now()}.webp`;
  const fileRef = ref(storage, filePath);
  
  await uploadString(fileRef, base64, 'data_url');
  const downloadURL = await getDownloadURL(fileRef);
  return downloadURL;
}