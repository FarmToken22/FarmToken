// mining.js - Mining related functions
import { database } from './config.js';
import { ref, get, update, serverTimestamp, runTransaction, push, set } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

export let miningInterval = null;
export let countdownInterval = null;
export let lastDisplayedEarned = -1;

// ========================================
// MINING CALCULATIONS
// ========================================
export function calculateCurrentEarned(userData, appSettings, getServerTime) {
    if (!userData?.miningStartTime) return 0;
    const durationSec = appSettings.mining.miningDuration * 3600;
    const rewardPerSec = appSettings.mining.totalReward / durationSec;
    const now = getServerTime();
    if (now >= userData.miningEndTime) return appSettings.mining.totalReward;
    const elapsed = Math.floor((now - userData.miningStartTime) / 1000);
    return Math.min(elapsed * rewardPerSec, appSettings.mining.totalReward);
}

// ========================================
// COUNTDOWN TIMER
// ========================================
export function startCountdown(endTime, getServerTime, appSettings, stopMining, showNotification) {
    clearInterval(countdownInterval);
    const timer = document.querySelector('#miningBtn .timer-display');
    
    countdownInterval = setInterval(() => {
        const left = Math.max(0, Math.floor((endTime - getServerTime()) / 1000));
        if (timer) timer.textContent = formatTime(left);
        
        if (left <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            stopMining();
            showNotification(`Mining complete! Claim ${appSettings.mining.totalReward} FZ.`);
        }
    }, 1000);
}

function formatTime(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// ========================================
// START MINING
// ========================================
export async function startMining(currentUser, userData, appSettings, getServerTime, showNotification) {
    if (!currentUser) return showNotification('Login required.', 'error');
    if (userData.miningStartTime && getServerTime() < userData.miningEndTime) {
        return showNotification('Mining already active.', 'error');
    }

    const userRef = ref(database, `users/${currentUser.uid}`);
    try {
        const startTime = serverTimestamp();
        const durationMs = appSettings.mining.miningDuration * 3600 * 1000;
        await update(userRef, { miningStartTime: startTime });
        
        const snap = await get(userRef);
        const start = snap.val().miningStartTime;
        await update(userRef, { miningEndTime: start + durationMs });
        
        showNotification(`Mining started for ${appSettings.mining.miningDuration} hours!`);
    } catch (err) {
        console.error(err);
        showNotification('Failed to start mining.', 'error');
    }
}

// ========================================
// UPDATE MINING DISPLAY
// ========================================
export function updateMiningDisplay(userData, appSettings, getServerTime, calculateEarned, stopMining) {
    if (!userData?.miningStartTime) return;
    
    const earned = calculateEarned(userData, appSettings, getServerTime);
    const rounded = Math.floor(earned * 1e6) / 1e6;
    
    if (rounded === lastDisplayedEarned) {
        requestAnimationFrame(() => updateMiningDisplay(userData, appSettings, getServerTime, calculateEarned, stopMining));
        return;
    }
    lastDisplayedEarned = rounded;

    const text = `${rounded.toFixed(6)} FZ`;
    document.getElementById('currentEarned')?.setAttribute('textContent', text);
    document.getElementById('earnedDisplay')?.setAttribute('textContent', text);

    if (getServerTime() >= userData.miningEndTime) {
        stopMining();
    } else {
        requestAnimationFrame(() => updateMiningDisplay(userData, appSettings, getServerTime, calculateEarned, stopMining));
    }
}

// ========================================
// STOP MINING
// ========================================
export function stopMining() {
    miningInterval = null;
    const btn = document.getElementById('miningBtn');
    const status = document.getElementById('miningStatus');
    
    if (btn) {
        btn.classList.add('claim');
        btn.disabled = false;
        btn.querySelector('.timer-display')?.setAttribute('textContent', 'Claim');
    }
    if (status) {
        status.textContent = 'Ready to Claim';
        status.className = 'mining-status';
    }
}

// ========================================
// CLAIM MINING REWARD
// ========================================
export async function claimMiningReward(currentUser, userData, appSettings, getServerTime, showNotification, showAdModal, checkReferralMilestones) {
    const userRef = ref(database, `users/${currentUser.uid}`);
    const now = getServerTime();
    const reward = appSettings.mining.totalReward;

    try {
        const result = await runTransaction(userRef, (data) => {
            if (!data || !data.miningStartTime || now < data.miningEndTime) return;
            return {
                ...data,
                balance: (data.balance || 0) + reward,
                totalMined: (data.totalMined || 0) + reward,
                miningStartTime: null,
                miningEndTime: null
            };
        });

        if (result.committed) {
            await recordMiningTransaction(currentUser.uid, reward);
            showNotification(`Claimed ${reward.toFixed(2)} FZ!`);
            showAdModal();
            if (userData.referredBy) await checkReferralMilestones(currentUser.uid);
        } else {
            showNotification('Not ready.', 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification('Claim failed.', 'error');
    }
}

async function recordMiningTransaction(uid, amount) {
    const txRef = push(ref(database, `users/${uid}/transactions`));
    await set(txRef, { 
        type: 'mining', 
        amount, 
        description: 'Mining Reward', 
        timestamp: serverTimestamp(), 
        status: 'completed' 
    });
}

// ========================================
// CLEANUP
// ========================================
export function cleanupMining() {
    clearInterval(miningInterval);
    clearInterval(countdownInterval);
    miningInterval = countdownInterval = null;
}