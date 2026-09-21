// ===== PROFILE PICKER COMPONENT =====

const ProfilePicker = {
  selectedProfile: '',

  /**
   * Render profile picker chips
   * @param {string} containerId - Container element ID
   * @param {string} selected - Currently selected profile name
   */
  async render(containerId, selected = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const profiles = await HisaabDB.getAllProfiles();
    const activeProfile = Store.get('activeProfile');
    this.selectedProfile = selected !== null ? selected : (activeProfile ? activeProfile.name : '');

    if (profiles.length === 0) {
      container.innerHTML = `
        <button type="button" class="chip" onclick="ProfilePicker.quickAdd('${containerId}')">
          <span class="chip__emoji">➕</span>
          <span>Profile add karo</span>
        </button>
      `;
      return;
    }

    container.innerHTML = profiles.map(p => `
      <button type="button" class="profile-chip ${this.selectedProfile === p.name ? 'profile-chip--active' : ''}"
              data-profile="${p.name}"
              onclick="ProfilePicker.select('${p.name.replace(/'/g, "\\'")}', '${containerId}')">
        <span class="profile-chip__emoji">${p.emoji}</span>
        <span>${p.name}</span>
      </button>
    `).join('');
  },

  /**
   * Select a profile
   */
  select(name, containerId) {
    this.selectedProfile = this.selectedProfile === name ? '' : name;
    // Re-render to update active state
    this.render(containerId, this.selectedProfile);
  },

  /**
   * Quick add a profile inline
   */
  async quickAdd(containerId) {
    const name = prompt('Family member ka naam likho:');
    if (!name || !name.trim()) return;

    const emoji = PROFILE_EMOJIS[Math.floor(Math.random() * PROFILE_EMOJIS.length)];
    
    try {
      const profile = await HisaabDB.addProfile({ name: name.trim(), emoji });
      Store.emit('profiles:changed');
      this.selectedProfile = profile.name;
      await this.render(containerId, profile.name);
      Toast.success(`${name} profile add ho gaya! ${emoji}`);
    } catch(e) {
      Toast.error('Profile add nahi ho paya 😔');
    }
  },

  /**
   * Get selected profile name
   */
  getSelected() {
    return this.selectedProfile;
  },

  /**
   * Reset selection
   */
  reset() {
    this.selectedProfile = '';
    const active = Store.get('activeProfile');
    if (active) this.selectedProfile = active.name;
  }
};
