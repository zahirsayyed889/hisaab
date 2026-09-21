// ===== HASH-BASED SPA ROUTER =====

const Router = {
  routes: {},
  currentPage: null,
  container: null,

  /**
   * Initialize router
   */
  init() {
    this.container = document.getElementById('page-container');
    
    // Listen for hash changes
    window.addEventListener('hashchange', () => this._handleRoute());
    
    // Handle initial route
    this._handleRoute();
  },

  /**
   * Register a route
   */
  register(path, handler) {
    this.routes[path] = handler;
  },

  /**
   * Navigate to a route
   */
  navigate(path) {
    window.location.hash = path;
  },

  /**
   * Get current route path
   */
  getCurrentRoute() {
    const hash = window.location.hash.slice(1) || '/';
    return hash;
  },

  /**
   * Handle route change
   */
  async _handleRoute() {
    const path = this.getCurrentRoute();
    const handler = this.routes[path] || this.routes['/'];

    if (!handler) {
      console.error(`No handler for route: ${path}`);
      return;
    }

    // Cleanup current page
    if (this.currentPage && this.currentPage.destroy) {
      this.currentPage.destroy();
    }

    // Update nav
    this._updateNav(path);

    // Update store
    Store.set('currentRoute', path);

    // Show/hide FAB
    const fab = document.getElementById('fab-add');
    if (fab) {
      fab.style.display = (path === '/' || path === '/history') ? 'flex' : 'none';
    }

    // Render new page
    this.container.innerHTML = '';
    this.container.className = 'page-content';
    
    try {
      this.currentPage = handler;
      const content = await handler.render();
      if (typeof content === 'string') {
        this.container.innerHTML = content;
      } else if (content instanceof Node) {
        this.container.appendChild(content);
      }

      // Call mount lifecycle
      if (handler.mount) {
        handler.mount();
      }
    } catch(e) {
      console.error('Route render error:', e);
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__emoji">😵</div>
          <h3 class="empty-state__title">Oops! Kuch galat ho gaya</h3>
          <p class="empty-state__subtitle">Page load nahi ho paya. Please try again.</p>
        </div>
      `;
    }
  },

  /**
   * Update bottom nav active state
   */
  _updateNav(path) {
    const items = document.querySelectorAll('.bottom-nav__item');
    items.forEach(item => {
      const route = item.dataset.route;
      item.classList.toggle('bottom-nav__item--active', route === path);
    });

    // Update header title based on route
    const titleMap = {
      '/': '📒 Hisaab',
      '/analytics': '📊 Reports',
      '/history': '📜 History',
      '/settings': '⚙️ Settings',
      '/search': '🔍 Search'
    };

    const header = document.querySelector('.app-header__title');
    if (header) {
      const emoji = titleMap[path] || '📒 Hisaab';
      const parts = emoji.split(' ');
      header.innerHTML = `<span class="logo-emoji">${parts[0]}</span><span>${parts.slice(1).join(' ')}</span>`;
    }
  }
};
