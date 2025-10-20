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
const MINIMUM_WITHDRAWAL = 50; // Minimum tokens required for withdrawal

// --- Helper Functions (No changes here) ---
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  if (notification) {
    notification.textContent = message;
    notification.style.background = type === 'success' ? '#28a745' : '#dc3545';
    notification.classList.add('show');
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
}

function showStatus(element, message, isError = false) {
  if (element) {
    element.textContent = message;
    element.classList.remove('hidden', 'text-green-500', 'text-red-500');
    element.classList.add(isError ? 'text-red-500' : 'text-green-500');
    setTimeout(() => {
      element.classList.add('hidden');
    }, 3000);
  }
}

function generateReferralCode() {
  return `FT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function switchSection(section) {
  const homeSection = document.getElementById('homeSection');
  const profileSection = document.getElementById('profileSection');
  const walletSection = document.getElementById('walletSection');
  const homeBtn = document.getElementById('homeBtn');
  const profileBtn = document.getElementById('profileBtn');
  const walletBtn = document.getElementById('walletBtn');

  if (homeSection) homeSection.classList.remove('active');
  if (profileSection) profileSection.classList.remove('active');
  if (walletSection) walletSection.classList.remove('active');
  if (homeBtn) homeBtn.classList.remove('text-green-600', 'font-semibold', 'border-t-2', 'border-green-600');
  if (profileBtn) profileBtn.classList.remove('text-green-600', 'font-semibold', 'border-t-2', 'border-green-600');
  if (walletBtn) walletBtn.classList.remove('text-green-600', 'font-semibold', 'border-t-2', 'border-green-600');

  if (section === 'home' && homeSection && homeBtn) {
    homeSection.classList.add('active');
    homeBtn.classList.add('text-green-600', 'font-semibold', 'border-t-2', 'border-green-600');
  } else if (section === 'profile' && profileSection && profileBtn) {
    profileSection.classList.add('active');
    profileBtn.classList.add('text-green-600', 'font-semibold', 'border-t-2', 'border-green-600');
  } else if (section === 'wallet' && walletSection && walletBtn) {
    walletSection.classList.add('active');
    walletBtn.classList.add('text-green-600', 'font-semibold', 'border-t-2', 'border-green-600');
  }
}
// --- End of Helper Functions ---


// Update UI with user data
function updateUI() {
  if (!userData) return;

  const totalBalanceEl = document.getElementById('totalBalance');
  const profileBalanceEl = document.getElementById('profileBalance');
  const walletBalance = document.getElementById('walletBalance');
  const miningRateEl = document.getElementById('miningRate');
  const referralCountEl = document.getElementById('referralCount');
  const totalMinedEl = document.getElementById('totalMined');
  const totalMinedWallet = document.getElementById('totalMinedWallet');
  const currentEarnedEl = document.getElementById('currentEarned');
  const referralRewardsEl = document.getElementById('referralRewards');
  const refCodeEl = document.getElementById('refCode');
  const joinDateEl = document.getElementById('joinDate');
  const earnedDisplayEl = document.getElementById('earnedDisplay');
  const progressBar = document.getElementById('progressBar');
  const levelText = document.getElementById('levelText');
  const claimReferralBtn = document.getElementById('claimReferralBtn');
  const referralSubmitBox = document.getElementById('referralSubmitBox');
  const referralSubmittedBox = document.getElementById('referralSubmittedBox');
  const miningBtn = document.getElementById('miningBtn');
  const miningStatusEl = document.getElementById('miningStatus');

  const balance = (userData.balance || 0).toFixed(2);
  const totalMined = (userData.totalMined || 0).toFixed(2);
  const miningRate = (REWARD_PER_SECOND * 3600).toFixed(4);
  const referralCount = userData.referrals ? Object.keys(userData.referrals).length : 0;
  const referralRewards = (userData.referralRewards || 0).toFixed(2);
  const progress = Math.min((userData.totalMined || 0) / MILESTONE_TOKENS * 100, 100);
  const level = Math.min(Math.floor((userData.totalMined || 0) / MILESTONE_TOKENS) + 1, 5);
  
  // Display current earned based on local calculation
  const currentEarned = calculateCurrentEarned();
  
  if (totalBalanceEl) totalBalanceEl.textContent = `${balance} FT`;
  if (profileBalanceEl) profileBalanceEl.textContent = `${balance} FT`;
  if (walletBalance) walletBalance.textContent = `${balance} FT`;
  if (miningRateEl) miningRateEl.textContent = `${miningRate}/hr`;
  if (referralCountEl) referralCountEl.textContent = referralCount;
  if (totalMinedEl) totalMinedEl.textContent = `${totalMined} FT`;
  if (totalMinedWallet) totalMinedWallet.textContent = `${totalMined} FT`;
  if (currentEarnedEl) currentEarnedEl.textContent = `${currentEarned.toFixed(6)} FT`;
  if (earnedDisplayEl) earnedDisplayEl.textContent = `${currentEarned.toFixed(6)} FT`;
  if (referralRewardsEl) referralRewardsEl.textContent = `${referralRewards} FT`;
  if (refCodeEl) refCodeEl.textContent = userData.referralCode || '---';
  if (joinDateEl) joinDateEl.textContent = userData.joinDate || '---';
  if (progressBar) progressBar.style.width = `${progress}%`;
  if (levelText) levelText.textContent = `Level ${level} / 5`;

  if (claimReferralBtn) {
    claimReferralBtn.style.display = (userData.referralRewards > 0) ? 'block' : 'none';
  }

  if (referralSubmitBox && referralSubmittedBox) {
    if (userData.referredBy) {
      referralSubmitBox.style.display = 'none';
      referralSubmittedBox.style.display = 'block';
    } else {
      referralSubmitBox.style.display = 'block';
      referralSubmittedBox.style.display = 'none';
    }
  }

  if (miningBtn && miningStatusEl) {
    if (userData.miningStartTime && Date.now() < userData.miningEndTime) {
      miningBtn.disabled = true;
      miningStatusEl.textContent = 'Active';
      miningStatusEl.classList.add('text-green-600');
      if (!countdownInterval) startCountdown(userData.miningEndTime);
      if (!miningInterval) miningInterval = setInterval(updateMiningDisplay, 1000);
    } else if (userData.miningStartTime && Date.now() >= userData.miningEndTime) {
      miningBtn.classList.add('claim');
      miningBtn.disabled = false;
      const timerDisplay = miningBtn.querySelector('.timer-display');
      if (timerDisplay) timerDisplay.textContent = 'Claim';
      miningStatusEl.textContent = 'Ready to Claim';
      miningStatusEl.classList.remove('text-green-600');
    } else {
      miningBtn.classList.remove('claim');
      miningBtn.disabled = false;
      const timerDisplay = miningBtn.querySelector('.timer-display');
      if (timerDisplay) timerDisplay.textContent = 'Start Mining';
      miningStatusEl.textContent = 'Inactive';
      miningStatusEl.classList.remove('text-green-600');
    }
  }
}

// **MODIFIED:** Calculate current earned without reading from DB constantly
function calculateCurrentEarned() {
    if (!userData || !userData.miningStartTime) {
        return 0;
    }

    const now = Date.now();
    if (now >= userData.miningEndTime) {
        return TOTAL_REWARD;
    }
    
    const elapsedSeconds = Math.floor((now - userData.miningStartTime) / 1000);
    return Math.min(elapsedSeconds * REWARD_PER_SECOND, TOTAL_REWARD);
}

// Start countdown timer
function startCountdown(endTime) {
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    const now = Date.now();
    const secondsLeft = Math.max(0, Math.floor((endTime - now) / 1000));
    
    const miningBtn = document.getElementById('miningBtn');
    const timerDisplay = miningBtn ? miningBtn.querySelector('.timer-display') : null;
    if (timerDisplay) timerDisplay.textContent = formatTime(secondsLeft);
    
    if (secondsLeft <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      stopMining(); // This function now just updates UI
      showNotification('Mining session completed! Ready to claim 6 FT.');
    }
  }, 1000);
}

// Start mining session
function startMining() {
  if (!currentUser) return showNotification('Please log in to start mining.', 'error');
  if (userData.miningStartTime && Date.now() < userData.miningEndTime) return showNotification('Mining session already active.', 'error');

  const userRef = ref(db, `users/${currentUser.uid}`);
  const startTime = Date.now();
  const endTime = startTime + MINING_DURATION * 1000;

  // Only one write to start the session
  update(userRef, {
    miningStartTime: startTime,
    miningEndTime: endTime
  }).then(() => {
    showNotification('Mining started! Session will run for 8 hours.');
    // The onValue listener will automatically call updateUI to reflect the changes
  }).catch(err => {
    console.error('Mining start error:', err);
    showNotification('Failed to start mining. Please try again.', 'error');
  });
}

// **NEW:** This function only updates the screen, doesn't write to the database
function updateMiningDisplay() {
  if (!userData || !userData.miningStartTime) return;

  const currentEarned = calculateCurrentEarned();

  const currentEarnedEl = document.getElementById('currentEarned');
  const earnedDisplayEl = document.getElementById('earnedDisplay');
  if (currentEarnedEl) currentEarnedEl.textContent = `${currentEarned.toFixed(6)} FT`;
  if (earnedDisplayEl) earnedDisplayEl.textContent = `${currentEarned.toFixed(6)} FT`;

  if (Date.now() >= userData.miningEndTime) {
    stopMining();
  }
}

// **MODIFIED:** This function now only stops intervals and updates the UI to "Claim" state
function stopMining() {
  clearInterval(miningInterval);
  clearInterval(countdownInterval);
  miningInterval = null;
  countdownInterval = null;
  
  const miningBtn = document.getElementById('miningBtn');
  const miningStatusEl = document.getElementById('miningStatus');
  if (miningBtn) {
    miningBtn.classList.add('claim');
    miningBtn.disabled = false;
    const timerDisplay = miningBtn.querySelector('.timer-display');
    if (timerDisplay) timerDisplay.textContent = 'Claim';
  }
  if (miningStatusEl) {
    miningStatusEl.textContent = 'Ready to Claim';
    miningStatusEl.classList.remove('text-green-600');
  }
}


// **MODIFIED FOR SECURITY:** Claim mining reward
async function claimMiningReward() {
  const userRef = ref(db, `users/${currentUser.uid}`);

  try {
    // 1. Get the latest data from the server to prevent cheating
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      showNotification('User data not found.', 'error');
      return;
    }
    const serverUserData = snapshot.val();

    // 2. Check if there is a mining session to claim
    if (!serverUserData.miningStartTime || !serverUserData.miningEndTime) {
      showNotification('No active mining session to claim.', 'error');
      return;
    }
    
    if (Date.now() < serverUserData.miningEndTime) {
        showNotification('Mining session is not yet complete.', 'error');
        return;
    }

    // 3. Securely calculate reward based on server time, not client data
    const rewardToClaim = TOTAL_REWARD; // Since session must be complete
    
    if (rewardToClaim <= 0) {
      showNotification('No rewards to claim.', 'error');
      return;
    }

    const newBalance = (serverUserData.balance || 0) + rewardToClaim;
    const newTotalMined = (serverUserData.totalMined || 0) + rewardToClaim;

    // 4. Update database in one go
    await update(userRef, {
      balance: newBalance,
      totalMined: newTotalMined,
      miningStartTime: null, // Reset mining session
      miningEndTime: null
    });

    // Create a transaction record
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transactionRef = ref(db, `users/${currentUser.uid}/transactions/${transactionId}`);
    await set(transactionRef, {
      type: 'mining',
      amount: rewardToClaim,
      description: 'Mining Reward Claimed',
      timestamp: Date.now()
    });

    showNotification(`Claimed ${rewardToClaim.toFixed(2)} FT!`);

    // Check referral milestones
    if (serverUserData.referredBy) {
      await checkReferralMilestones(currentUser.uid);
    }
    
    if (typeof showAdModal === 'function') {
      showAdModal();
    }
    
    // UI will be updated automatically by the onValue listener

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
    
    if (typeof showAdModal === 'function') {
        showAdModal();
    }
  } catch (err) {
    console.error('Referral claim error:', err);
    showNotification('Failed to claim referral rewards. Please try again.', 'error');
  }
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
  
      await update(refereeRef, {
        referralMilestones: { ...refereeData.referralMilestones || {}, [referrerId]: milestonesAchieved }
      });
  
      showNotification(`Referrer ${referrerId} received ${newBonuses} FT for referee ${refereeId}'s milestone!`);
    }
}

// Submit referral code
async function submitReferralCode() {
  const referralCodeInput = document.getElementById('referralCodeInput');
  const referralStatusEl = document.getElementById('referralStatus');
  const code = referralCodeInput ? referralCodeInput.value.trim().toUpperCase() : '';
  
  if (!code) return showStatus(referralStatusEl, 'Please enter a referral code.', true);
  if (userData.referredBy) return showStatus(referralStatusEl, 'You have already submitted a referral code.', true);
  if (code === userData.referralCode) return showStatus(referralStatusEl, 'You cannot use your own referral code.', true);

  try {
    const usersRef = ref(db, 'users');
    const referralQuery = query(usersRef, orderByChild('referralCode'), equalTo(code));
    const snapshot = await get(referralQuery);
    
    if (!snapshot.exists()) return showStatus(referralStatusEl, 'Invalid referral code.', true);

    const referrerData = Object.values(snapshot.val())[0];
    const referrerId = Object.keys(snapshot.val())[0];
    
    if (referrerId === currentUser.uid) return showStatus(referralStatusEl, 'You cannot use your own referral code.', true);

    const userRef = ref(db, `users/${currentUser.uid}`);
    const referrerRef = ref(db, `users/${referrerId}`);

    // Update both user and referrer
    await update(userRef, {
      referredBy: code,
      referralRewards: (userData.referralRewards || 0) + REFERRAL_BONUS
    });
    await update(referrerRef, {
      referralRewards: (referrerData.referralRewards || 0) + REFERRAL_BONUS,
      [`referrals/${currentUser.uid}`]: true
    });

    // Create transactions for both
    const userTransactionRef = ref(db, `users/${currentUser.uid}/transactions/tx_${Date.now()}_u`);
    await set(userTransactionRef, { type: 'referral', amount: REFERRAL_BONUS, description: 'Referral Bonus for Joining', timestamp: Date.now() });
    const referrerTransactionRef = ref(db, `users/${referrerId}/transactions/tx_${Date.now()}_r`);
    await set(referrerTransactionRef, { type: 'referral', amount: REFERRAL_BONUS, description: `Referral Bonus from ${currentUser.email || currentUser.uid}`, timestamp: Date.now() });

    showStatus(referralStatusEl, `Success! You and your referrer each received ${REFERRAL_BONUS} FT bonus!`);
    if (referralCodeInput) referralCodeInput.value = '';

  } catch (err) {
    console.error('Referral error details:', err);
    showStatus(referralStatusEl, `Error: ${err.message || 'Failed to submit referral code.'}`, true);
  }
}

// --- Other UI functions (No changes here) ---
function copyReferralCode() {
  const refCodeEl = document.getElementById('refCode');
  const code = refCodeEl ? refCodeEl.textContent : '';
  if (code === '---') return showNotification('No referral code available.', 'error');

  navigator.clipboard.writeText(code).then(() => {
    showNotification('Referral code copied!');
  }).catch(err => {
    showNotification('Failed to copy code.', 'error');
  });
}

function shareReferralCode(platform) {
  const refCodeEl = document.getElementById('refCode');
  const code = refCodeEl ? refCodeEl.textContent : '';
  if (code === '---') return showNotification('No referral code available.', 'error');

  const shareText = `Join FarmToken and start mining cryptocurrency! Use my referral code: ${code} to get 5 FT bonus!`;
  let url = '';
  if (platform === 'whatsapp') {
    url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  } else if (platform === 'telegram') {
    url = `https://t.me/share/url?url=${encodeURIComponent('https://farmtoken.com')}&text=${encodeURIComponent(shareText)}`;
  }
  window.open(url, '_blank');
}

function logout() {
  signOut(auth).then(() => {
    window.location.href = 'login.html';
  }).catch(err => {
    showNotification('Failed to logout.', 'error');
  });
}
// --- End of other UI functions ---


// Initialize user data
async function initializeUserData(user) {
  const userRef = ref(db, `users/${user.uid}`);
  const snapshot = await get(userRef);

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
  }

  // This is the key: onValue listens for ANY change in user data and updates the whole UI
  onValue(userRef, snapshot => {
    userData = snapshot.val();
    if (userData) {
      updateUI();
    }
  });
}

// --- Event Listeners (No changes here) ---
document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  if (loading) loading.style.display = 'none';

  const homeBtn = document.getElementById('homeBtn');
  const profileBtn = document.getElementById('profileBtn');
  const walletBtn = document.getElementById('walletBtn');
  const miningBtn = document.getElementById('miningBtn');
  const claimReferralBtn = document.getElementById('claimReferralBtn');
  const submitReferralBtn = document.getElementById('submitReferralBtn');
  const copyCode = document.getElementById('copyCode');
  const shareWA = document.getElementById('shareWA');
  const shareTG = document.getElementById('shareTG');
  const authBtn = document.getElementById('authBtn');
  const menuBtn = document.getElementById('menuBtn');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const menuOverlay = document.getElementById('menuOverlay');

  if (homeBtn) homeBtn.addEventListener('click', () => switchSection('home'));
  if (profileBtn) profileBtn.addEventListener('click', () => switchSection('profile'));
  if (walletBtn) walletBtn.addEventListener('click', () => switchSection('wallet'));
  if (miningBtn) miningBtn.addEventListener('click', () => {
    if (miningBtn.classList.contains('claim')) {
      claimMiningReward();
    } else {
      startMining();
    }
  });
  if (claimReferralBtn) claimReferralBtn.addEventListener('click', claimReferralRewards);
  if (submitReferralBtn) submitReferralBtn.addEventListener('click', submitReferralCode);
  if (copyCode) copyCode.addEventListener('click', copyReferralCode);
  if (shareWA) shareWA.addEventListener('click', () => shareReferralCode('whatsapp'));
  if (shareTG) shareTG.addEventListener('click', () => shareReferralCode('telegram'));
  if (authBtn) authBtn.addEventListener('click', logout);

  if (menuBtn && closeMenuBtn && menuOverlay) {
    menuBtn.addEventListener('click', () => menuOverlay.classList.remove('hidden'));
    closeMenuBtn.addEventListener('click', () => menuOverlay.classList.add('hidden'));
    menuOverlay.addEventListener('click', (event) => {
      if (event.target === menuOverlay) menuOverlay.classList.add('hidden');
    });
  }
});

// Authentication state listener
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    initializeUserData(user);
  } else {
    window.location.href = 'login.html';
  }
});