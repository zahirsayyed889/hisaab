// ===== ANALYTICS PAGE — Reports & Insights =====

const AnalyticsPage = {
  currentPeriod: 'week',
  unsubscribe: null,

  async render() {
    const div = document.createElement('div');
    div.className = 'page-analytics';
    div.innerHTML = `
      <!-- Period Toggle -->
      <div class="tab-bar" id="analytics-tabs">
        <button class="tab-bar__item ${this.currentPeriod === 'week' ? 'tab-bar__item--active' : ''}" onclick="AnalyticsPage.switchPeriod('week')">Is Hafte</button>
        <button class="tab-bar__item ${this.currentPeriod === 'month' ? 'tab-bar__item--active' : ''}" onclick="AnalyticsPage.switchPeriod('month')">Is Mahine</button>
        <button class="tab-bar__item ${this.currentPeriod === 'all' ? 'tab-bar__item--active' : ''}" onclick="AnalyticsPage.switchPeriod('all')">Sab</button>
      </div>

      <!-- Summary Stats -->
      <div class="analytics-summary">
        <div class="stats-row" id="analytics-stats">
          <div class="stat-card skeleton" style="height:70px;"></div>
          <div class="stat-card skeleton" style="height:70px;"></div>
          <div class="stat-card skeleton" style="height:70px;"></div>
        </div>
      </div>

      <!-- Comparison Card -->
      <div id="analytics-comparison" style="margin-bottom: var(--space-xl);"></div>

      <!-- Spending Trend Chart -->
      <div class="chart-section">
        <div class="chart-container">
          <div class="chart-container__title">📈 Kharche ka trend</div>
          <div style="height: 200px; position: relative;">
            <canvas id="chart-trend"></canvas>
          </div>
        </div>
      </div>

      <!-- Category Breakdown Chart -->
      <div class="chart-section">
        <div class="chart-container">
          <div class="chart-container__title">📊 Category-wise breakdown</div>
          <div style="display:flex; gap: var(--space-lg); align-items:center;">
            <div style="width:140px; height:140px; flex-shrink:0;">
              <canvas id="chart-category"></canvas>
            </div>
            <div id="category-breakdown-list" style="flex:1;"></div>
          </div>
        </div>
      </div>

      <!-- Top Items -->
      <div class="chart-section">
        <div class="section-header">
          <h2 class="section-title">🏆 Sabse zyada liye gaye</h2>
        </div>
        <div id="top-items-list"></div>
      </div>

      <!-- Share Button -->
      <div style="margin-top: var(--space-lg);">
        <button class="whatsapp-btn" onclick="AnalyticsPage.shareReport()" style="width:100%; justify-content: center;">
          <svg class="whatsapp-btn__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Report WhatsApp pe bhejo
        </button>
      </div>
    `;

    return div;
  },

  async mount() {
    await this._loadData();
    this.unsubscribe = Store.on('expense:changed', () => this._loadData());
  },

  destroy() {
    ChartComponent.destroyAll();
    if (this.unsubscribe) this.unsubscribe();
  },

  async switchPeriod(period) {
    this.currentPeriod = period;
    // Update tab UI
    document.querySelectorAll('#analytics-tabs .tab-bar__item').forEach(tab => {
      tab.classList.remove('tab-bar__item--active');
    });
    event.target.classList.add('tab-bar__item--active');
    await this._loadData();
  },

  async _loadData() {
    let expenses = [];
    let dateRange;
    let prevExpenses = [];

    if (this.currentPeriod === 'week') {
      dateRange = Utils.getDateRange('week');
      expenses = await HisaabDB.getExpensesByDateRange(dateRange.start, dateRange.end);
      const prevRange = Utils.getDateRange('last-week');
      prevExpenses = await HisaabDB.getExpensesByDateRange(prevRange.start, prevRange.end);
    } else if (this.currentPeriod === 'month') {
      dateRange = Utils.getDateRange('month');
      expenses = await HisaabDB.getExpensesByDateRange(dateRange.start, dateRange.end);
      const prevRange = Utils.getDateRange('last-month');
      prevExpenses = await HisaabDB.getExpensesByDateRange(prevRange.start, prevRange.end);
    } else {
      expenses = await HisaabDB.getAllExpenses();
      dateRange = expenses.length > 0 
        ? { start: expenses[expenses.length - 1].date, end: expenses[0].date }
        : { start: Utils.today(), end: Utils.today() };
    }

    const total = Utils.sum(expenses, 'amount');
    const count = expenses.length;

    // Days in range
    const dates = Utils.getDatesBetween(dateRange.start, dateRange.end);
    const numDays = dates.length || 1;

    // Group by date for chart
    const byDate = {};
    dates.forEach(d => byDate[d] = 0);
    expenses.forEach(e => {
      byDate[e.date] = (byDate[e.date] || 0) + e.amount;
    });

    // Find max/min day
    const dailyAmounts = Object.entries(byDate).filter(([d]) => dates.includes(d));
    const maxDay = dailyAmounts.reduce((max, [d, a]) => a > max[1] ? [d, a] : max, ['', 0]);
    const minDay = dailyAmounts.filter(([_, a]) => a > 0).reduce((min, [d, a]) => a < min[1] ? [d, a] : min, ['', Infinity]);

    // ===== RENDER STATS =====
    const statsEl = document.getElementById('analytics-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat-card">
          <div class="stat-card__value" style="color: var(--accent-primary);">${Utils.formatAmount(total)}</div>
          <div class="stat-card__label">Total Kharcha</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value">${Utils.formatAmount(Math.round(total / numDays))}</div>
          <div class="stat-card__label">Average / Din</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value">${count}</div>
          <div class="stat-card__label">Total Items</div>
        </div>
      `;
    }

    // ===== COMPARISON CARD =====
    const compEl = document.getElementById('analytics-comparison');
    if (compEl && this.currentPeriod !== 'all' && prevExpenses.length > 0) {
      const prevTotal = Utils.sum(prevExpenses, 'amount');
      const diff = total - prevTotal;
      const absDiff = Math.abs(diff);
      const isUp = diff > 0;
      const periodLabel = this.currentPeriod === 'week' ? 'pichle hafte' : 'pichle mahine';

      compEl.innerHTML = `
        <div class="comparison-card">
          <div class="comparison-card__icon comparison-card__icon--${isUp ? 'up' : 'down'}">
            ${isUp ? '📈' : '📉'}
          </div>
          <div class="comparison-card__text">
            ${periodLabel} se <span class="comparison-card__highlight" style="color: ${isUp ? 'var(--danger)' : 'var(--accent-primary)'}">₹${absDiff.toLocaleString('en-IN')} ${isUp ? 'zyada' : 'kam'}</span> kharcha hua
          </div>
        </div>
      `;
    } else if (compEl) {
      compEl.innerHTML = '';
    }

    // ===== TREND CHART =====
    if (this.currentPeriod !== 'all') {
      const chartLabels = dates.map(d => Utils.formatDate(d, 'short'));
      const chartData = dates.map(d => byDate[d] || 0);

      // Color bars: highlight today
      const colors = dates.map(d => d === Utils.today() ? 'rgba(0, 229, 160, 0.8)' : 'rgba(0, 229, 160, 0.4)');

      ChartComponent.bar('chart-trend', chartLabels, chartData, { colors });
    } else {
      // For "all" view, show last 30 days as line chart
      const last30Range = Utils.getDateRange('month');
      const last30Dates = Utils.getDatesBetween(last30Range.start, last30Range.end);
      const chartLabels = last30Dates.map(d => Utils.formatDate(d, 'short'));
      const chartData = last30Dates.map(d => byDate[d] || 0);
      ChartComponent.line('chart-trend', chartLabels, chartData);
    }

    // ===== CATEGORY CHART =====
    const catTotals = {};
    expenses.forEach(e => {
      const cat = e.category || 'other';
      catTotals[cat] = (catTotals[cat] || 0) + e.amount;
    });

    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length > 0) {
      const catLabels = sortedCats.map(([id]) => {
        const cat = CATEGORIES.find(c => c.id === id);
        return cat ? cat.name : id;
      });
      const catData = sortedCats.map(([, val]) => val);
      const catColors = sortedCats.map(([id]) => {
        const cat = CATEGORIES.find(c => c.id === id);
        return cat ? cat.color : '#8B8BA3';
      });

      ChartComponent.donut('chart-category', catLabels, catData, catColors);

      // Category breakdown list
      const breakdownEl = document.getElementById('category-breakdown-list');
      if (breakdownEl) {
        const maxCatAmount = Math.max(...catData);
        breakdownEl.innerHTML = `<div class="category-breakdown">
          ${sortedCats.map(([id, amount]) => {
            const cat = CATEGORIES.find(c => c.id === id) || { emoji: '📦', name: id, color: '#8B8BA3' };
            const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
            const barWidth = maxCatAmount > 0 ? (amount / maxCatAmount) * 100 : 0;
            return `
              <div class="category-row">
                <div class="category-row__emoji">${cat.emoji}</div>
                <div class="category-row__info">
                  <div class="category-row__name">${cat.name} (${pct}%)</div>
                  <div class="category-row__bar">
                    <div class="category-row__bar-fill" style="width:${barWidth}%; background:${cat.color};"></div>
                  </div>
                </div>
                <div class="category-row__amount">₹${amount.toLocaleString('en-IN')}</div>
              </div>
            `;
          }).join('')}
        </div>`;
      }
    }

    // ===== TOP ITEMS =====
    const itemTotals = {};
    expenses.forEach(e => {
      const name = e.name.toLowerCase().trim();
      if (!itemTotals[name]) {
        itemTotals[name] = { name: e.name, total: 0, count: 0, category: e.category };
      }
      itemTotals[name].total += e.amount;
      itemTotals[name].count++;
    });

    const topItems = Object.values(itemTotals).sort((a, b) => b.total - a.total).slice(0, 5);
    const topItemsEl = document.getElementById('top-items-list');
    if (topItemsEl) {
      if (topItems.length === 0) {
        topItemsEl.innerHTML = EmptyState.render({ icon: 'chart', title: 'Data nahi hai', subtitle: 'Pehle kuch kharche add karo' });
      } else {
        topItemsEl.innerHTML = `<div class="top-items-list">
          ${topItems.map((item, i) => {
            const rankClass = i < 3 ? `top-item__rank--${i + 1}` : 'top-item__rank--default';
            const cat = CATEGORIES.find(c => c.id === item.category);
            return `
              <div class="top-item">
                <div class="top-item__rank ${rankClass}">${i + 1}</div>
                <div class="top-item__info">
                  <div class="top-item__name">${cat ? cat.emoji : '📦'} ${item.name}</div>
                  <div class="top-item__count">${item.count} baar liya</div>
                </div>
                <div class="top-item__total">₹${item.total.toLocaleString('en-IN')}</div>
              </div>
            `;
          }).join('')}
        </div>`;
      }
    }
  },

  async shareReport() {
    let text;
    if (this.currentPeriod === 'week') {
      const range = Utils.getDateRange('week');
      const expenses = await HisaabDB.getExpensesByDateRange(range.start, range.end);
      const byDate = Utils.groupBy(expenses, 'date');
      text = Utils.generateWeeklySummary(byDate, range.start, range.end);
    } else {
      const range = Utils.getDateRange(this.currentPeriod === 'month' ? 'month' : 'week');
      const expenses = await HisaabDB.getExpensesByDateRange(range.start, range.end);
      const total = Utils.sum(expenses, 'amount');
      text = `📒 *Hisaab Report*\n📅 ${Utils.formatDate(range.start, 'short')} - ${Utils.formatDate(range.end, 'short')}\n💰 Total: ₹${total.toLocaleString('en-IN')}\n📊 ${expenses.length} items\n\n_Hisaab App se bheja gaya_ 📱`;
    }
    Utils.shareOnWhatsApp(text);
  }
};
