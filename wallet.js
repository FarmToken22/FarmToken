// wallet.js - Wallet Section Module (Admin Controlled Settings)
import { auth, database } from './config.js';
import { ref, get, update, push, onValue } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// ========================================
// AD CONFIGURATION
// ========================================
const AD_KEY = '78ade24182729fceea8e45203dad915b';
const AD_URL = `//www.highperformanceformat.com/${AD_KEY}/invoke.js`;
let adLoaded = false;
let adAttempted = false;

// ========================================
// ADMIN SETTINGS (FIREBASE থেকে লোড হবে)
// ========================================
let adminSettings = {
    withdrawalEnabled: false,
    minWithdraw: 10
};

// ========================================
// LOAD ADMIN SETTINGS FROM FIREBASE
// ========================================
async function loadAdminSettings() {
    try {
        const settingsRef = ref(database, 'adminSettings/withdrawal');
        const snapshot = await get(settingsRef);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            adminSettings.withdrawalEnabled = data.enabled !== undefined ? data.enabled : false;
            adminSettings.minWithdraw = data.minAmount || 10;
            console.log('✅ Admin settings loaded:', adminSettings);
        } else {
            // ডিফল্ট সেটিংস সেভ করুন
            await update(settingsRef, {
                enabled: false,
                minAmount: 10
            });
            console.log('✅ Default admin settings created');
        }
    } catch (error) {
        console.error('❌ Error loading admin settings:', error);
    }
}

// ========================================
// LISTEN TO ADMIN SETTINGS CHANGES (REAL-TIME)
// ========================================
function listenToAdminSettings() {
    const settingsRef = ref(database, 'adminSettings/withdrawal');
    
    onValue(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            adminSettings.withdrawalEnabled = data.enabled !== undefined ? data.enabled : false;
            adminSettings.minWithdraw = data.minAmount || 10;
            
            console.log('🔄 Admin settings updated:', adminSettings);
            
            // UI আপডেট করুন
            updateWithdrawalUI();
        }
    });
}

// ========================================
// DYNAMIC SECTION RENDERING
// ========================================
export async function renderWalletSection() {
    const container = document.getElementById('walletSection');
    if (!container) {
        console.error('Wallet section container not found');
        return;
    }
    
    // Admin settings লোড করুন
    await loadAdminSettings();
    
    container.innerHTML = `
        <div class="p-3 sm:p-4 space-y-4 max-w-lg mx-auto w-full pb-20">
            <!-- Wallet Header Card -->
            <div class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
                <div class="flex items-center gap-4">
                    <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h2 class="text-xl sm:text-2xl font-bold">My Wallet</h2>
                        <p class="text-blue-100 text-sm">Manage your FZ tokens</p>
                    </div>
                </div>
            </div>
            
            <!-- Balance Display -->
            <div class="bg-white shadow rounded-xl p-4 sm:p-6">
                <div class="text-center bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
                    <div class="flex items-center justify-center gap-2 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 class="text-sm uppercase text-gray-600 font-semibold">Total Balance</h4>
                    </div>
                    <p id="walletBalance" class="text-4xl font-bold text-green-600 mt-2">0.00 FZ</p>
                    <p class="text-xs text-gray-500 mt-2">Available balance</p>
                </div>
            </div>
            
            <!-- Ad Space 1 -->
            <div id="adSpace1" class="bg-gray-50 rounded-xl overflow-hidden transition-all duration-300" style="min-height: 50px; display: none;">
                <div id="adContainer1" class="flex items-center justify-center min-h-[50px]"></div>
            </div>
            
            <!-- Withdraw Section -->
            <div class="bg-white shadow rounded-xl p-4 sm:p-6">
                <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Withdraw FZ Tokens
                </h3>
                
                <!-- Status Notice (Dynamic) -->
                <div id="withdrawalNotice" class="border-2 rounded-lg p-4 mb-4"></div>
                
                <div id="withdrawalForm" class="space-y-4">
                    <!-- Wallet Address Input -->
                    <div>
                        <label for="walletAddress" class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Wallet Address
                        </label>
                        <input 
                            id="walletAddress" 
                            type="text" 
                            placeholder="Enter your FZ wallet address" 
                            class="w-full border-2 border-gray-300 rounded-lg p-3 text-sm outline-none focus:border-blue-500 transition"
                        >
                        <p class="text-xs text-gray-500 mt-1">Make sure the address is correct. Transactions cannot be reversed.</p>
                    </div>
                    
                    <!-- Amount Input -->
                    <div>
                        <label for="withdrawAmount" class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1V8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Amount (FZ)
                        </label>
                        <input 
                            id="withdrawAmount" 
                            type="number" 
                            placeholder="0.00 FZ" 
                            step="0.01"
                            class="w-full border-2 border-gray-300 rounded-lg p-3 text-sm outline-none focus:border-blue-500 transition"
                        >
                        <p id="minWithdrawText" class="text-xs text-gray-500 mt-1"></p>
                    </div>
                    
                    <!-- Quick Amount Buttons -->
                    <div>
                        <p class="text-sm font-medium text-gray-700 mb-2">Quick Select:</p>
                        <div class="grid grid-cols-4 gap-2">
                            <button class="quick-amount-btn bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-lg text-sm font-semibold transition" data-amount="25">25 FZ</button>
                            <button class="quick-amount-btn bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-lg text-sm font-semibold transition" data-amount="50">50 FZ</button>
                            <button class="quick-amount-btn bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-lg text-sm font-semibold transition" data-amount="100">100 FZ</button>
                            <button class="quick-amount-btn bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-lg text-sm font-semibold transition" data-amount="max">Max</button>
                        </div>
                    </div>
                    
                    <!-- Withdraw Status Message -->
                    <div id="withdrawStatus" class="status text-center"></div>
                    
                    <!-- Withdraw Button -->
                    <button 
                        id="withdrawBtn" 
                        class="w-full py-3 rounded-lg shadow text-base font-semibold flex items-center justify-center gap-2 transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span id="withdrawBtnText">Withdraw Now</span>
                    </button>
                </div>
            </div>
            
            <!-- Withdrawal Info -->
            <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div class="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h4 class="font-semibold text-blue-800 mb-2">Withdrawal Information</h4>
                        <ul id="withdrawalInfoList" class="text-sm text-blue-700 space-y-1"></ul>
                    </div>
                </div>
            </div>
            
            <!-- Ad Space 2 -->
            <div id="adSpace2" class="bg-gray-50 rounded-xl overflow-hidden transition-all duration-300" style="min-height: 50px; display: none;">
                <div id="adContainer2" class="flex items-center justify-center min-h-[50px]"></div>
            </div>
        </div>
    `;
    
    // Update UI based on settings
    updateWithdrawalUI();
    
    // Listen for real-time changes
    listenToAdminSettings();
    
    // Load single ad after rendering
    loadSingleAd();
    
    console.log('✅ Wallet section rendered - Ad system active');
}

// ========================================
// UPDATE WITHDRAWAL UI BASED ON SETTINGS
// ========================================
function updateWithdrawalUI() {
    const notice = document.getElementById('withdrawalNotice');
    const form = document.getElementById('withdrawalForm');
    const btn = document.getElementById('withdrawBtn');
    const btnText = document.getElementById('withdrawBtnText');
    const minText = document.getElementById('minWithdrawText');
    const infoList = document.getElementById('withdrawalInfoList');
    const addressInput = document.getElementById('walletAddress');
    const amountInput = document.getElementById('withdrawAmount');
    
    if (!notice || !form || !btn) return;
    
    if (adminSettings.withdrawalEnabled) {
        // WITHDRAWAL ENABLED
        notice.className = 'bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-4';
        notice.innerHTML = `
            <div class="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <h4 class="font-semibold text-green-800 mb-1">Withdrawal Available</h4>
                    <p class="text-sm text-green-700">You can withdraw your FZ tokens now.</p>
                </div>
            </div>
        `;
        
        form.classList.remove('opacity-50', 'pointer-events-none');
        btn.disabled = false;
        btn.className = 'w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-lg shadow text-base font-semibold flex items-center justify-center gap-2 transition cursor-pointer';
        if (btnText) btnText.textContent = 'Withdraw Now';
        
        if (addressInput) addressInput.disabled = false;
        if (amountInput) {
            amountInput.disabled = false;
            amountInput.min = adminSettings.minWithdraw;
        }
        
        if (minText) {
            minText.innerHTML = `Minimum withdrawal: <strong>${adminSettings.minWithdraw} FZ</strong>`;
        }
        
        if (infoList) {
            infoList.innerHTML = `
                <li>• Minimum withdrawal: <strong>${adminSettings.minWithdraw} FZ</strong></li>
                <li>• Processing time: <strong class="text-green-600">1-24 hours</strong></li>
                <li>• Status: <strong class="text-green-600">Active</strong></li>
            `;
        }
        
        // Enable quick buttons
        document.querySelectorAll('.quick-amount-btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('bg-gray-200', 'text-gray-500', 'cursor-not-allowed');
            btn.classList.add('bg-blue-100', 'hover:bg-blue-200', 'text-blue-700');
        });
        
    } else {
        // WITHDRAWAL DISABLED
        notice.className = 'bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-4';
        notice.innerHTML = `
            <div class="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <h4 class="font-semibold text-amber-800 mb-1">Withdrawal Temporarily Unavailable</h4>
                    <p class="text-sm text-amber-700">Withdrawal service is currently disabled. Please check back later.</p>
                </div>
            </div>
        `;
        
        form.classList.add('opacity-50', 'pointer-events-none');
        btn.disabled = true;
        btn.className = 'w-full bg-gray-400 text-white py-3 rounded-lg shadow text-base font-semibold cursor-not-allowed flex items-center justify-center gap-2';
        if (btnText) btnText.textContent = 'Withdrawal Disabled';
        
        if (addressInput) addressInput.disabled = true;
        if (amountInput) amountInput.disabled = true;
        
        if (minText) {
            minText.innerHTML = `Minimum withdrawal: <strong>${adminSettings.minWithdraw} FZ</strong>`;
        }
        
        if (infoList) {
            infoList.innerHTML = `
                <li>• Minimum withdrawal: <strong>${adminSettings.minWithdraw} FZ</strong></li>
                <li>• Processing time: <strong class="text-amber-600">Pending</strong></li>
                <li>• Status: <strong class="text-amber-600">Temporarily Unavailable</strong></li>
            `;
        }
        
        // Disable quick buttons
        document.querySelectorAll('.quick-amount-btn').forEach(btn => {
            btn.disabled = true;
            btn.classList.remove('bg-blue-100', 'hover:bg-blue-200', 'text-blue-700');
            btn.classList.add('bg-gray-200', 'text-gray-500', 'cursor-not-allowed');
        });
    }
}

// ========================================
// SMART AD LOADER
// ========================================
function loadSingleAd() {
    if (adLoaded || adAttempted) {
        console.log('⚠️ Ad already loaded or attempted');
        return;
    }
    
    adAttempted = true;

    const adSpaces = [
        { space: document.getElementById('adSpace1'), container: 'adContainer1' },
        { space: document.getElementById('adSpace2'), container: 'adContainer2' }
    ].filter(item => item.space && item.space.parentElement);

    if (adSpaces.length === 0) {
        console.warn('⚠️ No ad spaces found');
        return;
    }

    const randomIndex = Math.floor(Math.random() * adSpaces.length);
    const selected = adSpaces[randomIndex];

    selected.space.style.display = 'block';

    window.atOptions = {
        'key': AD_KEY,
        'format': 'iframe',
        'height': 50,
        'width': 320,
        'params': {}
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    
    script.onload = () => {
        adLoaded = true;
        console.log(`✅ Ad successfully loaded in ${selected.container}`);
    };
    
    script.onerror = (error) => {
        selected.space.style.display = 'none';
        adAttempted = false;
        console.error(`❌ Ad failed to load in ${selected.container}:`, error);
    };

    script.src = AD_URL;
    
    const container = document.getElementById(selected.container);
    if (container) {
        container.appendChild(script);
        console.log(`🔄 Loading ad in ${selected.container}...`);
    } else {
        console.error(`❌ Container ${selected.container} not found`);
    }
}

// ========================================
// WALLET DISPLAY
// ========================================
export function updateWalletDisplay(userData) {
    const walletBalanceEl = document.getElementById('walletBalance');
    if (walletBalanceEl && userData) {
        const balance = userData.balance || 0;
        walletBalanceEl.textContent = `${balance.toFixed(2)} FZ`;
        console.log(`💰 Wallet balance updated: ${balance.toFixed(2)} FZ`);
    }
}

// ========================================
// WITHDRAWAL HANDLER
// ========================================
export async function handleWithdraw(currentUser, userData, showStatus) {
    const statusEl = document.getElementById('withdrawStatus');
    
    // Check if withdrawal is enabled
    if (!adminSettings.withdrawalEnabled) {
        console.warn('⚠️ Withdrawal attempt blocked - feature disabled');
        if (statusEl) {
            showStatus(statusEl, 'Withdrawal is temporarily disabled', true);
        }
        return;
    }
    
    const addressInput = document.getElementById('walletAddress');
    const amountInput = document.getElementById('withdrawAmount');
    
    const address = addressInput?.value.trim();
    const amount = parseFloat(amountInput?.value || 0);
    
    // Validation
    if (!address) {
        showStatus(statusEl, 'Please enter a wallet address', true);
        return;
    }
    
    if (!amount || amount <= 0) {
        showStatus(statusEl, 'Please enter a valid amount', true);
        return;
    }
    
    if (amount > userData.balance) {
        showStatus(statusEl, 'Insufficient balance', true);
        return;
    }
    
    if (amount < adminSettings.minWithdraw) {
        showStatus(statusEl, `Minimum withdrawal is ${adminSettings.minWithdraw} FZ`, true);
        return;
    }
    
    try {
        const userRef = ref(database, `users/${currentUser.uid}`);
        const newBalance = userData.balance - amount;
        
        const transactionsRef = ref(database, `users/${currentUser.uid}/transactions`);
        const newTxRef = push(transactionsRef);
        
        const transaction = {
            type: 'withdraw',
            amount: amount,
            address: address,
            status: 'pending',
            timestamp: Date.now()
        };
        
        await update(userRef, { balance: newBalance });
        await update(newTxRef, transaction);
        
        showStatus(statusEl, 'Withdrawal request submitted!', false);
        
        if (addressInput) addressInput.value = '';
        if (amountInput) amountInput.value = '';
        
        updateWalletDisplay({ balance: newBalance });
        
        console.log('✅ Withdrawal processed successfully');
        
    } catch (error) {
        console.error('❌ Withdrawal error:', error);
        showStatus(statusEl, 'Failed to process withdrawal', true);
    }
}

function showStatus(el, message, isError = false) {
    if (!el) return;
    el.textContent = message;
    el.className = `status text-center ${isError ? 'text-red-600' : 'text-green-600'} show`;
    setTimeout(() => {
        el.className = 'status text-center';
        el.textContent = '';
    }, 3000);
}

// ========================================
// INITIALIZE
// ========================================
export function initWalletSection(currentUser, userData, showStatus) {
    if (!userData) {
        console.warn('⚠️ Cannot initialize wallet section: userData is null');
        return;
    }
    
    console.log('🚀 Initializing wallet section...');
    
    renderWalletSection();
    updateWalletDisplay(userData);

    // Setup withdraw button
    const withdrawBtn = document.getElementById('withdrawBtn');
    if (withdrawBtn) {
        withdrawBtn.onclick = () => handleWithdraw(currentUser, userData, showStatus);
    }
    
    // Setup quick amount buttons
    document.querySelectorAll('.quick-amount-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = btn.dataset.amount;
            const amountInput = document.getElementById('withdrawAmount');
            
            if (amount === 'max') {
                amountInput.value = userData.balance || 0;
            } else {
                amountInput.value = amount;
            }
        });
    });

    console.log('✅ Wallet initialized | Withdrawal:', adminSettings.withdrawalEnabled ? 'Enabled' : 'Disabled');
}