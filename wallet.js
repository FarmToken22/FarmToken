// wallet.js - Wallet Section Module (Fixed Ad System)
import { auth, database } from './config.js';
import { ref, get, update, push } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// ========================================
// AD CONFIGURATION
// ========================================
const AD_KEY = '78ade24182729fceea8e45203dad915b';
const AD_URL = `//www.highperformanceformat.com/${AD_KEY}/invoke.js`;
let adLoaded = false;
let adAttempted = false;

// ========================================
// WITHDRAWAL CONFIGURATION
// ========================================
const WITHDRAWAL_ENABLED = false; // উত্তোলন বন্ধ
const MIN_WITHDRAW = 10; // মিনিমাম উত্তোলন পরিমাণ

// ========================================
// DYNAMIC SECTION RENDERING
// ========================================
export function renderWalletSection() {
    const container = document.getElementById('walletSection');
    if (!container) {
        console.error('Wallet section container not found');
        return;
    }
    
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
            
            <!-- Withdraw Section (Disabled) -->
            <div class="bg-white shadow rounded-xl p-4 sm:p-6">
                <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Withdraw FZ Tokens
                </h3>
                
                <!-- Withdrawal Disabled Notice -->
                <div class="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-4">
                    <div class="flex items-start gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h4 class="font-semibold text-amber-800 mb-1">Withdrawal Temporarily Unavailable</h4>
                            <p class="text-sm text-amber-700">Withdrawal service is currently disabled. Please check back later.</p>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-4 opacity-50 pointer-events-none">
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
                            disabled
                            class="w-full border-2 border-gray-300 rounded-lg p-3 text-sm outline-none bg-gray-100"
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
                            min="${MIN_WITHDRAW}"
                            disabled
                            class="w-full border-2 border-gray-300 rounded-lg p-3 text-sm outline-none bg-gray-100"
                        >
                        <p class="text-xs text-gray-500 mt-1">Minimum withdrawal: <strong>${MIN_WITHDRAW} FZ</strong></p>
                    </div>
                    
                    <!-- Quick Amount Buttons -->
                    <div>
                        <p class="text-sm font-medium text-gray-700 mb-2">Quick Select:</p>
                        <div class="grid grid-cols-4 gap-2">
                            <button class="quick-amount-btn bg-gray-200 text-gray-500 py-2 px-3 rounded-lg text-sm font-semibold cursor-not-allowed" disabled>25 FZ</button>
                            <button class="quick-amount-btn bg-gray-200 text-gray-500 py-2 px-3 rounded-lg text-sm font-semibold cursor-not-allowed" disabled>50 FZ</button>
                            <button class="quick-amount-btn bg-gray-200 text-gray-500 py-2 px-3 rounded-lg text-sm font-semibold cursor-not-allowed" disabled>100 FZ</button>
                            <button class="quick-amount-btn bg-gray-200 text-gray-500 py-2 px-3 rounded-lg text-sm font-semibold cursor-not-allowed" disabled>Max</button>
                        </div>
                    </div>
                    
                    <!-- Withdraw Button (Disabled) -->
                    <button 
                        id="withdrawBtn" 
                        disabled
                        class="w-full bg-gray-400 text-white py-3 rounded-lg shadow text-base font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Withdrawal Disabled
                    </button>
                </div>
            </div>
            
            <!-- Minimum Withdrawal Info -->
            <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div class="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h4 class="font-semibold text-blue-800 mb-2">Withdrawal Information</h4>
                        <ul class="text-sm text-blue-700 space-y-1">
                            <li>• Minimum withdrawal: <strong>${MIN_WITHDRAW} FZ</strong></li>
                            <li>• Processing time: <strong class="text-amber-600">Pending</strong></li>
                            <li>• Status: <strong class="text-amber-600">Temporarily Unavailable</strong></li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Ad Space 2 -->
            <div id="adSpace2" class="bg-gray-50 rounded-xl overflow-hidden transition-all duration-300" style="min-height: 50px; display: none;">
                <div id="adContainer2" class="flex items-center justify-center min-h-[50px]"></div>
            </div>
        </div>
    `;
    
    // Load single ad after rendering
    loadSingleAd();
    
    console.log('✅ Wallet section rendered - Ad system active');
}

// ========================================
// SMART AD LOADER: Improved Version
// ========================================
function loadSingleAd() {
    // Prevent multiple attempts
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

    // Randomly select one ad space
    const randomIndex = Math.floor(Math.random() * adSpaces.length);
    const selected = adSpaces[randomIndex];

    // Show selected ad space
    selected.space.style.display = 'block';

    // Configure ad options
    window.atOptions = {
        'key': AD_KEY,
        'format': 'iframe',
        'height': 50,
        'width': 320,
        'params': {}
    };

    // Create and load ad script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    
    script.onload = () => {
        adLoaded = true;
        console.log(`✅ Ad successfully loaded in ${selected.container}`);
    };
    
    script.onerror = (error) => {
        selected.space.style.display = 'none';
        adAttempted = false; // Allow retry
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
// WITHDRAWAL HANDLER (DISABLED)
// ========================================
export async function handleWithdraw(currentUser, userData, showStatus) {
    const statusEl = document.getElementById('withdrawStatus');
    
    // Check if withdrawal is enabled
    if (!WITHDRAWAL_ENABLED) {
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
    
    if (amount < MIN_WITHDRAW) {
        showStatus(statusEl, `Minimum withdrawal is ${MIN_WITHDRAW} FZ`, true);
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

    // Setup withdraw button (will be disabled if WITHDRAWAL_ENABLED is false)
    const withdrawBtn = document.getElementById('withdrawBtn');
    if (withdrawBtn && WITHDRAWAL_ENABLED) {
        withdrawBtn.onclick = () => handleWithdraw(currentUser, userData, showStatus);
    }

    console.log('✅ Wallet initialized | Withdrawal:', WITHDRAWAL_ENABLED ? 'Enabled' : 'Disabled');
}