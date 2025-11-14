// wallet.js - Wallet Section Module (Updated: With Mobile-Friendly Ads)
import { auth, database } from './config.js';
import { ref, get, update, push } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

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
                    <p class="text-xs text-gray-500 mt-2">Available for withdrawal</p>
                </div>
            </div>
            
            <!-- Ad Space 1 (Mobile Friendly - 320x50) -->
            <div class="bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center" style="min-height: 50px;">
                <div id="ad-container-1"></div>
            </div>
            
            <!-- Withdraw Section -->
            <div class="bg-white shadow rounded-xl p-4 sm:p-6">
                <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Withdraw FZ Tokens
                </h3>
                
                <div class="space-y-4">
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
                            class="w-full border-2 border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                        <p class="text-xs text-gray-500 mt-1">Make sure the address is correct. Transactions cannot be reversed.</p>
                    </div>
                    
                    <!-- Amount Input -->
                    <div>
                        <label for="withdrawAmount" class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Amount (FZ)
                        </label>
                        <input 
                            id="withdrawAmount" 
                            type="number" 
                            placeholder="0.00 FZ" 
                            step="0.01"
                            min="10"
                            class="w-full border-2 border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                        <p class="text-xs text-gray-500 mt-1">Minimum withdrawal: <strong>10 FZ</strong></p>
                    </div>
                    
                    <!-- Quick Amount Buttons -->
                    <div>
                        <p class="text-sm font-medium text-gray-700 mb-2">Quick Select:</p>
                        <div class="grid grid-cols-4 gap-2">
                            <button class="quick-amount-btn bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-semibold transition-colors" data-amount="25">25 FZ</button>
                            <button class="quick-amount-btn bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-semibold transition-colors" data-amount="50">50 FZ</button>
                            <button class="quick-amount-btn bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-semibold transition-colors" data-amount="100">100 FZ</button>
                            <button class="quick-amount-btn bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-semibold transition-colors" data-amount="max">Max</button>
                        </div>
                    </div>
                    
                    <!-- Withdraw Button -->
                    <button 
                        id="withdrawBtn" 
                        class="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 rounded-lg shadow text-base font-semibold hover:from-red-600 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Withdraw Now
                    </button>
                    <p id="withdrawStatus" class="status text-center"></p>
                </div>
            </div>
            
            <!-- Ad Space 2 (Mobile Friendly - 320x50) -->
            <div class="bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center" style="min-height: 50px;">
                <div id="ad-container-2"></div>
            </div>
        </div>
    `;
    
    // Setup quick amount buttons after rendering
    setupQuickAmountButtons();
    
    // Load ads after rendering
    loadAds();
    
    console.log('Wallet section rendered dynamically with ads');
}

// ========================================
// LOAD ADS
// ========================================
function loadAds() {
    // Ad 1 - Mobile Friendly (320x50)
    const adContainer1 = document.getElementById('ad-container-1');
    if (adContainer1) {
        const script1 = document.createElement('script');
        script1.type = 'text/javascript';
        script1.innerHTML = `
            atOptions = {
                'key' : '78ade24182729fceea8e45203dad915b',
                'format' : 'iframe',
                'height' : 50,
                'width' : 320,
                'params' : {}
            };
        `;
        adContainer1.appendChild(script1);
        
        const invokeScript1 = document.createElement('script');
        invokeScript1.type = 'text/javascript';
        invokeScript1.src = '//www.highperformanceformat.com/78ade24182729fceea8e45203dad915b/invoke.js';
        adContainer1.appendChild(invokeScript1);
    }
    
    // Ad 2 - Mobile Friendly (320x50)
    const adContainer2 = document.getElementById('ad-container-2');
    if (adContainer2) {
        const script2 = document.createElement('script');
        script2.type = 'text/javascript';
        script2.innerHTML = `
            atOptions = {
                'key' : '78ade24182729fceea8e45203dad915b',
                'format' : 'iframe',
                'height' : 50,
                'width' : 320,
                'params' : {}
            };
        `;
        adContainer2.appendChild(script2);
        
        const invokeScript2 = document.createElement('script');
        invokeScript2.type = 'text/javascript';
        invokeScript2.src = '//www.highperformanceformat.com/78ade24182729fceea8e45203dad915b/invoke.js';
        adContainer2.appendChild(invokeScript2);
    }
}

// ========================================
// QUICK AMOUNT BUTTONS
// ========================================
function setupQuickAmountButtons() {
    const quickButtons = document.querySelectorAll('.quick-amount-btn');
    const amountInput = document.getElementById('withdrawAmount');
    const walletBalance = document.getElementById('walletBalance');
    
    quickButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = btn.dataset.amount;
            
            if (amount === 'max') {
                const balanceText = walletBalance?.textContent || '0.00 FZ';
                const balance = parseFloat(balanceText.replace(' FZ', ''));
                if (amountInput) amountInput.value = balance.toFixed(2);
            } else {
                if (amountInput) amountInput.value = amount;
            }
        });
    });
}

// ========================================
// WALLET DISPLAY
// ========================================
export function updateWalletDisplay(userData) {
    const walletBalanceEl = document.getElementById('walletBalance');
    if (walletBalanceEl) {
        walletBalanceEl.textContent = `${(userData.balance || 0).toFixed(2)} FZ`;
    }
}

// ========================================
// WITHDRAWAL HANDLER
// ========================================
export async function handleWithdraw(currentUser, userData, showStatus) {
    const addressInput = document.getElementById('walletAddress');
    const amountInput = document.getElementById('withdrawAmount');
    const statusEl = document.getElementById('withdrawStatus');
    
    const address = addressInput?.value.trim();
    const amount = parseFloat(amountInput?.value || 0);
    
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
    
    const MIN_WITHDRAW = 10;
    if (amount < MIN_WITHDRAW) {
        showStatus(statusEl, `Minimum withdrawal is ${MIN_WITHDRAW} FZ`, true);
        return;
    }
    
    try {
        const userRef = ref(database, `users/${currentUser.uid}`);
        const newBalance = userData.balance - amount;
        
        // Create transaction record
        const transactionsRef = ref(database, `users/${currentUser.uid}/transactions`);
        const newTxRef = push(transactionsRef);
        
        const transaction = {
            type: 'withdraw',
            amount: amount,
            address: address,
            status: 'pending',
            timestamp: Date.now()
        };
        
        await update(userRef, {
            balance: newBalance
        });
        
        await update(newTxRef, transaction);
        
        showStatus(statusEl, 'Withdrawal request submitted!', false);
        
        // Clear inputs
        if (addressInput) addressInput.value = '';
        if (amountInput) amountInput.value = '';
        
        // Update balance display
        updateWalletDisplay({ balance: newBalance });
        
    } catch (error) {
        console.error('Withdrawal error:', error);
        showStatus(statusEl, 'Failed to process withdrawal', true);
    }
}

function showStatus(el, message, isError = false) {
    if (!el) return;
    el.textContent = message;
    el.className = `status ${isError ? 'error' : 'success'} show`;
    setTimeout(() => el.className = 'status', 3000);
}

// ========================================
// INITIALIZE
// ========================================
export function initWalletSection(userData) {
    if (!userData) {
        console.warn('Cannot initialize wallet section: userData is null');
        return;
    }
    
    updateWalletDisplay(userData);
    console.log('Wallet section initialized with ads');
}