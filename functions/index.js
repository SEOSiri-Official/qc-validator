const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch"); // Required for the domain verification crawler

// --- INITIALIZE ADMIN SDK (ONCE) ---
admin.initializeApp();

// =========================================================================
// SECTION 1: EXTERNAL EMAIL NOTIFICATIONS (For Public Subscribers)
// =========================================================================

// --- Transporter for Nodemailer (Gmail via App Password) ---
const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: "www.seosiri@gmail.com", // The REAL Gmail login
    pass: "YOUR_GENERATED_APP_PASSWORD" // The 16-digit App Password
  }
});

// --- TRIGGER: New Project Creation (Sends to Public Subscribers) ---
exports.sendNewEntryAlert = functions.firestore
  .document("checklists/{docId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || data.score < 100 || data.agreementStatus === 'drafting') {
        return null;
    }

    const snapshot = await admin.firestore().collection("subscribers").where("isActive", "==", true).get();
    const emails = snapshot.docs.map(doc => doc.data().email).filter(Boolean);
    if (emails.length === 0) return null;

    const reportUrl = `https://qcval.seosiri.com/report/${context.params.docId}`;
    const mailOptions = {
        from: '"QC Validator Alerts" <admin@seosiri.com>',
        to: "admin@seosiri.com",
        bcc: emails,
        subject: `✅ New Certified Product: ${data.title}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="background-color: #111827; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0;">New Verified Entry</h2>
                </div>
                <div style="padding: 30px;">
                    <p style="color: #333; font-size: 16px;">A new product has successfully passed all Quality Control parameters on the SEOSiri Platform.</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <ul style="list-style: none; padding: 0; margin: 0; color: #374151;">
                            <li style="margin-bottom: 10px;"><strong>📦 Product:</strong> ${data.title}</li>
                            <li style="margin-bottom: 10px;"><strong>🏭 Industry:</strong> ${data.industry}</li>
                            <li style="margin-bottom: 0;"><strong>💯 Score:</strong> <span style="color: green; font-weight: bold;">${data.score}% (PASSED)</span></li>
                        </ul>
                    </div>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${reportUrl}" style="background-color: #4F46E5; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Full Report</a>
                    </div>
                </div>
                <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
                    <p style="font-size: 11px; color: #9ca3af; margin: 0;">You received this because you subscribed to QC Alerts at qcval.seosiri.com.</p>
                </div>
            </div>
          `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email alert sent to ${emails.length} subscribers.`);
    } catch (error) {
      console.error("Critical Error sending email:", error);
    }
});

// --- TRIGGER: New Custom Request (Lead Generation) ---
exports.sendNewLeadAlert = functions.firestore
  .document("checklists/{docId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (data.agreementStatus !== 'drafting' || !data.buyerEmail) return null;
    const mailOptions = {
        from: '"QC Validator Leads" <admin@seosiri.com>',
        to: data.sellerEmail,
        subject: `🚀 New Business Lead: ${data.title}`,
        html: `<h3>You have a new custom request!</h3><p><strong>Buyer:</strong> ${data.buyerEmail}</p><p>They have requested a custom QC report based on your listing.</p><p><a href="https://qcval.seosiri.com/dashboard">Go to Dashboard to Chat</a></p>`
    };
    return transporter.sendMail(mailOptions);
});

// =========================================================================
// 2. INTERNAL IN-APP NOTIFICATIONS (For Project Parties)
// =========================================================================

const createNotification = (recipientId, title, message, link) => {
  if (!recipientId) return null;
  return admin.firestore().collection('notifications').add({
    recipientId, title, message, link, isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

exports.onNewChatMessage = functions.firestore
  .document('checklists/{checklistId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (afterData.messages.length > beforeData.messages.length) {
      const newMessage = afterData.messages[afterData.messages.length - 1];
      const recipientId = afterData.uid === newMessage.senderId ? afterData.buyerUid : afterData.uid;
      if (!recipientId) return null;
      const senderName = newMessage.senderEmail.split('@')[0];
      return createNotification(
        recipientId,
        `New Message in "${afterData.title}"`,
        `${senderName}: "${(newMessage.text || newMessage.textOriginal).substring(0, 30)}..."`,
        `/report/${context.params.checklistId}`
      );
    }
    return null;
  });

exports.onProjectSigned = functions.firestore
  .document('checklists/{checklistId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (beforeData.agreementStatus !== 'party_a_signed' && afterData.agreementStatus === 'party_a_signed') {
      return createNotification(
        afterData.buyerUid,
        `Action Required: Sign "${afterData.title}"`,
        `The seller has signed the agreement. Your signature is now required.`,
        `/report/${context.params.checklistId}`
      );
    }
    if (beforeData.agreementStatus !== 'completed' && afterData.agreementStatus === 'completed') {
      return createNotification(
        afterData.uid,
        `Agreement Executed for "${afterData.title}"`,
        `The buyer has signed the agreement. The contract is now complete.`,
        `/report/${context.params.checklistId}`
      );
    }
    return null;
  });

// =========================================================================
// 3. MAINTENANCE (Cron Jobs - Requires Blaze Plan)
// =========================================================================

exports.revertUnmaintainedListings = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const db = admin.firestore();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const snapshot = await db.collection('market_listings')
        .where('lastMaintainedAt', '<', admin.firestore.Timestamp.fromDate(cutoff))
        .get();
    if (snapshot.empty) return null;
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Removed ${snapshot.size} unmaintained listings.`);
    return null;
});

// --- [NEW] Continuous Domain Verification ---
exports.continuousDomainVerification = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const db = admin.firestore();
    const verifiedUsersQuery = db.collection('users').where('isDomainVerified', '==', true);
    const snapshot = await verifiedUsersQuery.get();

    if (snapshot.empty) {
        console.log("No verified users to check.");
        return null;
    }

    const promises = snapshot.docs.map(doc => {
        const userData = doc.data();
        const { verifiedDomain, verificationCode } = userData;
        if (!verifiedDomain || !verificationCode) return Promise.resolve();

        return fetch(`https://${verifiedDomain}`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.text();
            })
            .then(html => {
                const expectedTag = `<meta name="qc-validator-verification" content="${verificationCode}">`;
                if (!html.includes(expectedTag)) {
                    console.log(`Verification failed for ${verifiedDomain}. Revoking status.`);
                    return doc.ref.update({ isDomainVerified: false });
                }
            })
            .catch(error => console.error(`Error fetching ${verifiedDomain}:`, error));
    });

    await Promise.all(promises);
    console.log(`Completed verification checks for ${snapshot.size} users.`);
    return null;
});

// =========================================================================
// 4. SOURCING REQUESTS (Reverse Marketplace)
// =========================================================================

exports.onNewSourcingRequest = functions.firestore
  .document('sourcing_requests/{requestId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    // --- SECURITY GATE: Ignore spam/unverified requests ---
    if (data.status !== 'verified') {
        console.log(`Request skipped: User status is ${data.status}`);
        return null; 
    }
    
    // 1. Get ALL users (In future, query for specific industry suppliers)
    const usersSnap = await admin.firestore().collection('users').get();
    
    // 2. Prepare Batch Write (More efficient than loop)
    const batch = admin.firestore().batch();
    
    let count = 0;
    usersSnap.forEach(userDoc => {
        // Create a notification for every user
        const notifRef = admin.firestore().collection('notifications').doc();
        batch.set(notifRef, {
            recipientId: userDoc.id,
            title: `📢 New Sourcing Request: ${data.product}`,
            message: `A buyer is looking for ${data.product}. Contact: ${data.email}`,
            link: '/dashboard', 
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        count++;
    });

    // 3. Commit
    await batch.commit();
    console.log(`Sent sourcing alert to ${count} users.`);
    return null;
});

// ... (your existing imports and functions) ...

// Helper function to award a badge
const awardBadge = async (userId, badgeId) => {
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return;

    const userData = userDoc.data();
    // Check if the user already has this badge to prevent duplicates
    if (userData.achievedBadges && userData.achievedBadges.includes(badgeId)) {
        console.log(`User ${userId} already has badge ${badgeId}.`);
        return;
    }

    // Award the badge
    await userRef.update({
        achievedBadges: admin.firestore.FieldValue.arrayUnion(badgeId)
    });
    
    // Create an in-app notification for the user
    createNotification(
        userId,
        `🏆 Badge Unlocked: ${badgeId.replace('-', ' ').toUpperCase()}`,
        `Congratulations! You've earned a new badge for your profile.`,
        `/profile/${userId}` // Link to their profile page
    );
};


// --- TRIGGER 1: Award "Initiator" Badge on First Report Creation ---
exports.onFirstReportCreated = functions.firestore
    .document('checklists/{checklistId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const userId = data.uid;
        
        // Award the 'first-report' badge
        await awardBadge(userId, 'first-report');
        return null;
    });


// --- TRIGGER 2: Award "Perfectionist" Badge on First 100% Score ---
exports.onFirstHundredScore = functions.firestore
    .document('checklists/{checklistId}')
    .onUpdate(async (change, context) => {
        const beforeData = change.before.data();
        const afterData = change.after.data();
        const userId = afterData.uid;

        // Check if score changed from < 100 to 100
        if (beforeData.score < 100 && afterData.score === 100) {
            await awardBadge(userId, 'first-100-score');
        }
        return null;
    });


// --- TRIGGER 3: Award "Deal Maker" Badge on First Completed Agreement ---
exports.onFirstSale = functions.firestore
    .document('checklists/{checklistId}')
    .onUpdate(async (change, context) => {
        const beforeData = change.before.data();
        const afterData = change.after.data();
        const sellerId = afterData.uid;

        // Check if agreement status changed to 'completed'
        if (beforeData.agreementStatus !== 'completed' && afterData.agreementStatus === 'completed') {
            await awardBadge(sellerId, 'first-sale');
        }
        return null;
    });

    // --- TRIGGER: On New User Creation (For Referral Program) ---
exports.processReferral = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const newUser = snap.data();
    const newUserId = context.params.userId;
    const referredByCode = newUser.referredByCode;

    // Exit if the user was not referred
    if (!referredByCode) {
      console.log(`User ${newUserId} was not referred.`);
      return null;
    }
    
    // Find the user who owns the referral code
    const referrerQuery = admin.firestore().collection('users')
        .where('referralCode', '==', referredByCode)
        .limit(1);
    
    const referrerSnap = await referrerQuery.get();

    if (referrerSnap.empty) {
        console.error(`Referral code ${referredByCode} not found for user ${newUserId}.`);
        return null;
    }

    const referrerDoc = referrerSnap.docs[0];
    const referrerId = referrerDoc.id;
    
    // Create a batch to update both users at once
    const batch = admin.firestore().batch();
    
    // 1. Award reward to the NEW user
    const newUserRef = admin.firestore().collection('users').doc(newUserId);
    batch.update(newUserRef, { 
        // Example: Give them a "Referred" badge
        badges: admin.firestore.FieldValue.arrayUnion('Referred'),
        referredBy: referrerId // Store the UID of the referrer
    });

    // 2. Award reward to the REFERRER
    batch.update(referrerDoc.ref, {
        // Example: Increment their referral count
        referralCount: admin.firestore.FieldValue.increment(1)
    });

    await batch.commit();
    console.log(`Successfully processed referral. New user: ${newUserId}, Referrer: ${referrerId}.`);
    return null;
  });

  // =========================================================================
// SECTION 3: AUTOMATED REMINDERS & SUGGESTIONS (CRON JOBS)
// =========================================================================

// --- FUNCTION 1: Task Reminders ---
// This function runs automatically once every 24 hours to find incomplete tasks.
exports.sendTaskReminders = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();
    
    // --- SCENARIO 1: Incomplete Drafts (older than 1 day) ---
    const oneDayAgo = new Date();
    oneDayAgo.setDate(now.getDate() - 1);
    const incompleteDraftsQuery = db.collection('checklists')
        .where('score', '==', 0)
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(oneDayAgo));
        
    const draftsSnapshot = await incompleteDraftsQuery.get();
    
    draftsSnapshot.forEach(doc => {
        const data = doc.data();
        createNotification(
            data.uid, 
            "Don't Forget Your Draft!",
            `You started "${data.title}" but haven't added any evidence yet.`,
            `/dashboard`
        );
    });

    // --- SCENARIO 2: Stalled Agreements (older than 3 days) ---
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(now.getDate() - 3);
    const stalledAgreementsQuery = db.collection('checklists')
        .where('agreementStatus', '==', 'party_a_signed')
        .where('updatedAt', '<', admin.firestore.Timestamp.fromDate(threeDaysAgo)); // Requires 'updatedAt' field
        
    const agreementsSnapshot = await stalledAgreementsQuery.get();
        
    agreementsSnapshot.forEach(doc => {
        const data = doc.data();
        if(data.buyerUid) { // Ensure buyer exists
            createNotification(
                data.buyerUid, 
                `Action Required: Sign "${data.title}"`,
                `The agreement is waiting for your signature to be finalized.`,
                `/dashboard`
            );
        }
    });

    console.log(`Sent reminders for ${draftsSnapshot.size} drafts and ${agreementsSnapshot.size} agreements.`);
    return null;
});

// --- FUNCTION 2: Helpful Suggestions Engine ---
exports.sendHelpfulSuggestions = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const db = admin.firestore();
    
    // 1. Get all users who have consented to suggestions
    const usersSnap = await db.collection('users').where('wantsSuggestions', '==', true).get();
    if (usersSnap.empty) {
        console.log("No users have opted in for suggestions.");
        return null;
    }

    // 2. Iterate through each consenting user
    for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        
        // --- DEFINE SUGGESTION RULES ---
        
        // Rule: Check for Pharma activity
        const pharmaChecklists = await db.collection('checklists').where('uid', '==', userId).where('industry', '==', 'Pharmaceuticals & Biotech').limit(1).get();
        if (!pharmaChecklists.empty) {
            createNotification(userId, "Pharma QC Tip", "Read our guide on maintaining EU-GMP cold chain integrity.", "/press/pharma-cold-chain-guide");
            continue; // Move to the next user
        }

        // Rule: Check for Construction activity
        const constructionChecklists = await db.collection('checklists').where('uid', '==', userId).where('industry', '==', 'Construction & Civil Engineering').limit(1).get();
        if (!constructionChecklists.empty) {
            createNotification(userId, "Construction Pro Tip", "Learn about ASTM standards for concrete compressive strength.", "/press/astm-concrete-standards");
            continue;
        }

        // Rule: Check for Food & Agriculture activity
        const agricultureChecklists = await db.collection('checklists').where('uid', '==', userId).where('industry', '==', 'Agriculture & Produce').limit(1).get();
        if (!agricultureChecklists.empty) {
            createNotification(userId, "Food Safety Alert", "Is your process HACCP compliant? Read our 7 principles guide.", "/press/haccp-principles-guide");
            continue;
        }
        
        // Rule: Check for Precious Metals activity
        const gemsChecklists = await db.collection('checklists').where('uid', '==', userId).where('industry', '==', 'Precious Metals (Gold/Diamonds)').limit(1).get();
        if (!gemsChecklists.empty) {
            createNotification(userId, "Valuable Insight", "Verifying provenance: A guide to Kimberley & LBMA standards.", "/press/kimberley-provenance-guide");
            continue;
        }
        
        // Rule: Check for Software (SaaS) activity (based on type, not industry)
        const softwareChecklists = await db.collection('checklists').where('uid', '==', userId).where('type', '==', 'software').limit(1).get();
        if (!softwareChecklists.empty) {
            createNotification(userId, "Secure Your SaaS", "Are you OWASP Top 10 compliant? A quick checklist for your app.", "/press/owasp-top-10-saas");
            continue;
        }

        // Rule: Check for general B2B users who haven't listed on the marketplace
        const b2bChecklists = await db.collection('checklists').where('uid', '==', userId).where('businessModel', '==', 'B2B').limit(1).get();
        const userListings = await db.collection('market_listings').where('sellerId', '==', userId).limit(1).get();
        if (!b2bChecklists.empty && userListings.empty) {
             createNotification(userId, "Grow Your Business", "You've verified a B2B product. Time to list it on the Town Hall!", "/marketplace");
             continue;
        }
    }
    
    console.log(`Checked for helpful suggestions for ${usersSnap.size} users.`);
    return null;
});

// Add this to your functions/index.js

// This function runs every 24 hours
exports.triggerSitemapRevalidation = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    console.log('Pinging Vercel to revalidate sitemap...');
    
    try {
        const response = await fetch('https://qcval.seosiri.com/api/revalidate-sitemap', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${functions.config().cron.secret}` // Use Firebase environment config
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to revalidate: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Successfully triggered sitemap revalidation:', data);
        return null;
        
    } catch (error) {
        console.error('Error triggering sitemap revalidation:', error);
        return null;
    }
});

// --- TRIGGER: New Dispute Filed ---
exports.onDisputeCreated = functions.firestore
  .document('disputes/{disputeId}')
  .onCreate(async (snap, context) => {
    const dispute = snap.data();
    
    // Notify the SELLER that a dispute has been opened against them
    return createNotification(
      dispute.sellerId,
      `⚠️ Dispute Filed: ${dispute.checklistId.slice(0,8)}`,
      `A buyer has filed a dispute. Action is required.`,
      `/disputes/${context.params.disputeId}` // Link to the new dispute page
    );
  });