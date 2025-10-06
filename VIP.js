import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getDatabase, ref, onValue, update, get, push, set } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

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

let allRequests = [];
let allUsers = [];
let currentFilter = 'all';

const el = {
  loading: document.getElementById('loading'),
  notification: document.getElementById('notification'),
  requestsList: document.getElementById('requestsList'),
  totalRequests: document.getElementById('totalRequests'),
  pendingRequests: document.getElementById('pendingRequests'),
  approvedRequests: document.getElementById('approvedRequests'),
  rejectedRequests: document.getElementById('rejectedRequests'),
  onlineUsers: document.getElementById('onlineUsers'),
  refreshBtn: document.getElementById('refreshBtn'),
  notificationForm: document.getElementById('notificationForm'),
  notificationTitle: document.getElementById('notificationTitle'),
  notificationMessage: document.getElementById('notificationMessage'),
  notificationTarget: document.getElementById('notificationTarget'),
  specificTargetInput: document.getElementById('specificTargetInput'),
  targetId: document.getElementById('targetId'),
  sendNotificationBtn: document.getElementById('sendNotificationBtn'),
  usersList: document.getElementById('usersList'),
  multiplesList: document.getElementById('multiplesList'),
  suspiciousList: document.getElementById('suspiciousList'),
  scanCheatersBtn: document.getElementById('scanCheatersBtn')
};

function showNotification(message, isError = false) {
  el.notification.textContent = message;
  el.notification.classList.toggle('error', isError);
  el.notification.classList.add('show');
  setTimeout(() => {
    el.notification.classList.remove('show');
  }, 3000);
}

async function checkAdminStatus(uid) {
  try {
    const adminRef = ref(db, `admins/${uid}`);
    const snapshot = await get(adminRef);
    console.log('Admin Check - UID:', uid);
    console.log('Admin Node Exists:', snapshot.exists());
    console.log('Admin Value:', snapshot.val());
    return snapshot.exists() && snapshot.val() === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

async function fetchUserEmail(userId) {
  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val().email || 'Unknown';
    }
    return 'Unknown';
  } catch (error) {
    console.error('Error fetching user email:', error);
    return 'Unknown';
  }
}

async function findUserByEmail(email) {
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      const users = snapshot.val();
      for (const [uid, userData] of Object.entries(users)) {
        if (userData.email && userData.email.toLowerCase() === email.toLowerCase()) {
          return uid;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

function updateStats() {
  const total = allRequests.length;
  const pending = allRequests.filter(req => req.status === 'pending').length;
  const approved = allRequests.filter(req => req.status === 'approved').length;
  const rejected = allRequests.filter(req => req.status === 'rejected').length;

  el.totalRequests.textContent = total;
  el.pendingRequests.textContent = pending;
  el.approvedRequests.textContent = approved;
  el.rejectedRequests.textContent = rejected;
}

async function renderRequests() {
  el.requestsList.innerHTML = '';
  if (allRequests.length === 0) {
    el.requestsList.innerHTML = '<p class="text-center text-gray-500 py-8">No withdrawal requests found.</p>';
    return;
  }

  const filteredRequests = allRequests.filter(req => {
    if (currentFilter === 'all') return true;
    return req.status === currentFilter;
  });

  for (const req of filteredRequests) {
    const userEmail = await fetchUserEmail(req.userId);
    const card = document.createElement('div');
    card.className = `request-card p-4 rounded-lg shadow ${req.status}`;
    card.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 class="text-md font-semibold text-gray-800">Withdrawal Request</h4>
          <p class="text-sm text-gray-600 mt-1">${req.description}</p>
          <p class="text-sm text-gray-600 mt-1">Amount: ${req.amount.toFixed(2)} FT</p>
          <p class="text-sm text-gray-600 mt-1">Wallet: ${req.walletAddress}</p>
          <p class="text-xs text-gray-500 mt-2">Submitted: ${formatDate(req.timestamp)}</p>
          <p class="text-xs text-gray-500">User ID: ${req.userId}</p>
          <p class="text-xs text-gray-500">User Email: ${userEmail}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="badge ${req.status}">${req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span>
          ${req.status === 'pending' ? `
            <button class="approve-btn px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors" data-id="${req.id}">
              Approve
            </button>
            <button class="reject-btn px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors" data-id="${req.id}">
              Reject
            </button>
          ` : ''}
        </div>
      </div>
    `;
    el.requestsList.appendChild(card);
  }
}

async function approveWithdrawal(id) {
  const request = allRequests.find(req => req.id === id);
  if (!request || request.status !== 'pending') {
    showNotification('Invalid request or already processed.', true);
    return;
  }

  try {
    const userRef = ref(db, `users/${request.userId}`);
    const userSnapshot = await get(userRef);
    if (!userSnapshot.exists()) {
      showNotification('User not found.', true);
      return;
    }

    const userData = userSnapshot.val();
    if (userData.balance < request.amount) {
      showNotification('User has insufficient balance.', true);
      return;
    }

    const newBalance = userData.balance - request.amount;
    const updates = {
      [`VIPFarmToken/withdrawals/${id}/status`]: 'approved',
      [`users/${request.userId}/balance`]: newBalance,
      [`users/${request.userId}/transactions/${id}`]: {
        type: 'withdrawal',
        amount: request.amount,
        description: `Withdrawal to ${request.walletAddress} (Approved)`,
        timestamp: Date.now()
      }
    };

    await update(ref(db, '/'), updates);
    showNotification(`Withdrawal of ${request.amount.toFixed(2)} FT approved`);
    request.status = 'approved';
    updateStats();
    renderRequests();
  } catch (error) {
    showNotification('Failed to approve withdrawal: ' + error.message, true);
  }
}

async function rejectWithdrawal(id) {
  const request = allRequests.find(req => req.id === id);
  if (!request || request.status !== 'pending') {
    showNotification('Invalid request or already processed.', true);
    return;
  }

  try {
    const updates = {
      [`VIPFarmToken/withdrawals/${id}/status`]: 'rejected',
      [`users/${request.userId}/transactions/${id}`]: {
        type: 'withdrawal_request',
        amount: request.amount,
        description: `Withdrawal to ${request.walletAddress} (Rejected)`,
        timestamp: Date.now()
      }
    };

    await update(ref(db, '/'), updates);
    showNotification(`Withdrawal request rejected`);
    request.status = 'rejected';
    updateStats();
    renderRequests();
  } catch (error) {
    showNotification('Failed to reject withdrawal: ' + error.message, true);
  }
}

async function sendNotification(e) {
  e.preventDefault();

  const title = el.notificationTitle.value.trim();
  const message = el.notificationMessage.value.trim();
  const targetType = el.notificationTarget.value;
  let targetId = targetType === 'specific' ? el.targetId.value.trim() : 'all';

  if (!title || !message) {
    showNotification('Please fill in title and message.', true);
    return;
  }

  if (targetType === 'specific' && !targetId) {
    showNotification('Please enter a user ID or email.', true);
    return;
  }

  el.loading.style.display = 'flex';
  el.sendNotificationBtn.disabled = true;

  try {
    if (targetType === 'specific' && targetId.includes('@')) {
      const userId = await findUserByEmail(targetId);
      if (!userId) {
        showNotification('User not found with this email.', true);
        el.loading.style.display = 'none';
        el.sendNotificationBtn.disabled = false;
        return;
      }
      targetId = userId;
    }

    const notificationsRef = ref(db, 'VIPFarmToken/notifications');
    const newNotificationRef = push(notificationsRef);
    await set(newNotificationRef, {
      title: title,
      message: message,
      target: targetId,
      timestamp: Date.now(),
      status: 'active'
    });

    showNotification('Notification sent successfully!');
    el.notificationForm.reset();
    el.specificTargetInput.classList.add('hidden');
    el.notificationTarget.value = 'all';
  } catch (error) {
    showNotification('Failed to send notification: ' + error.message, true);
  } finally {
    el.loading.style.display = 'none';
    el.sendNotificationBtn.disabled = false;
  }
}

async function getPresence(uid) {
  const snap = await get(ref(db, `presence/${uid}`));
  return snap.exists();
}

async function renderUsers() {
  el.usersList.innerHTML = '';
  if (allUsers.length === 0) {
    el.usersList.innerHTML = '<p class="text-center text-gray-500 py-8">No users found.</p>';
    return;
  }

  for (const user of allUsers) {
    const isOnline = await getPresence(user.uid);
    const isBlocked = user.blocked || false;
    const card = document.createElement('div');
    card.className = `request-card p-4 rounded-lg shadow ${isBlocked ? 'rejected' : ''}`;
    card.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 class="text-md font-semibold text-gray-800">User: ${user.email || 'Unknown'}</h4>
          <p class="text-sm text-gray-600 mt-1">UID: ${user.uid}</p>
          <p class="text-sm text-gray-600 mt-1">Balance: ${user.balance?.toFixed(2) || 0} FT</p>
          <p class="text-sm text-gray-600 mt-1">Online: ${isOnline ? 'Yes' : 'No'}</p>
          <p class="text-sm text-gray-600 mt-1">Blocked: ${isBlocked ? 'Yes' : 'No'}</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="audit-btn px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors" data-uid="${user.uid}">
            Audit Balance
          </button>
          <button class="${isBlocked ? 'unblock-btn' : 'block-btn'} px-3 py-1 bg-${isBlocked ? 'green' : 'red'}-600 text-white rounded-lg text-sm hover:bg-${isBlocked ? 'green' : 'red'}-700 transition-colors" data-uid="${user.uid}">
            ${isBlocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      </div>
    `;
    el.usersList.appendChild(card);
  }
}

function renderMultiples(multiples) {
  el.multiplesList.innerHTML = '';
  if (multiples.length === 0) {
    el.multiplesList.innerHTML = '<p class="text-center text-gray-500 py-8">No multiple accounts detected.</p>';
    return;
  }

  multiples.forEach(group => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'p-4 rounded-lg shadow bg-yellow-50 border-l-4 border-yellow-400';
    groupDiv.innerHTML = `<h4 class="text-md font-semibold text-gray-800">Group with IP: ${group[0].ip || 'Unknown'}</h4>`;
    group.forEach(user => {
      groupDiv.innerHTML += `
        <p class="text-sm text-gray-600"> - ${user.email || 'Unknown'} (UID: ${user.uid}, Balance: ${user.balance?.toFixed(2) || 0})</p>
      `;
    });
    el.multiplesList.appendChild(groupDiv);
  });
}

function renderSuspicious(suspicious) {
  el.suspiciousList.innerHTML = '';
  if (suspicious.length === 0) {
    el.suspiciousList.innerHTML = '<p class="text-center text-green-500 py-8">No suspicious users found.</p>';
    return;
  }

  suspicious.forEach(user => {
    const card = document.createElement('div');
    card.className = 'request-card p-4 rounded-lg shadow rejected';
    card.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 class="text-md font-semibold text-gray-800">User: ${user.email || 'Unknown'}</h4>
          <p class="text-sm text-gray-600 mt-1">UID: ${user.uid}</p>
          <p class="text-sm text-gray-600 mt-1">Current Balance: ${user.current.toFixed(2)} FT</p>
          <p class="text-sm text-gray-600 mt-1">Expected Balance: ${user.expected.toFixed(2)} FT</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="block-btn px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors" data-uid="${user.uid}">
            Block
          </button>
        </div>
      </div>
    `;
    el.suspiciousList.appendChild(card);
  });
}

async function auditUser(uid) {
  try {
    const transRef = ref(db, `users/${uid}/transactions`);
    const snap = await get(transRef);
    let transactions = [];
    if (snap.exists()) {
      transactions = Object.values(snap.val());
    }
    let expected = 0;
    const creditTypes = ['deposit', 'earn', 'bonus', 'referral'];
    transactions.forEach(t => {
      if (creditTypes.includes(t.type)) {
        expected += t.amount;
      } else if (t.type === 'withdrawal') {
        expected -= t.amount;
      }
    });
    const user = allUsers.find(u => u.uid === uid);
    const current = user.balance || 0;
    const isSuspicious = Math.abs(expected - current) > 0.01;
    showNotification(
      `User ${uid}: ${isSuspicious ? `Suspicious: Expected ${expected.toFixed(2)}, Current ${current.toFixed(2)}` : 'Balance OK'}`,
      isSuspicious
    );
  } catch (error) {
    showNotification('Audit failed: ' + error.message, true);
  }
}

async function blockUser(uid, block = true) {
  try {
    await update(ref(db, `users/${uid}`), { blocked: block });
    showNotification(`User ${block ? 'blocked' : 'unblocked'}`);
    const user = allUsers.find(u => u.uid === uid);
    if (user) user.blocked = block;
    renderUsers();
  } catch (e) {
    showNotification('Operation failed: ' + e.message, true);
  }
}

async function scanCheaters() {
  el.loading.style.display = 'flex';
  const suspicious = [];
  for (const user of allUsers) {
    const transRef = ref(db, `users/${user.uid}/transactions`);
    const snap = await get(transRef);
    let transactions = [];
    if (snap.exists()) {
      transactions = Object.values(snap.val());
    }
    let expected = 0;
    const creditTypes = ['deposit', 'earn', 'bonus', 'referral'];
    transactions.forEach(t => {
      if (creditTypes.includes(t.type)) {
        expected += t.amount;
      } else if (t.type === 'withdrawal') {
        expected -= t.amount;
      }
    });
    const current = user.balance || 0;
    if (Math.abs(expected - current) > 0.01) {
      suspicious.push({ ...user, expected, current });
    }
  }
  el.loading.style.display = 'none';
  renderSuspicious(suspicious);
}

function updateOnlineCount() {
  const presenceRef = ref(db, 'presence');
  onValue(presenceRef, snap => {
    el.onlineUsers.textContent = snap.numChildren();
  });
}

function fetchRequests() {
  const withdrawalsRef = ref(db, 'VIPFarmToken/withdrawals');
  onValue(withdrawalsRef, async snapshot => {
    allRequests = [];
    const data = snapshot.val();
    if (data) {
      Object.entries(data).forEach(([id, req]) => {
        allRequests.push({ id, ...req });
      });
    }
    updateStats();
    await renderRequests();
    el.loading.style.display = 'none';
  }, error => {
    console.error('Withdrawal fetch error:', error);
    showNotification('Failed to load withdrawal requests: ' + error.message, true);
    el.loading.style.display = 'none';
  });
}

function fetchUsers() {
  const usersRef = ref(db, 'users');
  onValue(usersRef, async snapshot => {
    allUsers = [];
    const data = snapshot.val();
    if (data) {
      Object.entries(data).forEach(([uid, user]) => {
        allUsers.push({ uid, ...user });
      });
    }
    await renderUsers();

    // Compute multiples
    const multipleAccounts = new Map();
    allUsers.forEach(user => {
      const ip = user.ip || 'unknown';
      if (!multipleAccounts.has(ip)) multipleAccounts.set(ip, []);
      multipleAccounts.get(ip).push(user);
    });
    const multiples = Array.from(multipleAccounts.values()).filter(group => group.length > 1);
    renderMultiples(multiples);
  });
}

function setupEventListeners() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderRequests();
    });
  });

  el.refreshBtn.addEventListener('click', () => {
    el.loading.style.display = 'flex';
    fetchRequests();
  });

  document.addEventListener('click', e => {
    if (e.target.classList.contains('approve-btn')) {
      const id = e.target.dataset.id;
      approveWithdrawal(id);
    } else if (e.target.classList.contains('reject-btn')) {
      const id = e.target.dataset.id;
      rejectWithdrawal(id);
    } else if (e.target.classList.contains('audit-btn')) {
      const uid = e.target.dataset.uid;
      auditUser(uid);
    } else if (e.target.classList.contains('block-btn')) {
      const uid = e.target.dataset.uid;
      blockUser(uid, true);
    } else if (e.target.classList.contains('unblock-btn')) {
      const uid = e.target.dataset.uid;
      blockUser(uid, false);
    }
  });

  el.notificationForm.addEventListener('submit', sendNotification);

  el.notificationTarget.addEventListener('change', () => {
    if (el.notificationTarget.value === 'specific') {
      el.specificTargetInput.classList.remove('hidden');
    } else {
      el.specificTargetInput.classList.add('hidden');
    }
  });

  el.scanCheatersBtn.addEventListener('click', scanCheaters);
}

onAuthStateChanged(auth, async user => {
  if (user) {
    console.log('User logged in:', user.uid);
    const isAdmin = await checkAdminStatus(user.uid);
    console.log('Is Admin:', isAdmin);
    
    if (!isAdmin) {
      showNotification('Access denied. Admin privileges required.', true);
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
      return;
    }
    
    fetchRequests();
    fetchUsers();
    updateOnlineCount();
    setupEventListeners();
  } else {
    console.log('No user logged in');
    window.location.href = 'login.html';
  }
});

window.addEventListener('load', () => {
  setTimeout(() => {
    if (el.loading.style.display !== 'none') {
      el.loading.style.display = 'none';
    }
  }, 1000);
});