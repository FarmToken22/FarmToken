// home.js - Home Section with Smart Single Ad System (100% Error-Free)
import { auth, database } from './config.js';
import { ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// ========================================
// AD CONFIGURATION
// ========================================
const AD_KEY = '78ade24182729fceea8e45203dad915b';
const AD_URL = '//www.highperformanceformat.com/' + AD_KEY + '/invoke.js';
let adLoaded = false; // Only one ad will load

// Mining state
let miningInterval = null;
let countdownInterval = null;

// Helper function to show notifications
function showNotification(message, type = 'info') {
    const notificationEl = document.createElement('div');
    notificationEl.className = 'fixed top-4 right-4 p-4 rounded-lg shadow-lg ' + 
        (type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500') + 
        ' text-white z-50';
    notificationEl.textContent = message;
    document.body.appendChild(notificationEl);
    setTimeout(() => notificationEl.remove(), 5000);
}

// ========================================
// DYNAMIC SECTION RENDERING
// ========================================
export function renderHomeSection() {
    const container = document.getElementById('homeSection');
    if (!container) {
        showNotification('Home section container not found', 'error');
        return;
    }
    
    container.innerHTML = 
        '<div class="p-3 sm:p-4 max-w-lg mx-auto w-full">' +
            '<!-- Stats Bar -->' +
            '<div class="stats-bar flex justify-around p-4 bg-white rounded-xl shadow mb-4">' +
                '<div class="text-center">' +
                    '<h4 class="text-xs uppercase text-gray-600 font-semibold">Balance</h4>' +
                    '<p id="totalBalance" class="text-lg font-bold text-green-600">0.00 FZ</p>' +
                '</div>' +
                '<div class="text-center">' +
                    '<h4 class="text-xs uppercase text-gray-600 font-semibold">Mining Rate</h4>' +
                    '<p id="miningRate" class="text-lg font-bold text-green-600">0.00/hr</p>' +
                '</div>' +
                '<div class="text-center">' +
                    '<h4 class="text-xs uppercase text-gray-600 font-semibold">Referrals</h4>' +
                    '<p id="referralCount" class="text-lg font-bold text-green-600">0</p>' +
                '</div>' +
            '</div>' +
            
            '<!-- Ad Space 1 (Hidden by default) -->' +
            '<div id="adSpaceHome1" class="ad-container mb-4 min-h-[50px] flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden transition-all duration-300" style="display: none;">' +
                '<div id="adContainerHome1"></div>' +
            '</div>' +
            
            '<!-- Mining Section -->' +
            '<div class="mining text-center flex flex-col items-center">' +
                '<div class="mining-container w-full">' +
                    '<img src="Full.png" alt="Mining Animation" class="w-full rounded-xl shadow-lg mx-auto" onerror="this.onerror=null; this.src=\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgNDAwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2UwZTBlMCIgcng9IjEyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiIGZvbnQtc2l6ZT0iMjAiIGR5PSIuM2VtIj5NaW5pbmcgQXJlYTwvdGV4dD48L3N2Zz4=\';">' +
                    '<button class="mining-btn w-full mt-4 py-3 bg-green-500 text-white rounded-lg font-semibold disabled:bg-gray-400" id="miningBtn" disabled>' +
                        '<span class="timer-display">Start Mining</span>' +
                        '<span class="earned-display" id="earnedDisplay">0.000000 FZ</span>' +
                    '</button>' +
                '</div>' +
                
                '<!-- Mining Info Card -->' +
                '<div class="mining-info bg-white p-4 rounded-xl shadow w-full max-w-[400px] mt-4">' +
                    '<div class="flex justify-between py-2 border-b">' +
                        '<span class="text-gray-600">Mining Status</span>' +
                        '<span class="mining-status" id="miningStatus">Inactive</span>' +
                    '</div>' +
                    '<div class="flex justify-between py-2 border-b">' +
                        '<span class="text-gray-600">Current Earned</span>' +
                        '<span class="text-green-600 font-semibold" id="currentEarned">0.000000 FZ</span>' +
                    '</div>' +
                    '<div class="flex justify-between py-2">' +
                        '<span class="text-gray-600">Total Mined</span>' +
                        '<span class="text-green-600 font-semibold" id="totalMined">0.00 FZ</span>' +
                    '</div>' +
                '</div>' +
                
                '<!-- Ad Space 2 (Hidden by default) -->' +
                '<div id="adSpaceHome2" class="ad-container mt-4 w-full min-h-[50px] flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden transition-all duration-300" style="display: none;">' +
                    '<div id="adContainerHome2"></div>' +
                '</div>' +
            '</div>' +
        '</div>';

    console.log('Home section rendered with smart ad system');
    loadSingleAd(); // Load only one ad
}

// ========================================
// SMART AD LOADER: Only ONE Ad Loads
// ========================================
function loadSingleAd() {
    if (adLoaded) return;

    const adSpaces = [
        { space: document.getElementById('adSpaceHome1'), container: 'adContainerHome1' },
        { space: document.getElementById('adSpaceHome2'), container: 'adContainerHome2' }
    ].filter(item => item.space);

    if (adSpaces.length === 0) return;

    const randomIndex = Math.floor(Math.random() * adSpaces.length);
    const selected = adSpaces[randomIndex];
    selected.space.style.display = 'flex';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.onload = () => {
        adLoaded = true;
        console.log('Ad loaded in home adSpace' + (randomIndex + 1));
    };
    script.onerror = () => {
        selected.space.style.display = 'none';
        console.warn('Ad failed to load in home adSpace' + (randomIndex + 1));
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
// MINING CALCULATIONS
// ========================================
export function calculateCurrentEarned(userData, appSettings, getServerTime) {
    if (!userData.miningStartTime) return 0;
    
    const now = getServerTime();
    const elapsed = Math.min(now - userData.miningStartTime, appSettings.mining.miningDuration * 3600000);
    const rate = appSettings.mining.totalReward / (appSettings.mining.miningDuration * 3600000);
    
    return elapsed * rate;
}

// ========================================
// START COUNTDOWN AND EARNED DISPLAY (Fixed: timerDisplay)
// ========================================
export function startCountdownAndEarned(endTime, getServerTime, appSettings, userData, stopMining, showNotification) {
    const timerDisplay = document.querySelector('#miningBtn .timer-display');
    const earnedDisplay = document.getElementById('earnedDisplay');
    const currentEarnedEl = document.getElementById('currentEarned');
    
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        const now = getServerTime();
        const remainingMs = Math.max(0, endTime - now);
        
        if (remainingMs <= 0) {
            clearInterval(countdownInterval);
            stopMining();
            if (timerDisplay) timerDisplay.textContent = 'Claim'; // FIXED: timer|Display → timerDisplay
            showNotification('Mining complete! Claim your reward.', 'success');
            return;
        }
        
        const hours = Math.floor(remainingMs / 3600000);
        const minutes = Math.floor((remainingMs % 3600000) / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        
        if (timerDisplay) {
            timerDisplay.textContent = 
                hours.toString().padStart(2, '0') + ':' + 
                minutes.toString().padStart(2, '0') + ':' + 
                seconds.toString().padStart(2, '0');
        }
        
        const earned = calculateCurrentEarned(userData, appSettings, getServerTime);
        if (earnedDisplay) earnedDisplay.textContent = earned.toFixed(6) + ' FZ';
        if (currentEarnedEl) currentEarnedEl.textContent = earned.toFixed(6) + ' FZ';
    }, 1000);
}

// ========================================
// START MINING
// ========================================
async function startMining(userRef, appSettings, getServerTime) {
    try {
        const now = getServerTime();
        await update(userRef, {
            miningStartTime: now,
            miningEndTime: now + (appSettings.mining.miningDuration * 3600000)
        });
        showNotification('Mining started!', 'success');
    } catch (error) {
        showNotification('Failed to start mining: ' + error.message, 'error');
    }
}

// ========================================
// STOP MINING
// ========================================
function stopMining() {
    if (miningInterval) clearInterval(miningInterval);
    const statusEl = document.getElementById('miningStatus');
    if (statusEl) statusEl.textContent = 'Inactive';
    const btn = document.getElementById('miningBtn');
    if (btn) btn.disabled = false;
}

// ========================================
// CLAIM REWARD
// ========================================
async function claimReward(userRef, userData, appSettings, getServerTime) {
    try {
        const earned = calculateCurrentEarned(userData, appSettings, getServerTime);
        const newBalance = (userData.balance || 0) + earned;
        const newTotalMined = (userData.totalMined || 0) + earned;
        
        const session = {
            startTime: userData.miningStartTime,
            endTime: getServerTime(),
            reward: earned,
            claimed: true
        };
        
        const miningSessions = [...(userData.miningSessions || []), session];
        
        await update(userRef, {
            balance: newBalance,
            totalMined: newTotalMined,
            miningStartTime: null,
            miningEndTime: null,
            miningSessions: miningSessions
        });
        
        const balEl = document.getElementById('totalBalance');
        if (balEl) balEl.textContent = newBalance.toFixed(2) + ' FZ';
        const minedEl = document.getElementById('totalMined');
        if (minedEl) minedEl.textContent = newTotalMined.toFixed(2) + ' FZ';
        const currEl = document.getElementById('currentEarned');
        if (currEl) currEl.textContent = '0.000000 FZ';
        const earnEl = document.getElementById('earnedDisplay');
        if (earnEl) earnEl.textContent = '0.000000 FZ';
        const timerEl = document.querySelector('#miningBtn .timer-display');
        if (timerEl) timerEl.textContent = 'Start Mining';
        
        showNotification('Claimed ' + earned.toFixed(6) + ' FZ!', 'success');
        updateRecentSessions({ miningSessions });
    } catch (error) {
        showNotification('Failed to claim reward: ' + error.message, 'error');
    }
}

// ========================================
// UPDATE UI
// ========================================
export function updateUI(userData, appSettings, getServerTime) {
    try {
        const balEl = document.getElementById('totalBalance');
        if (balEl) balEl.textContent = (userData.balance || 0).toFixed(2) + ' FZ';
        const rateEl = document.getElementById('miningRate');
        if (rateEl) rateEl.textContent = (appSettings.mining.totalReward / appSettings.mining.miningDuration).toFixed(2) + '/hr';
        const refEl = document.getElementById('referralCount');
        if (refEl) refEl.textContent = userData.referralCount || 0;
        const minedEl = document.getElementById('totalMined');
        if (minedEl) minedEl.textContent = (userData.totalMined || 0).toFixed(2) + ' FZ';
        
        const miningBtn = document.getElementById('miningBtn');
        const timerDisplay = document.querySelector('#miningBtn .timer-display');
        const statusEl = document.getElementById('miningStatus');
        
        if (userData.miningStartTime && userData.miningEndTime > getServerTime()) {
            if (statusEl) statusEl.textContent = 'Active';
            if (miningBtn) miningBtn.disabled = true;
            startCountdownAndEarned(userData.miningEndTime, getServerTime, appSettings, userData, stopMining, showNotification);
        } else if (userData.miningStartTime) {
            if (statusEl) statusEl.textContent = 'Complete';
            if (miningBtn) miningBtn.disabled = false;
            if (timerDisplay) timerDisplay.textContent = 'Claim';
        } else {
            if (statusEl) statusEl.textContent = 'Inactive';
            if (miningBtn) miningBtn.disabled = false;
            if (timerDisplay) timerDisplay.textContent = 'Start Mining';
        }
        
        updateRecentSessions(userData);
    } catch (error) {
        showNotification('Failed to update UI: ' + error.message, 'error');
    }
}

// ========================================
// RECENT SESSIONS
// ========================================
function updateRecentSessions(userData) {
    const sessionsEl = document.getElementById('recentSessions');
    if (!sessionsEl) return;
    
    const miningSessions = userData.miningSessions || [];
    
    if (miningSessions.length === 0) {
        sessionsEl.innerHTML = '';
        return;
    }
    
    const recentSessions = miningSessions.slice(-5).reverse();
    
    sessionsEl.innerHTML = recentSessions.map(session => {
        const startDate = new Date(session.startTime);
        const endDate = new Date(session.endTime);
        
        const formattedDate = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const startTime = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const endTime = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        const statusIcon = session.claimed ? 'Checkmark' : 'Hourglass';
        const statusColor = session.claimed ? 'text-green-600' : 'text-yellow-600';
        const bgColor = session.claimed ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200';
        
        return '<div class="flex items-center justify-between p-3 ' + bgColor + ' rounded-lg border">' +
            '<div class="flex items-center gap-3">' +
                '<div class="bg-green-500 text-white rounded-full p-2">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />' +
                    '</svg>' +
                '</div>' +
                '<div>' +
                    '<p class="font-semibold text-gray-800">+' + session.reward.toFixed(2) + ' FZ</p>' +
                    '<p class="text-xs text-gray-500">' + formattedDate + ' • ' + startTime + ' - ' + endTime + '</p>' +
                '</div>' +
            '</div>' +
            '<span class="' + statusColor + ' font-bold text-xl">' + statusIcon + '</span>' +
        '</div>';
    }).join('');
}

// ========================================
// CLEANUP
// ========================================
export function cleanupMining() {
    if (miningInterval) clearInterval(miningInterval);
    if (countdownInterval) clearInterval(countdownInterval);
    miningInterval = null;
    countdownInterval = null;
}

// ========================================
// INITIALIZE
// ========================================
export function initHomeSection(userData, appSettings, getServerTime) {
    renderHomeSection();
    
    const userRef = ref(database, 'users/' + auth.currentUser.uid);
    
    const miningBtn = document.getElementById('miningBtn');
    if (miningBtn) {
        miningBtn.addEventListener('click', async () => {
            if (miningBtn.disabled) return;
            
            if (userData.miningStartTime && !(userData.miningEndTime > getServerTime())) {
                await claimReward(userRef, userData, appSettings, getServerTime);
            } else {
                await startMining(userRef, appSettings, getServerTime);
            }
        });
    }
    
    onValue(userRef, (snapshot) => {
        const updatedUserData = snapshot.val();
        updateUI(updatedUserData, appSettings, getServerTime);
    }, (error) => {
        showNotification('Failed to load user data: ' + error.message, 'error');
    });
    
    updateUI(userData, appSettings, getServerTime);
}

export { updateRecentSessions };