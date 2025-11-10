// home.js - Home Section Module (Updated for dynamic rendering)
import { auth, database } from './config.js';
import { ref, get, set, onValue } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// Mining state
let miningInterval = null;
let countdownInterval = null;

// ========================================
// DYNAMIC SECTION RENDERING
// ========================================
export function renderHomeSection() {
    const container = document.getElementById('homeSection');
    if (!container) {
        console.error('Home section container not found');
        return;
    }
    
    container.innerHTML = `
        <div class="p-3 sm:p-4 max-w-lg mx-auto w-full">
            <!-- Stats Bar -->
            <div class="stats-bar flex justify-around p-4 bg-white rounded-xl shadow mb-4">
                <div class="text-center">
                    <h4 class="text-xs uppercase text-gray-600 font-semibold">Balance</h4>
                    <p id="totalBalance" class="text-lg font-bold text-green-600">0.00 FZ</p>
                </div>
                <div class="text-center">
                    <h4 class="text-xs uppercase text-gray-600 font-semibold">Mining Rate</h4>
                    <p id="miningRate" class="text-lg font-bold text-green-600">0.00/hr</p>
                </div>
                <div class="text-center">
                    <h4 class="text-xs uppercase text-gray-600 font-semibold">Referrals</h4>
                    <p id="referralCount" class="text-lg font-bold text-green-600">0</p>
                </div>
            </div>
            
            <!-- Mining Section -->
            <div class="mining text-center flex flex-col items-center">
                <div class="mining-container">
                    <img src="Full.png" alt="Mining Animation" class="w-full rounded-xl shadow-lg" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22><rect width=%22400%22 height=%22400%22 fill=%22%23e0e0e0%22 rx=%2212%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2220%22>Mining Area</text></svg>'">
                    <button class="mining-btn" id="miningBtn" disabled>
                        <span class="timer-display">Start Mining</span>
                        <span class="earned-display" id="earnedDisplay">0.000000 FZ</span>
                    </button>
                </div>
                
                <!-- Mining Info Card -->
                <div class="mining-info bg-white p-4 rounded-xl shadow w-full max-w-[400px]">
                    <div class="flex justify-between py-2 border-b">
                        <span class="text-gray-600">Mining Status</span>
                        <span class="mining-status" id="miningStatus">Inactive</span>
                    </div>
                    <div class="flex justify-between py-2 border-b">
                        <span class="text-gray-600">Current Earned</span>
                        <span class="text-green-600 font-semibold" id="currentEarned">0.000000 FZ</span>
                    </div>
                    <div class="flex justify-between py-2">
                        <span class="text-gray-600">Total Mined</span>
                        <span class="text-green-600 font-semibold" id="totalMined">0.00 FZ</span>
                    </div>
                </div>
            </div>
            
            <!-- Mining Instructions -->
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-4 mt-4">
                <h4 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    How to Mine
                </h4>
                <ul class="text-sm text-gray-600 space-y-1">
                    <li class="flex items-start gap-2">
                        <span class="text-green-500 font-bold">•</span>
                        <span>Click <strong>"Start Mining"</strong> to begin earning FZ tokens</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-green-500 font-bold">•</span>
                        <span>Mining runs automatically for 8 hours</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-green-500 font-bold">•</span>
                        <span>Click <strong>"Claim"</strong> when mining is complete</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-green-500 font-bold">•</span>
                        <span>Refer friends to boost your mining rate!</span>
                    </li>
                </ul>
            </div>
            
            <!-- Quick Stats -->
            <div class="grid grid-cols-2 gap-3 mt-4">
                <div class="bg-white rounded-lg shadow p-3 border-l-4 border-blue-500">
                    <div class="flex items-center gap-2 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-xs text-gray-600 font-semibold">Session Time</span>
                    </div>
                    <p class="text-lg font-bold text-gray-800" id="sessionTime">8 Hours</p>
                </div>
                
                <div class="bg-white rounded-lg shadow p-3 border-l-4 border-purple-500">
                    <div class="flex items-center gap-2 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-xs text-gray-600 font-semibold">Max Reward</span>
                    </div>
                    <p class="text-lg font-bold text-gray-800" id="maxReward">6.00 FZ</p>
                </div>
            </div>
            
            <!-- Recent Activities -->
            <div class="bg-white shadow rounded-xl p-4 mt-4">
                <h3 class="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Recent Mining Sessions
                </h3>
                <div id="recentSessions" class="space-y-2 max-h-48 overflow-y-auto">
                    <p class="text-gray-500 text-sm text-center py-4">No mining sessions yet. Start mining now!</p>
                </div>
            </div>
        </div>
    `;
    
    console.log('✅ Home section rendered dynamically');
}

// ========================================
// MINING CALCULATIONS
// ========================================

// Calculate current earned amount
export function calculateCurrentEarned(userData, appSettings, getServerTime) {
    if (!userData.miningStartTime) return 0;
    
    const now = getServerTime();
    const elapsed = Math.min(now - userData.miningStartTime, appSettings.mining.miningDuration * 3600000);
    const rate = appSettings.mining.totalReward / (appSettings.mining.miningDuration * 3600000);
    
    return elapsed * rate;
}

// Start countdown and earned display
export function startCountdownAndEarned(endTime, getServerTime, appSettings, userData, stopMining, showNotification) {
    const timerDisplay = document.querySelector('#miningBtn .timer-display');
    const earnedDisplay = document.getElementById('earnedDisplay');
    const currentEarnedEl = document.getElementById('currentEarned');
    
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        const now = getServerTime();
        const remaining = Math.max(0, endTime - now);
        
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            stopMining();
            if (timerDisplay) timerDisplay.textContent = 'Claim';
            showNotification('Mining complete! Claim your reward.', 'success');
            return;
        }
        
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        if (timerDisplay) {
            timerDisplay.textContent = `${hours}h ${minutes}m ${seconds}s`;
        }
        
        const earned = calculateCurrentEarned(userData, appSettings, getServerTime);
        if (earnedDisplay) earnedDisplay.textContent = `${earned.toFixed(6)} FZ`;
        if (currentEarnedEl) currentEarnedEl.textContent = `${earned.toFixed(6)} FZ`;
    }, 1000);
}

// ========================================
// RECENT SESSIONS DISPLAY
// ========================================
function updateRecentSessions(userData) {
    const sessionsEl = document.getElementById('recentSessions');
    if (!sessionsEl) return;
    
    const miningSessions = userData.miningSessions || [];
    
    if (miningSessions.length === 0) {
        sessionsEl.innerHTML = `
            <p class="text-gray-500 text-sm text-center py-4">
                No mining sessions yet. Start mining now!
            </p>
        `;
        return;
    }
    
    // Show last 5 sessions
    const recentSessions = miningSessions.slice(-5).reverse();
    
    sessionsEl.innerHTML = recentSessions.map(session => {
        const startDate = new Date(session.startTime);
        const endDate = new Date(session.endTime);
        
        const formattedDate = startDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
        });
        const startTime = startDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
        const endTime = endDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
        
        const statusIcon = session.claimed ? '✓' : '⏳';
        const statusColor = session.claimed ? 'text-green-600' : 'text-yellow-600';
        const bgColor = session.claimed ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200';
        
        return `
            <div class="flex items-center justify-between p-3 ${bgColor} rounded-lg border">
                <div class="flex items-center gap-3">
                    <div class="bg-green-500 text-white rounded-full p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                    </div>
                    <div>
                        <p class="font-semibold text-gray-800">+${session.reward.toFixed(2)} FZ</p>
                        <p class="text-xs text-gray-500">${formattedDate} • ${startTime} - ${endTime}</p>
                    </div>
                </div>
                <span class="${statusColor} font-bold text-xl">${statusIcon}</span>
            </div>
        `;
    }).join('');
}

// ========================================
// UPDATE MINING DISPLAY
// ========================================
export function updateMiningDisplay(appSettings) {
    // Update session time and max reward
    const sessionTimeEl = document.getElementById('sessionTime');
    const maxRewardEl = document.getElementById('maxReward');
    
    if (sessionTimeEl) {
        sessionTimeEl.textContent = `${appSettings.mining.miningDuration} Hours`;
    }
    
    if (maxRewardEl) {
        maxRewardEl.textContent = `${appSettings.mining.totalReward.toFixed(2)} FZ`;
    }
}

// ========================================
// CLEANUP
// ========================================
export function cleanupMining() {
    if (miningInterval) {
        clearInterval(miningInterval);
        miningInterval = null;
    }
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

// ========================================
// INITIALIZE
// ========================================
export function initHomeSection(userData = null, appSettings = null) {
    console.log('✅ Home section initialized');
    
    // Update recent sessions if userData is available
    if (userData) {
        updateRecentSessions(userData);
    }
    
    // Update mining display if appSettings is available
    if (appSettings) {
        updateMiningDisplay(appSettings);
    }
}

// Export for external use
export { updateRecentSessions };