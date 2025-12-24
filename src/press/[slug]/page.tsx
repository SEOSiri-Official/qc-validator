import { notFound } from 'next/navigation';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import ShareButtons from '@/components/ShareButtons';

// --- START: FIREBASE ADMIN INITIALIZATION ---
try {
  if (!admin.apps.length) {
    const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (e) {
  console.error("Firebase Admin Init Error:", e);
}
// Get DB instance safely
const db = admin.apps.length ? getFirestore() : null;
// --- END INITIALIZATION ---

async function getPost(slug: string) {
  // --- FIX: Check if db exists before using it ---
  if (!db) return null;

  const postDocRef = db.collection('press_releases').doc(slug);
  const postDoc = await postDocRef.get();
  
  if (!postDoc.exists) {
    return null;
  }
  return postDoc.data();
}

// SEO: Generate dynamic metadata for each post
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) {
    return { title: 'Post Not Found' };
  }
  
  return {
    title: `${post.title} | QC Press`,
    description: post.summary,
    openGraph: {
        title: post.title,
        description: post.summary,
        type: 'article',
        publishedTime: new Date(post.publishedAt._seconds * 1000).toISOString(),
        authors: [post.authorName],
    },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) {
    notFound();
  }

  return (
    <div className="bg-white py-16">
      <div className="max-w-3xl mx-auto px-4">
        
        <header>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{post.title}</h1>
            <p className="text-md text-gray-500">
                By {post.authorName} on {new Date(post.publishedAt._seconds * 1000).toLocaleDateString()}
            </p>
        </header>

        {/* Share Buttons Component */}
        <ShareButtons title={post.title} />

        <main className="prose lg:prose-xl mt-8">
            {/* The main content from Firestore */}
            <div dangerouslySetInnerHTML={{ __html: post.content }} />

            {/* Internal Link to Verified Product */}
            {post.linkedProductId && (
                <div className="mt-12 p-4 bg-gray-50 border rounded-lg not-prose">
                    <h3 className="font-bold text-base">Featured Verified Product</h3>
                    <p className="text-sm">This article references a product verified on our platform.</p>
                    <a href={`/report/${post.linkedProductId}`} className="text-indigo-600 font-bold text-sm">
                        View the Full QC Report →
                    </a>
                </div>
            )}
        </main>
      </div>
    </div>
  );
}