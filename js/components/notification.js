// ===== DAILY NOTIFICATION REMINDER =====
// Reminds user to add hisaab at end of day

const NotificationReminder = {
  STORAGE_KEY: 'hisaab_notification_settings',

  init() {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return;
    }
    const settings = this.getSettings();
    if (settings.enabled && this.isPermissionGranted()) {
      this._scheduleReminder();
    }
  },

  /**
   * Check if notification permission is granted
   */
  isPermissionGranted() {
    return Notification.permission === 'granted';
  },

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      Toast.error('Is browser mein notifications support nahi hai');
      return false;
    }

    const result = await Notification.requestPermission();
    if (result === 'granted') {
      Toast.success('Notifications ON! Ab roz yaad dilayenge 🔔');
      this._scheduleReminder();
      return true;
    } else {
      Toast.warning('Notification permission nahi di');
      return false;
    }
  },

  /**
   * Get notification settings
   */
  getSettings() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch(e) { /* ignore */ }
    }
    return {
      enabled: false,
      time: '21:00', // 9 PM default
    };
  },

  /**
   * Save notification settings
   */
  saveSettings(settings) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    if (settings.enabled) {
      this._scheduleReminder();
    } else {
      this._cancelReminder();
    }
  },

  /**
   * Enable daily reminder
   */
  async enable(time = '21:00') {
    const hasPermission = this.isPermissionGranted() || await this.requestPermission();
    if (!hasPermission) return false;

    this.saveSettings({ enabled: true, time });
    return true;
  },

  /**
   * Disable daily reminder
   */
  disable() {
    this.saveSettings({ enabled: false, time: '21:00' });
    Toast.info('Reminder OFF kar diya');
  },

  /**
   * Toggle reminder
   */
  async toggle() {
    const settings = this.getSettings();
    if (settings.enabled) {
      this.disable();
      return false;
    } else {
      return await this.enable(settings.time);
    }
  },

  /**
   * Schedule the daily reminder using setTimeout
   * (In production you'd use Service Worker + Push API, but for offline PWA this works)
   */
  _scheduleReminder() {
    const settings = this.getSettings();
    if (!settings.enabled) return;

    const now = new Date();
    const [hours, minutes] = settings.time.split(':').map(Number);
    
    let target = new Date();
    target.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    const delay = target - now;

    // Clear any existing timer
    this._cancelReminder();

    // Set timer
    this._timerId = setTimeout(async () => {
      await this._showNotification();
      // Reschedule for next day
      this._scheduleReminder();
    }, delay);

    console.log(`Reminder scheduled for ${target.toLocaleTimeString()} (in ${Math.round(delay / 60000)} min)`);
  },

  _cancelReminder() {
    if (this._timerId) {
      clearTimeout(this._timerId);
      this._timerId = null;
    }
  },

  /**
   * Show the notification
   */
  async _showNotification() {
    if (!this.isPermissionGranted()) return;

    // Get today's total
    try {
      const today = Utils.today();
      const expenses = await HisaabDB.getExpensesByDate(today);
      const total = Utils.sum(expenses, 'amount');
      const count = expenses.length;

      let body;
      if (count === 0) {
        body = 'Aaj ka hisaab add nahi kiya! Abhi add karo 📝';
      } else {
        body = `Aaj ${count} items, ₹${total.toLocaleString('en-IN')} kharcha. Kuch aur add karna hai?`;
      }

      new Notification('📒 Hisaab Reminder', {
        body,
        icon: 'icons/icon-192.png',
        badge: 'icons/icon-192.png',
        tag: 'daily-reminder',
        renotify: true,
        vibrate: [200, 100, 200]
      });
    } catch(e) {
      new Notification('📒 Hisaab Reminder', {
        body: 'Aaj ka hisaab add karo!',
        icon: 'icons/icon-192.png',
        tag: 'daily-reminder'
      });
    }
  },

  /**
   * Send a test notification
   */
  async sendTest() {
    const hasPermission = this.isPermissionGranted() || await this.requestPermission();
    if (!hasPermission) return;

    new Notification('📒 Hisaab Test', {
      body: 'Ye test notification hai! Agar ye dikh raha hai toh reminder kaam karega 🎉',
      icon: 'icons/icon-192.png',
      tag: 'test'
    });

    Toast.success('Test notification bhej di! 🔔');
  }
};
