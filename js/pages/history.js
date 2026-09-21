// ===== HISTORY PAGE — Past Hisaab =====

const HistoryPage = {
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  unsubscribe: null,

  async render() {
    const div = document.createElement('div');
    div.className = 'page-history';
    div.innerHTML = `
      <!-- Month Navigator -->
      <div class="date-nav">
        <button class="date-nav__btn" onclick="HistoryPage.prevMonth()" aria-label="Previous month">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div class="date-nav__label" id="history-month-label"></div>
        <button class="date-nav__btn" onclick="HistoryPage.nextMonth()" aria-label="Next month">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      <!-- Month Total -->
      <div class="month-total">
        <div class="month-total__amount" id="history-month-total">₹0</div>
        <div class="month-total__label" id="history-month-count">0 items</div>
      </div>

      <!-- Calendar Heatmap -->
      <div id="history-heatmap"></div>

      <!-- Expense Groups by Date -->
      <div id="history-list"></div>
    `;

    return div;
  },

  async mount() {
    await this._loadMonth();
    this.unsubscribe = Store.on('expense:changed', () => this._loadMonth());
  },

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
  },

  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this._loadMonth();
  },

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this._loadMonth();
  },

  async _loadMonth() {
    const startDate = new Date(this.currentYear, this.currentMonth, 1);
    const endDate = new Date(this.currentYear, this.currentMonth + 1, 0);
    
    const startStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-01`;
    const endStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    // Update label
    const labelEl = document.getElementById('history-month-label');
    if (labelEl) {
      labelEl.textContent = startDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }

    // Fetch expenses
    const expenses = await HisaabDB.getExpensesByDateRange(startStr, endStr);
    const total = Utils.sum(expenses, 'amount');

    // Update totals
    const totalEl = document.getElementById('history-month-total');
    if (totalEl) totalEl.textContent = Utils.formatAmount(total);

    const countEl = document.getElementById('history-month-count');
    if (countEl) countEl.textContent = `${expenses.length} items in ${endDate.getDate()} days`;

    // Render Heatmap
    this._renderHeatmap(expenses, startDate, endDate);

    // Group by date
    const grouped = Utils.groupBy(expenses, 'date');
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    const listEl = document.getElementById('history-list');
    if (!listEl) return;

    if (sortedDates.length === 0) {
      listEl.innerHTML = EmptyState.render({
        icon: 'empty',
        title: 'Is mahine ka koi hisaab nahi',
        subtitle: 'Is month mein koi kharcha add nahi hua'
      });
      return;
    }

    listEl.innerHTML = sortedDates.map(date => {
      const dayExpenses = grouped[date];
      const dayTotal = Utils.sum(dayExpenses, 'amount');
      const dateLabel = Utils.formatDate(date, 'relative') !== date 
        ? `${Utils.formatDate(date, 'relative')} • ${Utils.formatDate(date, 'day')}` 
        : Utils.formatDate(date, 'day');

      return `
        <div class="date-group" id="date-group-${date}">
          <div class="date-group__header">
            <div class="date-group__date">${dateLabel}</div>
            <div class="date-group__total">₹${dayTotal.toLocaleString('en-IN')}</div>
          </div>
          <div class="expense-list">
            ${dayExpenses.map(e => ExpenseCard.render(e)).join('')}
          </div>
        </div>
      `;
    }).join('');
  },

  _renderHeatmap(expenses, startDate, endDate) {
    const heatmapEl = document.getElementById('history-heatmap');
    if (!heatmapEl) return;

    // Daily totals map
    const dailyTotals = {};
    expenses.forEach(e => {
      dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.amount;
    });

    const daysInMonth = endDate.getDate();
    // Monday start: 0=Mon, 1=Tue, ..., 6=Sun
    const startDayOfWeek = (startDate.getDay() + 6) % 7;
    const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    let cellsHtml = '';
    // Day-of-week header labels
    dayNames.forEach(d => {
      cellsHtml += `<div class="calendar-heatmap__day-label">${d}</div>`;
    });

    // Empty cells before day 1
    for (let i = 0; i < startDayOfWeek; i++) {
      cellsHtml += `<div class="calendar-heatmap__cell calendar-heatmap__cell--empty"></div>`;
    }

    const todayStr = Utils.today();

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const spend = dailyTotals[dayStr] || 0;
      
      let level = 0;
      if (spend > 0) {
        if (spend <= 200) level = 1;
        else if (spend <= 600) level = 2;
        else if (spend <= 1500) level = 3;
        else level = 4;
      }

      const isToday = dayStr === todayStr ? 'calendar-heatmap__cell--today' : '';
      const tooltip = spend > 0 
        ? `${day} ${startDate.toLocaleDateString('en-IN', { month: 'short' })}: ₹${spend.toLocaleString('en-IN')}` 
        : `${day} ${startDate.toLocaleDateString('en-IN', { month: 'short' })}`;

      cellsHtml += `
        <div class="calendar-heatmap__cell calendar-heatmap__cell--level-${level} ${isToday}" 
             title="${tooltip}" 
             onclick="HistoryPage.scrollToDate('${dayStr}', ${spend})">
          ${day}
        </div>
      `;
    }

    heatmapEl.innerHTML = `
      <div class="calendar-heatmap">
        <div class="calendar-heatmap__title">
          <span>📅 Mahine Ka Kharcha Heatmap</span>
        </div>
        <div class="calendar-heatmap__grid">
          ${cellsHtml}
        </div>
        <div class="calendar-heatmap__legend">
          <span>Kam</span>
          <div class="calendar-heatmap__legend-item calendar-heatmap__cell--level-0" title="₹0"></div>
          <div class="calendar-heatmap__legend-item calendar-heatmap__cell--level-1" title="≤ ₹200"></div>
          <div class="calendar-heatmap__legend-item calendar-heatmap__cell--level-2" title="₹200 - ₹600"></div>
          <div class="calendar-heatmap__legend-item calendar-heatmap__cell--level-3" title="₹600 - ₹1500"></div>
          <div class="calendar-heatmap__legend-item calendar-heatmap__cell--level-4" title="> ₹1500"></div>
          <span>Zyada</span>
        </div>
      </div>
    `;
  },

  scrollToDate(dateStr, spend) {
    if (spend === 0) {
      Toast.info(`${Utils.formatDate(dateStr, 'day')}: Koi kharcha nahi tha`);
      return;
    }
    const el = document.getElementById(`date-group-${dateStr}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'all 0.3s ease';
      el.style.borderRadius = 'var(--radius-lg)';
      el.style.boxShadow = '0 0 0 2px var(--accent-primary)';
      setTimeout(() => { el.style.boxShadow = ''; }, 1600);
    } else {
      Toast.info(`${Utils.formatDate(dateStr, 'day')}: ₹${spend.toLocaleString('en-IN')}`);
    }
  }
};
