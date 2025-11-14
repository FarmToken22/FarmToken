// app.js - Main application file (Ad-Free Version)
import { auth, database } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { ref, get, set, onValue, update } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// Import home module
import { 
    calculateCurrentEarned, 
    startCountdownAndEarned,
    cleanupMining,
    initHomeSection,
    renderHomeSection
} from './home.js';

// Import profile module
import { 
    copyReferralCode,
    shareReferralCode,
    submitReferralCode,
    claimReferralRewards,
    checkReferralMilestones,
    initProfileSection,
    renderProfileSection
} from './profile.js';

// Import wallet module
import { 
    updateWalletDisplay,
    handleWithdraw,
    initWalletSection,
    renderWalletSection
} from './wallet.js';

// Import bonus module
import { 
    isBonusAvailable,
    updateBonusTimer,
    claimBonus,
    cleanupBonus,
    initBonusSection,
    renderBonusSection
} from './bonus.js';

// Import mining functions
import { 
    startMining as startMiningFunc, 
    stopMining as stopMiningFunc,
    claimMiningReward as claimMiningRewardFunc
} from './mining.js';

// ========================================
// GLOBALS & CONSTANTS
// ========================================
let currentUser = null;
let userData = null;
let serverTimeOffset = 0;
let unsubscribeUser = null;
let unsubscribeSettings = null;
let authUnsubscribe = null;
let isAppFullyLoaded = false;
let sectionsRendered = {
    home: false,
    profile: false,
    wallet: false,
    bonus: false
};

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
    cleanupBonus();
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

// ========================================
// DYNAMIC SECTION RENDERING
// ========================================
function ensureSectionRendered(section) {
    if (sectionsRendered[section]) return;
    
    console.log(`Rendering ${section} section dynamically...`);
    
    switch(section) {
        case 'home':
            renderHomeSection();
            sectionsRendered.home = true;
            break;
        case 'profile':
            renderProfileSection();
            sectionsRendered.profile = true;
            break;
        case 'wallet':
            renderWalletSection();
            sectionsRendered.wallet = true;
            break;
        case 'bonus':
            renderBonusSection();
            sectionsRendered.bonus = true;
            break;
    }
}

// ========================================
// SECTION SWITCHING
// ========================================
function switchSection(section) {
    ensureSectionRendered(section);
    
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('text-green-600', 'active'));
    
    const sectionMap = {
        'home': 'homeSection',
        'profile': 'profileSection',
        'wallet': 'walletSection',
        'bonus': 'bonusSection'
    };
    
    const btnMap = {
        'home': 'homeBtn',
        'profile': 'profileBtn',
        'wallet': 'walletBtn',
        'bonus': 'bonusBtn'
    };
    
    const sectionEl = document.getElementById(sectionMap[section]);
    const btnEl = document.getElementById(btnMap[section]);
    
    if (sectionEl) sectionEl.classList.add('active');
    if (btnEl) btnEl.classList.add('text-green-600', 'active');
    
    if (section === 'wallet') {
        initWalletSection(userData);
        updateWalletDisplay(userData);
    } else if (section === 'bonus') {
        initBonusSection(userData, getServerTime);
    } else if (section === 'home') {
        initHomeSection();
    } else if (section === 'profile') {
        initProfileSection(currentUser, userData, appSettings, showNotification, null, logout);
    }
    
    updateUI();
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

    const updateElement = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    updateElement('totalBalance', `${balance} FZ`);
    updateElement('profileBalance', `${balance} FZ`);
    updateElement('walletBalance', `${balance} FZ`);
    updateElement('miningRate', `${miningRate}/hr`);
    updateElement('referralCount', referralCount);
    updateElement('totalMined', `${totalMined.toFixed(2)} FZ`);
    updateElement('currentEarned', `${currentEarned.toFixed(6)} FZ`);
    updateElement('earnedDisplay', `${currentEarned.toFixed(6)} FZ`);
    updateElement('referralRewards', `${referralRewards} FZ`);
    updateElement('refCode', userData.referralCode || '---');
    updateElement('joinDate', userData.joinDate || '---');

    const progressBar = document.getElementById('progressBar');
    if (progressBar) progressBar.style.width = `${levelInfo.progress}%`;
    
    const levelText = document.getElementById('levelText');
    if (levelText) {
        levelText.textContent = `Level ${levelInfo.level} / ${MAX_LEVEL} (${levelInfo.current}/${levelInfo.required} FZ)`;
    }

    const claimReferralBtn = document.getElementById('claimReferralBtn');
    if (claimReferralBtn) {
        claimReferralBtn.style.display = userData.referralRewards > 0 ? 'block' : 'none';
    }

    const referralSubmitBox = document.getElementById('referralSubmitBox');
    const referralSubmittedBox = document.getElementById('referralSubmittedBox');
    if (referralSubmitBox && referralSubmittedBox) {
        const isReferred = !!userData.referredBy;
        referralSubmitBox.style.display = isReferred ? 'none' : 'block';
        referralSubmittedBox.style.display = isReferred ? 'block' : 'none';
    }

    const miningBtn = document.getElementById('miningBtn');
    const miningStatus = document.getElementById('miningStatus');
    const timerDisplay = document.querySelector('#miningBtn .timer-display');
    
    if (miningBtn && miningStatus && timerDisplay) {
        const now = getServerTime();
        if (userData.miningStartTime && now < userData.miningEndTime) {
            miningBtn.disabled = true;
            miningBtn.classList.remove('claim');
            miningStatus.textContent = 'Active';
            miningStatus.className = 'mining-status text-green-600';
            startCountdownAndEarned(
                userData.miningEndTime,
                getServerTime,
                appSettings,
                userData,
                stopMining,
                showNotification
            );
        } else if (userData.miningStartTime && now >= userData.miningEndTime) {
            miningBtn.classList.add('claim');
            miningBtn.disabled = false;
            timerDisplay.textContent = 'Claim';
            miningStatus.textContent = 'Ready to Claim';
            miningStatus.className = 'mining-status text-yellow-600';
        } else {
            miningBtn.classList.remove('claim');
            miningBtn.disabled = false;
            timerDisplay.textContent = 'Start Mining';
            miningStatus.textContent = 'Inactive';
            miningStatus.className = 'mining-status text-gray-600';
        }
    }

    const bonusSection = document.getElementById('bonusSection');
    if (bonusSection && bonusSection.classList.contains('active')) {
        updateBonusTimer(userData, getServerTime);
    }
}

// ========================================
// MINING WRAPPERS (Ad-Free)
// ========================================
async function startMining() {
    try {
        await startMiningFunc(
            currentUser, 
            userData, 
            appSettings, 
            getServerTime, 
            showNotification,
            startCountdownAndEarned
        );
    } catch (error) {
        console.error("Mining start error:", error);
        showNotification("Failed to start mining", "error");
    }
}

function stopMining() {
    try {
        stopMiningFunc();
    } catch (error) {
        console.error("Mining stop error:", error);
    }
}

function claimMiningReward() {
    try {
        claimMiningRewardFunc(
            currentUser, 
            userData, 
            appSettings, 
            getServerTime, 
            showNotification,
            checkReferralMilestones
        );
    } catch (error) {
        console.error("Claim error:", error);
        showNotification("Failed to claim reward", "error");
    }
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
            if (!sectionsRendered.home) {
                ensureSectionRendered('home');
            }
            updateUI();
        }
    }, (error) => {
        console.error("User data load failed:", error);
        showNotification("Failed to load user data", "error");
    });
}

async function createNewUser(user) {
    try {
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
        console.log("New user created successfully");
    } catch (error) {
        console.error("User creation failed:", error);
        showNotification("Failed to create user account", "error");
    }
}

// ========================================
// LOGOUT
// ========================================
function logout() {
    cleanup();
    signOut(auth).then(() => {
        location.href = 'login.html';
    }).catch(error => {
        console.error("Logout error:", error);
        showNotification("Logout failed", "error");
    });
}

// ========================================
// EVENT DELEGATION (Ad-Free)
// ========================================
function setupEventDelegation() {
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        
        if (target.id === 'miningBtn' || target.closest('#miningBtn')) {
            const btn = document.getElementById('miningBtn');
            if (btn.classList.contains('claim')) {
                claimMiningReward();
            } else {
                startMining();
            }
        }
        
        if (target.id === 'claimReferralBtn') {
            claimReferralRewards(currentUser, userData, showNotification);
        }
        if (target.id === 'submitReferralBtn') {
            submitReferralCode(currentUser, userData, appSettings, showStatus);
        }
        if (target.id === 'copyCode') {
            copyReferralCode(userData, showNotification);
        }
        if (target.id === 'shareWA') {
            shareReferralCode(userData, 'whatsapp', appSettings, showNotification);
        }
        if (target.id === 'shareTG') {
            shareReferralCode(userData, 'telegram', appSettings, showNotification);
        }
        
        if (target.id === 'claimBonusBtn') {
            claimBonus(currentUser, userData, getServerTime, showNotification);
        }
        
        if (target.id === 'withdrawBtn') {
            handleWithdraw(currentUser, userData, showStatus);
        }
        
        if (target.id === 'authBtn') {
            logout();
        }
    });
}

// ========================================
// DOM READY
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    
    console.log("App initialized - Ad-Free & Dynamic");

    setupEventDelegation();

    const homeBtn = document.getElementById('homeBtn');
    const profileBtn = document.getElementById('profileBtn');
    const walletBtn = document.getElementById('walletBtn');
    const bonusBtn = document.getElementById('bonusBtn');

    homeBtn?.addEventListener('click', () => switchSection('home'));
    profileBtn?.addEventListener('click', () => switchSection('profile'));
    walletBtn?.addEventListener('click', () => switchSection('wallet'));
    bonusBtn?.addEventListener('click', () => switchSection('bonus'));
});

// ========================================
// AUTH STATE
// ========================================
authUnsubscribe = onAuthStateChanged(auth, user => {
    if (user) {
        currentUser = user;
        console.log("User logged in:", user.uid);
        listenForSettings();
        initializeUserData(user);
    } else {
        console.log("No user logged in");
        cleanup();
        location.href = 'login.html';
    }
});

// Export for other modules
export { 
    currentUser, 
    userData, 
    appSettings, 
    getServerTime, 
    showNotification, 
    showStatus,
    updateUI,
    switchSection
};