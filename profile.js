// profile.js - Profile Section Module (With Smart Ad Management)
import { auth, database } from './config.js';
import { ref, get, set, update } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// ========================================
// AD CONFIGURATION
// ========================================
const AD_KEY = '78ade24182729fceea8e45203dad915b';
const AD_URL = `//www.highperformanceformat.com/${AD_KEY}/invoke.js`;
let adLoaded = false; // Global flag to ensure only ONE ad loads

// ========================================
// DYNAMIC SECTION RENDERING
// ========================================
export function renderProfileSection() {
    const container = document.getElementById('profileSection');
    if (!container) {
        console.error('Profile section container not found');
        return;
    }

    container.innerHTML = `
        <div class="p-3 sm:p-4 space-y-4 sm:space-y-6 max-w-lg mx-auto w-full pb-20">
            <!-- Profile Header Card -->
            <div class="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
                <div class="flex items-center gap-4">
                    <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h2 class="text-xl sm:text-2xl font-bold">My Profile</h2>
                        <p class="text-green-100 text-sm">Member since <span id="joinDate">---</span></p>
                    </div>
                </div>
            </div>

            <!-- Ad Space 1 -->
            <div id="adSpace1" class="bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300" style="min-height: 50px; display: none;">
                <div id="adContainer1"></div>
            </div>

            <!-- Balance & Stats Card -->
            <div class="bg-white shadow rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
                <h3 class="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Balance & Rewards
                </h3>

                <div class="flex justify-between border-b pb-2 sm:pb-3">
                    <p class="text-gray-600 text-base sm:text-lg">Total Balance</p>
                    <p id="profileBalance" class="text-green-600 font-bold text-base sm:text-lg">0.00 FZ</p>
                </div>

                <div class="flex justify-between border-b pb-2 sm:pb-3">
                    <p class="text-gray-600 text-base sm:text-lg">Referral Rewards</p>
                    <div class="flex items-center gap-2">
                        <p id="referralRewards" class="text-green-600 font-bold text-base sm:text-lg">0.00 FZ</p>
                        <button id="claimReferralBtn" class="text-xs sm:text-sm bg-yellow-500 text-white px-2 sm:px-3 py-1.5 rounded-lg hover:bg-yellow-600 transition-all" style="display:none">Claim</button>
                    </div>
                </div>
            </div>

            <!-- Ad Space 2 -->
            <div id="adSpace2" class="bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300" style="min-height: 50px; display: none;">
                <div id="adContainer2"></div>
            </div>

            <!-- Referral Code Card -->
            <div class="bg-white shadow rounded-xl p-4 sm:p-6">
                <h3 class="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Your Referral Code
                </h3>

                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-dashed border-blue-300">
                    <p class="text-sm text-gray-600 mb-2">Share this code with friends:</p>
                    <div class="flex items-center justify-between gap-3">
                        <p id="refCode" class="text-2xl font-bold text-blue-600 tracking-wider">---</p>
                        <button id="copyCode" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2 whitespace-nowrap">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                        </button>
                    </div>
                </div>

                <div class="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
                    <button id="shareWA" class="flex-1 text-xs sm:text-sm bg-green-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z"/>
                        </svg>
                        WhatsApp
                    </button>
                    <button id="shareTG" class="flex-1 text-xs sm:text-sm bg-blue-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                        </svg>
                        Telegram
                    </button>
                </div>
            </div>

            <!-- Ad Space 3 -->
            <div id="adSpace3" class="bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300" style="min-height: 50px; display: none;">
                <div id="adContainer3"></div>
            </div>

            <!-- Referral Input Card -->
            <div id="referralSubmitBox" class="bg-white shadow rounded-xl p-4 sm:p-6">
                <h3 class="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Have a Referral Code?
                </h3>
                <p class="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Enter your friend's referral code to connect with them and earn bonus rewards!</p>
                <div class="flex flex-col sm:flex-row gap-2">
                    <input id="referralCodeInput" type="text" placeholder="Enter code (e.g., FZ-XXXXX)" class="flex-1 border-2 border-gray-300 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all">
                    <button id="submitReferralBtn" class="bg-green-500 text-white px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base hover:bg-green-600 transition-colors font-semibold whitespace-nowrap">
                        Submit Code
                    </button>
                </div>
                <p id="referralStatus" class="status mt-2"></p>
            </div>

            <!-- Referral Submitted Box -->
            <div id="referralSubmittedBox" class="bg-green-100 border-2 border-green-300 rounded-xl p-4 text-green-700 text-center text-sm sm:text-base font-semibold flex items-center justify-center gap-2" style="display:none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Referral code already submitted!
            </div>

            <!-- Ad Space 4 -->
            <div id="adSpace4" class="bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300" style="min-height: 50px; display: none;">
                <div id="adContainer4"></div>
            </div>

            <!-- Referral Stats Card -->
            <div class="bg-white shadow rounded-xl p-4 sm:p-6">
                <h3 class="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20 5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Your Referrals
                </h3>

                <div class="text-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                    <p class="text-4xl font-bold text-indigo-600" id="totalReferrals">0</p>
                    <p class="text-sm text-gray-600 mt-1">Total Friends Referred</p>
                </div>

                <div id="referralsList" class="mt-4 space-y-2 max-h-48 overflow-y-auto">
                    <p class="text-gray-500 text-sm text-center py-4">No referrals yet. Share your code to get started!</p>
                </div>
            </div>

            <!-- Logout Button -->
            <button id="authBtn" class="w-full bg-red-500 text-white py-2.5 sm:py-3 rounded-lg shadow text-base sm:text-lg hover:bg-red-600 transition-colors font-semibold flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
            </button>
        </div>
    `;

    console.log('Profile section rendered with smart ad management');
    loadSingleAd(); // Load only one ad
}

// ========================================
// SMART AD LOADER: Only ONE Ad Loads
// ========================================
function loadSingleAd() {
    if (adLoaded) return; // Prevent multiple ads

    const adSpaces = [
        { space: document.getElementById('adSpace1'), container: 'adContainer1' },
        { space: document.getElementById('adSpace2'), container: 'adContainer2' },
        { space: document.getElementById('adSpace3'), container: 'adContainer3' },
        { space: document.getElementById('adSpace4'), container: 'adContainer4' }
    ].filter(item => item.space); // Filter valid spaces

    if (adSpaces.length === 0) return;

    // Randomly pick ONE ad space
    const randomIndex = Math.floor(Math.random() * adSpaces.length);
    const selected = adSpaces[randomIndex];

    // Show the selected ad space
    selected.space.style.display = 'flex';

    // Inject ad script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.onload = () => {
        adLoaded = true;
        console.log(`Ad loaded successfully in adSpace${randomIndex + 1}`);
    };
    script.onerror = () => {
        selected.space.style.display = 'none'; // Hide on failure
        console.warn(`Ad failed to load in adSpace${randomIndex + 1}, hiding space.`);
    };

    window.atOptions = {
        'key': AD_KEY,
        'format': 'iframe',
        'height': 50,
        'width': 320,
        'params': {}
    };

    script.src = AD_URL;
    document.getElementById(selected.container).appendChild(script);
}

// ========================================
// REFERRAL UI TOGGLE
// ========================================
export function toggleReferralUI(hasReferred) {
    const submitBox = document.getElementById('referralSubmitBox');
    const submittedBox = document.getElementById('referralSubmittedBox');

    if (submitBox) submitBox.style.display = hasReferred ? 'none' : 'block';
    if (submittedBox) submittedBox.style.display = hasReferred ? 'flex' : 'none';
}

// ========================================
// HELPER: Show Status Message
// ========================================
function showStatus(el, message, isError) {
    if (!el) return;
    el.textContent = message;
    el.className = isError ? 'status text-red-600' : 'status text-green-600';
    setTimeout(() => { el.textContent = ''; }, 4000);
}

// ========================================
// COPY & SHARE FUNCTIONS
// ========================================
export function copyReferralCode(userData, showNotification) {
    if (!userData.referralCode) {
        showNotification('No referral code found', 'error');
        return;
    }
    navigator.clipboard.writeText(userData.referralCode)
        .then(() => showNotification('Referral code copied!', 'success'))
        .catch(() => showNotification('Failed to copy code', 'error'));
}

export function shareReferralCode(userData, platform, appSettings, showNotification) {
    if (!userData.referralCode) {
        showNotification('No referral code found', 'error');
        return;
    }

    const message = `Join FarmZone and start mining FZ coins!\n\nUse my referral code: ${userData.referralCode}\nEarn ${appSettings.referral.referralBonus} FZ bonus instantly!\n\nStart earning now!`;
    const encodedMessage = encodeURIComponent(message);

    const url = platform === 'whatsapp'
        ? `https://wa.me/?text=${encodedMessage}`
        : `https://t.me/share/url?url=${encodedMessage}`;

    window.open(url, '_blank');
}

// ========================================
// SUBMIT REFERRAL CODE
// ========================================
export async function submitReferralCode(currentUser, userData, appSettings, showStatus) {
    const input = document.getElementById('referralCodeInput');
    const statusEl = document.getElementById('referralStatus');
    const code = input?.value.trim().toUpperCase();

    if (!code) return showStatus(statusEl, 'Please enter a referral code', true);
    if (code === userData.referralCode) return showStatus(statusEl, 'Cannot use your own referral code', true);
    if (userData.referredBy) return showStatus(statusEl, 'You have already used a referral code', true);

    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        if (!snapshot.exists()) return showStatus(statusEl, 'Invalid referral code', true);

        let referrerUid = null;
        snapshot.forEach(child => {
            if (child.val().referralCode === code) referrerUid = child.key;
        });
        if (!referrerUid || referrerUid === currentUser.uid) return showStatus(statusEl, 'Invalid referral code', true);

        await update(ref(database, `users/${currentUser.uid}`), { referredBy: referrerUid });

        const referrerRef = ref(database, `users/${referrerUid}`);
        const referrerSnap = await get(referrerRef);
        const referrerData = referrerSnap.val();
        const newReferrals = { ...(referrerData.referrals || {}), [currentUser.uid]: { joinedAt: Date.now(), totalContribution: 0 } };
        const newRewards = (referrerData.referralRewards || 0) + appSettings.referral.referralBonus;

        await update(referrerRef, { referrals: newReferrals, referralRewards: newRewards });

        showStatus(statusEl, `Referral code applied! ${appSettings.referral.referralBonus} FZ added to referrer.`, false);
        if (input) input.value = '';
        toggleReferralUI(true);

    } catch (error) {
        console.error('Referral submission error:', error);
        showStatus(statusEl, 'Failed to submit referral code', true);
    }
}

// ========================================
// CLAIM REFERRAL REWARDS
// ========================================
export async function claimReferralRewards(currentUser, userData, showNotification, showAdModal) {
    if (!userData.referralRewards || userData.referralRewards <= 0) {
        showNotification('No referral rewards to claim', 'error');
        return;
    }

    try {
        const userRef = ref(database, `users/${currentUser.uid}`);
        const newBalance = (userData.balance || 0) + userData.referralRewards;
        await update(userRef, { balance: newBalance, referralRewards: 0 });
        showNotification(`Claimed ${userData.referralRewards.toFixed(2)} FZ from referrals!`, 'success');
        if (showAdModal) showAdModal();
    } catch (error) {
        console.error('Claim referral error:', error);
        showNotification('Failed to claim referral rewards', 'error');
    }
}

// ========================================
// CHECK MILESTONES
// ========================================
export async function checkReferralMilestones(currentUser, userData, appSettings) {
    if (!userData.referrals) return;
    const referralCount = Object.keys(userData.referrals).length;
    const milestones = userData.referralMilestones || {};
    const milestone = appSettings.referral.referralMilestone;
    const milestoneLevel = Math.floor(referralCount / milestone);

    if (milestoneLevel > 0 && !milestones[milestoneLevel]) {
        const bonus = milestone * appSettings.referral.referralBonus;
        milestones[milestoneLevel] = { reached: Date.now(), bonus };
        const newRewards = (userData.referralRewards || 0) + bonus;
        await update(ref(database, `users/${currentUser.uid}`), { referralMilestones: milestones, referralRewards: newRewards });
        console.log(`Milestone ${milestoneLevel} reached! Bonus: ${bonus} FZ`);
    }
}

// ========================================
// UPDATE REFERRALS LIST
// ========================================
export async function updateReferralsList(userData) {
    const listEl = document.getElementById('referralsList');
    const totalEl = document.getElementById('totalReferrals');
    if (!listEl || !totalEl) return;

    const referrals = userData.referrals || {};
    const count = Object.keys(referrals).length;
    totalEl.textContent = count;

    if (count === 0) {
        listEl.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">No referrals yet. Share your code to get started!</p>';
        return;
    }

    listEl.innerHTML = '';
    for (const [uid, data] of Object.entries(referrals)) {
        const joinedDate = new Date(data.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const contribution = (data.totalContribution || 0).toFixed(2);

        const item = document.createElement('div');
        item.className = 'bg-gray-50 p-3 rounded-lg flex justify-between items-center text-xs sm:text-sm';
        item.innerHTML = `
            <div>
                <p class="font-semibold text-gray-800">User #${uid.slice(-6)}</p>
                <p class="text-gray-500">Joined: ${joinedDate}</p>
            </div>
            <p class="text-green-600 font-bold">${contribution} FZ</p>
        `;
        listEl.appendChild(item);
    }
}

// ========================================
// MAIN INITIALIZER
// ========================================
export function initProfileSection(currentUser, userData, appSettings, showNotification, showAdModal, logoutCallback) {
    renderProfileSection();

    // Update dynamic data
    const balanceEl = document.getElementById('profileBalance');
    const rewardsEl = document.getElementById('referralRewards');
    if (balanceEl) balanceEl.textContent = `${(userData.balance || 0).toFixed(2)} FZ`;
    if (rewardsEl) rewardsEl.textContent = `${(userData.referralRewards || 0).toFixed(2)} FZ`;

    const claimBtn = document.getElementById('claimReferralBtn');
    if (claimBtn) {
        claimBtn.style.display = (userData.referralRewards > 0) ? 'block' : 'none';
        claimBtn.onclick = () => claimReferralRewards(currentUser, userData, showNotification, showAdModal);
    }

    const refCodeEl = document.getElementById('refCode');
    if (refCodeEl) refCodeEl.textContent = userData.referralCode || '---';

    if (userData.createdAt) {
        const date = new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const joinDateEl = document.getElementById('joinDate');
        if (joinDateEl) joinDateEl.textContent = date;
    }

    toggleReferralUI(!!userData.referredBy);
    updateReferralsList(userData);

    // Event listeners
    document.getElementById('copyCode')?.addEventListener('click', () => copyReferralCode(userData, showNotification));
    document.getElementById('shareWA')?.addEventListener('click', () => shareReferralCode(userData, 'whatsapp', appSettings, showNotification));
    document.getElementById('shareTG')?.addEventListener('click', () => shareReferralCode(userData, 'telegram', appSettings, showNotification));
    document.getElementById('submitReferralBtn')?.addEventListener('click', () => submitReferralCode(currentUser, userData, appSettings, showStatus));

    document.getElementById('authBtn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            auth.signOut().then(logoutCallback).catch(err => showNotification('Logout failed', 'error'));
        }
    });
}