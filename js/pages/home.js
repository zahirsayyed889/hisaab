// ===== HOME PAGE — Aaj Ka Hisaab =====

const HomePage = {
  unsubscribe: null,

  async render() {
    const today = Utils.today();
    const expenses = await HisaabDB.getExpensesByDate(today);
    const total = Utils.sum(expenses, 'amount');
    const count = expenses.length;

    // Category breakdown for quick stats
    const categoryTotals = {};
    expenses.forEach(e => {
      const cat = e.category || 'other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
    });
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    const topCatInfo = topCategory ? CATEGORIES.find(c => c.id === topCategory[0]) : null;

    // Budget check
    const dailyBudget = await HisaabDB.getBudget('daily');
    let budgetHtml = '';
    if (dailyBudget && dailyBudget.isActive && dailyBudget.amount > 0) {
      const pct = Math.min((total / dailyBudget.amount) * 100, 100);
      const fillClass = pct >= 90 ? 'budget-progress__fill--danger' : pct >= 70 ? 'budget-progress__fill--warning' : '';
      budgetHtml = `
        <div class="budget-progress">
          <div class="budget-progress__bar">
            <div class="budget-progress__fill ${fillClass}" style="width: ${pct}%"></div>
          </div>
          <div class="budget-progress__text">
            <span>${Utils.formatAmount(total)} / ${Utils.formatAmount(dailyBudget.amount)}</span>
            <span>${Math.round(pct)}% used</span>
          </div>
        </div>
      `;
    }

    const div = document.createElement('div');
    div.className = 'page-home';
    div.innerHTML = `
      <!-- Hero Summary Card -->
      <div class="hero-card">
        <div class="hero-card__label">Aaj Ka Hisaab • ${Utils.formatDate(today, 'day')}</div>
        <div class="hero-card__amount">
          <span class="rupee-sign">₹</span>${total.toLocaleString('en-IN')}
        </div>
        <div class="hero-card__meta">
          <div class="hero-card__stat">
            <span>📦</span>
            <span class="hero-card__stat-value">${count}</span>
            <span>items</span>
          </div>
          ${topCatInfo ? `
          <div class="hero-card__stat">
            <span>${topCatInfo.emoji}</span>
            <span class="hero-card__stat-value">${topCatInfo.name}</span>
            <span>top</span>
          </div>
          ` : ''}
          ${count > 0 ? `
          <div class="hero-card__stat">
            <span>📊</span>
            <span class="hero-card__stat-value">₹${Math.round(total / count)}</span>
            <span>avg</span>
          </div>
          ` : ''}
        </div>
        ${budgetHtml}
      </div>

      <!-- WhatsApp Share Button (only if there are expenses) -->
      ${count > 0 ? `
      <div style="display: flex; gap: var(--space-sm); margin-bottom: var(--space-lg);">
        <button class="whatsapp-btn" onclick="HomePage.shareWhatsApp()" style="flex:1; justify-content: center;">
          <svg class="whatsapp-btn__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp pe bhejo
        </button>
      </div>
      ` : ''}

      <!-- Expense List -->
      <div class="section-header">
        <h2 class="section-title">Items (${count})</h2>
        ${count > 0 ? '<span class="section-action" onclick="Router.navigate(\'/search\')">Search 🔍</span>' : ''}
      </div>
      <div id="home-expense-list">
        ${ExpenseCard.renderList(expenses)}
      </div>
    `;

    return div;
  },

  mount() {
    // Listen for expense changes
    this.unsubscribe = Store.on('expense:changed', () => {
      this._refresh();
    });
  },

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
  },

  async _refresh() {
    const container = document.getElementById('page-container');
    if (container && Store.get('currentRoute') === '/') {
      const content = await this.render();
      container.innerHTML = '';
      container.appendChild(content);
    }
  },

  async shareWhatsApp() {
    const today = Utils.today();
    const expenses = await HisaabDB.getExpensesByDate(today);
    const text = Utils.generateDailySummary(expenses, today);
    Utils.shareOnWhatsApp(text);
  }
};
