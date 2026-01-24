import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // --- 1. SECURE AUTHENTICATION ---
    const idToken = request.headers.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ success: false, message: "Unauthorized: No token provided" }, { status: 401 });
    }

    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json({ success: false, message: "Unauthorized: Invalid token" }, { status: 401 });
    }
    
    const userId = decodedToken.uid; 
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json({ success: false, message: "Domain is required." }, { status: 400 });
    }

    // --- 2. FETCH EXPECTED CODE ---
    const userRef = db.collection('users').doc(userId); 
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ success: false, message: "User profile not found." }, { status: 404 });
    }
    const userData = userSnap.data();
    const expectedCode = userData?.verificationCode;

    if (!expectedCode) {
      return NextResponse.json({ success: false, message: "No verification code generated." }, { status: 400 });
    }

    // --- 3. ROBUST URL STRATEGY ---
    // Clean the input to get the base domain
    let cleanInput = domain.toLowerCase().trim();
    cleanInput = cleanInput.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Generate candidates to check. Order matters (HTTPS preferred).
    // This solves the issue where seosiri.com fails but www.seosiri.com works.
    const candidates = [
        `https://${cleanInput}`,
        `https://www.${cleanInput}`,
        `http://${cleanInput}`, 
        `http://www.${cleanInput}`
    ];

    // Remove duplicates (e.g. if user typed www.seosiri.com, don't check it twice)
    const urlsToTry = [...new Set(candidates)];
    
    console.log(`Checking variations for: ${cleanInput}`);

    let verified = false;
    let successfulUrl = '';

    // --- 4. ATTEMPT FETCH ON EACH CANDIDATE ---
    for (const url of urlsToTry) {
        try {
            console.log(`Trying: ${url}...`);
            // Set a short timeout so we don't wait forever on a broken link
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout per try

            const response = await fetch(url, { 
                redirect: 'follow', 
                signal: controller.signal 
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const html = await response.text();
                const $ = cheerio.load(html);
                const metaTag = $(`meta[name="qc-validator-verification"]`);
                const foundCode = metaTag.attr('content');

                if (foundCode && foundCode === expectedCode) {
                    verified = true;
                    successfulUrl = url;
                    break; // Stop the loop, we found it!
                }
            }
        } catch (err) {
            console.log(`Failed to reach ${url}, trying next candidate...`);
            // Continue to next URL in loop
        }
    }

    // --- 5. RESULT ---
    if (verified) {
      await userRef.update({ 
          isDomainVerified: true, 
          verifiedDomain: cleanInput, 
          verificationCode: null 
      });
      return NextResponse.json({ success: true, message: `Domain verified successfully via ${successfulUrl}!` });
    } else {
      return NextResponse.json({ success: false, message: `Could not find meta tag on ${cleanInput} or www.${cleanInput}.` }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json({ success: false, message: `Server Error: ${error.message}` }, { status: 500 });
  }
}