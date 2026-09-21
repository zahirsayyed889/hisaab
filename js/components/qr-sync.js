// ===== QR CODE SYNC COMPONENT =====
// Generate QR code from data for cross-device transfer
// Another device can scan the QR to import the data

const QRSync = {
  /**
   * Show QR code modal for data sharing
   */
  async showExportQR() {
    try {
      const data = await HisaabDB.exportData();
      const jsonStr = JSON.stringify(data);
      
      // Check data size — QR codes have limits (~4000 chars for alphanumeric)
      if (jsonStr.length > 3000) {
        // Too large for single QR — offer chunked or redirect to JSON download
        this._showLargeDataModal(jsonStr);
        return;
      }

      this._showQRModal(jsonStr, 'Saara Data');
    } catch(e) {
      Toast.error('QR generate nahi ho paya 😔');
    }
  },

  /**
   * Show QR for today's data only (smaller, fits in QR)
   */
  async showTodayQR() {
    try {
      const today = Utils.today();
      const expenses = await HisaabDB.getExpensesByDate(today);
      const data = {
        version: 1,
        type: 'daily',
        date: today,
        app: 'Hisaab',
        data: { expenses }
      };
      const jsonStr = JSON.stringify(data);
      this._showQRModal(jsonStr, `Aaj Ka Hisaab (${Utils.formatDate(today, 'short')})`);
    } catch(e) {
      Toast.error('QR generate nahi ho paya 😔');
    }
  },

  /**
   * Show the QR code in a modal
   */
  _showQRModal(data, title) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop modal-backdrop--active';
    overlay.style.zIndex = '700';
    overlay.onclick = () => overlay.remove();

    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 100%; max-width: var(--max-width); z-index: 701;
      background: var(--bg-secondary); border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
      padding: var(--space-xl); text-align: center;
      animation: slideUp var(--transition-slow) both;
    `;

    modal.innerHTML = `
      <div class="modal__handle"></div>
      <h3 style="font-size: var(--fs-lg); font-weight: var(--fw-bold); margin-bottom: var(--space-sm);">
        📱 QR Code se Share Karo
      </h3>
      <p style="font-size: var(--fs-sm); color: var(--text-tertiary); margin-bottom: var(--space-lg);">
        ${title} — doosre phone se scan karo
      </p>
      <div id="qr-canvas-container" style="
        background: #fff; border-radius: var(--radius-lg); padding: var(--space-lg);
        display: inline-block; margin-bottom: var(--space-lg);
      ">
        <canvas id="qr-canvas"></canvas>
      </div>
      <p style="font-size: var(--fs-xs); color: var(--text-tertiary); margin-bottom: var(--space-lg);">
        Doosre device pe Hisaab app kholke, Settings > Import se QR scan karo
      </p>
      <button class="btn btn--secondary btn--full" onclick="this.closest('.modal-backdrop').remove()">
        Band Karo
      </button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Generate QR Code
    setTimeout(() => {
      const canvas = document.getElementById('qr-canvas');
      if (canvas && typeof QRCode !== 'undefined') {
        QRCode.toCanvas(canvas, data, {
          width: 220,
          margin: 2,
          color: {
            dark: '#0F0F14',
            light: '#FFFFFF'
          }
        }, (error) => {
          if (error) {
            console.error('QR generation error:', error);
            document.getElementById('qr-canvas-container').innerHTML = 
              '<p style="color:#FF6B6B;padding:20px;">QR generate nahi ho paya. Data bahut bada hai.</p>';
          }
        });
      }
    }, 100);
  },

  /**
   * Handle large data — show download option instead of QR
   */
  _showLargeDataModal(jsonStr) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop modal-backdrop--active';
    overlay.style.zIndex = '700';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 100%; max-width: var(--max-width); z-index: 701;
      background: var(--bg-secondary); border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
      padding: var(--space-xl); text-align: center;
      animation: slideUp var(--transition-slow) both;
    `;

    const sizeKB = Math.round(jsonStr.length / 1024);
    modal.innerHTML = `
      <div class="modal__handle"></div>
      <div class="empty-state__icon-box" style="margin: 0 auto var(--space-md); width:56px; height:56px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      </div>
      <h3 style="font-size: var(--fs-lg); font-weight: var(--fw-bold); margin-bottom: var(--space-sm);">
        Data Bahut Bada Hai (${sizeKB}KB)
      </h3>
      <p style="font-size: var(--fs-sm); color: var(--text-tertiary); margin-bottom: var(--space-lg);">
        QR mein fit nahi hoga. Aaj ka data QR se bhejo, ya JSON file download karo.
      </p>
      <div style="display:flex; gap: var(--space-sm); flex-direction:column;">
        <button class="btn btn--primary btn--full" onclick="QRSync.showTodayQR(); this.closest('.modal-backdrop').remove();">
          📱 Sirf Aaj Ka Data (QR)
        </button>
        <button class="btn btn--secondary btn--full" onclick="SettingsPage.exportJSON(); this.closest('.modal-backdrop').remove();">
          💾 Full Backup (JSON Download)
        </button>
        <button class="btn btn--ghost btn--full" onclick="this.closest('.modal-backdrop').remove();">
          Band Karo
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  },

  /**
   * Import data from text (used after QR scan)
   */
  async importFromText(text) {
    try {
      const data = JSON.parse(text);
      const result = await HisaabDB.importData(data);
      Store.emit('expense:changed');
      Store.emit('profiles:changed');
      Toast.success(`Import done! ${result.expenses} expenses, ${result.profiles} profiles 🎉`);
      return true;
    } catch(e) {
      console.error('Import error:', e);
      Toast.error('Import fail! Data format galat hai.');
      return false;
    }
  },

  /**
   * Show modal to paste or scan QR data
   */
  showImportModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop modal-backdrop--active';
    overlay.style.zIndex = '700';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 100%; max-width: var(--max-width); z-index: 701;
      background: var(--bg-secondary); border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
      padding: var(--space-xl); text-align: center;
      animation: slideUp var(--transition-slow) both;
    `;

    modal.innerHTML = `
      <div class="modal__handle"></div>
      <h3 style="font-size: var(--fs-lg); font-weight: var(--fw-bold); margin-bottom: var(--space-xs);">
        📥 QR Data Import Karo
      </h3>
      <p style="font-size: var(--fs-sm); color: var(--text-tertiary); margin-bottom: var(--space-lg);">
        Doosre phone ka QR data text yahan paste karo
      </p>
      <div class="form-group" style="text-align:left; margin-bottom: var(--space-md);">
        <label class="form-label" for="qr-import-text">Data / QR Code JSON:</label>
        <textarea id="qr-import-text" class="form-input" rows="4" placeholder='{"version":1,"data":{...}}' style="font-family: monospace; font-size: 12px; resize: none;"></textarea>
      </div>
      <div style="display:flex; gap: var(--space-sm); flex-direction:column;">
        <button class="btn btn--primary btn--full" id="btn-do-qr-import">
          Import Data 📥
        </button>
        <button class="btn btn--secondary btn--full" onclick="this.closest('.modal-backdrop').remove()">
          Cancel
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('btn-do-qr-import').onclick = async () => {
      const val = document.getElementById('qr-import-text').value.trim();
      if (!val) {
        Toast.warning('Pehle data paste karo');
        return;
      }
      const ok = await this.importFromText(val);
      if (ok) {
        overlay.remove();
      }
    };
  }
};
