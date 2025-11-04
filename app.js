// config.js থেকে import করুন
import { auth, database } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { 
    ref, get, set, update, onValue, query, orderByChild, equalTo, 
    runTransaction, serverTimestamp, push 
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import { sidebarIcons } from './icon.js';

// ========================================
// GLOBALS & CONSTANTS
// ========================================
let currentUser = null;
let userData = null;
let miningInterval = null;
let countdownInterval = null;
let serverTimeOffset = 0;
let lastDisplayedEarned = -1;
let unsubscribeUser = null;
let unsubscribeSettings = null;
let authUnsubscribe = null;

// App Settings
let appSettings = {
    mining: { miningDuration: 8, totalReward: 6 },
    referral: { referralBonus: 5, referralMilestone: 100 }
};

const LEVEL_MILESTONES = [0, 500, 1000, 2000, 5000];
const MAX_LEVEL = LEVEL_MILESTONES.length - 1;

// ========================================
// SETTINGS & SERVER TIME
// ========================================
function listenForSettings() {
    const settingsRef = ref(database, 'settings');
    unsubscribeSettings = onValue(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
            const settings = snapshot.val();
            appSettings.mining = { ...appSettings.mining, ...settings.mining };
            appSettings.referral = { ...appSettings.referral, ...settings.referral };
            console.log("Settings updated:", appSettings);
            updateUI();
        }
    }, (error) => console.error("Settings load failed:", error));
}

onValue(ref(database, '.info/serverTimeOffset'), (snap) => {
    serverTimeOffset = snap.val() || 0;
}, { onlyOnce: true });

function getServerTime() {
    return Date.now() + serverTimeOffset;
}

// Cleanup
function cleanup() {
    if (unsubscribeUser) unsubscribeUser();
    if (unsubscribeSettings) unsubscribeSettings();
    if (authUnsubscribe) authUnsubscribe();
    clearInterval(miningInterval);
    clearInterval(countdownInterval);
    miningInterval = countdownInterval = null;
}
window.addEventListener('beforeunload', cleanup);

// ========================================
// HELPER FUNCTIONS
// ========================================
function showNotification(message, type = 'success') {
    const el = document.getElementById('notification');
    if (!el) return;
    el.textContent = message;
    el.style.background = type === 'success' ? '#28a745' : '#dc3545';
    el.className = 'notification show';
    setTimeout(() => el.className = 'notification', 3000);
}

function showStatus(el, message, isError = false) {
    if (!el) return;
    el.textContent = message;
    el.className = `status ${isError ? 'error' : 'success'} show`;
    setTimeout(() => el.className = 'status', 3000);
}

function generateReferralCode() {
    return `FZ-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

function formatTime(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function switchSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('text-green-600', 'active'));
    
    if (section === 'home') {
        document.getElementById('homeSection')?.classList.add('active');
        document.getElementById('homeBtn')?.classList.add('text-green-600', 'active');
    } else if (section === 'profile') {
        document.getElementById('profileSection')?.classList.add('active');
        document.getElementById('profileBtn')?.classList.add('text-green-600', 'active');
    }
}

// ========================================
// LEVEL SYSTEM
// ========================================
function getUserLevel(totalMined) {
    for (let i = LEVEL_MILESTONES.length - 1; i > 0; i--) {
        if (totalMined >= LEVEL_MILESTONES[i]) return i + 1;
    }
    return 1;
}

function getCurrentLevelProgress(totalMined) {
    const level = getUserLevel(totalMined);
    const start = level === 1 ? 0 : LEVEL_MILESTONES[level - 2];
    const end = level > MAX_LEVEL ? LEVEL_MILESTONES[MAX_LEVEL] : LEVEL_MILESTONES[level - 1];
    const progress = end > start ? ((totalMined - start) / (end - start)) * 100 : 100;
    return { level, progress: Math.min(progress, 100), current: totalMined - start, required: end - start };
}

// ========================================
// UI UPDATE
// ========================================
function updateUI() {
    if (!userData) return;

    const totalMined = userData.totalMined || 0;
    const levelInfo = getCurrentLevelProgress(totalMined);
    const referralCount = Object.keys(userData.referrals || {}).length;
    const currentEarned = calculateCurrentEarned();

    const miningRate = (appSettings.mining.totalReward / appSettings.mining.miningDuration).toFixed(4);
    const balance = (userData.balance || 0).toFixed(2);
    const referralRewards = (userData.referralRewards || 0).toFixed(2);

    // Select elements once
    const els = {
        totalBalance: document.getElementById('totalBalance'),
        profileBalance: document.getElementById('profileBalance'),
        miningRate: document.getElementById('miningRate'),
        referralCount: document.getElementById('referralCount'),
        totalMined: document.getElementById('totalMined'),
        currentEarned: document.getElementById('currentEarned'),
        earnedDisplay: document.getElementById('earnedDisplay'),
        referralRewards: document.getElementById('referralRewards'),
        refCode: document.getElementById('refCode'),
        joinDate: document.getElementById('joinDate'),
        progressBar: document.getElementById('progressBar'),
        levelText: document.getElementById('levelText'),
        claimReferralBtn: document.getElementById('claimReferralBtn'),
        referralSubmitBox: document.getElementById('referralSubmitBox'),
        referralSubmittedBox: document.getElementById('referralSubmittedBox'),
        miningBtn: document.getElementById('miningBtn'),
        miningStatus: document.getElementById('miningStatus'),
        timerDisplay: document.querySelector('#miningBtn .timer-display')
    };

    // Update text
    els.totalBalance && (els.totalBalance.textContent = `${balance} FZ`);
    els.profileBalance && (els.profileBalance.textContent = `${balance} FZ`);
    els.miningRate && (els.miningRate.textContent = `${miningRate}/hr`);
    els.referralCount && (els.referralCount.textContent = referralCount);
    els.totalMined && (els.totalMined.textContent = `${totalMined.toFixed(2)} FZ`);
    els.currentEarned && (els.currentEarned.textContent = `${currentEarned.toFixed(6)} FZ`);
    els.earnedDisplay && (els.earnedDisplay.textContent = `${currentEarned.toFixed(6)} FZ`);
    els.referralRewards && (els.referralRewards.textContent = `${referralRewards} FZ`);
    els.refCode && (els.refCode.textContent = userData.referralCode || '---');
    els.joinDate && (els.joinDate.textContent = userData.joinDate || '---');

    // Level
    if (els.progressBar) els.progressBar.style.width = `${levelInfo.progress}%`;
    if (els.levelText) {
        els.levelText.textContent = `Level ${levelInfo.level} / ${MAX_LEVEL} (${levelInfo.current}/${levelInfo.required} FZ)`;
    }

    // Referral Claim
    if (els.claimReferralBtn) {
        els.claimReferralBtn.style.display = userData.referralRewards > 0 ? 'block' : 'none';
    }

    // Referral Input
    if (els.referralSubmitBox && els.referralSubmittedBox) {
        const isReferred = !!userData.referredBy;
        els.referralSubmitBox.style.display = isReferred ? 'none' : 'block';
        els.referralSubmittedBox.style.display = isReferred ? 'block' : 'none';
    }

    // Mining Button
    if (els.miningBtn && els.miningStatus && els.timerDisplay) {
        const now = getServerTime();
        if (userData.miningStartTime && now < userData.miningEndTime) {
            els.miningBtn.disabled = true;
            els.miningStatus.textContent = 'Active';
            els.miningStatus.className = 'mining-status text-green-600';
            if (!countdownInterval) startCountdown(userData.miningEndTime);
            if (!miningInterval) requestAnimationFrame(updateMiningDisplay);
        } else if (userData.miningStartTime && now >= userData.miningEndTime) {
            els.miningBtn.classList.add('claim');
            els.miningBtn.disabled = false;
            els.timerDisplay.textContent = 'Claim';
            els.miningStatus.textContent = 'Ready to Claim';
            els.miningStatus.className = 'mining-status';
        } else {
            els.miningBtn.classList.remove('claim');
            els.miningBtn.disabled = false;
            els.timerDisplay.textContent = 'Start Mining';
            els.miningStatus.textContent = 'Inactive';
            els.miningStatus.className = 'mining-status';
        }
    }
}

// ========================================
// MINING LOGIC
// ========================================
function calculateCurrentEarned() {
    if (!userData?.miningStartTime) return 0;
    const durationSec = appSettings.mining.miningDuration * 3600;
    const rewardPerSec = appSettings.mining.totalReward / durationSec;
    const now = getServerTime();
    if (now >= userData.miningEndTime) return appSettings.mining.totalReward;
    const elapsed = Math.floor((now - userData.miningStartTime) / 1000);
    return Math.min(elapsed * rewardPerSec, appSettings.mining.totalReward);
}

function startCountdown(endTime) {
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

async function startMining() {
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

function updateMiningDisplay() {
    if (!userData?.miningStartTime) return;
    const earned = calculateCurrentEarned();
    const rounded = Math.floor(earned * 1e6) / 1e6;
    if (rounded === lastDisplayedEarned) {
        requestAnimationFrame(updateMiningDisplay);
        return;
    }
    lastDisplayedEarned = rounded;

    const text = `${rounded.toFixed(6)} FZ`;
    document.getElementById('currentEarned')?.setAttribute('textContent', text);
    document.getElementById('earnedDisplay')?.setAttribute('textContent', text);

    if (getServerTime() >= userData.miningEndTime) stopMining();
    else requestAnimationFrame(updateMiningDisplay);
}

function stopMining() {
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
// REFERRAL SYSTEM
// ========================================
async function submitReferralCode() {
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
            return { ...data, referredBy: code, referralRewards: (data.referralRewards || 0) + appSettings.referral.referralBonus };
        });

        if (!result.committed) return showStatus(statusEl, 'Already submitted.', true);

        await updateReferrer(referrerId, currentUser.uid);
        await recordReferralTransactions(currentUser.uid, referrerId);
        showStatus(statusEl, `Success! +${appSettings.referral.referralBonus} FZ!`);
        input.value = '';
    } catch (err) {
        console.error(err);
        showStatus(statusEl, 'Failed. Try again.', true);
    }
}

async function updateReferrer(referrerId, refereeId) {
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

async function recordReferralTransactions(refereeId, referrerId) {
    const txRef1 = push(ref(database, `users/${refereeId}/transactions`));
    const txRef2 = push(ref(database, `users/${referrerId}/transactions`));
    const bonus = appSettings.referral.referralBonus;
    await Promise.all([
        set(txRef1, { type: 'referral', amount: bonus, description: 'Join Bonus', timestamp: serverTimestamp(), status: 'completed' }),
        set(txRef2, { type: 'referral', amount: bonus, description: 'Referral Bonus', timestamp: serverTimestamp(), status: 'completed' })
    ]);
}

// ========================================
// CLAIM REWARDS
// ========================================
async function claimMiningReward() {
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
    await set(txRef, { type: 'mining', amount, description: 'Mining Reward', timestamp: serverTimestamp(), status: 'completed' });
}

async function checkReferralMilestones(refereeId) {
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
        await grantMilestoneBonus(referrerId, refereeId, achieved, bonus);
    }
}

async function grantMilestoneBonus(referrerId, refereeId, count, bonus) {
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
        type: 'referral', amount: bonus,
        description: `Milestone (${count * appSettings.referral.referralMilestone} FZ)`,
        timestamp: serverTimestamp(), status: 'completed'
    });
}

async function claimReferralRewards() {
    if (!userData || userData.referralRewards <= 0) return showNotification('No rewards.', 'error');
    const amount = userData.referralRewards;
    const userRef = ref(database, `users/${currentUser.uid}`);

    const result = await runTransaction(userRef, (data) => {
        if (!data || data.referralRewards <= 0) return;
        return { ...data, balance: (data.balance || 0) + data.referralRewards, referralRewards: 0 };
    });

    if (result.committed) {
        const txRef = push(ref(database, `users/${currentUser.uid}/transactions`));
        await set(txRef, { type: 'referral', amount, description: 'Referral Claim', timestamp: serverTimestamp(), status: 'completed' });
        showNotification(`Claimed ${amount.toFixed(2)} FZ!`);
        showAdModal();
    }
}

// ========================================
// USER INIT
// ========================================
async function initializeUserData(user) {
    if (unsubscribeUser) unsubscribeUser();
    const userRef = ref(database, `users/${user.uid}`);
    unsubscribeUser = onValue(userRef, async (snap) => {
        if (!snap.exists()) await createNewUser(user);
        else {
            userData = snap.val();
            updateUI();
        }
    });
}

async function createNewUser(user) {
    const userRef = ref(database, `users/${user.uid}`);
    await set(userRef, {
        balance: 0, totalMined: 0, usdtBalance: 0,
        referralCode: generateReferralCode(),
        joinDate: new Date().toISOString().split('T')[0],
        referrals: {}, referralRewards: 0, referralMilestones: {}, transactions: {}, createdAt: Date.now()
    });
}

// ========================================
// UTILITIES
// ========================================
function copyReferralCode() {
    const code = document.getElementById('refCode')?.textContent;
    if (!code || code === '---') return showNotification('No code.', 'error');
    navigator.clipboard.writeText(code).then(() => showNotification('Copied!'));
}

function shareReferralCode(platform) {
    const code = document.getElementById('refCode')?.textContent;
    if (!code || code === '---') return showNotification('No code.', 'error');
    const text = `Join FarmZone! Use code: ${code} and get ${appSettings.referral.referralBonus} FZ bonus!`;
    const url = platform === 'whatsapp'
        ? `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
        : `https://t.me/share/url?url=https://farmzone.com&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

function logout() {
    cleanup();
    signOut(auth).then(() => location.href = 'login.html');
}

// ========================================
// SIDEBAR & DOM
// ========================================
function populateSidebar() {
    const container = document.getElementById('sidebar-content');
    if (!container) return;
    container.innerHTML = sidebarIcons.map(i => `
        <a href="${i.href}" class="group flex justify-center items-center h-12 w-12 rounded-full bg-gray-200 hover:bg-green-500 text-gray-700 hover:text-white transition-all">
            ${i.svg}
            <span class="tooltip">${i.name}</span>
        </a>
    `).join('');
}

function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggleBtn');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleFn = () => {
        sidebar?.classList.toggle('open');
        overlay?.classList.toggle('hidden');
    };
    toggle?.addEventListener('click', toggleFn);
    overlay?.addEventListener('click', toggleFn);
}

// ========================================
// AD MODAL
// ========================================
function showAdModal() {
    const modal = document.getElementById('adModal');
    const closeBtn = document.getElementById('adCloseBtn');
    if (!modal) return;

    const key = '78ade24182729fceea8e45203dad915b';
    const container = document.createElement('div');
    container.innerHTML = `
        <script type="text/javascript">
            atOptions = {'key':'${key}','format':'iframe','height':250,'width':300,'params':{}};
        </script>
        <script type="text/javascript" src="//www.highperformanceformat.com/${key}/invoke.js"></script>
    `;
    const adContainer = document.getElementById('claimAd');
    adContainer.innerHTML = '';
    adContainer.appendChild(container);

    modal.style.display = 'flex';
    const close = () => modal.style.display = 'none';
    closeBtn?.addEventListener('click', close);
    setTimeout(close, 5000);
}

// ========================================
// DOM READY
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loading')?.style.setProperty('display', 'none');
    populateSidebar();
    setupSidebar();

    const els = {
        homeBtn: document.getElementById('homeBtn'),
        profileBtn: document.getElementById('profileBtn'),
        walletBtn: document.getElementById('walletBtn'),
        miningBtn: document.getElementById('miningBtn'),
        claimReferralBtn: document.getElementById('claimReferralBtn'),
        submitReferralBtn: document.getElementById('submitReferralBtn'),
        copyCode: document.getElementById('copyCode'),
        shareWA: document.getElementById('shareWA'),
        shareTG: document.getElementById('shareTG'),
        authBtn: document.getElementById('authBtn')
    };

    els.homeBtn?.addEventListener('click', () => switchSection('home'));
    els.profileBtn?.addEventListener('click', () => switchSection('profile'));
    els.walletBtn?.addEventListener('click', () => location.href = 'wallet.html');
    els.miningBtn?.addEventListener('click', () => els.miningBtn.classList.contains('claim') ? claimMiningReward() : startMining());
    els.claimReferralBtn?.addEventListener('click', claimReferralRewards);
    els.submitReferralBtn?.addEventListener('click', submitReferralCode);
    els.copyCode?.addEventListener('click', copyReferralCode);
    els.shareWA?.addEventListener('click', () => shareReferralCode('whatsapp'));
    els.shareTG?.addEventListener('click', () => shareReferralCode('telegram'));
    els.authBtn?.addEventListener('click', logout);
});

// ========================================
// AUTH STATE
// ========================================
authUnsubscribe = onAuthStateChanged(auth, user => {
    if (user) {
        currentUser = user;
        listenForSettings();
        initializeUserData(user);
    } else {
        cleanup();
        location.href = 'login.html';
    }
});