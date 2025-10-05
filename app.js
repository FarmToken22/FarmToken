import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAH9-GEeIVDe98wCziPHnDv5Q84BoQFXOQ",
  authDomain: "farmtoken.firebaseapp.com",
  databaseURL: "https://farmtoken-default-rtdb.firebaseio.com",
  projectId: "farmtoken",
  storageBucket: "farmtoken.firebasestorage.app",
  messagingSenderId: "873508490805",
  appId: "1:873508490805:web:6d2676c41aa60a289cab7c",
  measurementId: "G-YZPTK2CP47"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentUser = null;
let userData = null;
let miningInterval = null;
let countdownInterval = null;

const MINING_DURATION = 8 * 60 * 60; // 8 hours in seconds
const TOTAL_REWARD = 6; // Total reward per mining session
const REWARD_PER_SECOND = TOTAL_REWARD / MINING_DURATION;
const MILESTONE_TOKENS = 100; // Tokens needed to level up
const REFERRAL_BONUS = 5; // Bonus for referrals
const REFERRAL_MILESTONE = 100; // Tokens mined by referee for referrer bonus
const MINIMUM_WITHDRAWAL = 300; // Minimum tokens required for withdrawal

const el = {
  loading: document.getElementById('loading'),
  authBtn: document.getElementById('authBtn'),
  homeBtn: document.getElementById('homeBtn'),
  profileBtn: document.getElementById('profileBtn'),
  walletBtn: document.getElementById('walletBtn'),
  homeSection: document.getElementById('homeSection'),
  profileSection: document.getElementById('profileSection'),
  walletSection: document.getElementById('walletSection'),
  miningBtn: document.getElementById('miningBtn'),
  claimReferralBtn: document.getElementById('claimReferralBtn'),
  referralRewardsEl: document.getElementById('referralRewards'),
  totalBalanceEl: document.getElementById('totalBalance'),
  profileBalanceEl: document.getElementById('profileBalance'),
  walletBalance: document.getElementById('walletBalance'),
  totalMinedEl: document.getElementById('totalMined'),
  totalMinedWallet: document.getElementById('totalMinedWallet'),
  miningStatusEl: document.getElementById('miningStatus'),
  miningRateEl: document.getElementById('miningRate'),
  currentEarnedEl: document.getElementById('currentEarned'),
  referralCountEl: document.getElementById('referralCount'),
  refCodeEl: document.getElementById('refCode'),
  joinDateEl: document.getElementById('joinDate'),
  referralCodeInput: document.getElementById('referralCodeInput'),
  submitReferralBtn: document.getElementById('submitReferralBtn'),
  referralStatusEl: document.getElementById('referralStatus'),
  referralSubmitBox: document.getElementById('referralSubmitBox'),
  referralSubmittedBox: document.getElementById('referralSubmittedBox'),
  earnedDisplayEl: document.getElementById('earnedDisplay'),
  copyCode: document.getElementById('copyCode'),
  shareWA: document.getElementById('shareWA'),
  shareTG: document.getElementById('shareTG'),
  settingsBtn: document.getElementById('settingsBtn'),
  progressBar: document.getElementById('progressBar'),
  levelText: document.getElementById('levelText'),
  withdrawalAmount: document.getElementById('withdrawalAmount'),
  walletAddress: document.getElementById('walletAddress'),
  withdrawBtn: document.getElementById('withdrawBtn'),
  withdrawalStatus: document.getElementById('withdrawalStatus'),
  transactionList: document.getElementById('transactionList'),
  notification: document.getElementById('notification')
};

// Notification helper
function showNotification(message, type = 'success') {
  el.notification.textContent = message;
  el.notification.style.background = type === 'success' ? '#28a745' : '#dc3545';
  el.notification.classList.add('show');
  setTimeout(() => {
    el.notification.classList.remove('show');
  }, 3000);
}

// Show status message
function showStatus(element, message, isError = false) {
  element.textContent = message;
  element.classList.remove('hidden', 'text-green-500', 'text-red-500');
  element.classList.add(isError ? 'text-red-500' : 'text-green-500');
  setTimeout(() => {
    element.classList.add('hidden');
  }, 3000);
}

// Generate unique referral code
function generateReferralCode() {
  return `FT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

// Format time for countdown
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Switch sections (Home/Profile/Wallet)
function switchSection(section) {
  el.homeSection.classList.remove('active');
  el.profileSection.classList.remove('active');
  el.walletSection.classList.remove('active');
  el.homeBtn.classList.remove('text-green-600', 'font-semibold', 'border-t-2', 'border-green-600');
  el.profileBtn.classList.remove('text-green-600', 'font-semibold', 'border-t-2', 'border-green-600');
  el.walletBtn.classList.remove('text-green-600', 'font-semibold', 'border-t-2', 'border-green-600');

  if (section === 'home') {
    el.homeSection.classList.add('active');
    el.homeBtn.classList.add('text-green-600', 'font-semibold', 'border-t-2', 'border-green-600');
  } else if (section === 'profile') {
    el.profileSection.classList.add('active');
    el.profileBtn.classList.add('text-green-600', 'font-semibold', 'border-t-2', 'border-green-600');
  } else if (section === 'wallet') {
    el.walletSection.classList.add('active');
    el.walletBtn.classList.add('text-green-600', 'font-semibold', 'border-t-2', 'border-green-600');
  }
}

// Update UI with user data
function updateUI() {
  if (!userData) return;
  const balance = (userData.balance || 0).toFixed(2);
  const totalMined = (userData.totalMined || 0).toFixed(2);
  const miningRate = (REWARD_PER_SECOND * 3600).toFixed(4);
  const referralCount = userData.referrals ? Object.keys(userData.referrals).length : 0;
  const referralRewards = (userData.referralRewards || 0).toFixed(2);
  const currentEarned = (userData.currentEarned || 0).toFixed(6);
  const progress = Math.min((userData.totalMined || 0) / MILESTONE_TOKENS * 100, 100);
  const level = Math.min(Math.floor((userData.totalMined || 0) / MILESTONE_TOKENS) + 1, 5);

  el.totalBalanceEl.textContent = `${balance} FT`;
  el.profileBalanceEl.textContent = `${balance} FT`;
  el.walletBalance.textContent = `${balance} FT`;
  el.miningRateEl.textContent = `${miningRate}/hr`;
  el.referralCountEl.textContent = referralCount;
  el.totalMinedEl.textContent = `${totalMined} FT`;
  el.totalMinedWallet.textContent = `${totalMined} FT`;
  el.currentEarnedEl.textContent = `${currentEarned} FT`;
  el.referralRewardsEl.textContent = `${referralRewards} FT`;
  el.refCodeEl.textContent = userData.referralCode || '---';
  el.joinDateEl.textContent = userData.joinDate || '---';
  el.earnedDisplayEl.textContent = `${currentEarned} FT`;
  el.progressBar.style.width = `${progress}%`;
  el.levelText.textContent = `Level ${level} / 5`;

  const transactions = userData.transactions || {};
  el.transactionList.innerHTML = '';
  if (Object.keys(transactions).length === 0) {
    el.transactionList.innerHTML = '<p class="text-gray-500 text-sm sm:text-base">No transactions yet.</p>';
  } else {
    Object.entries(transactions).forEach(([id, tx]) => {
      const date = new Date(tx.timestamp).toLocaleString();
      const amountClass = tx.type === 'withdrawal' ? 'text-red-600' : 'text-green-600';
      el.transactionList.innerHTML += `
        <div class="transaction-item border-b pb-2 sm:pb-3">
          <div class="flex justify-between">
            <p class="text-sm sm:text-base text-gray-600">${tx.description}</p>
            <p class="text-sm sm:text-base font-semibold ${amountClass}">${tx.type === 'withdrawal' ? '-' : '+'}${tx.amount.toFixed(2)} FT</p>
          </div>
          <p class="text-xs sm:text-sm text-gray-500">${date}</p>
        </div>
      `;
    });
  }

  if (userData.referralRewards > 0) {
    el.claimReferralBtn.style.display = 'block';
  } else {
    el.claimReferralBtn.style.display = 'none';
  }

  if (userData.referredBy) {
    el.referralSubmitBox.style.display = 'none';
    el.referralSubmittedBox.style.display = 'block';
  } else {
    el.referralSubmitBox.style.display = 'block';
    el.referralSubmittedBox.style.display = 'none';
  }

  if (userData.miningStartTime && userData.miningEndTime && Date.now() < userData.miningEndTime) {
    el.miningBtn.disabled = true;
    el.miningStatusEl.textContent = 'Active';
    el.miningStatusEl.classList.add('text-green-600');
    if (!countdownInterval) {
      startCountdown(userData.miningEndTime);
    }
    if (!miningInterval) {
      miningInterval = setInterval(updateMining, 1000);
    }
  } else if (userData.currentEarned >= TOTAL_REWARD) {
    el.miningBtn.classList.add('claim');
    el.miningBtn.disabled = false;
    el.miningBtn.querySelector('.timer-display').textContent = 'Claim';
    el.miningStatusEl.textContent = 'Ready to Claim';
    el.miningStatusEl.classList.remove('text-green-600');
  } else {
    el.miningBtn.classList.remove('claim');
    el.miningBtn.disabled = false;
    el.miningBtn.querySelector('.timer-display').textContent = 'Start Mining';
    el.miningStatusEl.textContent = 'Inactive';
    el.miningStatusEl.classList.remove('text-green-600');
  }
}

// Sync mining progress
function syncMiningProgress() {
  if (!userData || !userData.miningStartTime) return;

  const now = Date.now();
  const elapsedSeconds = Math.floor((now - userData.miningStartTime) / 1000);
  let calculatedEarned = Math.min(elapsedSeconds * REWARD_PER_SECOND, TOTAL_REWARD);

  if (now >= userData.miningEndTime) {
    calculatedEarned = TOTAL_REWARD;
    stopMining();
  }

  if (calculatedEarned > (userData.currentEarned || 0)) {
    const userRef = ref(db, `users/${currentUser.uid}`);
    update(userRef, { currentEarned: calculatedEarned }).catch(err => {
      console.error('Sync mining progress error:', err);
      showNotification('Error syncing mining progress.', 'error');
    });
  }
}

// Start countdown timer
function startCountdown(endTime) {
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    const now = Date.now();
    const secondsLeft = Math.max(0, Math.floor((endTime - now) / 1000));
    
    const timerDisplay = el.miningBtn.querySelector('.timer-display');
    if (timerDisplay) {
      timerDisplay.textContent = formatTime(secondsLeft);
    } else {
      console.error('Timer display element not found');
      showNotification('UI error: Timer display not found.', 'error');
      clearInterval(countdownInterval);
      countdownInterval = null;
      return;
    }

    if (secondsLeft <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      stopMining();
      const userRef = ref(db, `users/${currentUser.uid}`);
      update(userRef, { currentEarned: TOTAL_REWARD }).then(() => {
        el.miningBtn.classList.add('claim');
        el.miningBtn.disabled = false;
        timerDisplay.textContent = 'Claim';
        el.miningStatusEl.textContent = 'Ready to Claim';
        el.miningStatusEl.classList.remove('text-green-600');
        showNotification('Mining session completed! Ready to claim 6 FT.');
      }).catch(err => {
        console.error('Error setting final reward:', err);
        showNotification('Error finalizing mining session.', 'error');
      });
    }
  }, 1000);
}

// Start mining session
function startMining() {
  if (!currentUser) {
    showNotification('Please log in to start mining.', 'error');
    return;
  }

  if (userData.miningStartTime && Date.now() < userData.miningEndTime) {
    showNotification('Mining session already active.', 'error');
    return;
  }

  const userRef = ref(db, `users/${currentUser.uid}`);
  const startTime = Date.now();
  const endTime = startTime + MINING_DURATION * 1000;

  update(userRef, {
    miningStartTime: startTime,
    miningEndTime: endTime,
    currentEarned: 0
  }).then(() => {
    el.miningBtn.disabled = true;
    el.miningStatusEl.textContent = 'Active';
    el.miningStatusEl.classList.add('text-green-600');
    miningInterval = setInterval(updateMining, 1000);
    startCountdown(endTime);
    showNotification('Mining started! Session will run for 8 hours.');
  }).catch(err => {
    console.error('Mining start error:', err);
    showNotification('Failed to start mining. Please try again.', 'error');
  });
}

// Update mining progress
function updateMining() {
  if (!userData || !userData.miningStartTime) return;

  const now = Date.now();
  const elapsed = (now - userData.miningStartTime) / 1000;
  let currentEarned = Math.min(elapsed * REWARD_PER_SECOND, TOTAL_REWARD);

  if (currentEarned >= TOTAL_REWARD || now >= userData.miningEndTime) {
    currentEarned = TOTAL_REWARD;
    stopMining();
  }

  const userRef = ref(db, `users/${currentUser.uid}`);
  update(userRef, { currentEarned }).catch(err => {
    console.error('Mining update error:', err);
    showNotification('Error updating mining progress.', 'error');
  });

  el.currentEarnedEl.textContent = `${currentEarned.toFixed(6)} FT`;
  el.earnedDisplayEl.textContent = `${currentEarned.toFixed(6)} FT`;
}

// Stop mining session
function stopMining() {
  clearInterval(miningInterval);
  clearInterval(countdownInterval);
  miningInterval = null;
  countdownInterval = null;
  el.miningBtn.classList.add('claim');
  el.miningBtn.disabled = false;
  const timerDisplay = el.miningBtn.querySelector('.timer-display');
  if (timerDisplay) {
    timerDisplay.textContent = 'Claim';
  }
  el.miningStatusEl.textContent = 'Ready to Claim';
  el.miningStatusEl.classList.remove('text-green-600');
}

// Check referral milestones for referrers
async function checkReferralMilestones(refereeId) {
  const refereeRef = ref(db, `users/${refereeId}`);
  const refereeSnapshot = await get(refereeRef);
  if (!refereeSnapshot.exists()) return;

  const refereeData = refereeSnapshot.val();
  const referrerCode = refereeData.referredBy;
  if (!referrerCode) return;

  const usersRef = ref(db, 'users');
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
    const referrerRef = ref(db, `users/${referrerId}`);
    await update(referrerRef, {
      referralRewards: (referrerData.referralRewards || 0) + newBonuses
    });

    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transactionRef = ref(db, `users/${referrerId}/transactions/${transactionId}`);
    await set(transactionRef, {
      type: 'referral',
      amount: newBonuses,
      description: `Referral Milestone Bonus for ${refereeId}`,
      timestamp: Date.now()
    });

    // Update referee's milestone tracking
    await update(refereeRef, {
      referralMilestones: { ...refereeData.referralMilestones || {}, [referrerId]: milestonesAchieved }
    });

    showNotification(`Referrer ${referrerId} received ${newBonuses} FT for referee ${refereeId}'s milestone!`);
  }
}

// Claim mining reward
async function claimMiningReward() {
  if (!userData || userData.currentEarned <= 0) {
    showNotification('No rewards to claim.', 'error');
    return;
  }

  const userRef = ref(db, `users/${currentUser.uid}`);
  const newBalance = (userData.balance || 0) + userData.currentEarned;
  const newTotalMined = (userData.totalMined || 0) + userData.currentEarned;

  try {
    await update(userRef, {
      balance: newBalance,
      totalMined: newTotalMined,
      currentEarned: 0,
      miningStartTime: null,
      miningEndTime: null
    });

    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transactionRef = ref(db, `users/${currentUser.uid}/transactions/${transactionId}`);
    await set(transactionRef, {
      type: 'mining',
      amount: userData.currentEarned,
      description: 'Mining Reward Claimed',
      timestamp: Date.now()
    });

    // Check if this user is a referee and update referrer's rewards
    if (userData.referredBy) {
      await checkReferralMilestones(currentUser.uid);
    }

    el.miningBtn.classList.remove('claim');
    el.miningBtn.querySelector('.timer-display').textContent = 'Start Mining';
    el.miningStatusEl.textContent = 'Inactive';
    showNotification(`Claimed ${userData.currentEarned.toFixed(6)} FT!`);
    updateUI();
  } catch (err) {
    console.error('Claim error:', err);
    showNotification('Failed to claim rewards. Please try again.', 'error');
  }
}

// Claim referral rewards
async function claimReferralRewards() {
  if (!userData || userData.referralRewards <= 0) {
    showNotification('No referral rewards to claim.', 'error');
    return;
  }

  const userRef = ref(db, `users/${currentUser.uid}`);
  const newBalance = (userData.balance || 0) + userData.referralRewards;

  try {
    await update(userRef, {
      balance: newBalance,
      referralRewards: 0
    });

    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transactionRef = ref(db, `users/${currentUser.uid}/transactions/${transactionId}`);
    await set(transactionRef, {
      type: 'referral',
      amount: userData.referralRewards,
      description: 'Referral Rewards Claimed',
      timestamp: Date.now()
    });

    showNotification(`Claimed ${userData.referralRewards.toFixed(2)} FT from referrals!`);
    updateUI();
  } catch (err) {
    console.error('Referral claim error:', err);
    showNotification('Failed to claim referral rewards. Please try again.', 'error');
  }
}

// Submit referral code
async function submitReferralCode() {
  const code = el.referralCodeInput.value.trim().toUpperCase();
  if (!code) {
    showStatus(el.referralStatusEl, 'Please enter a referral code.', true);
    return;
  }

  if (userData.referredBy) {
    showStatus(el.referralStatusEl, 'You have already submitted a referral code.', true);
    return;
  }

  if (code === userData.referralCode) {
    showStatus(el.referralStatusEl, 'You cannot use your own referral code.', true);
    return;
  }

  try {
    const usersRef = ref(db, 'users');
    const referralQuery = query(usersRef, orderByChild('referralCode'), equalTo(code));
    const snapshot = await get(referralQuery);
    if (!snapshot.exists()) {
      showStatus(el.referralStatusEl, 'Invalid referral code.', true);
      return;
    }

    const referrerData = Object.values(snapshot.val())[0];
    const referrerId = Object.keys(snapshot.val())[0];
    const userRef = ref(db, `users/${currentUser.uid}`);
    const referrerRef = ref(db, `users/${referrerId}`);

    await Promise.all([
      update(userRef, {
        referredBy: code,
        referralRewards: (userData.referralRewards || 0) + REFERRAL_BONUS
      }),
      update(referrerRef, {
        referralRewards: (referrerData.referralRewards || 0) + REFERRAL_BONUS,
        referrals: { ...referrerData.referrals || {}, [currentUser.uid]: true }
      })
    ]);

    const userTransactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userTransactionRef = ref(db, `users/${currentUser.uid}/transactions/${userTransactionId}`);
    await set(userTransactionRef, {
      type: 'referral',
      amount: REFERRAL_BONUS,
      description: 'Referral Bonus for Joining',
      timestamp: Date.now()
    });

    const referrerTransactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const referrerTransactionRef = ref(db, `users/${referrerId}/transactions/${referrerTransactionId}`);
    await set(referrerTransactionRef, {
      type: 'referral',
      amount: REFERRAL_BONUS,
      description: `Referral Bonus for ${currentUser.uid}`,
      timestamp: Date.now()
    });

    showStatus(el.referralStatusEl, 'Referral code submitted successfully! You and your referrer received 5 FT.');
    el.referralCodeInput.value = '';
    showNotification('Referral code applied! Bonus added to both accounts.');
  } catch (err) {
    console.error('Referral error:', err);
    showStatus(el.referralStatusEl, 'Failed to submit referral code. Please try again.', true);
  }
}

// Copy referral code
function copyReferralCode() {
  const code = el.refCodeEl.textContent;
  if (code === '---') {
    showNotification('No referral code available. Please refresh the page.', 'error');
    return;
  }

  navigator.clipboard.writeText(code).then(() => {
    showNotification('Referral code copied!');
  }).catch(err => {
    console.error('Copy error:', err);
    showNotification('Failed to copy referral code.', 'error');
  });
}

// Share referral code
function shareReferralCode(platform) {
  const code = el.refCodeEl.textContent;
  if (code === '---') {
    showNotification('No referral code available. Please refresh the page.', 'error');
    return;
  }

  const shareText = `Join FarmToken and start mining cryptocurrency! Use my referral code: ${code} to get 5 FT bonus!`;
  let url = '';
  if (platform === 'whatsapp') {
    url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  } else if (platform === 'telegram') {
    url = `https://t.me/share/url?url=${encodeURIComponent('https://farmtoken.com')}&text=${encodeURIComponent(shareText)}`;
  }
  window.open(url, '_blank');
  showNotification(`Shared referral code on ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`);
}

// Initiate withdrawal
async function initiateWithdrawal() {
  const amount = parseFloat(el.withdrawalAmount.value);
  const walletAddress = el.walletAddress.value.trim();

  // Validate input
  if (!amount || amount <= 0) {
    showStatus(el.withdrawalStatus, 'Please enter a valid amount.', true);
    return;
  }

  if (amount < MINIMUM_WITHDRAWAL) {
    showStatus(el.withdrawalStatus, `Minimum withdrawal amount is ${MINIMUM_WITHDRAWAL} FT.`, true);
    return;
  }

  if (!walletAddress) {
    showStatus(el.withdrawalStatus, 'Please enter a valid wallet address.', true);
    return;
  }

  // Show "Withdraw not active" message without processing the withdrawal
  showStatus(el.withdrawalStatus, 'Withdraw not active', true);
  showNotification('Withdrawal feature is currently disabled.', 'error');
  el.withdrawalAmount.value = ''; // Clear input
  el.walletAddress.value = ''; // Clear input
}

// Navigate to settings page
function goToSettings() {
  window.location.href = 'settings.html';
}

// Logout user
function logout() {
  signOut(auth).then(() => {
    window.location.href = 'login.html';
  }).catch(err => {
    console.error('Logout error:', err);
    showNotification('Failed to logout. Please try again.', 'error');
  });
}

// Initialize user data
async function initializeUserData(user) {
  const userRef = ref(db, `users/${user.uid}`);
  const snapshot = await get(userRef);
  const existingData = snapshot.val();

  if (!snapshot.exists()) {
    const referralCode = generateReferralCode();
    const joinDate = new Date().toISOString().split('T')[0];
    await set(userRef, {
      balance: 0,
      totalMined: 0,
      referralCode,
      joinDate,
      referrals: {},
      referralRewards: 0,
      referralMilestones: {},
      transactions: {}
    });
    console.log('New user data initialized with referral code:', referralCode);
    showNotification('Welcome! Your profile has been created.');
  } else if (!existingData.referralCode) {
    const referralCode = generateReferralCode();
    const updates = { referralCode };
    if (!existingData.joinDate) updates.joinDate = new Date().toISOString().split('T')[0];
    if (!existingData.referrals) updates.referrals = {};
    if (!existingData.referralRewards) updates.referralRewards = 0;
    if (!existingData.referralMilestones) updates.referralMilestones = {};
    if (existingData.balance === undefined) updates.balance = 0;
    if (existingData.totalMined === undefined) updates.totalMined = 0;
    if (!existingData.transactions) updates.transactions = {};
    await update(userRef, updates);
    console.log('Referral code generated for existing user:', referralCode);
    showNotification('Referral code generated successfully!');
  }

  onValue(userRef, snapshot => {
    userData = snapshot.val();
    if (userData) {
      syncMiningProgress();
      updateUI();
    }
  });
}

// Event listeners
window.addEventListener('load', () => {
  el.loading.style.display = 'none';
});

el.homeBtn.addEventListener('click', () => switchSection('home'));
el.profileBtn.addEventListener('click', () => switchSection('profile'));
el.walletBtn.addEventListener('click', () => switchSection('wallet'));
el.miningBtn.addEventListener('click', () => {
  if (el.miningBtn.classList.contains('claim')) {
    claimMiningReward();
  } else {
    startMining();
  }
});
el.claimReferralBtn.addEventListener('click', claimReferralRewards);
el.submitReferralBtn.addEventListener('click', submitReferralCode);
el.copyCode.addEventListener('click', copyReferralCode);
el.shareWA.addEventListener('click', () => shareReferralCode('whatsapp'));
el.shareTG.addEventListener('click', () => shareReferralCode('telegram'));
el.withdrawBtn.addEventListener('click', initiateWithdrawal);
el.settingsBtn.addEventListener('click', goToSettings);
el.authBtn.addEventListener('click', logout);

// Authentication state listener
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    initializeUserData(user);
  } else {
    window.location.href = 'login.html';
  }
});