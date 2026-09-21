// ===== IndexedDB DATABASE MANAGER =====

const HisaabDB = {
  DB_NAME: 'HisaabDB',
  DB_VERSION: 1,
  db: null,

  /**
   * Initialize / open the database
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Expenses store
        if (!db.objectStoreNames.contains('expenses')) {
          const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
          expenseStore.createIndex('date', 'date', { unique: false });
          expenseStore.createIndex('category', 'category', { unique: false });
          expenseStore.createIndex('addedBy', 'addedBy', { unique: false });
          expenseStore.createIndex('name', 'name', { unique: false });
          expenseStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Profiles store
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }

        // Budgets store
        if (!db.objectStoreNames.contains('budgets')) {
          db.createObjectStore('budgets', { keyPath: 'id' });
        }
      };
    });
  },

  /**
   * Get a transaction and object store
   */
  _getStore(storeName, mode = 'readonly') {
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  },

  // ===== EXPENSE CRUD =====

  /**
   * Add a new expense
   */
  async addExpense(expense) {
    const record = {
      id: Utils.generateId(),
      name: expense.name.trim(),
      amount: parseFloat(expense.amount),
      note: (expense.note || '').trim(),
      category: expense.category || 'other',
      addedBy: expense.addedBy || '',
      date: expense.date || Utils.today(),
      time: expense.time || Utils.now(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const store = this._getStore('expenses', 'readwrite');
      const request = store.add(record);
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Update an existing expense
   */
  async updateExpense(id, updates) {
    const existing = await this.getExpense(id);
    if (!existing) throw new Error('Expense not found');

    const updated = {
      ...existing,
      ...updates,
      amount: parseFloat(updates.amount || existing.amount),
      updatedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const store = this._getStore('expenses', 'readwrite');
      const request = store.put(updated);
      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Delete an expense by ID
   */
  async deleteExpense(id) {
    return new Promise((resolve, reject) => {
      const store = this._getStore('expenses', 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get a single expense by ID
   */
  async getExpense(id) {
    return new Promise((resolve, reject) => {
      const store = this._getStore('expenses');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get all expenses for a specific date
   */
  async getExpensesByDate(date) {
    return new Promise((resolve, reject) => {
      const store = this._getStore('expenses');
      const index = store.index('date');
      const request = index.getAll(date);
      request.onsuccess = () => {
        const results = request.result || [];
        // Sort by createdAt descending (newest first)
        results.sort((a, b) => b.createdAt - a.createdAt);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get all expenses in a date range (inclusive)
   */
  async getExpensesByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const store = this._getStore('expenses');
      const index = store.index('date');
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);
      request.onsuccess = () => {
        const results = request.result || [];
        results.sort((a, b) => b.createdAt - a.createdAt);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get all expenses (for export)
   */
  async getAllExpenses() {
    return new Promise((resolve, reject) => {
      const store = this._getStore('expenses');
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result || [];
        results.sort((a, b) => {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          return b.createdAt - a.createdAt;
        });
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Search expenses by name
   */
  async searchExpenses(query) {
    const all = await this.getAllExpenses();
    const q = query.toLowerCase().trim();
    return all.filter(e => 
      e.name.toLowerCase().includes(q) ||
      (e.note && e.note.toLowerCase().includes(q)) ||
      (e.category && e.category.toLowerCase().includes(q))
    );
  },

  /**
   * Get frequently used item names (for suggestions)
   */
  async getFrequentItems(limit = 10) {
    const all = await this.getAllExpenses();
    const freq = {};
    all.forEach(e => {
      const name = e.name.toLowerCase().trim();
      if (!freq[name]) {
        freq[name] = { name: e.name, count: 0, lastAmount: e.amount, category: e.category };
      }
      freq[name].count++;
      freq[name].lastAmount = e.amount;
    });
    return Object.values(freq)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  /**
   * Get expense count
   */
  async getExpenseCount() {
    return new Promise((resolve, reject) => {
      const store = this._getStore('expenses');
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // ===== PROFILE CRUD =====

  async addProfile(profile) {
    const record = {
      id: Utils.generateId(),
      name: profile.name.trim(),
      emoji: profile.emoji || '🧑',
      isActive: true,
      createdAt: Date.now()
    };
    return new Promise((resolve, reject) => {
      const store = this._getStore('profiles', 'readwrite');
      const request = store.add(record);
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  },

  async updateProfile(id, updates) {
    const existing = await this.getProfile(id);
    if (!existing) throw new Error('Profile not found');
    const updated = { ...existing, ...updates };
    return new Promise((resolve, reject) => {
      const store = this._getStore('profiles', 'readwrite');
      const request = store.put(updated);
      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteProfile(id) {
    return new Promise((resolve, reject) => {
      const store = this._getStore('profiles', 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  async getProfile(id) {
    return new Promise((resolve, reject) => {
      const store = this._getStore('profiles');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllProfiles() {
    return new Promise((resolve, reject) => {
      const store = this._getStore('profiles');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  // ===== BUDGET CRUD =====

  async saveBudget(budget) {
    const record = {
      id: budget.type, // 'daily', 'weekly', 'monthly'
      type: budget.type,
      amount: parseFloat(budget.amount),
      isActive: budget.isActive !== false,
      updatedAt: Date.now()
    };
    return new Promise((resolve, reject) => {
      const store = this._getStore('budgets', 'readwrite');
      const request = store.put(record);
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  },

  async getBudget(type) {
    return new Promise((resolve, reject) => {
      const store = this._getStore('budgets');
      const request = store.get(type);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllBudgets() {
    return new Promise((resolve, reject) => {
      const store = this._getStore('budgets');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  // ===== DATA MANAGEMENT =====

  /**
   * Export all data as JSON
   */
  async exportData() {
    const [expenses, profiles, budgets] = await Promise.all([
      this.getAllExpenses(),
      this.getAllProfiles(),
      this.getAllBudgets()
    ]);
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: 'Hisaab',
      data: { expenses, profiles, budgets }
    };
  },

  /**
   * Import data from JSON
   */
  async importData(jsonData) {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    
    if (!data.data) throw new Error('Invalid Hisaab backup file');

    const { expenses = [], profiles = [], budgets = [] } = data.data;
    let imported = { expenses: 0, profiles: 0, budgets: 0 };

    // Import expenses
    for (const expense of expenses) {
      try {
        const store = this._getStore('expenses', 'readwrite');
        await new Promise((resolve, reject) => {
          const req = store.put(expense);
          req.onsuccess = () => { imported.expenses++; resolve(); };
          req.onerror = () => resolve(); // Skip duplicates
        });
      } catch(e) { /* skip */ }
    }

    // Import profiles
    for (const profile of profiles) {
      try {
        const store = this._getStore('profiles', 'readwrite');
        await new Promise((resolve, reject) => {
          const req = store.put(profile);
          req.onsuccess = () => { imported.profiles++; resolve(); };
          req.onerror = () => resolve();
        });
      } catch(e) { /* skip */ }
    }

    // Import budgets
    for (const budget of budgets) {
      try {
        const store = this._getStore('budgets', 'readwrite');
        await new Promise((resolve, reject) => {
          const req = store.put(budget);
          req.onsuccess = () => { imported.budgets++; resolve(); };
          req.onerror = () => resolve();
        });
      } catch(e) { /* skip */ }
    }

    return imported;
  },

  /**
   * Clear all data (danger!)
   */
  async clearAllData() {
    const storeNames = ['expenses', 'profiles', 'budgets'];
    for (const name of storeNames) {
      await new Promise((resolve, reject) => {
        const store = this._getStore(name, 'readwrite');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
};
