// config.js থেকে import করুন
import { auth, database } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { ref, get, set, update, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import { sidebarIcons } from './icon.js'; // icon.js থেকে ডেটা ইম্পোর্ট

let currentUser = null;
let userData = null;
let miningInterval = null;
let countdownInterval = null;

// Mining Settings
const MINING_DURATION = 8 * 60 * 60; // 8 hours in seconds
const TOTAL_REWARD = 6;
const REWARD_PER_SECOND = TOTAL_REWARD / MINING_DURATION;

// Referral Settings
const REFERRAL_BONUS = 5;
const REFERRAL_MILESTONE = 100;

// Withdrawal
const MINIMUM_WITHDRAWAL = 50;

// === নতুন লেভেল মাইলস্টোন সিস্টেম ===
const LEVEL_MILESTONES = [0, 500, 1000, 2000, 5000]; // Level 1: 0-500, Level 2: 500-1000, etc.
const MAX_LEVEL = LEVEL_MILESTONES.length - 1; // 5

// --- Ad Modal Functions ---
function showAdModal() {
    const adModal = document.getElementById('adModal');
    if (!adModal) return;

    const adKey = '78ade24182729fceea8e45203dad915b';
    const adContainer = document.createElement('div');
    const script1 = document.createElement('script');
    script1.type = 'text/javascript';
    script1.innerHTML = `atOptions = {'key': '${adKey}','format': 'iframe','height': 250,'width': 300,'params': {}};`;
    const script2 = document.createElement('script');
    script2.type = 'text/javascript';
    script2.src = `//www.highperformanceformat.com/${adKey}/invoke.js`;
    
    adContainer.appendChild(script1);
    adContainer.appendChild(script2);

    const claimAd = document.getElementById('claimAd');
    if (claimAd) {
        claimAd.innerHTML = '';
        claimAd.appendChild(adContainer);
    }

    adModal.style.display = 'flex';
    setTimeout(closeAdModal, 5000);
}

window.closeAdModal = function () {
    const adModal = document.getElementById('adModal');
    if (adModal) adModal.style.display = 'none';
};

// --- Helper Functions ---
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.style.background = type === 'success' ? '#28a745' : '#dc3545';
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);
    }
}

function showStatus(element, message, isError = false) {
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden', 'text-green-500', 'text-red-500');
        element.classList.add(isError ? 'text-red-500' : 'text-green-500');
        setTimeout(() => element.classList.add('hidden'), 3000);
    }
}

function generateReferralCode() {
    return `FZ-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function switchSection(section) {
    const sections = ['homeSection', 'profileSection'];
    const btns = ['homeBtn', 'profileBtn'];

    sections.forEach(s => document.getElementById(s)?.classList.remove('active'));
    btns.forEach(b => {
        const btn = document.getElementById(b);
        if (btn) {
            btn.classList.remove('text-green-600', 'active');
        }
    });

    if (section === 'home') {
        document.getElementById('homeSection')?.classList.add('active');
        const homeBtn = document.getElementById('homeBtn');
        if (homeBtn) {
            homeBtn.classList.add('text-green-600', 'active');
        }
    } else if (section === 'profile') {
        document.getElementById('profileSection')?.classList.add('active');
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.classList.add('text-green-600', 'active');
        }
    }
}

// === নতুন লেভেল ক্যালকুলেশন ===
function getUserLevel(totalMined) {
    let level = 1;
    for (let i = 1; i < LEVEL_MILESTONES.length; i++) {
        if (totalMined >= LEVEL_MILESTONES[i]) {
            level = i + 1;
        } else {
            break;
        }
    }
    return Math.min(level, MAX_LEVEL);
}

function getCurrentLevelProgress(totalMined) {
    const level = getUserLevel(totalMined);
    const currentLevelStart = level === 1 ? 0 : LEVEL_MILESTONES[level - 1];
    const nextLevelStart = level >= MAX_LEVEL ? LEVEL_MILESTONES[MAX_LEVEL] : LEVEL_MILESTONES[level];
    const progressInLevel = totalMined - currentLevelStart;
    const requiredForNext = nextLevelStart - currentLevelStart;
    const percentage = requiredForNext > 0 ? (progressInLevel / requiredForNext) * 100 : 100;
    return {
        level,
        progress: Math.min(percentage, 100),
        current: progressInLevel,
        required: requiredForNext,
        nextMilestone: nextLevelStart
    };
}

// --- UI Update ---
function updateUI() {
    if (!userData) return;

    const totalMined = userData.totalMined || 0;
    const levelInfo = getCurrentLevelProgress(totalMined);

    const els = {
        totalBalance: document.getElementById('totalBalance'),
        profileBalance: document.getElementById('profileBalance'),
        miningRate: document.getElementById('miningRate'),
        referralCount: document.getElementById('referralCount'),
        totalMined: document.getElementById('totalMined'),
        currentEarned: document.getElementById('currentEarned'),
        referralRewards: document.getElementById('referralRewards'),
        refCode: document.getElementById('refCode'),
        joinDate: document.getElementById('joinDate'),
        earnedDisplay: document.getElementById('earnedDisplay'),
        progressBar: document.getElementById('progressBar'),
        levelText: document.getElementById('levelText'),
        claimReferralBtn: document.getElementById('claimReferralBtn'),
        referralSubmitBox: document.getElementById('referralSubmitBox'),
        referralSubmittedBox: document.getElementById('referralSubmittedBox'),
        miningBtn: document.getElementById('miningBtn'),
        miningStatus: document.getElementById('miningStatus')
    };

    const balance = (userData.balance || 0).toFixed(2);
    const miningRate = (REWARD_PER_SECOND * 3600).toFixed(4);
    const referralCount = userData.referrals ? Object.keys(userData.referrals).length : 0;
    const referralRewards = (userData.referralRewards || 0).toFixed(2);
    const currentEarned = calculateCurrentEarned();

    // Update Balance & Mining
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

    // Update Progress Bar & Level
    if (els.progressBar) els.progressBar.style.width = `${levelInfo.progress}%`;
    if (els.levelText) {
        const current = levelInfo.current.toLocaleString();
        const required = levelInfo.required.toLocaleString();
        els.levelText.textContent = `Level ${levelInfo.level} / ${MAX_LEVEL} (${current}/${required} FZ)`;
    }

    // Claim Button
    if (els.claimReferralBtn) {
        els.claimReferralBtn.style.display = (userData.referralRewards > 0) ? 'block' : 'none';
    }

    // Referral Box
    if (els.referralSubmitBox && els.referralSubmittedBox) {
        if (userData.referredBy) {
            els.referralSubmitBox.style.display = 'none';
            els.referralSubmittedBox.style.display = 'block';
        } else {
            els.referralSubmitBox.style.display = 'block';
            els.referralSubmittedBox.style.display = 'none';
        }
    }

    // Mining Button & Status
    if (els.miningBtn && els.miningStatus) {
        if (userData.miningStartTime && Date.now() < userData.miningEndTime) {
            els.miningBtn.disabled = true;
            els.miningStatus.textContent = 'Active';
            els.miningStatus.classList.add('text-green-600');
            if (!countdownInterval) startCountdown(userData.miningEndTime);
            if (!miningInterval) miningInterval = setInterval(updateMiningDisplay, 1000);
        } else if (userData.miningStartTime && Date.now() >= userData.miningEndTime) {
            els.miningBtn.classList.add('claim');
            els.miningBtn.disabled = false;
            const timerDisplay = els.miningBtn.querySelector('.timer-display');
            if (timerDisplay) timerDisplay.textContent = 'Claim';
            els.miningStatus.textContent = 'Ready to Claim';
            els.miningStatus.classList.remove('text-green-600');
        } else {
            els.miningBtn.classList.remove('claim');
            els.miningBtn.disabled = false;
            const timerDisplay = els.miningBtn.querySelector('.timer-display');
            if (timerDisplay) timerDisplay.textContent = 'Start Mining';
            els.miningStatus.textContent = 'Inactive';
            els.miningStatus.classList.remove('text-green-600');
        }
    }
}

function calculateCurrentEarned() {
    if (!userData || !userData.miningStartTime) return 0;
    const now = Date.now();
    if (now >= userData.miningEndTime) return TOTAL_REWARD;
    const elapsedSeconds = Math.floor((now - userData.miningStartTime) / 1000);
    return Math.min(elapsedSeconds * REWARD_PER_SECOND, TOTAL_REWARD);
}

function startCountdown(endTime) {
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        const secondsLeft = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        const timerDisplay = document.querySelector('#miningBtn .timer-display');
        if (timerDisplay) timerDisplay.textContent = formatTime(secondsLeft);
        if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            stopMining();
            showNotification('Mining session completed! Ready to claim 6 FZ.');
        }
    }, 1000);
}

function startMining() {
    if (!currentUser) return showNotification('Please log in to start mining.', 'error');
    if (userData.miningStartTime && Date.now() < userData.miningEndTime) return showNotification('Mining session already active.', 'error');

    const userRef = ref(database, `users/${currentUser.uid}`);
    const startTime = Date.now();
    const endTime = startTime + MINING_DURATION * 1000;

    update(userRef, { miningStartTime: startTime, miningEndTime: endTime })
        .then(() => showNotification('Mining started! Session will run for 8 hours.'))
        .catch(err => {
            console.error('Mining start error:', err);
            showNotification('Failed to start mining. Please try again.', 'error');
        });
}

function updateMiningDisplay() {
    if (!userData || !userData.miningStartTime) return;
    const currentEarned = calculateCurrentEarned();
    const currentEarnedEl = document.getElementById('currentEarned');
    const earnedDisplayEl = document.getElementById('earnedDisplay');
    if (currentEarnedEl) currentEarnedEl.textContent = `${currentEarned.toFixed(6)} FZ`;
    if (earnedDisplayEl) earnedDisplayEl.textContent = `${currentEarned.toFixed(6)} FZ`;
    if (Date.now() >= userData.miningEndTime) stopMining();
}

function stopMining() {
    clearInterval(miningInterval);
    clearInterval(countdownInterval);
    miningInterval = null;
    countdownInterval = null;

    const miningBtn = document.getElementById('miningBtn');
    const miningStatus = document.getElementById('miningStatus');
    if (miningBtn) {
        miningBtn.classList.add('claim');
        miningBtn.disabled = false;
        const timerDisplay = miningBtn.querySelector('.timer-display');
        if (timerDisplay) timerDisplay.textContent = 'Claim';
    }
    if (miningStatus) {
        miningStatus.textContent = 'Ready to Claim';
        miningStatus.classList.remove('text-green-600');
    }
}

async function claimMiningReward() {
    const userRef = ref(database, `users/${currentUser.uid}`);
    try {
        const snapshot = await get(userRef);
        if (!snapshot.exists()) return showNotification('User data not found.', 'error');
        const serverUserData = snapshot.val();

        if (!serverUserData.miningStartTime || Date.now() < serverUserData.miningEndTime) {
            return showNotification('Mining session is not yet complete.', 'error');
        }

        const rewardToClaim = TOTAL_REWARD;
        const newBalance = (serverUserData.balance || 0) + rewardToClaim;
        const newTotalMined = (serverUserData.totalMined || 0) + rewardToClaim;

        await update(userRef, {
            balance: newBalance,
            totalMined: newTotalMined,
            miningStartTime: null,
            miningEndTime: null
        });

        const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const transactionRef = ref(database, `users/${currentUser.uid}/transactions/${transactionId}`);
        await set(transactionRef, {
            type: 'mining',
            amount: rewardToClaim,
            description: 'Mining Reward Claimed',
            timestamp: Date.now(),
            status: 'completed'
        });

        showNotification(`Claimed ${rewardToClaim.toFixed(2)} FZ!`);
        showAdModal();

        if (serverUserData.referredBy) await checkReferralMilestones(currentUser.uid);
    } catch (err) {
        console.error('Claim error:', err);
        showNotification('Failed to claim rewards. Please try again.', 'error');
    }
}

async function claimReferralRewards() {
    if (!userData || userData.referralRewards <= 0) return showNotification('No referral rewards to claim.', 'error');
    const userRef = ref(database, `users/${currentUser.uid}`);
    const rewardAmount = userData.referralRewards;
    const newBalance = (userData.balance || 0) + rewardAmount;

    try {
        await update(userRef, { balance: newBalance, referralRewards: 0 });
        const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const transactionRef = ref(database, `users/${currentUser.uid}/transactions/${transactionId}`);
        await set(transactionRef, {
            type: 'referral',
            amount: rewardAmount,
            description: 'Referral Rewards Claimed',
            timestamp: Date.now(),
            status: 'completed'
        });
        showNotification(`Claimed ${rewardAmount.toFixed(2)} FZ from referrals!`);
        showAdModal();
    } catch (err) {
        console.error('Referral claim error:', err);
        showNotification('Failed to claim referral rewards. Please try again.', 'error');
    }
}

async function checkReferralMilestones(refereeId) {
    const refereeRef = ref(database, `users/${refereeId}`);
    const refereeSnapshot = await get(refereeRef);
    if (!refereeSnapshot.exists()) return;

    const refereeData = refereeSnapshot.val();
    const referrerCode = refereeData.referredBy;
    if (!referrerCode) return;

    const usersRef = ref(database, 'users');
    const referrerQuery = query(usersRef, orderByChild('referralCode'), equalTo(referrerCode));
    const referrerSnapshot = await get(referrerQuery);
    if (!referrerSnapshot.exists()) return;

    const referrerId = Object.keys(referrerSnapshot.val())[0];
    const referrerData = Object.values(referrerSnapshot.val())[0];
    const refereeTotalMined = refereeData.totalMined || 0;
    const milestonesAchieved = Math.floor(refereeTotalMined / REFERRAL_MILESTONE);
    const previousMilestones = refereeData.referralMilestones?.[referrerId] || 0;

    if (milestonesAchieved > previousMilestones) {
        const newBonuses = (milestonesAchieved - previousMilestones) * REFERRAL_BONUS;
        const referrerRef = ref(database, `users/${referrerId}`);
        await update(referrerRef, { referralRewards: (referrerData.referralRewards || 0) + newBonuses });

        const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const transactionRef = ref(database, `users/${referrerId}/transactions/${transactionId}`);
        await set(transactionRef, {
            type: 'referral',
            amount: newBonuses,
            description: `Referral Milestone Bonus`,
            timestamp: Date.now(),
            status: 'completed'
        });

        await update(refereeRef, {
            referralMilestones: { ...refereeData.referralMilestones || {}, [referrerId]: milestonesAchieved }
        });
    }
}

async function submitReferralCode() {
    const input = document.getElementById('referralCodeInput');
    const statusEl = document.getElementById('referralStatus');
    const code = input?.value.trim().toUpperCase() || '';

    if (!code) return showStatus(statusEl, 'Please enter a referral code.', true);
    if (userData.referredBy) return showStatus(statusEl, 'You have already submitted a referral code.', true);
    if (code === userData.referralCode) return showStatus(statusEl, 'You cannot use your own referral code.', true);

    try {
        const usersRef = ref(database, 'users');
        const referralQuery = query(usersRef, orderByChild('referralCode'), equalTo(code));
        const snapshot = await get(referralQuery);
        if (!snapshot.exists()) return showStatus(statusEl, 'Invalid referral code.', true);

        const referrerData = Object.values(snapshot.val())[0];
        const referrerId = Object.keys(snapshot.val())[0];
        if (referrerId === currentUser.uid) return showStatus(statusEl, 'You cannot use your own referral code.', true);

        const userRef = ref(database, `users/${currentUser.uid}`);
        const referrerRef = ref(database, `users/${referrerId}`);

        await update(userRef, { referredBy: code, referralRewards: (userData.referralRewards || 0) + REFERRAL_BONUS });
        await update(referrerRef, {
            referralRewards: (referrerData.referralRewards || 0) + REFERRAL_BONUS,
            [`referrals/${currentUser.uid}`]: true
        });

        const userTx = ref(database, `users/${currentUser.uid}/transactions/tx_${Date.now()}_u`);
        await set(userTx, { type: 'referral', amount: REFERRAL_BONUS, description: 'Referral Join Bonus', timestamp: Date.now(), status: 'completed' });
        const referrerTx = ref(database, `users/${referrerId}/transactions/tx_${Date.now()}_r`);
        await set(referrerTx, { type: 'referral', amount: REFERRAL_BONUS, description: `Bonus from new referral`, timestamp: Date.now(), status: 'completed' });

        showStatus(statusEl, `Success! You and your referrer each received ${REFERRAL_BONUS} FZ bonus!`);
        if (input) input.value = '';
    } catch (err) {
        console.error('Referral error:', err);
        showStatus(statusEl, 'Failed to submit referral code.', true);
    }
}

function copyReferralCode() {
    const code = document.getElementById('refCode')?.textContent || '';
    if (code === '---') return showNotification('No referral code available.', 'error');
    navigator.clipboard.writeText(code).then(() => showNotification('Referral code copied!')).catch(() => showNotification('Failed to copy.', 'error'));
}

function shareReferralCode(platform) {
    const code = document.getElementById('refCode')?.textContent || '';
    if (code === '---') return showNotification('No referral code available.', 'error');

    const shareText = `Join FarmZone and start mining! Use my referral code: ${code} to get a ${REFERRAL_BONUS} FZ bonus!`;
    let url = '';
    if (platform === 'whatsapp') {
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    } else if (platform === 'telegram') {
        url = `https://t.me/share/url?url=${encodeURIComponent('https://farmzone.com')}&text=${encodeURIComponent(shareText)}`;
    }
    window.open(url, '_blank');
}

function logout() {
    signOut(auth).then(() => window.location.href = 'login.html').catch(() => showNotification('Failed to logout.', 'error'));
}

async function initializeUserData(user) {
    const userRef = ref(database, `users/${user.uid}`);
    onValue(userRef, async (snapshot) => {
        if (!snapshot.exists()) {
            const referralCode = generateReferralCode();
            const joinDate = new Date().toISOString().split('T')[0];
            await set(userRef, {
                balance: 0,
                totalMined: 0,
                usdtBalance: 0,
                referralCode,
                joinDate,
                referrals: {},
                referralRewards: 0,
                referralMilestones: {},
                transactions: {}
            });
        }
        userData = snapshot.val();
        if (userData) updateUI();
    });
}

// --- Sidebar Logic ---
function populateSidebar() {
    const sidebarContent = document.getElementById('sidebar-content');
    if (!sidebarContent) return;

    const iconHTML = sidebarIcons.map(icon => `
        <a href="${icon.href}" title="${icon.name}" class="group relative flex justify-center items-center h-12 w-12 rounded-full bg-gray-200 hover:bg-green-500 hover:text-white text-gray-700 transition-all duration-300">
            ${icon.svg}
            <span class="absolute left-full ml-4 w-auto min-w-max px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                ${icon.name}
            </span>
        </a>
    `).join('');

    sidebarContent.innerHTML = iconHTML;
}

function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    const toggleSidebar = () => {
        sidebar?.classList.toggle('open');
        sidebarOverlay?.classList.toggle('hidden');
    };

    if (sidebar && sidebarToggleBtn && sidebarOverlay) {
        sidebarToggleBtn.addEventListener('click', toggleSidebar);
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';

    // Populate and setup sidebar
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
        authBtn: document.getElementById('authBtn'),
    };

    els.homeBtn?.addEventListener('click', () => switchSection('home'));
    els.profileBtn?.addEventListener('click', () => switchSection('profile'));
    // ✅ আপডেট: wallet.html পেজে redirect
    els.walletBtn?.addEventListener('click', () => window.location.href = 'wallet.html');
    els.miningBtn?.addEventListener('click', () => els.miningBtn.classList.contains('claim') ? claimMiningReward() : startMining());
    els.claimReferralBtn?.addEventListener('click', claimReferralRewards);
    els.submitReferralBtn?.addEventListener('click', submitReferralCode);
    els.copyCode?.addEventListener('click', copyReferralCode);
    els.shareWA?.addEventListener('click', () => shareReferralCode('whatsapp'));
    els.shareTG?.addEventListener('click', () => shareReferralCode('telegram'));
    els.authBtn?.addEventListener('click', logout);
});

onAuthStateChanged(auth, user => {
    if (user) {
        currentUser = user;
        initializeUserData(user);
    } else {
        window.location.href = 'login.html';
    }
});