// ===== EXPENSE CARD COMPONENT =====

const ExpenseCard = {
  /**
   * Render a single expense item
   */
  render(expense) {
    const cat = CATEGORIES.find(c => c.id === expense.category) || CATEGORIES[CATEGORIES.length - 1];
    const timeStr = expense.time ? Utils.formatTime(expense.time) : '';
    const noteStr = expense.note ? `<span>• ${expense.note}</span>` : '';
    const addedBy = expense.addedBy ? `<span>👤 ${expense.addedBy}</span>` : '';

    return `
      <div class="expense-item" data-id="${expense.id}" onclick="ExpenseCard.handleTap('${expense.id}')">
        <div class="expense-item__icon expense-item__icon--${expense.category || 'other'}">
          ${cat.emoji}
        </div>
        <div class="expense-item__info">
          <div class="expense-item__name">${this._escapeHtml(expense.name)}</div>
          <div class="expense-item__meta">
            ${timeStr ? `<span>${timeStr}</span>` : ''}
            ${addedBy}
            ${noteStr}
          </div>
        </div>
        <div class="expense-item__amount">
          <span class="rupee-sign">₹</span>${parseFloat(expense.amount).toLocaleString('en-IN')}
        </div>
        <div class="expense-item__actions">
          <button class="expense-item__action-btn expense-item__action-btn--edit" onclick="event.stopPropagation(); AddModal.openEdit('${expense.id}')" aria-label="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="expense-item__action-btn expense-item__action-btn--delete" onclick="event.stopPropagation(); ExpenseCard.handleDelete('${expense.id}')" aria-label="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Render expense list
   */
  renderList(expenses) {
    if (!expenses || expenses.length === 0) {
      return EmptyState.render({
        icon: 'empty',
        title: 'Aaj koi kharcha nahi!',
        subtitle: 'Neeche + button se kharcha add karo'
      });
    }
    return `<div class="expense-list stagger-children">${expenses.map(e => this.render(e)).join('')}</div>`;
  },

  /**
   * Handle tap on expense item (show/hide actions)
   */
  handleTap(id) {
    // Close all open actions
    document.querySelectorAll('.expense-item--show-actions').forEach(el => {
      if (el.dataset.id !== id) {
        el.classList.remove('expense-item--show-actions');
      }
    });

    // Toggle current
    const el = document.querySelector(`.expense-item[data-id="${id}"]`);
    if (el) {
      el.classList.toggle('expense-item--show-actions');
    }
  },

  /**
   * Handle delete with confirmation
   */
  async handleDelete(id) {
    ConfirmDialog.show({
      emoji: '🗑️',
      title: 'Delete karna hai?',
      message: 'Ye kharcha permanently delete ho jayega. Wapas nahi aa sakta!',
      confirmText: 'Haan, Delete Karo',
      cancelText: 'Nahi',
      onConfirm: async () => {
        try {
          await HisaabDB.deleteExpense(id);
          Store.emit('expense:changed');
          Toast.success('Kharcha delete ho gaya! 🗑️');
        } catch(e) {
          Toast.error('Delete nahi ho paya 😔');
        }
      }
    });
  },

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// ===== CONFIRM DIALOG =====
const ConfirmDialog = {
  show({ emoji = '❓', title, message, confirmText = 'Haan', cancelText = 'Nahi', onConfirm }) {
    const backdrop = document.getElementById('confirm-backdrop');
    const dialog = document.getElementById('confirm-dialog');
    
    document.getElementById('confirm-emoji').textContent = emoji;
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-ok').textContent = confirmText;
    document.getElementById('confirm-cancel').textContent = cancelText;

    backdrop.classList.add('modal-backdrop--active');
    dialog.classList.add('confirm-dialog--active');

    const cleanup = () => {
      backdrop.classList.remove('modal-backdrop--active');
      dialog.classList.remove('confirm-dialog--active');
      document.getElementById('confirm-ok').onclick = null;
      document.getElementById('confirm-cancel').onclick = null;
    };

    document.getElementById('confirm-ok').onclick = () => {
      cleanup();
      if (onConfirm) onConfirm();
    };

    document.getElementById('confirm-cancel').onclick = cleanup;
    backdrop.onclick = cleanup;
  }
};
