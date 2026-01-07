import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import * as nodemailer from 'nodemailer';

export async function POST(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Find new projects from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const projectsQuery = db.collection('checklists')
      .where('score', '==', 100)
      .where('createdAt', '>=', oneHourAgo);
      
    const projectsSnap = await projectsQuery.get();
    if (projectsSnap.empty) {
      return NextResponse.json({ message: "No new projects to announce." });
    }

    // 3. Get subscribers
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
        from: '"QC Validator Alerts" <info@seosiri.com>', // The "From" address users will see
        to: "alerts@qcval.seosiri.com", // A placeholder, BCC is used
        bcc: subscriberEmails,
        subject: `✅ New Verified Product: ${project.title}`,
        html: `
          <h1>New High-Quality Product Alert</h1>
          <p>A new product has been successfully verified on the QC Validator platform.</p>
          <ul>
            <li><strong>Product:</strong> ${project.title}</li>
            <li><strong>Industry:</strong> ${project.industry}</li>
            <li><strong>Standard:</strong> ${project.standard}</li>
          </ul>
          <p><a href="${reportUrl}" style="padding: 10px 15px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">View Full Report</a></p>
          <hr>
          <p style="font-size: 12px; color: #888;">You received this because you subscribed to alerts on qcval.seosiri.com.</p>
        `,
      });
    }

    return NextResponse.json({ success: true, sentTo: subscriberEmails.length, projectCount: projectsSnap.size });

  } catch (error) {
    console.error('Failed to send alerts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}