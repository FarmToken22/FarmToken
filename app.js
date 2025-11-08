// app.js - Main application file
import { auth, database } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { ref, get, set, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import { sidebarIcons } from './icon.js';

// Import NEW mining functions
import { 
    calculateCurrentEarned, 
    startCountdownAndEarned,
    startMining as startMiningFunc, 
    stopMining as stopMiningFunc,
    claimMiningReward as claimMiningRewardFunc,
    cleanupMining
} from './mining.js';

// Import referral functions
import { 
    submitReferralCode as submitReferralCodeFunc,
    claimReferralRewards as claimReferralRewardsFunc,
    checkReferralMilestones,
    copyReferralCode as copyReferralCodeFunc,
    shareReferralCode as shareReferralCodeFunc
} from './referral.js';

// ========================================
// GLOBALS & CONSTANTS
// ========================================
let currentUser = null;
let userData = null;
let serverTimeOffset = 0;
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

// ========================================
// CLEANUP
// ========================================
function cleanup() {
    if (unsubscribeUser) unsubscribeUser();
    if (unsubscribeSettings) unsubscribeSettings();
    if (authUnsubscribe) authUnsubscribe();
    cleanupMining();
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
    return { 
        level, 
        progress: Math.min(progress, 100), 
        current: totalMined - start, 
        required: end - start 
    };
}

// ========================================
// UI UPDATE
// ========================================
function updateUI() {
    if (!userData) return;

    const totalMined = userData.totalMined || 0;
    const levelInfo = getCurrentLevelProgress(totalMined);
    const referralCount = Object.keys(userData.referrals || {}).length;
    const currentEarned = calculateCurrentEarned(userData, appSettings, getServerTime);

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

    // Mining Button State
    if (els.miningBtn && els.miningStatus && els.timerDisplay) {
        const now = getServerTime();
        if (userData.miningStartTime && now < userData.miningEndTime) {
            els.miningBtn.disabled = true;
            els.miningBtn.classList.remove('claim');
            els.miningStatus.textContent = 'Active';
            els.miningStatus.className = 'mining-status text-green-600';
            // Start countdown + earned update
            startCountdownAndEarned(
                userData.miningEndTime,
                getServerTime,
                appSettings,
                userData,
                stopMining,
                showNotification
            );
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
// WRAPPER FUNCTIONS FOR MINING
// ========================================
async function startMining() {
    await startMiningFunc(
        currentUser, 
        userData, 
        appSettings, 
        getServerTime, 
        showNotification,
        startCountdownAndEarned  // Pass new function
    );
}

function stopMining() {
    stopMiningFunc();
}

function claimMiningReward() {
    claimMiningRewardFunc(
        currentUser, 
        userData, 
        appSettings, 
        getServerTime, 
        showNotification, 
        showAdModal, 
        checkReferralMilestones
    );
}

// ========================================
// WRAPPER FUNCTIONS FOR REFERRAL
// ========================================
function submitReferralCode() {
    submitReferralCodeFunc(currentUser, userData, appSettings, showStatus);
}

function claimReferralRewards() {
    claimReferralRewardsFunc(currentUser, userData, showNotification, showAdModal);
}

function copyReferralCode() {
    copyReferralCodeFunc(showNotification);
}

function shareReferralCode(platform) {
    shareReferralCodeFunc(platform, appSettings, showNotification);
}

// ========================================
// USER INIT
// ========================================
async function initializeUserData(user) {
    if (unsubscribeUser) unsubscribeUser();
    const userRef = ref(database, `users/${user.uid}`);
    unsubscribeUser = onValue(userRef, async (snap) => {
        if (!snap.exists()) {
            await createNewUser(user);
        } else {
            userData = snap.val();
            updateUI();
        }
    });
}

async function createNewUser(user) {
    const userRef = ref(database, `users/${user.uid}`);
    await set(userRef, {
        balance: 0, 
        totalMined: 0, 
        usdtBalance: 0,
        referralCode: generateReferralCode(),
        joinDate: new Date().toISOString().split('T')[0],
        referrals: {}, 
        referralRewards: 0, 
        referralMilestones: {}, 
        transactions: {}, 
        createdAt: Date.now()
    });
}

// ========================================
// UTILITIES
// ========================================
function logout() {
    cleanup();
    signOut(auth).then(() => location.href = 'login.html');
}

// ========================================
// MENU DROPDOWN
// ========================================
function populateMenu() {
    const container = document.getElementById('menuDropdown');
    if (!container) return;
    container.innerHTML = sidebarIcons.map(i => `
        <a href="${i.href}">
            ${i.svg}
            <span>${i.name}</span>
        </a>
    `).join('');
}

function setupMenu() {
    const menuBtn = document.getElementById('menuToggleBtn');
    const menuDropdown = document.getElementById('menuDropdown');
    const menuOverlay = document.getElementById('menuOverlay');
    
    const toggleMenu = () => {
        menuDropdown?.classList.toggle('show');
        menuOverlay?.classList.toggle('show');
    };
    
    const closeMenu = () => {
        menuDropdown?.classList.remove('show');
        menuOverlay?.classList.remove('show');
    };
    
    menuBtn?.addEventListener('click', toggleMenu);
    menuOverlay?.addEventListener('click', closeMenu);
    
    menuDropdown?.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' || e.target.closest('a')) {
            closeMenu();
        }
    });
}

// ========================================
// AD MODAL
// ========================================
function showAdModal() {
    const modal = document.getElementById('adModal');
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
    document.getElementById('adCloseBtn')?.addEventListener('click', close);
    setTimeout(close, 5000);
}

// ========================================
// DOM READY
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loading')?.style.setProperty('display', 'none');
    populateMenu();
    setupMenu();

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
    
    els.miningBtn?.addEventListener('click', () => {
        if (els.miningBtn.classList.contains('claim')) {
            claimMiningReward();
        } else {
            startMining();
        }
    });
    
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