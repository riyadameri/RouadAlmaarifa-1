// ==============================================
// MAIN JAVASCRIPT - Shared Functions
// ==============================================

// API Configuration
const API_URL = window.location.origin;
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

// Socket.IO Connection
let socket;

// Initialize Socket.IO
function initSocket() {
  socket = io(API_URL, {
    transports: ['websocket', 'polling'],
    path: '/socket.io/'
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('student-detected', (data) => {
    console.log('Student detected:', data);
    showToast(`تم اكتشاف الطالب: ${data.student.name}`, 'info');
  });

  socket.on('unknown-card', (data) => {
    console.log('Unknown card:', data);
    showToast('بطاقة غير معروفة', 'warning');
  });

  socket.on('raw-data', (data) => {
    console.log('Raw RFID data:', data);
    const uidInput = document.getElementById('card-uid');
    if (uidInput) {
      uidInput.value = data.uid;
    }
  });
}

// Toast Notifications
function showToast(message, type = 'info', duration = 3000) {
  const toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `alert alert-${type}`;
  toast.style.marginBottom = '10px';
  toast.style.animation = 'slideIn 0.3s ease';
  toast.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer;">&times;</button>
    </div>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }
  }, duration);
}

// Modal Functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
  }
}

// Format Date
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-EG');
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('ar-EG');
}

// Format Currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0
  }).format(amount);
}

// Get Status Badge
function getStatusBadge(status) {
  const badges = {
    'active': 'badge badge-success',
    'inactive': 'badge badge-danger',
    'pending': 'badge badge-warning',
    'paid': 'badge badge-success',
    'unpaid': 'badge badge-danger',
    'late': 'badge badge-danger',
    'scheduled': 'badge badge-info',
    'ongoing': 'badge badge-primary',
    'completed': 'badge badge-success',
    'cancelled': 'badge badge-danger'
  };

  const labels = {
    'active': 'نشط',
    'inactive': 'غير نشط',
    'pending': 'قيد الانتظار',
    'paid': 'مدفوع',
    'unpaid': 'غير مدفوع',
    'late': 'متأخر',
    'scheduled': 'مجدول',
    'ongoing': 'جاري',
    'completed': 'مكتمل',
    'cancelled': 'ملغي'
  };

  const badgeClass = badges[status] || 'badge badge-secondary';
  const label = labels[status] || status;

  return `<span class="${badgeClass}">${label}</span>`;
}

// API Request Helper
async function apiRequest(endpoint, method = 'GET', data = null) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json'
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const options = {
    method,
    headers,
    credentials: 'include'
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/';
      return null;
    }

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'حدث خطأ في الطلب');
    }

    return result;
  } catch (error) {
    console.error('API Error:', error);
    showToast(error.message, 'danger');
    throw error;
  }
}

// Login
async function login(username, password, role = 'admin') {
  try {
    const result = await apiRequest('/api/auth/login', 'POST', { username, password });
    
    if (result.token) {
      authToken = result.token;
      currentUser = result.user;
      
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      
      showToast('تم تسجيل الدخول بنجاح', 'success');
      
      // Redirect based on role
      if (role === 'student') {
        window.location.href = '/student/dashboard';
      } else if (role === 'teacher') {
        window.location.href = '/teacher';
      } else {
        window.location.href = '/admin';
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Login error:', error);
    showToast('فشل تسجيل الدخول: ' + error.message, 'danger');
    return false;
  }
}

// Logout
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  authToken = null;
  currentUser = {};
  window.location.href = '/';
  showToast('تم تسجيل الخروج بنجاح', 'success');
}

// Check Authentication
function checkAuth(requiredRole = null) {
  if (!authToken) {
    window.location.href = '/';
    return false;
  }

  if (requiredRole && currentUser.role !== requiredRole) {
    window.location.href = '/';
    return false;
  }

  return true;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Add logout button handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  // Update user name in top bar
  const userNameElement = document.getElementById('user-name');
  if (userNameElement && currentUser.fullName) {
    userNameElement.textContent = `مرحباً، ${currentUser.fullName}`;
  }

  const userAvatar = document.getElementById('user-avatar');
  if (userAvatar && currentUser.fullName) {
    userAvatar.textContent = currentUser.fullName.charAt(0);
  }

  // Initialize socket if on admin page
  if (window.location.pathname.includes('admin')) {
    initSocket();
  }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);