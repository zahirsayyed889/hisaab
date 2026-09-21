// ===== REACTIVE STATE MANAGER & EVENT BUS =====

const Store = {
  _state: {
    currentRoute: '/',
    activeProfile: null,
    profiles: [],
    settings: {
      categoriesEnabled: true,
      budgetEnabled: false
    }
  },

  _listeners: {},

  /**
   * Initialize store from localStorage
   */
  init() {
    // Load settings from localStorage
    const saved = localStorage.getItem('hisaab_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this._state.settings = { ...this._state.settings, ...parsed };
      } catch(e) { /* ignore */ }
    }

    // Load active profile
    const activeProfile = localStorage.getItem('hisaab_active_profile');
    if (activeProfile) {
      try {
        this._state.activeProfile = JSON.parse(activeProfile);
      } catch(e) { /* ignore */ }
    }
  },

  /**
   * Get state value
   */
  get(key) {
    return this._state[key];
  },

  /**
   * Set state value and notify listeners
   */
  set(key, value) {
    const old = this._state[key];
    this._state[key] = value;
    this.emit(`state:${key}`, value, old);

    // Persist certain keys
    if (key === 'settings') {
      localStorage.setItem('hisaab_settings', JSON.stringify(value));
    }
    if (key === 'activeProfile') {
      localStorage.setItem('hisaab_active_profile', JSON.stringify(value));
    }
  },

  /**
   * Update settings
   */
  updateSettings(updates) {
    const current = this._state.settings;
    this.set('settings', { ...current, ...updates });
  },

  /**
   * Subscribe to an event
   */
  on(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    };
  },

  /**
   * Emit an event
   */
  emit(event, ...args) {
    const listeners = this._listeners[event];
    if (listeners) {
      listeners.forEach(cb => {
        try { cb(...args); } catch(e) { console.error(`Event handler error [${event}]:`, e); }
      });
    }
  },

  /**
   * Remove all listeners for an event
   */
  off(event) {
    delete this._listeners[event];
  }
};
