// referral.js - Referral system functions
import { database } from './config.js';
import { ref, get, query, orderByChild, equalTo, runTransaction, serverTimestamp, push, set } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// ========================================
// SUBMIT REFERRAL CODE
// ========================================
export async function submitReferralCode(currentUser, userData, appSettings, showStatus) {
    const input = document.getElementById('referralCodeInput');
    const statusEl = document.getElementById('referralStatus');
    const code = input?.value.trim().toUpperCase();
    
    if (!code) return showStatus(statusEl, 'Enter a code.', true);
    if (userData.referredBy) return showStatus(statusEl, 'Already used.', true);
    if (code === userData.referralCode) return showStatus(statusEl, 'Cannot use own code.', true);

    try {
        const q = query(ref(database, 'users'), orderByChild('referralCode'), equalTo(code));
        const snap = await get(q);
        
        if (!snap.exists()) return showStatus(statusEl, 'Invalid code.', true);

        const referrerId = Object.keys(snap.val())[0];
        if (referrerId === currentUser.uid) return showStatus(statusEl, 'Cannot use own.', true);

        const userRef = ref(database, `users/${currentUser.uid}`);
        const result = await runTransaction(userRef, (data) => {
            if (!data || data.referredBy) return;
            return { 
                ...data, 
                referredBy: code, 
                referralRewards: (data.referralRewards || 0) + appSettings.referral.referralBonus 
            };
        });

        if (!result.committed) return showStatus(statusEl, 'Already submitted.', true);

        await updateReferrer(referrerId, currentUser.uid, appSettings);
        await recordReferralTransactions(currentUser.uid, referrerId, appSettings);
        
        showStatus(statusEl, `Success! +${appSettings.referral.referralBonus} FZ!`);
        input.value = '';
    } catch (err) {
        console.error(err);
        showStatus(statusEl, 'Failed. Try again.', true);
    }
}

// ========================================
// UPDATE REFERRER
// ========================================
async function updateReferrer(referrerId, refereeId, appSettings) {
    const refPath = ref(database, `users/${referrerId}`);
    await runTransaction(refPath, (data) => {
        if (!data || data.referrals?.[refereeId]) return;
        return {
            ...data,
            referralRewards: (data.referralRewards || 0) + appSettings.referral.referralBonus,
            referrals: { ...(data.referrals || {}), [refereeId]: true }
        };
    });
}

// ========================================
// RECORD REFERRAL TRANSACTIONS
// ========================================
async function recordReferralTransactions(refereeId, referrerId, appSettings) {
    const txRef1 = push(ref(database, `users/${refereeId}/transactions`));
    const txRef2 = push(ref(database, `users/${referrerId}/transactions`));
    const bonus = appSettings.referral.referralBonus;
    
    await Promise.all([
        set(txRef1, { 
            type: 'referral', 
            amount: bonus, 
            description: 'Join Bonus', 
            timestamp: serverTimestamp(), 
            status: 'completed' 
        }),
        set(txRef2, { 
            type: 'referral', 
            amount: bonus, 
            description: 'Referral Bonus', 
            timestamp: serverTimestamp(), 
            status: 'completed' 
        })
    ]);
}

// ========================================
// CLAIM REFERRAL REWARDS
// ========================================
export async function claimReferralRewards(currentUser, userData, showNotification, showAdModal) {
    if (!userData || userData.referralRewards <= 0) {
        return showNotification('No rewards.', 'error');
    }
    
    const amount = userData.referralRewards;
    const userRef = ref(database, `users/${currentUser.uid}`);

    const result = await runTransaction(userRef, (data) => {
        if (!data || data.referralRewards <= 0) return;
        return { 
            ...data, 
            balance: (data.balance || 0) + data.referralRewards, 
            referralRewards: 0 
        };
    });

    if (result.committed) {
        const txRef = push(ref(database, `users/${currentUser.uid}/transactions`));
        await set(txRef, { 
            type: 'referral', 
            amount, 
            description: 'Referral Claim', 
            timestamp: serverTimestamp(), 
            status: 'completed' 
        });
        
        showNotification(`Claimed ${amount.toFixed(2)} FZ!`);
        showAdModal();
    }
}

// ========================================
// CHECK REFERRAL MILESTONES
// ========================================
export async function checkReferralMilestones(refereeId, appSettings) {
    const snap = await get(ref(database, `users/${refereeId}`));
    if (!snap.exists()) return;
    
    const referee = snap.val();
    if (!referee.referredBy) return;

    const q = query(ref(database, 'users'), orderByChild('referralCode'), equalTo(referee.referredBy));
    const referrerSnap = await get(q);
    if (!referrerSnap.exists()) return;

    const referrerId = Object.keys(referrerSnap.val())[0];
    const referrer = referrerSnap.val()[referrerId];
    const total = referee.totalMined || 0;
    const milestone = appSettings.referral.referralMilestone;
    const achieved = Math.floor(total / milestone);
    const previous = referrer.referralMilestones?.[refereeId] || 0;

    if (achieved > previous) {
        const bonus = (achieved - previous) * appSettings.referral.referralBonus;
        await grantMilestoneBonus(referrerId, refereeId, achieved, bonus, appSettings);
    }
}

// ========================================
// GRANT MILESTONE BONUS
// ========================================
async function grantMilestoneBonus(referrerId, refereeId, count, bonus, appSettings) {
    const refPath = ref(database, `users/${referrerId}`);
    await runTransaction(refPath, (data) => {
        if (!data) return;
        return {
            ...data,
            referralRewards: (data.referralRewards || 0) + bonus,
            referralMilestones: { ...(data.referralMilestones || {}), [refereeId]: count }
        };
    });

    const txRef = push(ref(database, `users/${referrerId}/transactions`));
    await set(txRef, {
        type: 'referral', 
        amount: bonus,
        description: `Milestone (${count * appSettings.referral.referralMilestone} FZ)`,
        timestamp: serverTimestamp(), 
        status: 'completed'
    });
}

// ========================================
// COPY REFERRAL CODE
// ========================================
export function copyReferralCode(showNotification) {
    const code = document.getElementById('refCode')?.textContent;
    if (!code || code === '---') return showNotification('No code.', 'error');
    
    navigator.clipboard.writeText(code).then(() => showNotification('Copied!'));
}

// ========================================
// SHARE REFERRAL CODE
// ========================================
export function shareReferralCode(platform, appSettings, showNotification) {
    const code = document.getElementById('refCode')?.textContent;
    if (!code || code === '---') return showNotification('No code.', 'error');
    
    const text = `Join FarmZone! Use code: ${code} and get ${appSettings.referral.referralBonus} FZ bonus!`;
    const url = platform === 'whatsapp'
        ? `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
        : `https://t.me/share/url?url=https://farmzone.com&text=${encodeURIComponent(text)}`;
    
    window.open(url, '_blank');
}