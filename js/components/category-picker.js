// ===== CATEGORY PICKER COMPONENT =====

const CategoryPicker = {
  selectedCategory: 'other',

  /**
   * Render category chips
   * @param {string} containerId - Container element ID
   * @param {string} selected - Currently selected category ID
   */
  render(containerId, selected = '') {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.selectedCategory = selected || '';

    const settings = Store.get('settings');
    if (!settings.categoriesEnabled) {
      container.parentElement.style.display = 'none';
      return;
    }
    container.parentElement.style.display = '';

    container.innerHTML = CATEGORIES.map(cat => `
      <button type="button" class="chip ${this.selectedCategory === cat.id ? 'chip--active' : ''}" 
              data-category="${cat.id}"
              onclick="CategoryPicker.select('${cat.id}', '${containerId}')">
        <span class="chip__emoji">${cat.emoji}</span>
        <span>${cat.name}</span>
      </button>
    `).join('');
  },

  /**
   * Select a category
   */
  select(categoryId, containerId) {
    this.selectedCategory = this.selectedCategory === categoryId ? '' : categoryId;
    this.render(containerId, this.selectedCategory);
  },

  /**
   * Get currently selected category
   */
  getSelected() {
    return this.selectedCategory;
  },

  /**
   * Reset selection
   */
  reset() {
    this.selectedCategory = '';
  }
};
