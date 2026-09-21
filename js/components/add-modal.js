// ===== ADD/EDIT EXPENSE MODAL =====

const AddModal = {
  isOpen: false,
  editingId: null,
  suggestionsData: [],

  init() {
    const backdrop = document.getElementById('modal-backdrop');
    const closeBtn = document.getElementById('modal-close');
    const form = document.getElementById('expense-form');
    const fab = document.getElementById('fab-add');
    const nameInput = document.getElementById('expense-name');

    // FAB click
    fab.addEventListener('click', () => this.open());

    // Close handlers
    closeBtn.addEventListener('click', () => this.close());
    backdrop.addEventListener('click', () => this.close());

    // Form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.save();
    });

    // Name input — suggestions
    nameInput.addEventListener('input', Utils.debounce(() => this._showSuggestions(), 200));
    nameInput.addEventListener('focus', () => this._showSuggestions());
    
    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#name-suggestions') && e.target.id !== 'expense-name') {
        this._hideSuggestions();
      }
    });

    // Load frequent items for suggestions
    this._loadSuggestions();
  },

  /**
   * Open modal for new expense
   */
  async open() {
    this.editingId = null;
    this._resetForm();

    document.getElementById('modal-title').textContent = 'Kharcha Add Karo ✍️';
    document.getElementById('btn-save-text').textContent = 'Save Karo ✅';

    // Set today's date and current time
    document.getElementById('expense-date').value = Utils.today();
    document.getElementById('expense-time').value = Utils.now();

    // Render pickers
    CategoryPicker.render('category-chips');
    await ProfilePicker.render('modal-profile-picker');

    this._showModal();
    
    // Focus amount
    setTimeout(() => document.getElementById('expense-amount').focus(), 350);
  },

  /**
   * Open modal for editing an expense
   */
  async openEdit(id) {
    const expense = await HisaabDB.getExpense(id);
    if (!expense) {
      Toast.error('Expense nahi mila 😔');
      return;
    }

    this.editingId = id;

    document.getElementById('modal-title').textContent = 'Kharcha Edit Karo ✏️';
    document.getElementById('btn-save-text').textContent = 'Update Karo 💾';
    document.getElementById('expense-id').value = id;
    document.getElementById('expense-amount').value = expense.amount;
    document.getElementById('expense-name').value = expense.name;
    document.getElementById('expense-note').value = expense.note || '';
    document.getElementById('expense-date').value = expense.date;
    document.getElementById('expense-time').value = expense.time || '';

    // Set category
    CategoryPicker.render('category-chips', expense.category);
    
    // Set profile
    await ProfilePicker.render('modal-profile-picker', expense.addedBy);

    this._showModal();
  },

  /**
   * Save or update expense
   */
  async save() {
    const amount = document.getElementById('expense-amount').value;
    const name = document.getElementById('expense-name').value;
    const note = document.getElementById('expense-note').value;
    const date = document.getElementById('expense-date').value;
    const time = document.getElementById('expense-time').value;
    const category = CategoryPicker.getSelected();
    const addedBy = ProfilePicker.getSelected();

    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      Toast.warning('Amount daalo pehle! 💰');
      document.getElementById('expense-amount').focus();
      return;
    }

    if (!name.trim()) {
      Toast.warning('Item ka naam likho! ✏️');
      document.getElementById('expense-name').focus();
      return;
    }

    try {
      if (this.editingId) {
        // Update
        await HisaabDB.updateExpense(this.editingId, {
          name: name.trim(),
          amount: parseFloat(amount),
          note: note.trim(),
          category,
          addedBy,
          date,
          time
        });
        Toast.success('Kharcha update ho gaya! ✅');
      } else {
        // Add new
        await HisaabDB.addExpense({
          name: name.trim(),
          amount: parseFloat(amount),
          note: note.trim(),
          category,
          addedBy,
          date,
          time
        });
        Toast.success('Kharcha add ho gaya! ✅');
      }

      // Refresh suggestions
      this._loadSuggestions();

      // Close modal and refresh
      this.close();
      Store.emit('expense:changed');

    } catch(e) {
      console.error('Save error:', e);
      Toast.error('Save nahi ho paya 😔');
    }
  },

  /**
   * Close modal
   */
  close() {
    this.isOpen = false;
    document.getElementById('modal-backdrop').classList.remove('modal-backdrop--active');
    document.getElementById('add-modal').classList.remove('modal--active');
    this._hideSuggestions();
  },

  // ===== PRIVATE =====

  _showModal() {
    this.isOpen = true;
    document.getElementById('modal-backdrop').classList.add('modal-backdrop--active');
    document.getElementById('add-modal').classList.add('modal--active');
  },

  _resetForm() {
    document.getElementById('expense-form').reset();
    document.getElementById('expense-id').value = '';
    CategoryPicker.reset();
    ProfilePicker.reset();
    this._hideSuggestions();
  },

  async _loadSuggestions() {
    try {
      this.suggestionsData = await HisaabDB.getFrequentItems(15);
    } catch(e) {
      this.suggestionsData = [];
    }
  },

  _showSuggestions() {
    const input = document.getElementById('expense-name');
    const container = document.getElementById('name-suggestions');
    const query = input.value.toLowerCase().trim();

    let matches = this.suggestionsData;
    if (query) {
      matches = matches.filter(item => item.name.toLowerCase().includes(query));
    }

    if (matches.length === 0) {
      this._hideSuggestions();
      return;
    }

    container.innerHTML = matches.slice(0, 6).map(item => {
      const cat = CATEGORIES.find(c => c.id === item.category);
      return `
        <div class="suggestion-item" onclick="AddModal._selectSuggestion('${item.name.replace(/'/g, "\\'")}', ${item.lastAmount}, '${item.category}')">
          <span>${cat ? cat.emoji : '📦'} ${item.name}</span>
          <span style="color: var(--text-tertiary); font-size: var(--fs-xs);">₹${item.lastAmount} • ${item.count}x</span>
        </div>
      `;
    }).join('');

    container.style.display = 'block';
  },

  _hideSuggestions() {
    const container = document.getElementById('name-suggestions');
    if (container) container.style.display = 'none';
  },

  _selectSuggestion(name, amount, category) {
    document.getElementById('expense-name').value = name;
    document.getElementById('expense-amount').value = amount;
    if (category) {
      CategoryPicker.render('category-chips', category);
    }
    this._hideSuggestions();
    document.getElementById('expense-amount').focus();
    document.getElementById('expense-amount').select();
  }
};
