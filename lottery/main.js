/**
 * 3-Digit Lottery Display Logic
 * MDCU Freshy Camp 2026
 */

// Sound Engine using Web Audio API (Synthesized SFX, no assets needed)
class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume context if suspended (browser security policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTick() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 40, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      console.warn("Audio error", e);
    }
  }

  playLock() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const playChime = (freq, delay, dur) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0.12, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + dur);
      };
      
      playChime(523.25, 0, 0.15); // C5
      playChime(659.25, 0.08, 0.25); // E5
    } catch (e) {
      console.warn("Audio error", e);
    }
  }

  playError() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.18);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.18);
    } catch (e) {
      console.warn("Audio error", e);
    }
  }

  playJackpot() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch (e) {
      console.warn("Audio error", e);
    }
  }
}

const sound = new SoundEngine();

// Slots State Definition
const slots = [
  {
    id: 1,
    elementId: 'slot-1',
    key: 'q',
    allowedValues: [2, 4, 8],
    state: 'idle', // 'idle' | 'spinning' | 'locked'
    currentValue: 'X',
    timerId: null
  },
  {
    id: 2,
    elementId: 'slot-2',
    key: 'w',
    allowedValues: [1, 3, 5, 6, 7],
    state: 'idle',
    currentValue: 'X',
    timerId: null
  },
  {
    id: 3,
    elementId: 'slot-3',
    key: 'e',
    allowedValues: [6, 7, 9],
    state: 'idle',
    currentValue: 'X',
    timerId: null
  }
];

// App State
let isModalOpen = false;
let isBoardOpen = false;
let draws = {
  "1st": null,
  "2nd": null,
  "3rd": null
};

// DOM Cache
const slotCards = {
  1: document.getElementById('slot-1'),
  2: document.getElementById('slot-2'),
  3: document.getElementById('slot-3')
};

const slotValues = {
  1: slotCards[1].querySelector('.digit-value'),
  2: slotCards[2].querySelector('.digit-value'),
  3: slotCards[3].querySelector('.digit-value')
};

const slotStatusIndicators = {
  1: slotCards[1].querySelector('.status-indicator'),
  2: slotCards[2].querySelector('.status-indicator'),
  3: slotCards[3].querySelector('.status-indicator')
};

const prizeModal = document.getElementById('prize-modal');
const modalNumberDisplay = document.getElementById('modal-number-display');
const boardOverlay = document.getElementById('board-overlay');

// Initialization
function init() {
  loadData();
  setupEventListeners();
  renderBoard();
}

// Storage Operations
function loadData() {
  const saved = sessionStorage.getItem('mdcu-lottery-draws');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Migrate array-based draws safely to single values
      draws["1st"] = Array.isArray(parsed["1st"]) ? (parsed["1st"][0] || null) : parsed["1st"] || null;
      draws["2nd"] = Array.isArray(parsed["2nd"]) ? (parsed["2nd"][0] || null) : parsed["2nd"] || null;
      draws["3rd"] = Array.isArray(parsed["3rd"]) ? (parsed["3rd"][0] || null) : parsed["3rd"] || null;
    } catch (e) {
      console.error("Failed to parse draws data from sessionStorage", e);
    }
  }
}

function saveData() {
  sessionStorage.setItem('mdcu-lottery-draws', JSON.stringify(draws));
  renderBoard();
}

function addDraw(prizeType, numberString) {
  draws[prizeType] = numberString;
  saveData();
}

function clearDraw(prizeType) {
  const label = prizeType === '1st' ? '1' : prizeType === '2nd' ? '2' : '3';
  if (confirm(`คุณต้องการลบผลรางวัลที่ ${label} หรือไม่?`)) {
    draws[prizeType] = null;
    saveData();
    sound.playLock();
  }
}

function resetDraws() {
  if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลการออกรางวัลทั้งหมดในเซสชันนี้? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
    draws = {
      "1st": null,
      "2nd": null,
      "3rd": null
    };
    saveData();
    sound.playError();
  }
}

// Render Results Board
function renderBoard() {
  const categories = ["1st", "2nd", "3rd"];
  let totalCount = 0;

  categories.forEach(cat => {
    const winnerContainer = document.getElementById(`winner-${cat}`);
    const clearBtn = document.querySelector(`.clear-winner-btn[data-prize="${cat}"]`);
    if (!winnerContainer) return;

    const num = draws[cat];
    if (num && typeof num === 'string' && num.length === 3) {
      totalCount++;
      // Display as 3 styled giant digits
      winnerContainer.innerHTML = `
        <div class="winner-digit">${num[0]}</div>
        <div class="winner-digit">${num[1]}</div>
        <div class="winner-digit">${num[2]}</div>
      `;
      if (clearBtn) clearBtn.disabled = false;
    } else {
      winnerContainer.innerHTML = '<div class="no-winner">ยังไม่ได้ออกรางวัล</div>';
      if (clearBtn) clearBtn.disabled = true;
    }
  });

  // Update total statistics count
  const countEl = document.getElementById('board-total-count');
  if (countEl) countEl.textContent = totalCount;
}

// Slot Machine Operations
function startSpin(slot) {
  if (slot.state === 'spinning') return;
  
  // If previously locked, we clear it
  if (slot.state === 'locked') {
    slot.currentValue = 'X';
    slotValues[slot.id].textContent = 'X';
  }

  slot.state = 'spinning';
  
  const cardEl = slotCards[slot.id];
  const digitBoxEl = cardEl.querySelector('.digit-box');
  const indicatorEl = slotStatusIndicators[slot.id];

  digitBoxEl.setAttribute('data-status', 'spinning');
  indicatorEl.textContent = 'SPINNING';

  // Spin interval: Rapidly cycle values
  let cycleIndex = 0;
  slot.timerId = setInterval(() => {
    cycleIndex = (cycleIndex + 1) % 10;
    slotValues[slot.id].textContent = cycleIndex;
    sound.playTick();
  }, 60);
}

function lockSlot(slot, value) {
  if (slot.state !== 'spinning') return;

  clearInterval(slot.timerId);
  slot.timerId = null;
  slot.state = 'locked';
  slot.currentValue = value;

  const cardEl = slotCards[slot.id];
  const digitBoxEl = cardEl.querySelector('.digit-box');
  const indicatorEl = slotStatusIndicators[slot.id];

  digitBoxEl.setAttribute('data-status', 'locked');
  slotValues[slot.id].textContent = value;
  indicatorEl.textContent = 'LOCKED';

  sound.playLock();

  // Check if all slots are locked
  checkSlotsCompletion();
}

function triggerInvalidFeedback(slot) {
  sound.playError();
  const cardEl = slotCards[slot.id];
  cardEl.classList.remove('invalid-shake');
  // Trigger reflow to restart animation
  void cardEl.offsetWidth;
  cardEl.classList.add('invalid-shake');
  
  // Clean up class after animation ends
  setTimeout(() => {
    cardEl.classList.remove('invalid-shake');
  }, 300);
}

function resetSlots() {
  slots.forEach(slot => {
    if (slot.timerId) {
      clearInterval(slot.timerId);
      slot.timerId = null;
    }
    slot.state = 'idle';
    slot.currentValue = 'X';
    
    const cardEl = slotCards[slot.id];
    const digitBoxEl = cardEl.querySelector('.digit-box');
    const indicatorEl = slotStatusIndicators[slot.id];

    digitBoxEl.setAttribute('data-status', 'idle');
    slotValues[slot.id].textContent = 'X';
    indicatorEl.textContent = 'READY';
  });
}

function checkSlotsCompletion() {
  const allLocked = slots.every(s => s.state === 'locked');
  if (allLocked) {
    const finalNumber = slots.map(s => s.currentValue).join('');
    
    // Slight delay before opening modal for better UX/anticipation
    setTimeout(() => {
      openPrizeModal(finalNumber);
    }, 600);
  }
}

// Modal Management
function openPrizeModal(numberString) {
  isModalOpen = true;
  sound.playJackpot();
  
  // Populate digits inside modal
  const spans = modalNumberDisplay.querySelectorAll('span');
  if (spans.length === 3) {
    spans[0].textContent = numberString[0];
    spans[1].textContent = numberString[1];
    spans[2].textContent = numberString[2];
  }
  
  prizeModal.classList.add('active');
}

function closePrizeModal() {
  isModalOpen = false;
  prizeModal.classList.remove('active');
}

function handlePrizeSelection(action) {
  if (!isModalOpen) return;

  const finalNumber = slots.map(s => s.currentValue).join('');
  
  if (action === 'discard') {
    sound.playError();
  } else {
    addDraw(action, finalNumber);
    sound.playLock();
  }

  closePrizeModal();
  resetSlots();
}

// Board Visibility
function toggleBoard(forceState) {
  const targetState = typeof forceState === 'boolean' ? forceState : !isBoardOpen;
  
  if (targetState === isBoardOpen) return;
  
  // If modal is open, prevent opening the board
  if (isModalOpen && targetState) return;

  isBoardOpen = targetState;
  
  if (isBoardOpen) {
    sound.init(); // Initialize audio context on keyboard toggle
    boardOverlay.classList.add('visible');
  } else {
    boardOverlay.classList.remove('visible');
  }
}

// Event Listeners Configuration
function setupEventListeners() {
  // Keyboard Handlers
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    // Ignore hotkeys if user is focusing an input (though there are none on this page)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Toggle hotkey instructions and constraint guides
    if (key === 'h') {
      document.body.classList.toggle('show-guide');
      return;
    }

    // Escape key to stop/cancel spin or close overlays
    if (key === 'escape') {
      if (isModalOpen) {
        closePrizeModal();
      }
      if (isBoardOpen) {
        toggleBoard(false);
      }
      resetSlots();
      sound.playError();
      return;
    }

    if (isModalOpen) {
      // Hotkeys for assignment modal
      if (key === '1') {
        handlePrizeSelection('1st');
      } else if (key === '2') {
        handlePrizeSelection('2nd');
      } else if (key === '3') {
        handlePrizeSelection('3rd');
      } else if (key === 'd') {
        handlePrizeSelection('discard');
      }
      return; // Stop event processing
    }

    if (isBoardOpen) {
      // Board hotkeys
      if (key === 'b') {
        toggleBoard(false);
      }
      return;
    }

    // Main Slot Controls
    if (key === 'q') {
      sound.init();
      startSpin(slots[0]);
    } else if (key === 'w') {
      sound.init();
      startSpin(slots[1]);
    } else if (key === 'e') {
      sound.init();
      startSpin(slots[2]);
    } else if (key === 'b') {
      toggleBoard(true);
    }
    
    // Number Inputs (0-9) to stop active spins
    if (key >= '0' && key <= '9') {
      // Find the first active spinning slot (left to right)
      const activeSlot = slots.find(s => s.state === 'spinning');
      if (activeSlot) {
        const val = parseInt(key, 10);
        if (activeSlot.allowedValues.includes(val)) {
          lockSlot(activeSlot, val);
        } else {
          triggerInvalidFeedback(activeSlot);
        }
      }
    }
  });

  // Modal Button Clicks
  const modalButtons = prizeModal.querySelectorAll('.prize-btn');
  modalButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const prize = btn.getAttribute('data-prize');
      handlePrizeSelection(prize);
    });
  });

  // Close Board Clicks
  document.getElementById('close-board-btn').addEventListener('click', () => {
    toggleBoard(false);
  });

  // Reset Board Data Clicks
  document.getElementById('reset-board-btn').addEventListener('click', () => {
    resetDraws();
  });

  // Clear individual prize winners click listeners
  const clearButtons = document.querySelectorAll('.clear-winner-btn');
  clearButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const prize = btn.getAttribute('data-prize');
      clearDraw(prize);
    });
  });
}

// Start application
init();
