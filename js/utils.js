// ===== UTILITY FUNCTIONS =====

const Utils = {
  // ===== DATE HELPERS =====
  
  /**
   * Get today's date in YYYY-MM-DD format
   */
  today() {
    return new Date().toISOString().split('T')[0];
  },

  /**
   * Get current time in HH:MM format
   */
  now() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  },

  /**
   * Format date to display string
   * @param {string} dateStr - YYYY-MM-DD
   * @param {string} format - 'short', 'long', 'relative'
   */
  formatDate(dateStr, format = 'short') {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format === 'relative') {
      if (dateStr === this.today()) return 'Aaj';
      const yDate = yesterday.toISOString().split('T')[0];
      if (dateStr === yDate) return 'Kal';
      
      const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
      if (diffDays > 0 && diffDays <= 7) return `${diffDays} din pehle`;
    }

    if (format === 'short') {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    if (format === 'long') {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    if (format === 'day') {
      return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    }

    if (format === 'month') {
      return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }

    return dateStr;
  },

  /**
   * Format time string for display
   */
  formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  },

  /**
   * Get start and end dates for a period
   */
  getDateRange(period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = this.today();

    switch (period) {
      case 'week': {
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        return { start: start.toISOString().split('T')[0], end };
      }
      case 'month': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: start.toISOString().split('T')[0], end };
      }
      case 'last-month': {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endLM = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start: start.toISOString().split('T')[0], end: endLM.toISOString().split('T')[0] };
      }
      case 'last-week': {
        const endLW = new Date(today);
        endLW.setDate(endLW.getDate() - 7);
        const startLW = new Date(endLW);
        startLW.setDate(startLW.getDate() - 6);
        return { start: startLW.toISOString().split('T')[0], end: endLW.toISOString().split('T')[0] };
      }
      default:
        return { start: end, end };
    }
  },

  /**
   * Get all dates between start and end (inclusive)
   */
  getDatesBetween(startStr, endStr) {
    const dates = [];
    const current = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  },

  /**
   * Get month name and year for a date
   */
  getMonthYear(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return {
      month: date.getMonth(),
      year: date.getFullYear(),
      label: date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    };
  },

  // ===== CURRENCY HELPERS =====
  
  /**
   * Format amount as Indian Rupee
   */
  formatAmount(amount) {
    if (amount === null || amount === undefined) return '₹0';
    const num = parseFloat(amount);
    if (isNaN(num)) return '₹0';
    
    // Indian number system formatting
    if (num >= 10000000) {
      return '₹' + (num / 10000000).toFixed(1) + 'Cr';
    }
    if (num >= 100000) {
      return '₹' + (num / 100000).toFixed(1) + 'L';
    }
    
    return '₹' + num.toLocaleString('en-IN', { 
      minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
      maximumFractionDigits: 2 
    });
  },

  /**
   * Format amount without ₹ symbol (for inputs)
   */
  formatNumber(amount) {
    if (!amount) return '0';
    return parseFloat(amount).toLocaleString('en-IN');
  },

  // ===== ID HELPERS =====
  
  /**
   * Generate a unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  // ===== DOM HELPERS =====
  
  $(selector) {
    return document.querySelector(selector);
  },

  $$(selector) {
    return document.querySelectorAll(selector);
  },

  /**
   * Create element with attributes and children
   */
  createElement(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.substring(2).toLowerCase(), value);
      } else if (key === 'dataset') {
        for (const [dk, dv] of Object.entries(value)) {
          el.dataset[dk] = dv;
        }
      } else if (key === 'innerHTML') {
        el.innerHTML = value;
      } else {
        el.setAttribute(key, value);
      }
    }
    for (const child of children) {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        el.appendChild(child);
      }
    }
    return el;
  },

  // ===== DEBOUNCE =====
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  // ===== ARRAY HELPERS =====
  
  /**
   * Group array of objects by a key
   */
  groupBy(arr, key) {
    return arr.reduce((groups, item) => {
      const val = item[key];
      groups[val] = groups[val] || [];
      groups[val].push(item);
      return groups;
    }, {});
  },

  /**
   * Sum values in array
   */
  sum(arr, key) {
    return arr.reduce((total, item) => total + (parseFloat(item[key]) || 0), 0);
  },

  // ===== WHATSAPP SHARE =====
  
  /**
   * Generate WhatsApp share link with summary text
   */
  shareOnWhatsApp(text) {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  },

  /**
   * Generate a daily summary text for WhatsApp sharing
   */
  generateDailySummary(expenses, date) {
    if (!expenses || expenses.length === 0) {
      return `📒 *Hisaab - ${this.formatDate(date, 'long')}*\n\nAaj koi kharcha nahi hua! 🎉`;
    }

    const total = this.sum(expenses, 'amount');
    let text = `📒 *Hisaab - ${this.formatDate(date, 'long')}*\n`;
    text += `━━━━━━━━━━━━━━━\n`;
    
    expenses.forEach((exp, i) => {
      const cat = CATEGORIES.find(c => c.id === exp.category);
      const emoji = cat ? cat.emoji : '📦';
      text += `${emoji} ${exp.name} — ₹${exp.amount}`;
      if (exp.note) text += ` _(${exp.note})_`;
      text += `\n`;
    });

    text += `━━━━━━━━━━━━━━━\n`;
    text += `💰 *Total: ₹${total.toLocaleString('en-IN')}*\n`;
    text += `📊 Items: ${expenses.length}\n`;
    text += `\n_Hisaab App se bheja gaya_ 📱`;

    return text;
  },

  /**
   * Generate weekly summary for WhatsApp sharing
   */
  generateWeeklySummary(expensesByDate, startDate, endDate) {
    let totalAmount = 0;
    let totalItems = 0;

    let text = `📒 *Hisaab - Weekly Report*\n`;
    text += `📅 ${this.formatDate(startDate, 'short')} - ${this.formatDate(endDate, 'short')}\n`;
    text += `━━━━━━━━━━━━━━━\n`;

    for (const [date, expenses] of Object.entries(expensesByDate)) {
      const dayTotal = this.sum(expenses, 'amount');
      totalAmount += dayTotal;
      totalItems += expenses.length;
      text += `${this.formatDate(date, 'day')}: ₹${dayTotal.toLocaleString('en-IN')} (${expenses.length} items)\n`;
    }

    text += `━━━━━━━━━━━━━━━\n`;
    text += `💰 *Total: ₹${totalAmount.toLocaleString('en-IN')}*\n`;
    text += `📊 Items: ${totalItems}\n`;
    text += `📈 Avg/day: ₹${Math.round(totalAmount / 7).toLocaleString('en-IN')}\n`;
    text += `\n_Hisaab App se bheja gaya_ 📱`;

    return text;
  },

  // ===== CSV EXPORT =====
  
  /**
   * Convert expenses to CSV string
   */
  toCSV(expenses) {
    const headers = ['Date', 'Time', 'Name', 'Amount (₹)', 'Category', 'Added By', 'Note'];
    const rows = expenses.map(e => [
      e.date,
      e.time || '',
      `"${(e.name || '').replace(/"/g, '""')}"`,
      e.amount,
      e.category || '',
      e.addedBy || '',
      `"${(e.note || '').replace(/"/g, '""')}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },

  /**
   * Download file
   */
  downloadFile(content, filename, type = 'text/csv') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};

// ===== CATEGORIES =====
const CATEGORIES = [
  { id: 'dairy',     name: 'Dairy',      nameHi: 'Dairy',      emoji: '🥛', color: '#00E5A0' },
  { id: 'grocery',   name: 'Sabzi',      nameHi: 'Sabzi',      emoji: '🥬', color: '#4CAF50' },
  { id: 'ration',    name: 'Ration',     nameHi: 'Ration',     emoji: '🍞', color: '#FFB547' },
  { id: 'household', name: 'Household',  nameHi: 'Ghar',       emoji: '🧹', color: '#2196F3' },
  { id: 'bills',     name: 'Bills',      nameHi: 'Bills',      emoji: '⚡', color: '#FFEB3B' },
  { id: 'medical',   name: 'Medical',    nameHi: 'Dawai',      emoji: '💊', color: '#FF6B6B' },
  { id: 'transport', name: 'Transport',  nameHi: 'Sawari',     emoji: '🚗', color: '#A78BFA' },
  { id: 'education', name: 'Education',  nameHi: 'Padhai',     emoji: '📚', color: '#00BCD4' },
  { id: 'other',     name: 'Other',      nameHi: 'Aur',        emoji: '📦', color: '#8B8BA3' }
];

// Default emojis for profile creation
const PROFILE_EMOJIS = ['👩', '👨', '👧', '👦', '🧑', '👴', '👵', '🧔', '👩‍🦱', '👨‍🦱'];

// Freeze constants
Object.freeze(CATEGORIES);
Object.freeze(PROFILE_EMOJIS);
