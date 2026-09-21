// ===== TOAST NOTIFICATION SYSTEM =====

const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
  },

  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {string} type - 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duration in ms
   */
  show(message, type = 'success', duration = 3000) {
    if (!this.container) this.init();

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">${icons[type] || '📌'}</span>
      <span class="toast__message">${message}</span>
    `;

    this.container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.classList.add('toast--exit');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(message, duration) { this.show(message, 'success', duration); },
  error(message, duration) { this.show(message, 'error', duration); },
  warning(message, duration) { this.show(message, 'warning', duration); },
  info(message, duration) { this.show(message, 'info', duration); }
};
