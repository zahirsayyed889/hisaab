// ===== EMPTY STATE COMPONENT =====

const EmptyState = {
  /**
   * Render a sleek, clean modern empty state
   * @param {object} options
   * @returns {string} HTML string
   */
  render({ icon = '', emoji = '', title = 'Kuch nahi hai', subtitle = '', action = null }) {
    let actionHtml = '';
    if (action) {
      actionHtml = `<button class="btn btn--primary btn--sm" style="margin-top: var(--space-lg);" onclick="${action.onClick}">${action.label}</button>`;
    }

    const icons = {
      empty: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      list: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
      chart: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
      search: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
      done: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
    };

    let visualHtml;
    if (icon && icons[icon]) {
      visualHtml = `<div class="empty-state__icon-box">${icons[icon]}</div>`;
    } else if (emoji) {
      visualHtml = `<div class="empty-state__icon-box" style="font-size:28px;">${emoji}</div>`;
    } else {
      visualHtml = `<div class="empty-state__icon-box">${icons.list}</div>`;
    }

    return `
      <div class="empty-state">
        ${visualHtml}
        <h3 class="empty-state__title">${title}</h3>
        <p class="empty-state__subtitle">${subtitle}</p>
        ${actionHtml}
      </div>
    `;
  }
};
