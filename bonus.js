// bonus.js - Enhanced 30-Day Streak with Beautiful Design
import { auth, database } from './config.js';
import { ref, runTransaction } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// ========================================
// CONSTANTS
// ========================================
const BONUS_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const STREAK_BREAK_THRESHOLD = 48 * 60 * 60 * 1000; // 48 hours
const TOTAL_DAYS = 30;
const dailyRewards = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 7];

let bonusTimerInterval = null;

// ========================================
// ENHANCED RENDER WITH MODERN DESIGN
// ========================================
export function renderBonusSection() {
    const container = document.getElementById('bonusSection');
    if (!container) {
        console.error('Bonus section container not found');
        return;
    }

    const cardsHTML = Array.from({ length: TOTAL_DAYS }, (_, i) => {
        const day = i + 1;
        const reward = dailyRewards[i];
        const isSpecialDay = reward > 1;
        
        return `
            <div class="day-card group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer" data-day="${day}">
                ${isSpecialDay ? `
                    <div class="absolute -top-1 -right-1 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-bl-3xl flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                    </div>
                ` : ''}
                
                <div class="relative p-4 text-center">
                    <div class="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/20 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <p class="text-xs font-semibold text-gray-500 mb-1">Day ${day}</p>
                    
                    <div class="relative inline-block">
                        <div class="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity"></div>
                        <p class="relative text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600">
                            +${reward}
                        </p>
                    </div>
                    
                    <p class="text-xs font-bold text-yellow-700 tracking-wide">FZ</p>
                    
                    <div class="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div class="progress-bar h-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-full transition-all duration-700 shadow-lg" style="width: 0%"></div>
                    </div>
                </div>
                
                <div class="checkmark absolute inset-0 flex items-center justify-center bg-green-500/95 backdrop-blur-sm opacity-0 transition-opacity duration-300">
                    <div class="text-center">
                        <svg class="w-16 h-16 text-white mx-auto mb-2 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        <p class="text-white font-bold text-sm">Claimed!</p>
                    </div>
                </div>
                
                <div class="next-indicator absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-500">
                    <div class="absolute inset-0 border-4 border-yellow-400 rounded-2xl animate-pulse"></div>
                    <div class="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        Next!
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="p-4 sm:p-6 max-w-5xl mx-auto w-full">
            <!-- Animated Header -->
            <div class="text-center mb-8 relative">
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="w-32 h-32 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                </div>
                <div class="relative">
                    <h2 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 mb-2 animate-gradient">
                        🎁 30-Day Streak Challenge
                    </h2>
                    <p class="text-gray-600 text-sm font-medium">Claim daily rewards and build your streak!</p>
                </div>
            </div>

            <!-- Progress Overview Card -->
            <div class="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 rounded-3xl p-6 mb-6 shadow-xl border-2 border-yellow-200 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-300/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
                
                <div class="relative grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Current Streak -->
                    <div class="text-center">
                        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-3 shadow-lg">
                            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <p class="text-sm font-semibold text-yellow-700 mb-1">Current Streak</p>
                        <p id="bonusStreakDisplay" class="text-3xl font-black text-yellow-800">0 days</p>
                    </div>
                    
                    <!-- Next Reward -->
                    <div class="text-center">
                        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-3 shadow-lg">
                            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <p class="text-sm font-semibold text-green-700 mb-1">Next Reward</p>
                        <p id="nextBonusAmount" class="text-3xl font-black text-green-800">Gift -- FZ</p>
                    </div>
                    
                    <!-- Timer -->
                    <div class="text-center">
                        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mb-3 shadow-lg">
                            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <p class="text-sm font-semibold text-blue-700 mb-1">Time Remaining</p>
                        <p id="bonusTimer" class="text-2xl font-black text-blue-800">--:--:--</p>
                    </div>
                </div>
            </div>

            <!-- 30 Cards Grid - 3 per row -->
            <div class="grid grid-cols-3 gap-3 mb-6">
                ${cardsHTML}
            </div>

            <!-- Ad Space 1 - Mobile Friendly (320x50) -->
            <div class="ad-container mb-6 min-h-[50px] flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                <div id="ad-mobile-1">
                    <script type="text/javascript">
                        atOptions = {
                            'key' : '78ade24182729fceea8e45203dad915b',
                            'format' : 'iframe',
                            'height' : 50,
                            'width' : 320,
                            'params' : {}
                        };
                    </script>
                    <script type="text/javascript" src="//www.highperformanceformat.com/78ade24182729fceea8e45203dad915b/invoke.js"></script>
                </div>
            </div>

            <!-- Claim Button with Animation -->
            <button id="claimBonusBtn" class="w-full relative overflow-hidden bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white py-4 rounded-2xl shadow-2xl text-lg font-black hover:shadow-yellow-500/50 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group">
                <div class="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-20 transition-opacity">
                    <div class="w-full h-full bg-white rounded-full blur-xl"></div>
                </div>
                <span class="relative flex items-center justify-center gap-3">
                    <svg id="claimBtnIcon" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/>
                    </svg>
                    <span id="claimBtnText">🎁 Claim Your Daily Reward</span>
                    <span id="claimLoader" class="hidden">
                        <svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </span>
                </span>
            </button>

            <!-- Status Message -->
            <p id="bonusStatus" class="status text-center mt-4 text-lg font-bold"></p>
            
            <!-- Ad Space 2 - Mobile Friendly (320x50) -->
            <div class="ad-container mt-6 mb-4 min-h-[50px] flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                <div id="ad-mobile-2">
                    <script type="text/javascript">
                        atOptions = {
                            'key' : '78ade24182729fceea8e45203dad915b',
                            'format' : 'iframe',
                            'height' : 50,
                            'width' : 320,
                            'params' : {}
                        };
                    </script>
                    <script type="text/javascript" src="//www.highperformanceformat.com/78ade24182729fceea8e45203dad915b/invoke.js"></script>
                </div>
            </div>
            
            <!-- Motivational Text -->
            <div class="mt-6 text-center">
                <p class="text-sm text-gray-500 italic">✨ Don't break your streak! Come back every day to claim amazing rewards ✨</p>
            </div>
        </div>
        
        <style>
            @keyframes gradient {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
            
            .animate-gradient {
                background-size: 200% 200%;
                animation: gradient 3s ease infinite;
            }
            
            .day-card:hover .progress-bar {
                box-shadow: 0 0 20px rgba(234, 179, 8, 0.5);
            }
            
            /* Ad Container Styles */
            .ad-container {
                min-height: 50px;
                transition: all 0.3s ease;
            }
            
            .ad-container:empty {
                min-height: 50px;
                background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
            }
        </style>
    `;

    console.log('Enhanced 30-Day Streak rendered');
}

// ========================================
// ENHANCED UPDATE CARDS WITH ANIMATIONS
// ========================================
export function updateDayCards(userData, getServerTime) {
    const now = getServerTime();
    const streak = userData.bonusStreak || 0;
    const lastClaim = userData.lastBonusClaim || 0;
    const isAvailable = (now - lastClaim) >= BONUS_INTERVAL;

    document.querySelectorAll('.day-card').forEach((card, i) => {
        const day = i + 1;
        const progressBar = card.querySelector('.progress-bar');
        const checkmark = card.querySelector('.checkmark');
        const nextIndicator = card.querySelector('.next-indicator');

        // Reset classes
        card.className = 'day-card group relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br transition-all duration-300 cursor-pointer';

        if (day < streak) {
            // Claimed days
            progressBar.style.width = '100%';
            checkmark.classList.remove('opacity-0');
            checkmark.classList.add('opacity-100');
            card.classList.add('border-green-400', 'from-green-50', 'to-green-100', 'shadow-lg', 'shadow-green-200/50');
        } else if (day === streak && isAvailable) {
            // Ready to claim (current day)
            progressBar.style.width = '100%';
            nextIndicator.classList.remove('opacity-0');
            nextIndicator.classList.add('opacity-100');
            card.classList.add('border-yellow-400', 'from-yellow-50', 'to-yellow-100', 'shadow-2xl', 'shadow-yellow-400/50', 'scale-105', 'animate-pulse');
        } else if (day === streak && !isAvailable) {
            // Current streak but not available yet
            progressBar.style.width = '60%';
            card.classList.add('border-yellow-300', 'from-yellow-50', 'to-orange-50', 'shadow-md');
        } else if (day === streak + 1) {
            // Next day
            progressBar.style.width = '20%';
            card.classList.add('border-orange-300', 'from-white', 'to-orange-50', 'shadow-sm');
        } else {
            // Future days
            progressBar.style.width = '0%';
            card.classList.add('border-gray-200', 'from-white', 'to-gray-50', 'shadow-sm');
        }
    });
}

// ========================================
// BONUS STATE LOGIC
// ========================================
function getBonusState(userData, getServerTime) {
    if (!userData || typeof getServerTime !== 'function') {
        return { isAvailable: false, currentStreak: 0, nextBonusAmount: 1, timeUntilNextBonus: BONUS_INTERVAL };
    }

    const now = getServerTime();
    const lastClaim = userData.lastBonusClaim || 0;
    const streak = userData.bonusStreak || 0;

    const timeSinceLastClaim = now - lastClaim;
    const isAvailable = timeSinceLastClaim >= BONUS_INTERVAL;
    const isStreakBroken = timeSinceLastClaim >= STREAK_BREAK_THRESHOLD;

    const currentStreak = isStreakBroken ? 0 : streak;
    const nextStreak = isAvailable ? currentStreak + 1 : currentStreak;
    const nextBonusAmount = dailyRewards[Math.min(nextStreak - 1, dailyRewards.length - 1)];

    return {
        isAvailable,
        currentStreak,
        nextStreak,
        nextBonusAmount,
        timeUntilNextBonus: Math.max(0, (lastClaim + BONUS_INTERVAL) - now)
    };
}

export function isBonusAvailable(userData, getServerTime) {
    return getBonusState(userData, getServerTime).isAvailable;
}

export function getTimeUntilNextBonus(userData, getServerTime) {
    return getBonusState(userData, getServerTime).timeUntilNextBonus;
}

// ========================================
// ENHANCED TIMER UPDATE
// ========================================
export function updateBonusTimer(userData, getServerTime) {
    const timerEl = document.getElementById('bonusTimer');
    const claimBtn = document.getElementById('claimBonusBtn');
    const claimBtnText = document.getElementById('claimBtnText');
    const nextBonusAmountEl = document.getElementById('nextBonusAmount');
    const streakDisplayEl = document.getElementById('bonusStreakDisplay');

    if (!timerEl || !claimBtn || !nextBonusAmountEl || !streakDisplayEl) return;

    if (bonusTimerInterval) clearInterval(bonusTimerInterval);

    const update = () => {
        const state = getBonusState(userData, getServerTime);

        nextBonusAmountEl.innerHTML = `${state.nextBonusAmount} FZ 🎁`;
        streakDisplayEl.textContent = `${state.currentStreak} day${state.currentStreak !== 1 ? 's' : ''} 🔥`;

        if (state.isAvailable) {
            timerEl.innerHTML = `<span class="text-green-600 font-black text-xl animate-pulse">✅ Ready Now!</span>`;
            claimBtn.disabled = false;
            claimBtnText.textContent = '🎁 Claim Your Daily Reward';
            clearInterval(bonusTimerInterval);
            bonusTimerInterval = null;
        } else {
            const remaining = state.timeUntilNextBonus;
            const h = String(Math.floor(remaining / 3600000)).padStart(2, '0');
            const m = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0');
            const s = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
            timerEl.innerHTML = `${h}:${m}:${s}`;
            claimBtn.disabled = true;
            claimBtnText.textContent = '⏰ Come Back Tomorrow';
        }

        updateDayCards(userData, getServerTime);
    };

    update();
    if (!getBonusState(userData, getServerTime).isAvailable) {
        bonusTimerInterval = setInterval(update, 1000);
    }
}

// ========================================
// ENHANCED CLAIM WITH CELEBRATION
// ========================================
export async function claimBonus(currentUser, userData, getServerTime, showNotification) {
    const statusEl = document.getElementById('bonusStatus');
    const claimBtn = document.getElementById('claimBonusBtn');
    const btnText = document.getElementById('claimBtnText');
    const loader = document.getElementById('claimLoader');

    if (!currentUser || !userData) return;

    const state = getBonusState(userData, getServerTime);
    if (!state.isAvailable) {
        showStatus(statusEl, '⏰ Please wait 24 hours between claims', true);
        return;
    }

    claimBtn.disabled = true;
    btnText.classList.add('hidden');
    loader.classList.remove('hidden');

    try {
        const userRef = ref(database, `users/${currentUser.uid}`);
        const now = getServerTime();
        const bonusAmount = state.nextBonusAmount;
        const newStreak = state.currentStreak + 1;

        await runTransaction(userRef, (currentData) => {
            if (!currentData) return currentData;

            const last = currentData.lastBonusClaim || 0;
            const timeDiff = now - last;
            if (timeDiff < BONUS_INTERVAL) return currentData;
            if (timeDiff >= STREAK_BREAK_THRESHOLD) currentData.bonusStreak = 0;

            currentData.balance = (currentData.balance || 0) + bonusAmount;
            currentData.lastBonusClaim = now;
            currentData.bonusStreak = (currentData.bonusStreak || 0) + 1;

            return currentData;
        });

        const updated = {
            ...userData,
            balance: userData.balance + bonusAmount,
            lastBonusClaim: now,
            bonusStreak: newStreak
        };

        updateBonusTimer(updated, getServerTime);
        showStatus(statusEl, `🎉 Success! +${bonusAmount} FZ Added! 🎉`, false);
        if (showNotification) showNotification(`+${bonusAmount} FZ`, 'success');

        // Celebration effect
        createConfetti();

    } catch (error) {
        console.error('Claim failed:', error);
        showStatus(statusEl, '❌ Failed. Please try again.', true);
    } finally {
        claimBtn.disabled = false;
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
    }
}

// ========================================
// CONFETTI CELEBRATION
// ========================================
function createConfetti() {
    const colors = ['#FCD34D', '#FBBF24', '#F59E0B', '#EF4444', '#EC4899'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            top: 50%;
            left: 50%;
            opacity: 1;
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(confetti);
        
        const angle = (Math.PI * 2 * i) / confettiCount;
        const velocity = 5 + Math.random() * 5;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity - 5;
        
        let x = 0, y = 0, opacity = 1;
        const animate = () => {
            y += vy;
            x += vx;
            opacity -= 0.02;
            
            confetti.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
            confetti.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                confetti.remove();
            }
        };
        animate();
    }
}

// ========================================
// UTILITIES
// ========================================
function showStatus(el, message, isError = false) {
    if (!el) return;
    el.textContent = message;
    el.className = `status text-center mt-4 text-lg font-bold ${isError ? 'text-red-600' : 'text-green-600'}`;
    setTimeout(() => el.textContent = '', 4000);
}

export function cleanupBonus() {
    if (bonusTimerInterval) clearInterval(bonusTimerInterval);
    bonusTimerInterval = null;
}

export function initBonusSection(userData, getServerTime) {
    if (!userData || typeof getServerTime !== 'function') return;
    updateBonusTimer(userData, getServerTime);
    console.log('Enhanced 30-Day Streak initialized');
}

export { dailyRewards, BONUS_INTERVAL, TOTAL_DAYS };