// ===== HISAAB APP — Main Entry Point =====

const App = {
  async init() {
    try {
      // 1. Initialize database
      await HisaabDB.init();
      console.log('✅ Database initialized');

      // 2. Initialize store
      Store.init();
      console.log('✅ Store initialized');

      // 3. Initialize components
      Toast.init();
      AddModal.init();
      if (typeof VoiceInput !== 'undefined') VoiceInput.init();
      if (typeof NotificationReminder !== 'undefined') NotificationReminder.init();
      console.log('✅ Components initialized');

      // 4. Register routes
      Router.register('/', HomePage);
      Router.register('/analytics', AnalyticsPage);
      Router.register('/history', HistoryPage);
      Router.register('/search', SearchPage);
      Router.register('/settings', SettingsPage);

      // 5. Setup bottom nav
      this._setupBottomNav();

      // 6. Setup search button
      this._setupSearchButton();

      // 7. Initialize router (renders first page)
      Router.init();
      console.log('✅ Router initialized');

      console.log('🎉 Hisaab App ready!');
    } catch(e) {
      console.error('❌ App init failed:', e);
      document.getElementById('page-container').innerHTML = `
        <div class="empty-state">
          <div class="empty-state__emoji">😵</div>
          <h3 class="empty-state__title">App start nahi ho paya</h3>
          <p class="empty-state__subtitle">Browser refresh karo ya IndexedDB support check karo.</p>
        </div>
      `;
    }
  },

  _setupBottomNav() {
    const nav = document.getElementById('bottom-nav');
    nav.addEventListener('click', (e) => {
      const item = e.target.closest('.bottom-nav__item');
      if (!item) return;
      
      const route = item.dataset.route;
      if (route) {
        Router.navigate(route);
      }
    });
  },

  _setupSearchButton() {
    const btn = document.getElementById('btn-search');
    if (btn) {
      btn.addEventListener('click', () => {
        Router.navigate('/search');
      });
    }
  }
};

// ===== BOOT =====
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
