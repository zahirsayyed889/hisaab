// ===== SEARCH PAGE =====

const SearchPage = {
  filterCategory: '',

  async render() {
    const div = document.createElement('div');
    div.className = 'page-search';
    div.innerHTML = `
      <!-- Search Bar -->
      <div class="search-bar">
        <svg class="search-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" class="search-bar__input" id="search-input" placeholder="Doodh, Sabzi, Atta..." autocomplete="off" autofocus>
      </div>

      <!-- Filter Chips -->
      <div class="filter-chips">
        <button class="chip ${this.filterCategory === '' ? 'chip--active' : ''}" onclick="SearchPage.setFilter('')">All</button>
        ${CATEGORIES.map(cat => `
          <button class="chip ${this.filterCategory === cat.id ? 'chip--active' : ''}" onclick="SearchPage.setFilter('${cat.id}')">
            <span class="chip__emoji">${cat.emoji}</span>
            <span>${cat.name}</span>
          </button>
        `).join('')}
      </div>

      <!-- Results -->
      <div id="search-results-info" class="search-results-info"></div>
      <div id="search-results"></div>
    `;

    return div;
  },

  mount() {
    const input = document.getElementById('search-input');
    if (input) {
      input.addEventListener('input', Utils.debounce(() => this._doSearch(), 250));
      input.focus();
    }

    // Show recent items on load
    this._showRecent();
  },

  destroy() {},

  setFilter(categoryId) {
    this.filterCategory = categoryId;
    
    // Update chip UI
    document.querySelectorAll('.filter-chips .chip').forEach(chip => {
      chip.classList.remove('chip--active');
    });
    event.target.closest('.chip').classList.add('chip--active');

    this._doSearch();
  },

  async _doSearch() {
    const query = document.getElementById('search-input').value.trim();
    
    if (!query && !this.filterCategory) {
      this._showRecent();
      return;
    }

    let results;
    if (query) {
      results = await HisaabDB.searchExpenses(query);
    } else {
      results = await HisaabDB.getAllExpenses();
    }

    // Apply category filter
    if (this.filterCategory) {
      results = results.filter(e => e.category === this.filterCategory);
    }

    const infoEl = document.getElementById('search-results-info');
    const resultsEl = document.getElementById('search-results');

    if (infoEl) {
      infoEl.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} mila${results.length !== 1 ? '' : ''}`;
    }

    if (results.length === 0) {
      resultsEl.innerHTML = EmptyState.render({
        icon: 'search',
        title: 'Kuch nahi mila!',
        subtitle: query ? `"${query}" se koi match nahi hua` : 'Is category mein koi kharcha nahi'
      });
      return;
    }

    // Group by date
    const grouped = Utils.groupBy(results, 'date');
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    resultsEl.innerHTML = sortedDates.map(date => {
      const dayExpenses = grouped[date];
      const dayTotal = Utils.sum(dayExpenses, 'amount');

      return `
        <div class="date-group">
          <div class="date-group__header">
            <div class="date-group__date">${Utils.formatDate(date, 'day')}</div>
            <div class="date-group__total">₹${dayTotal.toLocaleString('en-IN')}</div>
          </div>
          <div class="expense-list">
            ${dayExpenses.map(e => ExpenseCard.render(e)).join('')}
          </div>
        </div>
      `;
    }).join('');
  },

  async _showRecent() {
    const infoEl = document.getElementById('search-results-info');
    const resultsEl = document.getElementById('search-results');

    const recent = await HisaabDB.getAllExpenses();
    const top20 = recent.slice(0, 20);

    if (infoEl) infoEl.textContent = 'Recent kharchas';
    
    if (top20.length === 0) {
      resultsEl.innerHTML = EmptyState.render({
        icon: 'list',
        title: 'Koi kharcha nahi hai',
        subtitle: 'Pehle kuch add karo, phir yahan search kar sakte ho'
      });
      return;
    }

    resultsEl.innerHTML = `<div class="expense-list stagger-children">
      ${top20.map(e => ExpenseCard.render(e)).join('')}
    </div>`;
  }
};
