// ✅ config.js থেকে import করুন (Firebase initialization বারবার হবে না)
import { auth, database } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { ref, get, set, update, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

let currentUser = null;
let userData = null;
let miningInterval = null;
let countdownInterval = null;

const MINING_DURATION = 8 * 60 * 60; // 8 hours in seconds
const TOTAL_REWARD = 6; // Total reward per mining session
const REWARD_PER_SECOND = TOTAL_REWARD / MINING_DURATION;
const MILESTONE_TOKENS = 100;
const REFERRAL_BONUS = 5;
const REFERRAL_MILESTONE = 100;
const MINIMUM_WITHDRAWAL = 50;


// --- Ad Modal Functions START ---
// This function shows the ad modal
function showAdModal() {
    const adModal = document.getElementById('adModal');
    const adModalContent = document.getElementById('adModalContent');
    if (!adModal || !adModalContent) return;

    adModalContent.innerHTML = '<div class="spinner"></div><p class="text-sm mt-2">Loading ad...</p>'; // Show spinner
    adModal.classList.remove('hidden');

    // Ad configuration - you can place your interstitial ad code here
    const adKey = '78ade24182729fceea8e45203dad915b'; // Example Ad Key
    const adContainer = document.createElement('div');
    const script1 = document.createElement('script');
    script1.type = 'text/javascript';
    script1.innerHTML = `atOptions = {'key': '${adKey}','format': 'iframe','height': 250,'width': 300,'params': {}};`;
    const script2 = document.createElement('script');
    script2.type = 'text/javascript';
    script2.src = `//www.highperformanceformat.com/${adKey}/invoke.js`;
    
    adContainer.appendChild(script1);
    adContainer.appendChild(script2);
    
    // Clear spinner and show ad
    setTimeout(() => {
        adModalContent.innerHTML = '';
        adModalContent.appendChild(adContainer);
    }, 1500); // Wait a bit for the ad to load
}

// This function closes the ad modal
function closeAdModal() {
    const adModal = document.getElementById('adModal');
    if (adModal) {
        adModal.classList.add('hidden');
    }
}
// --- Ad Modal Functions END ---


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
      stopMining();
      showNotification('Mining session completed! Ready to claim 6 FT.');
    }
  }, 1000);
}

function startMining() {
  if (!currentUser) return showNotification('Please log in to start mining.', 'error');
  if (userData.miningStartTime && Date.now() < userData.miningEndTime) return showNotification('Mining session already active.', 'error');

  const userRef = ref(database, `users/${currentUser.uid}`);
  const startTime = Date.now();
  const endTime = startTime + MINING_DURATION * 1000;

  update(userRef, {
    miningStartTime: startTime,
    miningEndTime: endTime
  }).then(() => {
    showNotification('Mining started! Session will run for 8 hours.');
  }).catch(err => {
    console.error('Mining start error:', err);
    showNotification('Failed to start mining. Please try again.', 'error');
  });
}

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

async function claimMiningReward() {
  const userRef = ref(database, `users/${currentUser.uid}`);
  try {
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      showNotification('User data not found.', 'error');
      return;
    }
    const serverUserData = snapshot.val();

    if (!serverUserData.miningStartTime || !serverUserData.miningEndTime || Date.now() < serverUserData.miningEndTime) {
        showNotification('Mining session is not yet complete.', 'error');
        return;
    }

    const rewardToClaim = TOTAL_REWARD;
    const newBalance = (serverUserData.balance || 0) + rewardToClaim;
    const newTotalMined = (serverUserData.totalMined || 0) + rewardToClaim;

    await update(userRef, {
      balance: newBalance,
      totalMined: newTotalMined,
      miningStartTime: null,
      miningEndTime: null
    });

    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transactionRef = ref(database, `users/${currentUser.uid}/transactions/${transactionId}`);
    await set(transactionRef, {
      type: 'mining',
      amount: rewardToClaim,
      description: 'Mining Reward Claimed',
      timestamp: Date.now(),
      status: 'completed'
    });

    showNotification(`Claimed ${rewardToClaim.toFixed(2)} FT!`);
    showAdModal(); // Show ad after claiming

    if (serverUserData.referredBy) {
      await checkReferralMilestones(currentUser.uid);
    }
  } catch (err) {
    console.error('Claim error:', err);
    showNotification('Failed to claim rewards. Please try again.', 'error');
  }
}

async function claimReferralRewards() {
  if (!userData || userData.referralRewards <= 0) {
    showNotification('No referral rewards to claim.', 'error');
    return;
  }
  const userRef = ref(database, `users/${currentUser.uid}`);
  const newBalance = (userData.balance || 0) + userData.referralRewards;
  try {
    await update(userRef, {
      balance: newBalance,
      referralRewards: 0
    });
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transactionRef = ref(database, `users/${currentUser.uid}/transactions/${transactionId}`);
    await set(transactionRef, {
      type: 'referral',
      amount: userData.referralRewards,
      description: 'Referral Rewards Claimed',
      timestamp: Date.now(),
      status: 'completed'
    });
    showNotification(`Claimed ${userData.referralRewards.toFixed(2)} FT from referrals!`);
    showAdModal(); // Show ad after claiming
  } catch (err) {
    console.error('Referral claim error:', err);
    showNotification('Failed to claim referral rewards. Please try again.', 'error');
  }
}

async function checkReferralMilestones(refereeId) {
    const refereeRef = ref(database, `users/${refereeId}`);
    const refereeSnapshot = await get(refereeRef);
    if (!refereeSnapshot.exists()) return;
  
    const refereeData = refereeSnapshot.val();
    const referrerCode = refereeData.referredBy;
    if (!referrerCode) return;
  
    const usersRef = ref(database, 'users');
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
      const referrerRef = ref(database, `users/${referrerId}`);
      await update(referrerRef, {
        referralRewards: (referrerData.referralRewards || 0) + newBonuses
      });
  
      const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const transactionRef = ref(database, `users/${referrerId}/transactions/${transactionId}`);
      await set(transactionRef, {
        type: 'referral',
        amount: newBonuses,
        description: `Referral Milestone Bonus`,
        timestamp: Date.now(),
        status: 'completed'
      });
  
      await update(refereeRef, {
        referralMilestones: { ...refereeData.referralMilestones || {}, [referrerId]: milestonesAchieved }
      });
    }
}

async function submitReferralCode() {
  const referralCodeInput = document.getElementById('referralCodeInput');
  const referralStatusEl = document.getElementById('referralStatus');
  const code = referralCodeInput ? referralCodeInput.value.trim().toUpperCase() : '';
  
  if (!code) return showStatus(referralStatusEl, 'Please enter a referral code.', true);
  if (userData.referredBy) return showStatus(referralStatusEl, 'You have already submitted a referral code.', true);
  if (code === userData.referralCode) return showStatus(referralStatusEl, 'You cannot use your own referral code.', true);

  try {
    const usersRef = ref(database, 'users');
    const referralQuery = query(usersRef, orderByChild('referralCode'), equalTo(code));
    const snapshot = await get(referralQuery);
    
    if (!snapshot.exists()) return showStatus(referralStatusEl, 'Invalid referral code.', true);

    const referrerData = Object.values(snapshot.val())[0];
    const referrerId = Object.keys(snapshot.val())[0];
    
    if (referrerId === currentUser.uid) return showStatus(referralStatusEl, 'You cannot use your own referral code.', true);

    const userRef = ref(database, `users/${currentUser.uid}`);
    const referrerRef = ref(database, `users/${referrerId}`);

    await update(userRef, {
      referredBy: code,
      referralRewards: (userData.referralRewards || 0) + REFERRAL_BONUS
    });
    await update(referrerRef, {
      referralRewards: (referrerData.referralRewards || 0) + REFERRAL_BONUS,
      [`referrals/${currentUser.uid}`]: true
    });

    const userTransactionRef = ref(database, `users/${currentUser.uid}/transactions/tx_${Date.now()}_u`);
    await set(userTransactionRef, { type: 'referral', amount: REFERRAL_BONUS, description: 'Referral Join Bonus', timestamp: Date.now(), status: 'completed' });
    const referrerTransactionRef = ref(database, `users/${referrerId}/transactions/tx_${Date.now()}_r`);
    await set(referrerTransactionRef, { type: 'referral', amount: REFERRAL_BONUS, description: `Bonus from new referral`, timestamp: Date.now(), status: 'completed' });

    showStatus(referralStatusEl, `Success! You and your referrer each received ${REFERRAL_BONUS} FT bonus!`);
    if (referralCodeInput) referralCodeInput.value = '';

  } catch (err) {
    console.error('Referral error:', err);
    showStatus(referralStatusEl, 'Failed to submit referral code.', true);
  }
}

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

  const shareText = `Join FarmToken and start mining! Use my referral code: ${code} to get a ${REFERRAL_BONUS} FT bonus!`;
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

async function initializeUserData(user) {
  const userRef = ref(database, `users/${user.uid}`);
  onValue(userRef, async (snapshot) => {
    if (!snapshot.exists()) {
      const referralCode = generateReferralCode();
      const joinDate = new Date().toISOString().split('T')[0];
      await set(userRef, {
        balance: 0, totalMined: 0, referralCode, joinDate, referrals: {}, referralRewards: 0, referralMilestones: {}, transactions: {}
      });
    }
    userData = snapshot.val();
    if (userData) {
      updateUI();
    }
  });
}


document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  if (loading) loading.style.display = 'none';

  // --- Event listeners ---
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
  const historyBtn = document.getElementById('historyBtn');
  const closeAdModalBtn = document.getElementById('closeAdModalBtn');

  if (homeBtn) homeBtn.addEventListener('click', () => switchSection('home'));
  if (profileBtn) profileBtn.addEventListener('click', () => switchSection('profile'));
  if (walletBtn) walletBtn.addEventListener('click', () => switchSection('wallet'));
  if (miningBtn) miningBtn.addEventListener('click', () => {
    if (miningBtn.classList.contains('claim')) claimMiningReward();
    else startMining();
  });
  if (claimReferralBtn) claimReferralBtn.addEventListener('click', claimReferralRewards);
  if (submitReferralBtn) submitReferralBtn.addEventListener('click', submitReferralCode);
  if (copyCode) copyCode.addEventListener('click', copyReferralCode);
  if (shareWA) shareWA.addEventListener('click', () => shareReferralCode('whatsapp'));
  if (shareTG) shareTG.addEventListener('click', () => shareReferralCode('telegram'));
  if (authBtn) authBtn.addEventListener('click', logout);
  
  if (historyBtn) historyBtn.addEventListener('click', () => {
    window.location.href = 'History.html';
  });

  if (closeAdModalBtn) closeAdModalBtn.addEventListener('click', closeAdModal);

  if (menuBtn && closeMenuBtn && menuOverlay) {
    menuBtn.addEventListener('click', () => menuOverlay.classList.remove('hidden'));
    closeMenuBtn.addEventListener('click', () => menuOverlay.classList.add('hidden'));
    menuOverlay.addEventListener('click', (event) => {
      if (event.target === menuOverlay) menuOverlay.classList.add('hidden');
    });
  }
});

onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    initializeUserData(user);
  } else {
    window.location.href = 'login.html';
  }
});