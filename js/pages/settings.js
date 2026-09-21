// ===== SETTINGS PAGE =====

const SettingsPage = {
  unsubscribe: null,

  async render() {
    const profiles = await HisaabDB.getAllProfiles();
    const settings = Store.get('settings');
    const budgets = await HisaabDB.getAllBudgets();
    const dailyBudget = budgets.find(b => b.type === 'daily');
    const monthlyBudget = budgets.find(b => b.type === 'monthly');
    const expenseCount = await HisaabDB.getExpenseCount();
    const notifSettings = typeof NotificationReminder !== 'undefined' ? NotificationReminder.getSettings() : { enabled: false, time: '21:00' };

    const div = document.createElement('div');
    div.className = 'page-settings';
    div.innerHTML = `
      <!-- PROFILES SECTION -->
      <div class="settings-section">
        <h3 class="settings-section__title">👨‍👩‍👧‍👦 Family Profiles</h3>
        <div id="settings-profiles">
          ${profiles.map(p => `
            <div class="profile-card">
              <div class="avatar avatar--lg">${p.emoji}</div>
              <div class="profile-card__info">
                <div class="profile-card__name">${p.name}</div>
                <div class="profile-card__status">Member</div>
              </div>
              <button class="icon-btn" onclick="SettingsPage.deleteProfile('${p.id}', '${p.name}')" aria-label="Delete profile">
                <svg class="icon-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          `).join('')}
          <button class="add-profile-btn" onclick="SettingsPage.addProfile()">
            <span>➕</span>
            <span>Naya member add karo</span>
          </button>
        </div>
      </div>

      <!-- NOTIFICATION REMINDER SECTION -->
      <div class="settings-section">
        <h3 class="settings-section__title">🔔 Daily Reminder</h3>
        <div class="settings-list" style="background: var(--bg-secondary); border-radius: var(--radius-lg); padding: var(--space-base); border: 1px solid var(--border-subtle);">
          <div class="settings-item" style="padding-top:0;">
            <div class="settings-item__left">
              <div class="settings-item__icon" style="background: var(--accent-secondary-dim);">⏰</div>
              <div class="settings-item__text">
                <div class="settings-item__title">Roz yaad dilao</div>
                <div class="settings-item__subtitle">Raat ko hisaab likhne ka notification</div>
              </div>
            </div>
            <label class="toggle">
              <input type="checkbox" class="toggle__input" id="toggle-reminder" ${notifSettings.enabled ? 'checked' : ''} onchange="SettingsPage.toggleReminder(this.checked)">
              <span class="toggle__slider"></span>
            </label>
          </div>

          <div id="reminder-time-container" style="display: ${notifSettings.enabled ? 'flex' : 'none'}; align-items: center; justify-content: space-between; padding-top: var(--space-md); border-top: 1px solid var(--border-subtle); margin-top: var(--space-sm);">
            <label class="form-label" style="margin:0;">Kitne baje?</label>
            <input type="time" id="reminder-time" class="form-input" style="width: 130px; text-align:center;" value="${notifSettings.time || '21:00'}" onchange="SettingsPage.updateReminderTime(this.value)">
          </div>

          <button class="btn btn--secondary btn--sm btn--full" style="margin-top: var(--space-md);" onclick="NotificationReminder.sendTest()">
            Test Reminder Bhejo 🔔
          </button>
        </div>
      </div>

      <!-- PREFERENCES SECTION -->
      <div class="settings-section">
        <h3 class="settings-section__title">⚙️ Preferences</h3>
        <div class="settings-list" style="background: var(--bg-secondary); border-radius: var(--radius-lg); padding: 0 var(--space-base); border: 1px solid var(--border-subtle);">
          <div class="settings-item">
            <div class="settings-item__left">
              <div class="settings-item__icon" style="background: var(--accent-primary-dim);">📂</div>
              <div class="settings-item__text">
                <div class="settings-item__title">Categories dikhaao</div>
                <div class="settings-item__subtitle">Expense add karte waqt category pick karo</div>
              </div>
            </div>
            <label class="toggle">
              <input type="checkbox" class="toggle__input" id="toggle-categories" ${settings.categoriesEnabled ? 'checked' : ''} onchange="SettingsPage.toggleCategories(this.checked)">
              <span class="toggle__slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- BUDGET SECTION -->
      <div class="settings-section">
        <h3 class="settings-section__title">💰 Budget Limit</h3>
        <div class="settings-list" style="background: var(--bg-secondary); border-radius: var(--radius-lg); padding: var(--space-base); border: 1px solid var(--border-subtle);">
          <div class="form-group" style="margin-bottom: var(--space-md);">
            <label class="form-label" for="daily-budget">Daily Budget (₹)</label>
            <input type="number" id="daily-budget" class="form-input" placeholder="e.g. 500" value="${dailyBudget ? dailyBudget.amount : ''}" inputmode="numeric">
          </div>
          <div class="form-group" style="margin-bottom: var(--space-md);">
            <label class="form-label" for="monthly-budget">Monthly Budget (₹)</label>
            <input type="number" id="monthly-budget" class="form-input" placeholder="e.g. 15000" value="${monthlyBudget ? monthlyBudget.amount : ''}" inputmode="numeric">
          </div>
          <button class="btn btn--primary btn--sm btn--full" onclick="SettingsPage.saveBudget()">
            Budget Save Karo 💾
          </button>
        </div>
      </div>

      <!-- DATA MANAGEMENT SECTION -->
      <div class="settings-section">
        <h3 class="settings-section__title">📦 Data Management & Sync</h3>
        <div class="settings-list" style="background: var(--bg-secondary); border-radius: var(--radius-lg); padding: 0 var(--space-base); border: 1px solid var(--border-subtle);">
          
          <div class="settings-item" style="cursor:pointer;" onclick="QRSync.showExportQR()">
            <div class="settings-item__left">
              <div class="settings-item__icon" style="background: rgba(167, 139, 250, 0.15);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-tertiary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h4v4h-4z"/></svg>
              </div>
              <div class="settings-item__text">
                <div class="settings-item__title">QR Code Share (Export)</div>
                <div class="settings-item__subtitle">Doosre phone pe scan karke data bhejo</div>
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>

          <div class="settings-item" style="cursor:pointer;" onclick="QRSync.showImportModal()">
            <div class="settings-item__left">
              <div class="settings-item__icon" style="background: var(--accent-tertiary-dim);">📥</div>
              <div class="settings-item__text">
                <div class="settings-item__title">QR Code Data Import</div>
                <div class="settings-item__subtitle">Doosre phone ka QR data yahan paste karo</div>
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>

          <div class="settings-item" style="cursor:pointer;" onclick="SettingsPage.exportCSV()">
            <div class="settings-item__left">
              <div class="settings-item__icon" style="background: rgba(76, 175, 80, 0.15);">📄</div>
              <div class="settings-item__text">
                <div class="settings-item__title">Export CSV</div>
                <div class="settings-item__subtitle">Excel mein kholne ke liye download karo</div>
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>

          <div class="settings-item" style="cursor:pointer;" onclick="SettingsPage.exportJSON()">
            <div class="settings-item__left">
              <div class="settings-item__icon" style="background: rgba(33, 150, 243, 0.15);">💾</div>
              <div class="settings-item__text">
                <div class="settings-item__title">Backup (JSON)</div>
                <div class="settings-item__subtitle">Saara data backup karo (${expenseCount} expenses)</div>
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>

          <div class="settings-item" style="cursor:pointer;" onclick="SettingsPage.importData()">
            <div class="settings-item__left">
              <div class="settings-item__icon" style="background: var(--accent-tertiary-dim);">📁</div>
              <div class="settings-item__text">
                <div class="settings-item__title">Import File (JSON)</div>
                <div class="settings-item__subtitle">Backup file se data restore karo</div>
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>

          <div class="settings-item" style="cursor:pointer;" onclick="SettingsPage.clearAllData()">
            <div class="settings-item__left">
              <div class="settings-item__icon" style="background: var(--danger-dim);">🗑️</div>
              <div class="settings-item__text">
                <div class="settings-item__title" style="color: var(--danger);">Saara Data Delete Karo</div>
                <div class="settings-item__subtitle">⚠️ Ye wapas nahi aa sakta!</div>
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>
      </div>

      <!-- Hidden file input for import -->
      <input type="file" id="import-file-input" accept=".json" style="display:none" onchange="SettingsPage._handleImport(event)">

      <!-- ABOUT SECTION -->
      <div class="settings-section">
        <div style="text-align:center; padding: var(--space-xl); color: var(--text-tertiary); font-size: var(--fs-sm);">
          <div style="font-size: var(--fs-2xl); margin-bottom: var(--space-sm);">📒</div>
          <div style="font-weight: var(--fw-semibold); color: var(--text-secondary);">Hisaab v1.0</div>
          <div>Family Kharcha Tracker</div>
          <div style="margin-top: var(--space-xs);">Made with ❤️ for families</div>
        </div>
      </div>
    `;

    return div;
  },

  mount() {
    this.unsubscribe = Store.on('profiles:changed', () => this._refresh());
  },

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
  },

  // ===== PROFILE ACTIONS =====

  async addProfile() {
    const name = prompt('Family member ka naam likho:');
    if (!name || !name.trim()) return;

    const emojiIndex = Math.floor(Math.random() * PROFILE_EMOJIS.length);
    const emoji = PROFILE_EMOJIS[emojiIndex];

    try {
      await HisaabDB.addProfile({ name: name.trim(), emoji });
      Store.emit('profiles:changed');
      Toast.success(`${name} add ho gaya! ${emoji}`);
      this._refresh();
    } catch(e) {
      Toast.error('Profile add nahi ho paya 😔');
    }
  },

  async deleteProfile(id, name) {
    ConfirmDialog.show({
      emoji: '👤',
      title: `${name} ko remove karna hai?`,
      message: 'Profile remove hoga but uske kharchas delete nahi honge.',
      confirmText: 'Haan, Remove Karo',
      cancelText: 'Nahi',
      onConfirm: async () => {
        try {
          await HisaabDB.deleteProfile(id);
          Store.emit('profiles:changed');
          Toast.success(`${name} remove ho gaya!`);
          this._refresh();
        } catch(e) {
          Toast.error('Remove nahi ho paya 😔');
        }
      }
    });
  },

  // ===== SETTINGS ACTIONS =====

  toggleCategories(enabled) {
    Store.updateSettings({ categoriesEnabled: enabled });
    Toast.info(enabled ? 'Categories ON 📂' : 'Categories OFF');
  },

  async toggleReminder(enabled) {
    if (enabled) {
      const time = document.getElementById('reminder-time')?.value || '21:00';
      const ok = await NotificationReminder.enable(time);
      if (!ok) {
        const toggleEl = document.getElementById('toggle-reminder');
        if (toggleEl) toggleEl.checked = false;
        return;
      }
      const container = document.getElementById('reminder-time-container');
      if (container) container.style.display = 'flex';
    } else {
      NotificationReminder.disable();
      const container = document.getElementById('reminder-time-container');
      if (container) container.style.display = 'none';
    }
  },

  updateReminderTime(time) {
    if (!time) return;
    const settings = NotificationReminder.getSettings();
    settings.time = time;
    NotificationReminder.saveSettings(settings);
    Toast.success(`Reminder time set: ${time} ⏰`);
  },

  async saveBudget() {
    const dailyVal = document.getElementById('daily-budget').value;
    const monthlyVal = document.getElementById('monthly-budget').value;

    try {
      if (dailyVal) {
        await HisaabDB.saveBudget({ type: 'daily', amount: parseFloat(dailyVal), isActive: true });
      }
      if (monthlyVal) {
        await HisaabDB.saveBudget({ type: 'monthly', amount: parseFloat(monthlyVal), isActive: true });
      }
      Toast.success('Budget save ho gaya! 💰');
    } catch(e) {
      Toast.error('Budget save nahi ho paya 😔');
    }
  },

  // ===== DATA ACTIONS =====

  async exportCSV() {
    try {
      const expenses = await HisaabDB.getAllExpenses();
      if (expenses.length === 0) {
        Toast.warning('Koi data nahi hai export karne ke liye!');
        return;
      }
      const csv = Utils.toCSV(expenses);
      const date = Utils.today();
      Utils.downloadFile(csv, `hisaab_${date}.csv`, 'text/csv');
      Toast.success(`CSV download ho gaya! (${expenses.length} items) 📄`);
    } catch(e) {
      Toast.error('Export nahi ho paya 😔');
    }
  },

  async exportJSON() {
    try {
      const data = await HisaabDB.exportData();
      const json = JSON.stringify(data, null, 2);
      const date = Utils.today();
      Utils.downloadFile(json, `hisaab_backup_${date}.json`, 'application/json');
      Toast.success('Backup download ho gaya! 💾');
    } catch(e) {
      Toast.error('Backup nahi ho paya 😔');
    }
  },

  importData() {
    document.getElementById('import-file-input').click();
  },

  async _handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await HisaabDB.importData(text);
      Store.emit('expense:changed');
      Store.emit('profiles:changed');
      Toast.success(`Import done! ${result.expenses} expenses, ${result.profiles} profiles 📥`);
      this._refresh();
    } catch(e) {
      Toast.error('Import fail ho gaya! File check karo. 😔');
    }

    // Reset file input
    event.target.value = '';
  },

  async clearAllData() {
    ConfirmDialog.show({
      emoji: '⚠️',
      title: 'Saara data delete karna hai?',
      message: 'Ye action undo nahi ho sakta! Pehle backup le lo.',
      confirmText: '🗑️ Haan, Sab Delete Karo',
      cancelText: 'Ruko, Nahi',
      onConfirm: async () => {
        try {
          await HisaabDB.clearAllData();
          Store.emit('expense:changed');
          Store.emit('profiles:changed');
          Toast.success('Saara data delete ho gaya! 🗑️');
          this._refresh();
        } catch(e) {
          Toast.error('Delete nahi ho paya 😔');
        }
      }
    });
  },

  async _refresh() {
    const container = document.getElementById('page-container');
    if (container && Store.get('currentRoute') === '/settings') {
      const content = await this.render();
      container.innerHTML = '';
      container.appendChild(content);
      this.mount();
    }
  }
};
