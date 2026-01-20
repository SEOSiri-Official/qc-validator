import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin'; // Firestore Admin SDK
import { getAuth, DecodedIdToken } from 'firebase-admin/auth'; // Firebase Admin Auth SDK
import * as cheerio from 'cheerio'; // For robust HTML parsing

// Mark as dynamic to prevent caching issues with external HTTP requests
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // --- 1. SERVER-SIDE AUTHENTICATION (From your EXISTING code) ---
    const idToken = request.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      console.error("Verification API: Unauthorized - No token provided");
      return new Response('Unauthorized: No token provided', { status: 401 });
    }

    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Verification API: Token verification failed:", error);
      return new Response('Unauthorized: Invalid token', { status: 401 });
    }
    
    // SECURE: Use the UID from the verified token, NOT from the client's request body.
    const userId = decodedToken.uid; 
    
    // --- Get domain from request body ---
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json({ success: false, message: "Domain is required." }, { status: 400 });
    }

    // 1. Fetch the user's expected verification code from Firestore (using Admin SDK)
    const userRef = db.collection('users').doc(userId); 
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ success: false, message: "User profile not found." }, { status: 404 });
    }
    const userData = userSnap.data();
    const expectedCode = userData?.verificationCode;

    if (!expectedCode) {
      return NextResponse.json({ success: false, message: "No verification code generated for this user." }, { status: 400 });
    }

    // 2. Construct the URL to check
    let urlToCheck = domain;
    if (!urlToCheck.startsWith('http://') && !urlToCheck.startsWith('https://')) {
      urlToCheck = `https://${urlToCheck}`; // Always default to HTTPS
    }

    console.log(`Verifying meta tag on: ${urlToCheck} for user: ${userId}`); // Added logging for debugging

    // 3. Fetch the website's HTML (robustly)
const response = await fetch(urlToCheck, { redirect: 'follow' }); // Removed timeout as it's not supported by Node.js fetch // Follow redirects, 8s timeout
    if (!response.ok) {
        console.error(`Failed to fetch ${urlToCheck}: ${response.status} ${response.statusText}`);
        return NextResponse.json({ success: false, message: `Failed to access ${domain}. Status: ${response.status}` }, { status: response.status });
    }

    const html = await response.text();

    // 4. Parse HTML with Cheerio and find the meta tag
    const $ = cheerio.load(html);
    const metaTag = $(`meta[name="qc-validator-verification"]`);
    const foundCode = metaTag.attr('content');

    console.log(`Expected Code: ${expectedCode}`);
    console.log(`Found Code: ${foundCode || 'Not Found'}`);

    // 5. Compare codes
    if (foundCode && foundCode === expectedCode) {
      // 6. Update user's verification status (using Admin SDK)
      await userRef.update({ isDomainVerified: true, verifiedDomain: domain, verificationCode: null });
      console.log(`✅ User ${userId} domain ${domain} verified successfully.`);
      return NextResponse.json({ success: true, message: "Domain verified successfully!" });
    } else {
      console.log(`❌ User ${userId} verification failed: tag not found or code mismatch.`);
      return NextResponse.json({ success: false, message: "Verification meta tag not found or code mismatch." }, { status: 400 });
    }

  } catch (error: any) {
    console.error("💥 Critical error during domain verification API:", error);
    return NextResponse.json({ success: false, message: `An unexpected server error occurred: ${error.message}` }, { status: 500 });
  }
}