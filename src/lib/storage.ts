import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import imageCompression from 'browser-image-compression';

// --- EXISTING FUNCTION (UNCHANGED) ---
// Used for the main QC evidence upload.
export async function uploadImageAndGetURL(base64: string, userId: string): Promise<string> {
  if (!base64.startsWith('data:image')) {
    throw new Error("Invalid Base64 string for image upload.");
  }
  const fileRef = ref(storage, `evidence/${userId}/${Date.now()}.webp`);
  const snapshot = await uploadString(fileRef, base64, 'data_url');
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}


export const uploadDisputeEvidence = async (file: File, disputeId: string, userId: string) => {
  if (!file || !disputeId || !userId) return null;

  const options = {
    maxSizeMB: 0.1, // 100KB
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  };

  try {
    // 1. Compress the file
    const compressedFile = await imageCompression(file, options);
    
    // 2. Convert to Base64 (This is the key step)
    const base64String = await imageCompression.getDataUrlFromFile(compressedFile);
    
    // 3. Define path and upload the Base64 string
    const filePath = `disputes/${disputeId}/${userId}_${Date.now()}.jpg`;
    const storageRef = ref(storage, filePath);
    await uploadString(storageRef, base64String, 'data_url');
    
    // 4. Get URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;

  } catch (error) {
    console.error('Dispute evidence upload failed:', error);
    return null;
  }
};