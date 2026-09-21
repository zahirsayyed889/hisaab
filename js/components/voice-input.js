// ===== VOICE INPUT COMPONENT =====
// Uses Web Speech API for voice-to-text input with smart Hindi/English number parsing

const VoiceInput = {
  recognition: null,
  isListening: false,
  targetInput: null,

  init() {
    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log('Web Speech API not supported in this browser');
      // Keep button visible or hide gracefully
      const btn = document.getElementById('btn-voice');
      if (btn) {
        btn.title = 'Voice input is browser mein supported nahi hai';
        btn.onclick = () => Toast.warning('Aapka browser voice input support nahi karta. Chrome ya Edge use karo.');
      }
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'hi-IN'; // Hindi + English mixed
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.continuous = false;

    // Events
    this.recognition.onresult = (event) => {
      const result = event.results[0];
      const transcript = result[0].transcript;
      
      const parsed = this.parseTranscript(transcript);
      
      if (this.targetInput) {
        this.targetInput.value = parsed.name || transcript;
      }

      if (parsed.amount) {
        const amountInput = document.getElementById('expense-amount');
        if (amountInput) amountInput.value = parsed.amount;
      }

      if (parsed.category) {
        CategoryPicker.render('category-chips', parsed.category);
      }

      if (result.isFinal) {
        this.stop();
        if (parsed.amount) {
          Toast.success(`Suna: "${parsed.name}" • ₹${parsed.amount} 🎤`);
        } else {
          Toast.success(`Suna: "${parsed.name}" 🎤`);
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.stop();
      
      if (event.error === 'not-allowed') {
        Toast.error('Mic permission nahi di! Browser settings mein allow karo.');
      } else if (event.error === 'no-speech') {
        Toast.warning('Kuch sunai nahi diya. Dubara bol ke dekho! 🎤');
      } else {
        Toast.error('Voice input connect nahi ho paya 😔');
      }
    };

    this.recognition.onend = () => {
      this.stop();
    };

    // Setup button
    const btn = document.getElementById('btn-voice');
    if (btn) {
      btn.onclick = () => this.toggle();
    }
  },

  /**
   * Smart parser for transcripts like:
   * "Doodh 38", "Doodh 38 rupaye", "50 rupaye ka aata", "Sabzi 120"
   */
  parseTranscript(raw) {
    let transcript = raw.trim();
    let amount = null;
    let name = transcript;

    // Check prefix pattern: "50 rupaye ka doodh" or "50 ka doodh"
    const prefixMatch = transcript.match(/^(\d+(?:\.\d+)?)\s*(?:rupaye|rupay|rupees|rs)?\s*(?:ka|ki)?\s+(.+)$/i);
    if (prefixMatch) {
      amount = parseFloat(prefixMatch[1]);
      name = prefixMatch[2].trim();
    } else {
      // Check suffix pattern: "Doodh 38 rupaye" or "Doodh 38"
      const suffixMatch = transcript.match(/(\d+(?:\.\d+)?)\s*(?:rupaye|rupay|rupees|rs)?\s*$/i);
      if (suffixMatch) {
        amount = parseFloat(suffixMatch[1]);
        name = transcript.slice(0, suffixMatch.index).trim();
      }
    }

    // Clean trailing "ka", "ki", "ke"
    name = name.replace(/\b(?:ka|ki|ke|pe|me)\b\s*$/i, '').trim();

    // Capitalize first letter
    if (name) {
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    // Detect category from name keywords
    let category = null;
    const lowerName = (name || transcript).toLowerCase();
    
    if (/doodh|milk|dahi|curd|paneer|butter|makhan|chaas/i.test(lowerName)) {
      category = 'dairy';
    } else if (/sabzi|tamatar|aaloo|pyaz|bhindi|gobhi|fruit|kela|seb|aam/i.test(lowerName)) {
      category = 'grocery';
    } else if (/atta|chawal|rice|dal|tel|oil|cheeni|sugar|namak|ration|masala/i.test(lowerName)) {
      category = 'ration';
    } else if (/soap|sabun|surf|vim|harpic|shampoo|colgate|brush|jhaadu/i.test(lowerName)) {
      category = 'household';
    } else if (/bijli|bill|recharge|wifi|cylinder|gas|water/i.test(lowerName)) {
      category = 'bills';
    } else if (/dawa|dawai|tablet|medicine|doctor|syrup/i.test(lowerName)) {
      category = 'medical';
    } else if (/petrol|diesel|auto|cab|rickshaw|bus|metro|uber|ola/i.test(lowerName)) {
      category = 'transport';
    } else if (/fee|book|copy|pen|school|pencil|tuition/i.test(lowerName)) {
      category = 'education';
    }

    return { name, amount, category };
  },

  toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  },

  start() {
    if (!this.recognition) {
      Toast.warning('Voice recognition is browser mein uplabdh nahi hai.');
      return;
    }
    
    this.targetInput = document.getElementById('expense-name');
    this.isListening = true;
    
    // Update button UI
    const btn = document.getElementById('btn-voice');
    if (btn) {
      btn.classList.add('voice-btn--active');
      btn.setAttribute('title', 'Bolna band karne ke liye tap karo');
    }

    try {
      this.recognition.start();
      Toast.info('Sun raha hoon... bolo! e.g. "Doodh 38" 🎤');
    } catch(e) {
      console.error('Failed to start recognition:', e);
      this.stop();
    }
  },

  stop() {
    this.isListening = false;
    
    const btn = document.getElementById('btn-voice');
    if (btn) {
      btn.classList.remove('voice-btn--active');
      btn.setAttribute('title', 'Bol ke likho');
    }

    try {
      if (this.recognition) this.recognition.stop();
    } catch(e) { /* ignore */ }
  }
};
