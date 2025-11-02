import { auth, database } from './config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { ref, get, update, runTransaction, onValue, push } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// Constants
const dailyRewards = [1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,3,3,3,3,3,4,4,4,4,4,5,5,5,5,7];
const adConfigs = [
  { key: '63718988f07bc6d276f3c6a441757cae', format: 'iframe', height: 90, width: 728, src: '//www.highperformanceformat.com/63718988f07bc6d276f3c6a441757cae/invoke.js' },
  { key: '53c6462d2fd5ad5b91686ca9561f79a2', format: 'iframe', height: 90, width: 728, src: '//www.highperformanceformat.com/53c6462d2fd5ad5b91686ca9561f79a2/invoke.js' },
  { key: '78ade24182729fceea8e45203dad915b', format: 'iframe', height: 50, width: 320, src: '//www.highperformanceformat.com/78ade24182729fceea8e45203dad915b/invoke.js' },
  { key: '63718988f07bc6d276f3c6a441757cae', format: 'iframe', height: 90, width: 728, src: '//www.highperformanceformat.com/63718988f07bc6d276f3c6a441757cae/invoke.js' }
];

// Global variables
let userData = null;
let userId = null;
let currentUser = null;
let countdownTimers = {};
let cooldownInterval = null;
let adCountdownInterval = null;
let currentAdStep = 0;
let allTransactions = [];
let currentFilter = 'all';

// DOM Elements
const balanceEl = document.getElementById('balanceAmount');
const toastContainer = document.getElementById('toastContainer');
const persistentAdBanner = document.getElementById('persistentAdBanner');
const persistentAdContainer = document.getElementById('persistentAdContainer');
const closeAdBannerBtn = document.getElementById('closeAdBannerBtn');

// Toast Notification
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// Update Balance UI
function updateBalanceUI() {
  if (balanceEl && userData?.balance !== undefined) {
    balanceEl.textContent = userData.balance.toFixed(2);
  }
}

// Initialize sections and navigation
function initNavigation() {
  const sections = {
    daily: document.getElementById('dailyBonusSection'),
    extra: document.getElementById('extraRewardSection'),
    history: document.getElementById('historySection')
  };

  const navBtns = {
    daily: document.getElementById('dailyBtn'),
    extra: document.getElementById('extraBtn'),
    history: document.getElementById('historyBtn')
  };

  const navIndicator = document.getElementById('navIndicator');

  function showSection(sectionName) {
    Object.values(sections).forEach(s => s.classList.remove('active'));
    sections[sectionName].classList.add('active');

    Object.values(navBtns).forEach(b => {
      b.classList.remove('active', 'text-green-600');
      b.classList.add('text-gray-600');
    });
    navBtns[sectionName].classList.add('active', 'text-green-600');
    navBtns[sectionName].classList.remove('text-gray-600');

    updateNavIndicator(navBtns[sectionName]);

    if (sectionName === 'daily') loadDailyBonus();
    if (sectionName === 'extra') loadExtraReward();
    if (sectionName === 'history') loadHistory();
  }

  function updateNavIndicator(btn) {
    const btnRect = btn.getBoundingClientRect();
    const parentRect = btn.parentElement.getBoundingClientRect();
    const left = btnRect.left - parentRect.left;
    const width = btnRect.width;
    navIndicator.style.left = `${left}px`;
    navIndicator.style.width = `${width}px`;
  }

  Object.keys(navBtns).forEach(key => {
    navBtns[key].addEventListener('click', () => showSection(key));
  });

  setTimeout(() => updateNavIndicator(navBtns.daily), 100);
  window.addEventListener('resize', () => {
    const activeBtn = document.querySelector('.nav-btn.active');
    if (activeBtn) updateNavIndicator(activeBtn);
  });
}

// Daily Bonus Functions
async function loadDailyBonus() {
  if (!userId) return;
  try {
    const userRef = ref(database, 'users/' + userId);
    const snap = await get(userRef);
    if (snap.exists()) {
      userData = snap.val();
      if (!userData.dailyBonusDay) {
        userData.dailyBonusDay = 0;
        userData.lastClaimTime = 0;
      }
      updateBalanceUI();
      renderDailyGrid();
    }
  } catch (err) {
    showToast('Failed to load daily bonus.', 'error');
  }
}

function renderDailyGrid() {
  document.getElementById('dailyLoading').style.display = 'none';
  document.getElementById('dailyContent').style.display = 'block';
  
  const grid = document.getElementById('bonusGrid');
  grid.innerHTML = '';
  Object.values(countdownTimers).forEach(t => clearInterval(t));
  countdownTimers = {};

  const current = userData.dailyBonusDay || 0;
  const last = userData.lastClaimTime || 0;

  dailyRewards.forEach((reward, i) => {
    const card = document.createElement("div");
    card.className = "bonus-card";

    const day = document.createElement("h3");
    day.className = "font-semibold text-gray-700";
    day.textContent = `Day ${i + 1}`;
    card.appendChild(day);

    const rew = document.createElement("p");
    rew.className = "text-sm text-gray-500 mb-3";
    rew.textContent = `+${reward} Tokens`;
    card.appendChild(rew);

    const btn = document.createElement("button");
    btn.className = "w-full py-2 rounded-lg text-sm font-semibold transition-all";
    
    if (i < current) {
      btn.textContent = "Claimed";
      btn.classList.add("bg-green-100", "text-green-700");
      btn.disabled = true;
    } else if (i === current) {
      const diff = Date.now() - last;
      const oneDay = 86400000;
      const remain = oneDay - diff;
      
      if (remain > 0 && current > 0) {
        btn.disabled = true;
        btn.classList.add("bg-gray-100", "text-gray-500");
        startCountdown(btn, remain, i);
      } else {
        btn.textContent = "Claim Now";
        btn.classList.add("bg-green-500", "text-white", "hover:bg-green-600");
        btn.onclick = () => showRewardModal(i, reward);
      }
    } else {
      btn.textContent = "Locked";
      btn.classList.add("bg-gray-100", "text-gray-400");
      btn.disabled = true;
    }
    
    card.appendChild(btn);
    grid.appendChild(card);
  });
}

function showRewardModal(day, reward) {
  const modal = document.getElementById('rewardedAdModal');
  modal.classList.add('visible');
  
  document.getElementById('watchAdBtn').onclick = () => {
    modal.classList.remove('visible');
    startAd(day, reward);
  };
  
  document.getElementById('cancelAdBtn').onclick = () => {
    modal.classList.remove('visible');
  };
}

function startAd(day, reward) {
  const modal = document.getElementById('adPlayerModal');
  modal.classList.add('visible');
  
  let count = 8;
  const countText = document.getElementById('adCountdownText');
  const progressBar = document.getElementById('adProgressBar');
  
  progressBar.style.width = '0%';
  countText.textContent = `Watch for ${count}s...`;

  let canClaim = false;
  adCountdownInterval = setInterval(() => {
    count--;
    const progress = ((8 - count) / 8) * 100;
    progressBar.style.width = `${progress}%`;
    countText.textContent = `Watch for ${count}s...`;

    if (count <= 0) {
      clearInterval(adCountdownInterval);
      canClaim = true;
      countText.textContent = 'Ad completed!';
      setTimeout(() => {
        modal.classList.remove('visible');
        if (canClaim) claimDailyReward(day, reward);
      }, 1000);
    }
  }, 1000);

  loadAd(adConfigs[0], (success) => {
    if (!success && count > 0) {
      clearInterval(adCountdownInterval);
      modal.classList.remove('visible');
      showToast('Ad failed. Try again.', 'error');
    }
  });
}

async function claimDailyReward(index, reward) {
  const refUser = ref(database, 'users/' + userId);
  try {
    await runTransaction(refUser, (data) => {
      if (data && data.dailyBonusDay === index) {
        data.dailyBonusDay = index + 1;
        data.lastClaimTime = Date.now();
        data.balance = (data.balance || 0) + reward;
      }
      return data;
    });
    await loadDailyBonus();
    showToast(`+${reward} FZ claimed!`, 'success');
    addTransaction('daily_bonus', reward, `Day ${index + 1} Reward`);
  } catch (err) {
    showToast('Claim failed.', 'error');
  }
}

function startCountdown(btn, remain, idx) {
  function tick() {
    if (remain <= 0) {
      clearInterval(countdownTimers[idx]);
      renderDailyGrid();
      return;
    }
    const h = Math.floor(remain / 3600000);
    const m = Math.floor((remain % 3600000) / 60000);
    const s = Math.floor((remain % 60000) / 1000);
    btn.textContent = `${h}h ${m}m ${s}s`;
    remain -= 1000;
  }
  tick();
  countdownTimers[idx] = setInterval(tick, 1000);
}

// Extra Reward Functions
async function loadExtraReward() {
  if (!userId) return;
  document.getElementById('extraLoading').style.display = 'none';
  document.getElementById('extraContent').style.display = 'block';
  
  try {
    const snapshot = await get(ref(database, 'users/' + userId));
    if (snapshot.exists()) {
      userData = snapshot.val();
      if (!userData.extraReward) {
        userData.extraReward = { adsWatched: 0, lastRewardTime: 0 };
      }
      updateBalanceUI();
      updateExtraUI();
    }
  } catch (err) {
    showToast('Failed to load extra reward.', 'error');
  }
}

function updateExtraUI() {
  const { lastRewardTime = 0, adsWatched = 0 } = userData.extraReward || {};
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (lastRewardTime && now - lastRewardTime < oneDayMs && adsWatched >= 4) {
    document.getElementById('adTaskContainer').style.display = 'none';
    document.getElementById('cooldownInfo').style.display = 'block';
    document.getElementById('adsWatched').textContent = '4/4';
    startCooldownTimer(lastRewardTime + oneDayMs);
  } else {
    currentAdStep = (adsWatched >= 4 || (now - lastRewardTime >= oneDayMs)) ? 0 : adsWatched;
    document.getElementById('adsWatched').textContent = `${currentAdStep}/4`;
    document.getElementById('adTaskContainer').style.display = 'block';
    document.getElementById('cooldownInfo').style.display = 'none';
    updateAdActionButton();
  }
}


function updateAdActionButton() {
  const btn = document.getElementById('adActionBtn');
  btn.disabled = false;
  btn.innerHTML = currentAdStep >= 4 
    ? 'Claim 5 FZ Reward' 
    : `Watch Ad (${currentAdStep + 1}/4)`;
}

function startCooldownTimer(targetTime) {
  if (cooldownInterval) clearInterval(cooldownInterval);
  
  function update() {
    const remaining = targetTime - Date.now();
    if (remaining <= 0) {
      clearInterval(cooldownInterval);
      updateExtraUI();
      return;
    }
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    document.getElementById('cooldownTimer').textContent = 
      `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  update();
  cooldownInterval = setInterval(update, 1000);
}

async function handleAdAction() {
  if (currentAdStep >= 4) {
    await claimExtraReward();
  } else {
    startAdViewingProcess();
  }
}

function startAdViewingProcess() {
  const btn = document.getElementById('adActionBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Loading...';
  
  const viewer = document.getElementById('adViewer');
  viewer.style.display = 'flex';
  viewer.innerHTML = '<p class="text-sm text-gray-500">Loading ad...</p>';

  loadAd(adConfigs[currentAdStep % adConfigs.length], async (success) => {
    if (success) {
      await new Promise(r => setTimeout(r, 5000));
      await adViewCompleted();
    } else {
      viewer.innerHTML = '<p class="text-red-500">Ad failed. Please try again.</p>';
      setTimeout(() => {
        updateAdActionButton();
        viewer.style.display = 'none';
      }, 2000);
    }
  });
}

function loadAd(adConfig, callback) {
  const viewer = document.getElementById('adViewer');
  viewer.innerHTML = '';
  
  try {
    const script1 = document.createElement('script');
    script1.type = 'text/javascript';
    script1.innerHTML = `atOptions = {'key': '${adConfig.key}','format': '${adConfig.format}','height': ${adConfig.height},'width': ${adConfig.width},'params': {}};`;
    
    const script2 = document.createElement('script');
    script2.type = 'text/javascript';
    script2.src = adConfig.src;
    script2.onload = () => callback(true);
    script2.onerror = () => callback(false);
    
    viewer.appendChild(script1);
    viewer.appendChild(script2);
  } catch(e) {
    callback(false);
  }
}

async function adViewCompleted() {
  currentAdStep++;
  document.getElementById('adViewer').style.display = 'none';
  
  try {
    await update(ref(database, `users/${userId}/extraReward`), { adsWatched: currentAdStep });
    if(userData.extraReward) userData.extraReward.adsWatched = currentAdStep;
    document.getElementById('adsWatched').textContent = `${currentAdStep}/4`;
    updateAdActionButton();
    showToast(`Ad ${currentAdStep}/4 watched!`, 'success');
  } catch (error) {
    showToast('Save failed.', 'error');
  }
}

async function claimExtraReward() {
  const btn = document.getElementById('adActionBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>';

  try {
    await runTransaction(ref(database, 'users/' + userId), (data) => {
      if (data?.extraReward?.adsWatched >= 4) {
        data.balance = (data.balance || 0) + 5;
        data.extraReward.lastRewardTime = Date.now();
        data.extraReward.adsWatched = 0; // Reset after claim
      }
      return data;
    });
    await loadExtraReward(); // Reload data to reflect changes
    showToast('+5 FZ Reward Claimed!', 'success');
    addTransaction('extra_reward', 5, 'Watched 4 Ads');
  } catch (error) {
    btn.innerHTML = 'Claim Failed';
    setTimeout(() => updateAdActionButton(), 2000);
  }
}


// Transaction Helper
async function addTransaction(type, amount, description) {
  const txRef = ref(database, `users/${userId}/transactions`);
  await push(txRef, {
    type,
    amount,
    description,
    timestamp: Date.now()
  });
}

// History Functions
async function loadHistory() {
  document.getElementById('historyLoading').style.display = 'block';
  document.getElementById('historyContent').style.display = 'none';
  
  const txRef = ref(database, `users/${userId}/transactions`);
  onValue(txRef, snapshot => {
    const data = snapshot.val();
    allTransactions = data ? Object.values(data).sort((a, b) => b.timestamp - a.timestamp) : [];
    document.getElementById('historyLoading').style.display = 'none';
    document.getElementById('historyContent').style.display = 'block';
    renderTransactions();
  }, { onlyOnce: false });
}

function renderTransactions() {
  const list = document.getElementById('transactionsList');
  const empty = document.getElementById('emptyState');
  
  let filtered = currentFilter === 'all' ? allTransactions : 
                 allTransactions.filter(tx => tx.type === currentFilter);
  
  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  
  empty.style.display = 'none';
  list.innerHTML = '';
  
  filtered.forEach(tx => {
    const card = document.createElement('div');
    card.className = 'task-card';
    const isPositive = !['withdrawal'].includes(tx.type);
    const amountColor = isPositive ? 'text-green-600' : 'text-red-600';
    const amountSign = isPositive ? '+' : '-';
    
    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="font-semibold text-gray-800 capitalize mb-1">${tx.description || tx.type.replace('_', ' ')}</h3>
          <p class="text-xs text-gray-400">${formatDate(tx.timestamp)}</p>
        </div>
        <div class="text-right">
          <p class="font-bold ${amountColor}">${amountSign}${tx.amount.toFixed(2)} FZ</p>
          <span class="text-xs text-gray-500 capitalize">${tx.type.replace('_', ' ')}</span>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

function formatDate(ts) {
    const date = new Date(ts);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
}

// --- NEW --- Persistent Ad Banner Functionality
function loadPersistentBannerAd() {
  if (!persistentAdBanner) return;

  const bannerAdConfig = adConfigs.find(ad => ad.width === 320 && ad.height === 50);
  if (!bannerAdConfig) {
    return;
  }

  try {
    persistentAdContainer.innerHTML = ''; // Clear loading text
    const script1 = document.createElement('script');
    script1.type = 'text/javascript';
    script1.innerHTML = `atOptions = {'key': '${bannerAdConfig.key}','format': '${bannerAdConfig.format}','height': ${bannerAdConfig.height},'width': ${bannerAdConfig.width},'params': {}};`;

    const script2 = document.createElement('script');
    script2.type = 'text/javascript';
    script2.src = bannerAdConfig.src;

    script2.onload = () => {
      persistentAdBanner.style.display = 'block';
      setTimeout(() => {
        persistentAdBanner.classList.remove('translate-y-[200%]');
      }, 100);
    };

    script2.onerror = () => {
      persistentAdBanner.style.display = 'none';
    };

    persistentAdContainer.appendChild(script1);
    persistentAdContainer.appendChild(script2);
  } catch (e) {
    persistentAdBanner.style.display = 'none';
  }
}

// Event Listeners
document.getElementById('adActionBtn')?.addEventListener('click', handleAdAction);

document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(t => {
      t.classList.remove('bg-green-500', 'text-white');
      t.classList.add('bg-gray-100', 'text-gray-600');
    });
    tab.classList.add('bg-green-500', 'text-white');
    tab.classList.remove('bg-gray-100', 'text-gray-600');
    currentFilter = tab.dataset.filter;
    renderTransactions();
  });
});

closeAdBannerBtn?.addEventListener('click', () => {
  persistentAdBanner.classList.add('translate-y-[200%]');
  setTimeout(() => {
    persistentAdBanner.style.display = 'none';
  }, 500);
});

// Auth State
onAuthStateChanged(auth, user => {
  if (user) {
    userId = user.uid;
    currentUser = user;
    initNavigation();
    loadDailyBonus();
    loadPersistentBannerAd(); // Load the banner ad
    
    get(ref(database, 'users/' + userId)).then(snap => {
        if(snap.exists()) {
            userData = snap.val();
            updateBalanceUI();
        }
    });
  } else {
    window.location.href = 'index.html';
  }
});

// Cleanup
window.addEventListener('beforeunload', () => {
  Object.values(countdownTimers).forEach(clearInterval);
  if(cooldownInterval) clearInterval(cooldownInterval);
  if(adCountdownInterval) clearInterval(adCountdownInterval);
});