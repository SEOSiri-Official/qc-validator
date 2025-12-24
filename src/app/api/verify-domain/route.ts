import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export async function POST(request: Request) {
  // 1. Authenticate the request on the server to get the user's real ID
  const idToken = request.headers.get('authorization')?.split('Bearer ')[1];
  if (!idToken) {
    return new Response('Unauthorized: No token provided', { status: 401 });
  }

  let decodedToken;
  try {
    decodedToken = await getAuth().verifyIdToken(idToken);
  } catch (error) {
    return new Response('Unauthorized: Invalid token', { status: 401 });
  }
  
  // SECURE: Use the UID from the verified token, not from the client's request body.
  const userId = decodedToken.uid; 
  const { domain } = await request.json();

  if (!domain) {
    return NextResponse.json({ error: 'Missing domain' }, { status: 400 });
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userData = userSnap.data();
    if (!userData || !userData.verificationCode) {
        return NextResponse.json({ error: 'No verification code found' }, { status: 400 });
    }
    const { verificationCode } = userData;

    const response = await fetch(`https://${domain}`);
    if (!response.ok) {
        return NextResponse.json({ success: false, message: `Could not fetch ${domain}.` });
    }
    const html = await response.text();

    const expectedTag = `<meta name="qc-validator-verification" content="${verificationCode}">`;
    
    if (html.includes(expectedTag)) {
      await userRef.update({
          isDomainVerified: true,
          verifiedDomain: domain 
      });
      return NextResponse.json({ success: true, message: 'Domain verified successfully!' });
    } else {
      return NextResponse.json({ success: false, message: 'Verification meta tag not found.' });
    }

  } catch (error: any) {
    console.error('Verification process failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}