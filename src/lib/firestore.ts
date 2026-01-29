// src/lib/firestore.ts

import { db } from '@/lib/firebase';
import { 
  collection, addDoc, getDocs, query, where, 
  doc, updateDoc, onSnapshot, arrayUnion, serverTimestamp,
  increment, setDoc, runTransaction, arrayRemove // arrayRemove is crucial for toggling
} from 'firebase/firestore';
import { Checklist, ChatMessage, Standard, QCType, BusinessModel, ChecklistItem } from '@/lib/knowledgeBase';


// --- SUBSCRIBE (REAL-TIME) FUNCTIONS ---

/**
 * Subscribes to the community-contributed national standards collection.
 * @param onUpdate Callback function to update the component's state.
 * @returns An unsubscribe function to be called on component unmount.
 */
export const subscribeToCommunityStandards = (onUpdate: (standards: any[]) => void) => {
  const standardsQuery = query(collection(db, "nationalStandards"));
  return onSnapshot(standardsQuery, (snapshot) => {
    const standardsList: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sorting by endorsement count descending
    standardsList.sort((a, b) => (b.endorsementCount || 0) - (a.endorsementCount || 0));
    onUpdate(standardsList);
  });
};

/**
 * Subscribes to a user's checklists, including those they created (seller) or were invited to (buyer).
 * Handles real-time updates for checklists, meeting notifications, and chat.
 * @returns An unsubscribe function.
 */
export const subscribeToChecklists = (
    userId: string, 
    userEmail: string, 
    onUpdate: (checklists: Checklist[]) => void,
    onNotify: (notification: any) => void,
    onChatUpdate: (updatedChecklist: Checklist) => void,
    activeChatId?: string
    ) => {
    
    if (!userEmail || !userId) return () => {};

    const sellerQuery = query(collection(db, "checklists"), where("uid", "==", userId));
    const buyerQuery = query(collection(db, "checklists"), where("buyerEmail", "==", userEmail));
    
    let combinedLists: Record<string, Checklist> = {};

    const processSnapshot = (snapshot: any) => {
        snapshot.forEach((doc: any) => {
            combinedLists[doc.id] = { id: doc.id, ...doc.data() } as Checklist;
        });

        const allChecklists = Object.values(combinedLists).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        onUpdate(allChecklists);

        snapshot.docChanges().forEach((change: any) => {
            const data = { id: change.doc.id, ...change.doc.data() } as Checklist;
            if (activeChatId && activeChatId === data.id) {
                onChatUpdate(data);
            }
            if (change.type === "modified" && data.meetingStartedAt) {
                const updatedChecklist = data;
                const meetingTimestamp = updatedChecklist.meetingStartedAt?.toDate();
                if (meetingTimestamp && (new Date().getTime() - meetingTimestamp.getTime()) < 60000) {
                    if (updatedChecklist.lastMeetingInitiator !== userId) {
                        onNotify({
                            title: updatedChecklist.title, checklist: updatedChecklist,
                            platform: updatedChecklist.activeMeetingPlatform || 'meet'
                        });
                    }
                }
            }
        });
    };

    const unsubscribeSeller = onSnapshot(sellerQuery, processSnapshot);
    const unsubscribeBuyer = onSnapshot(buyerQuery, processSnapshot);
    
    return () => {
      unsubscribeSeller();
      unsubscribeBuyer();
    };
};


// --- WRITE / UPDATE FUNCTIONS ---

/**
 * Saves a new QC checklist project to Firestore.
 */
export const saveChecklist = async (data: any) => {
    await addDoc(collection(db, "checklists"), {
        ...data,
        createdAt: serverTimestamp(),
    });
};

/**
 * Updates a checklist's status for the digital signature workflow.
 */
export const signAgreement = async (checklistId: string, newStatus: 'party_a_signed' | 'completed') => {
    const checklistRef = doc(db, "checklists", checklistId);
    await updateDoc(checklistRef, { agreementStatus: newStatus });
};

/**
 * Creates a new community-contributed national standard.
 */
export const createNationalStandard = async (standardId: string, data: any) => {
    const standardRef = doc(db, "nationalStandards", standardId);
    await setDoc(standardRef, data);
};

/**
 * Increments/Decrements the endorsement count for a national standard using a transaction.
 * Also toggles the user's UID in the 'endorsedBy' array.
 */
export const endorseStandard = async (standardId: string, userId: string) => { // <-- Now requires userId
    const standardRef = doc(db, "nationalStandards", standardId);

    return runTransaction(db, async (transaction) => {
        const standardDoc = await transaction.get(standardRef);

        if (!standardDoc.exists()) {
            throw new Error("Standard does not exist in the database.");
        }

        const data = standardDoc.data();
        const endorsedBy: string[] = data?.endorsedBy || [];
        const currentCount: number = data?.endorsementCount || 0;
        
        const hasEndorsed = endorsedBy.includes(userId);

        if (hasEndorsed) {
            // User has endorsed -> Remove endorsement
            transaction.update(standardRef, {
                endorsementCount: currentCount - 1,
                endorsedBy: arrayRemove(userId)
            });
            return { endorsed: false, newCount: currentCount - 1 };
        } else {
            // User has not endorsed -> Add endorsement
            transaction.update(standardRef, {
                endorsementCount: currentCount + 1,
                endorsedBy: arrayUnion(userId)
            });
            return { endorsed: true, newCount: currentCount + 1 };
        }
    });
};

/**
 * Posts a new listing to the public marketplace.
 */
export const publishToMarketplace = async (checklist: Checklist, price: string, contact: string, sellerId: string) => {
    const thumbnail = checklist.items.find(i => i.evidenceBefore)?.evidenceBefore || null;
    await addDoc(collection(db, "market_listings"), {
        title: checklist.title, type: checklist.type, industry: checklist.industry, standard: checklist.standard,
        description: `Certified ${checklist.standard} compliant. Passed ${checklist.items.length} QC checks. Score: ${checklist.score}%`,
        price, contact, imageUrl: thumbnail, verifiedAt: serverTimestamp(), sellerId
    });
};

/**
 * Updates a checklist to signal the start of a live meeting.
 * @returns The URL for the meeting to be opened in a new tab.
 */
export const startLiveMeeting = async (checklistId: string, platform: 'teams' | 'meet', initiatorId: string) => {
    let url = platform === 'teams' ? 'https://teams.live.com/_#/meet/new' : 'https://meet.google.com/new';
    const checklistRef = doc(db, "checklists", checklistId);
    await updateDoc(checklistRef, {
      activeMeetingUrl: url,
      activeMeetingPlatform: platform,
      meetingStartedAt: serverTimestamp(),
      lastMeetingInitiator: initiatorId
    });
    return url;
};

/**
 * Adds a new chat message to a checklist's message array.
 */
export const sendChatMessage = async (checklistId: string, newMessage: ChatMessage) => {
    const listRef = doc(db, "checklists", checklistId);
    await updateDoc(listRef, {
        messages: arrayUnion(newMessage)
    });
};