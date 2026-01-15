import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import * as nodemailer from 'nodemailer';

// Mark as dynamic so it doesn't get cached
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log("🚀 Alert System: Job Started");

  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("❌ Alert System: Authorization Failed");
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. LOG CREDENTIAL STATUS (Do not log the actual passwords)
    console.log(`🔐 Secrets Check: GMAIL_USER=${process.env.GMAIL_USER ? 'Set' : 'Missing'}, PASS=${process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Missing'}`);

    // 3. WIDEN WINDOW TO 24 HOURS (For Testing)
    // This ensures we catch the project you created hours ago
    const timeWindow = new Date(Date.now() - 24 * 60 * 60 * 1000); 
    console.log("⏰ Looking for projects created after:", timeWindow.toISOString());

    const projectsQuery = db.collection('checklists')
      .where('score', '==', 100)
      .where('createdAt', '>=', timeWindow)
      .orderBy('createdAt', 'desc'); // Get newest first
      
    const projectsSnap = await projectsQuery.get();
    
    console.log(`🔎 Database Query Complete. Found: ${projectsSnap.size} projects.`);

    if (projectsSnap.empty) {
      console.log("⚠️ No projects matched the criteria.");
      return NextResponse.json({ message: "No new projects to announce." });
    }

    // 4. Get subscribers
    const subscribersSnap = await db.collection('subscribers').where('isActive', '==', true).get();
    const subscriberEmails = subscribersSnap.docs.map(doc => doc.data().email);
    console.log(`📧 Found ${subscriberEmails.length} active subscribers:`, subscriberEmails);

    if (subscriberEmails.length === 0) {
      return NextResponse.json({ message: "No subscribers to notify." });
    }

    // 5. Configure Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // 6. Verify Connection (New Step)
    try {
        await transporter.verify();
        console.log("✅ Nodemailer connection verified.");
    } catch (verifyError) {
        console.error("❌ Nodemailer Connection Failed:", verifyError);
        throw verifyError;
    }

    // 7. Send ONE email (Process only the latest project to avoid spamming during test)
    const latestDoc = projectsSnap.docs[0];
    const project = latestDoc.data();
    const reportUrl = `https://qcval.seosiri.com/report/${latestDoc.id}`;

    console.log(`📤 Attempting to send email for project: ${project.title}`);

    const info = await transporter.sendMail({
        from: '"QC Validator Alerts" <info@seosiri.com>',
        to: "undisclosed-recipients@qcval.seosiri.com",
        bcc: subscriberEmails,
        subject: `✅ Verified: ${project.title}`,
        html: `
            <h2>New 100% Score Product Verified</h2>
            <p><strong>Product:</strong> ${project.title}</p>
            <p><strong>Standard:</strong> ${project.standard}</p>
            <p><a href="${reportUrl}">View Report</a></p>
        `,
    });

    console.log("✅ Email sent! Message ID:", info.messageId);
    return NextResponse.json({ success: true, sentTo: subscriberEmails.length });

  } catch (error: any) {
    console.error('💥 CRITICAL ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}