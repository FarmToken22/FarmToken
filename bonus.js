// bonus.js - Bonus Section Module (Updated for Daily Streak Rewards)
import { auth, database } from './config.js';
import { ref, update } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// ========================================
// CONSTANTS
// ========================================
const BONUS_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
// Daily streak rewards array (30 days)
const dailyRewards = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 7];

let bonusTimerInterval = null;

// ========================================
// DYNAMIC SECTION RENDERING
// ========================================
export function renderBonusSection() {
    const container = document.getElementById('bonusSection');
    if (!container) {
        console.error('Bonus section container not found');
        return;
    }
    
    container.innerHTML = `
        <div class="p-3 sm:p-4 max-w-lg mx-auto w-full pb-20">
            <div class="bg-white shadow rounded-xl p-4 sm:p-6 text-center">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Daily Streak Bonus</h2>
                <p class="text-gray-500 mb-6">Claim your reward every 24 hours to build your streak!</p>
                
                <div class="bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-xl p-6 mb-5">
                    <p class="text-yellow-600 font-semibold">Your Next Reward</p>
                    <p id="nextBonusAmount" class="text-4xl font-bold text-yellow-800 my-2">🎁 -- FZ</p>
                    <p id="bonusStreakDisplay" class="text-sm text-yellow-700">Current Streak: 0 days</p>
                </div>
                
                <button id="claimBonusBtn" class="w-full bg-yellow-500 text-white py-3 rounded-lg shadow text-base font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Claim Bonus
                </button>
                <div id="bonusTimer" class="mt-4 text-gray-600 font-medium"></div>
                <p id="bonusStatus" class="status text-center mt-2"></p>
            </div>
            
            <!-- Bonus History Section -->
            <div class="bg-white shadow rounded-xl p-4 sm:p-6 mt-4">
                <h3 class="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Bonus History
                </h3>
                <div id="bonusHistory" class="space-y-2 max-h-48 overflow-y-auto">
                    <p class="text-gray-500 text-sm text-center py-4">Your bonus claim history will appear here.</p>
                </div>
            </div>
            
            <!-- Bonus Information -->
            <div class="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg p-4 mt-4">
                <h4 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    How Daily Streak Works
                </h4>
                <ul class="text-sm text-gray-600 space-y-1">
                    <li class="flex items-start gap-2"><span class="text-yellow-500 font-bold">•</span><span>Claim your bonus every 24 hours to increase your streak.</span></li>
                    <li class="flex items-start gap-2"><span class="text-yellow-500 font-bold">•</span><span>The longer your streak, the bigger the reward!</span></li>
                    <li class="flex items-start gap-2"><span class="text-yellow-500 font-bold">•</span><span>If you miss a day (wait longer than 48 hours), your streak will reset to day 1.</span></li>
                    <li class="flex items-start gap-2"><span class="text-yellow-500 font-bold">•</span><span>Rewards cap at day 30's amount for streaks longer than 30 days.</span></li>
                </ul>
            </div>
        </div>
    `;
    
    console.log('✅ Bonus section with streak system rendered dynamically');
}

// ========================================
// BONUS LOGIC (INTERNAL & EXPORTED)
// ========================================

/**
 * (Internal) Gets the current state of the user's bonus.
 * @param {object} userData - User data from Firebase.
 * @param {function} getServerTime - Function to get server-synced time.
 * @returns {object} An object with bonus state details.
 */
function getBonusState(userData, getServerTime) {
    const now = getServerTime();
    const lastClaim = userData.lastBonusClaim || 0;
    const streak = userData.bonusStreak || 0;

    const timeSinceLastClaim = now - lastClaim;
    
    const isAvailable = timeSinceLastClaim >= BONUS_INTERVAL;
    const isStreakBroken = timeSinceLastClaim >= (2 * BONUS_INTERVAL);
    const currentStreak = isAvailable ? (isStreakBroken ? 0 : streak) : streak;
    
    const nextBonusAmount = dailyRewards[Math.min(currentStreak, dailyRewards.length - 1)];

    return {
        isAvailable,
        currentStreak,
        nextBonusAmount,
        timeUntilNextBonus: Math.max(0, (lastClaim + BONUS_INTERVAL) - now)
    };
}

// Re-exporting for backward compatibility with other modules
export function isBonusAvailable(userData, getServerTime) {
    return getBonusState(userData, getServerTime).isAvailable;
}

// Re-exporting for backward compatibility
export function getTimeUntilNextBonus(userData, getServerTime) {
    return getBonusState(userData, getServerTime).timeUntilNextBonus;
}

// Update bonus timer display
export function updateBonusTimer(userData, getServerTime) {
    const timerEl = document.getElementById('bonusTimer');
    const claimBtn = document.getElementById('claimBonusBtn');
    const nextBonusAmountEl = document.getElementById('nextBonusAmount');
    const streakDisplayEl = document.getElementById('bonusStreakDisplay');

    if (!timerEl || !claimBtn || !nextBonusAmountEl || !streakDisplayEl) return;

    if (bonusTimerInterval) clearInterval(bonusTimerInterval);

    const updateDisplay = () => {
        const state = getBonusState(userData, getServerTime);

        nextBonusAmountEl.innerHTML = `🎁 ${state.nextBonusAmount} FZ`;
        streakDisplayEl.textContent = `Current Streak: ${state.currentStreak} day(s)`;

        if (state.isAvailable) {
            timerEl.innerHTML = `
                <span class="inline-flex items-center gap-2 text-green-600 font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Bonus Available!
                </span>
            `;
            claimBtn.disabled = false;
            clearInterval(bonusTimerInterval);
        } else {
            const remaining = state.timeUntilNextBonus;
            const hours = Math.floor(remaining / 3600000);
            const minutes = Math.floor((remaining % 3600000) / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);

            timerEl.innerHTML = `
                <span class="inline-flex items-center gap-2 text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Next bonus in: <strong>${hours}h ${minutes}m ${seconds}s</strong>
                </span>
            `;
            claimBtn.disabled = true;
        }
    };

    updateDisplay();
    if (!getBonusState(userData, getServerTime).isAvailable) {
        bonusTimerInterval = setInterval(updateDisplay, 1000);
    }
}

// Update bonus history display
function updateBonusHistory(userData) {
    const historyEl = document.getElementById('bonusHistory');
    if (!historyEl) return;

    const bonusHistory = userData.bonusHistory || [];

    if (bonusHistory.length === 0) {
        historyEl.innerHTML = `<p class="text-gray-500 text-sm text-center py-4">No bonus claims yet. Claim your first bonus now!</p>`;
        return;
    }

    const recentClaims = bonusHistory.slice(-10).reverse();
    historyEl.innerHTML = recentClaims.map(claim => {
        const date = new Date(claim.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div class="flex items-center gap-3">
                    <div class="bg-yellow-500 text-white rounded-full p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                    </div>
                    <div>
                        <p class="font-semibold text-gray-800">+${claim.amount} FZ</p>
                        <p class="text-xs text-gray-500">${formattedDate} at ${formattedTime}</p>
                    </div>
                </div>
                <span class="text-green-600 font-bold">✓</span>
            </div>
        `;
    }).join('');
}

// Claim bonus
export async function claimBonus(currentUser, userData, getServerTime, showNotification, showAdModal) {
    const statusEl = document.getElementById('bonusStatus');
    const claimBtn = document.getElementById('claimBonusBtn');

    const state = getBonusState(userData, getServerTime);
    
    if (!state.isAvailable) {
        showStatus(statusEl, 'Bonus not available yet', true);
        return;
    }

    if (claimBtn) claimBtn.disabled = true;

    try {
        const userRef = ref(database, `users/${currentUser.uid}`);
        
        const bonusToClaim = state.nextBonusAmount;
        const newStreak = state.currentStreak + 1;
        
        const newBalance = (userData.balance || 0) + bonusToClaim;
        const now = getServerTime();
        
        const bonusHistory = userData.bonusHistory || [];
        bonusHistory.push({
            amount: bonusToClaim,
            timestamp: now
        });

        await update(userRef, {
            balance: newBalance,
            lastBonusClaim: now,
            bonusStreak: newStreak,
            bonusHistory: bonusHistory
        });

        showStatus(statusEl, `✅ Claimed ${bonusToClaim} FZ bonus! Your streak is now ${newStreak} days!`, false);
        showNotification(`Bonus claimed! +${bonusToClaim} FZ`, 'success');
        
        const updatedUserData = { 
            ...userData, 
            balance: newBalance,
            lastBonusClaim: now,
            bonusStreak: newStreak,
            bonusHistory 
        };
        
        updateBonusHistory(updatedUserData);
        updateBonusTimer(updatedUserData, getServerTime);
        
        if (showAdModal) showAdModal();

    } catch (error) {
        console.error('Bonus claim error:', error);
        showStatus(statusEl, 'Failed to claim bonus', true);
        if (claimBtn) claimBtn.disabled = false;
    }
}

// Show status message
function showStatus(el, message, isError = false) {
    if (!el) return;
    el.textContent = message;
    el.className = `status ${isError ? 'error' : 'success'} show`;
    setTimeout(() => el.className = 'status', 3000);
}

// Cleanup bonus timer
export function cleanupBonus() {
    if (bonusTimerInterval) {
        clearInterval(bonusTimerInterval);
        bonusTimerInterval = null;
    }
}

// Initialize bonus section
export function initBonusSection(userData, getServerTime) {
    if (!userData) {
        console.warn('Cannot initialize bonus section: userData is null');
        return;
    }

    updateBonusTimer(userData, getServerTime);
    updateBonusHistory(userData);

    console.log('✅ Streak bonus section initialized');
}

// Export constants for other modules if needed
export { dailyRewards, BONUS_INTERVAL };