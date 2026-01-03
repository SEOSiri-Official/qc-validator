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


// --- NEW FUNCTION (ADDED) ---
// Used specifically for dispute evidence, includes compression.
export const uploadDisputeEvidence = async (file: File, disputeId: string, userId: string) => {
  if (!file || !disputeId || !userId) return null;

  // Compression options to target ~100KB for lightweight storage
  const options = {
    maxSizeMB: 0.1, // Max size 100KB
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  };

  try {
    // 1. Compress the image file
    const compressedFile = await imageCompression(file, options);
    
    // 2. Convert the compressed file to a Base64 Data URL
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
    });
    const base64String = await base64Promise;
    
    // 3. Define the storage path
    const filePath = `disputes/${disputeId}/${userId}_${Date.now()}.jpg`;
    const storageRef = ref(storage, filePath);
    
    // 4. Upload the Base64 string
    await uploadString(storageRef, base64String, 'data_url');
    
    // 5. Get the public download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;

  } catch (error) {
    console.error('Dispute evidence upload failed:', error);
    return null;
  }
};