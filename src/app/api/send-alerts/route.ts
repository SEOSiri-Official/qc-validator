import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import * as nodemailer from 'nodemailer';

// Mark as dynamic so it doesn't get cached
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Find new, high-quality projects from the last hour
    // Using a slightly wider 70-min window to account for server drift
    const seventyMinutesAgo = new Date(Date.now() - 70 * 60 * 1000);
    const projectsQuery = db.collection('checklists')
      .where('score', '==', 100)
      .where('createdAt', '>=', seventyMinutesAgo);
      
    const projectsSnap = await projectsQuery.get();
    
    if (projectsSnap.empty) {
      return NextResponse.json({ message: "No new projects to announce." });
    }

    // 3. Get all active subscribers
    const subscribersSnap = await db.collection('subscribers').where('isActive', '==', true).get();
    const subscriberEmails = subscribersSnap.docs.map(doc => doc.data().email);
    
    if (subscriberEmails.length === 0) {
      return NextResponse.json({ message: "No subscribers to notify." });
    }

    // 4. Set up Nodemailer using secure Environment Variables
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // 5. Send emails
    for (const doc of projectsSnap.docs) {
      const project = doc.data();
      const reportUrl = `https://qcval.seosiri.com/report/${doc.id}`;
      
      await transporter.sendMail({
        // UPDATE: Clean, Professional Sender Name
        from: '"QC Validator Global" <www.seosiri@gmail.com>',
        to: "alerts@qcval.seosiri.com", // Placeholder
        bcc: subscriberEmails, // Send to all subscribers
        subject: `✅ New Verified Product: ${project.title}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #4F46E5;">New High-Quality Product Verified</h2>
            <p>A new product has been successfully verified on the QC Validator Global platform with a 100% score.</p>
            <ul style="background: #f3f4f6; padding: 20px; border-radius: 8px; list-style: none;">
              <li><strong>Product:</strong> ${project.title}</li>
              <li><strong>Industry:</strong> ${project.industry}</li>
              <li><strong>Standard:</strong> ${project.standard}</li>
            </ul>
            <br>
            <a href="${reportUrl}" style="padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View Full QC Report</a>
            <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #888;">You received this because you subscribed to alerts on qcval.seosiri.com.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true, sentTo: subscriberEmails.length, projectCount: projectsSnap.size });

  } catch (error: any) {
    console.error('Failed to send alerts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}