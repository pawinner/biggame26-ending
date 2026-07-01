import { initFirebaseTimer, setTimerState, listenToTimerState, watchConnection } from './firebase-timer.js';

const circumference = 880;

let state = {
  startTime: 0,
  durationMs: 30000,
  isRunning: false,
  isPaused: false,
  pausedAt: 0,
  disaster: false,
  timesUp: false
};

// Initialize Disaster Sound
const disasterSound = new Audio('/sounds/disaster.mp3');
disasterSound.volume = 0.8;
disasterSound.preload = 'auto';

let disasterSoundPlayMode = null; // 'd' for disaster mode, 'f' for F key, or null

// Initialize Times Up Sound
const timesUpSound = new Audio('/sounds/wwtbamlose.mp3');
timesUpSound.volume = 0.8;
timesUpSound.preload = 'auto';

// Limit disaster mode sound to 15 seconds
disasterSound.addEventListener('timeupdate', () => {
  if (disasterSoundPlayMode === 'd' && disasterSound.currentTime >= 15) {
    disasterSound.pause();
    disasterSound.currentTime = 0;
    disasterSoundPlayMode = null;
  }
});

// Reset play mode when sound finishes naturally
disasterSound.addEventListener('ended', () => {
  disasterSoundPlayMode = null;
});

// Initialize Beep 1 Sound (played when start/restarting)
const beep1Sound = new Audio('/sounds/beep1.mp3');
beep1Sound.volume = 0.8;
beep1Sound.preload = 'auto';

// Initialize Beep 2 Sound (played when clock hits 0)
const beep2Sound = new Audio('/sounds/beep2.mp3');
beep2Sound.volume = 0.8;
beep2Sound.preload = 'auto';

// Initialize ELZ Jingle Sound
const elzJingleSound = new Audio('/sounds/elzjingle.mp3');
elzJingleSound.volume = 0.8;
elzJingleSound.preload = 'auto';

let lastCycle = 0;
let lastStartTime = 0;

// --- Canvas Particle System ---
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

let particles = [];

function resizeCanvas() {
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
  constructor() {
    this.reset();
    if (canvas) {
      this.y = Math.random() * canvas.height;
    }
  }

  reset() {
    if (canvas) {
      this.x = Math.random() * canvas.width;
      this.y = canvas.height + 20;
    } else {
      this.x = 0;
      this.y = 0;
    }
    this.radius = Math.random() * 2.5 + 0.5;
    this.speedY = Math.random() * 0.8 + 0.2;
    this.speedX = Math.random() * 0.4 - 0.2;
    
    // Default indigo color
    this.r = 99;
    this.g = 102;
    this.b = 241;
    this.alpha = Math.random() * 0.5 + 0.1;
  }

  update(currentMode, isLowTime) {
    let speedMult = 1.0;
    
    if (currentMode === 'disaster') {
      this.r = 239;
      this.g = 68;
      this.b = 68;
      speedMult = 3.5;
      this.speedX += (Math.random() * 0.4 - 0.2);
      this.speedX = Math.max(-2, Math.min(2, this.speedX));
    } else if (currentMode === 'timesup') {
      this.r = 244;
      this.g = 63;
      this.b = 94;
      speedMult = 2.0;
    } else if (currentMode === 'paused') {
      this.r = 245;
      this.g = 158;
      this.b = 11;
      speedMult = 0.2;
    } else if (isLowTime) {
      this.r = 249;
      this.g = 115;
      this.b = 22;
      speedMult = 2.0;
    } else if (currentMode === 'running') {
      this.r = 99;
      this.g = 102;
      this.b = 241;
      speedMult = 1.0;
    } else {
      this.r = 148;
      this.g = 163;
      this.b = 184;
      speedMult = 0.5;
    }

    this.y -= this.speedY * speedMult;
    this.x += this.speedX * speedMult;

    if (this.y < 0) {
      this.reset();
    }
  }

  draw() {
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${this.alpha})`;
    ctx.fill();
  }
}

// Initialize particles
const particleCount = 75;
if (canvas) {
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
}

function animateParticles() {
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  let currentMode = 'idle';
  let isLowTime = false;

  if (state && state.isRunning) {
    if (state.isPaused) {
      currentMode = 'paused';
    } else {
      currentMode = 'running';
    }
  }
  if (state && state.disaster) {
    currentMode = 'disaster';
  }
  if (state && state.timesUp) {
    currentMode = 'timesup';
  }

  if (state && state.isRunning && !state.isPaused && !state.disaster && !state.timesUp) {
    const elapsedMs = Date.now() - state.startTime;
    const countdownDurationMs = 3000;
    if (elapsedMs >= countdownDurationMs) {
      const timerElapsedMs = elapsedMs - countdownDurationMs;
      const msInCycle = timerElapsedMs % state.durationMs;
      const remainingTimeMs = Math.max(0, state.durationMs - msInCycle);
      if (remainingTimeMs < 10000) {
        isLowTime = true;
      }
    }
  }

  particles.forEach(p => {
    p.update(currentMode, isLowTime);
    p.draw();
  });

  requestAnimationFrame(animateParticles);
}
// Start particle animation
animateParticles();

// Initialize Firebase
const isConnected = initFirebaseTimer();

// Connection status DOM elements
const connStatus = document.getElementById('conn-status');
const connStatusText = document.getElementById('conn-status-text');

if (isConnected) {
  watchConnection((connected) => {
    if (connected) {
      connStatus.className = 'status-badge status-connected';
      connStatusText.textContent = 'Synced';
    } else {
      connStatus.className = 'status-badge status-disconnected';
      connStatusText.textContent = 'Offline';
    }
  });

  listenToTimerState((newState) => {
    handleStateUpdate(newState);
  });
} else {
  // Local storage fallback
  connStatus.className = 'status-badge status-disconnected';
  connStatusText.textContent = 'Local Only';
  listenToTimerState((newState) => {
    handleStateUpdate(newState);
  });
}

function handleStateUpdate(newState) {
  const disasterTransitionedOn = newState && newState.disaster && (!state || !state.disaster);
  const timesUpTransitionedOn = newState && newState.timesUp && (!state || !state.timesUp);

  if (newState && newState.disaster) {
    document.body.classList.add('disaster-flash');
    if (disasterTransitionedOn) {
      disasterSoundPlayMode = 'd';
      disasterSound.currentTime = 0;
      disasterSound.play().catch((err) => console.warn("Audio play blocked by browser:", err));
    }
  } else {
    document.body.classList.remove('disaster-flash');
    if (disasterSoundPlayMode === 'd') {
      disasterSound.pause();
      disasterSound.currentTime = 0;
      disasterSoundPlayMode = null;
    }
  }

  const timesUpOverlay = document.getElementById('times-up-overlay');

  if (newState && newState.timesUp) {
    document.body.classList.add('times-up-flash');
    if (timesUpOverlay) {
      timesUpOverlay.style.display = 'flex';
    }
    if (timesUpTransitionedOn) {
      timesUpSound.currentTime = 0;
      timesUpSound.play().catch((err) => console.warn("Audio play blocked by browser:", err));
    }
  } else {
    document.body.classList.remove('times-up-flash');
    if (timesUpOverlay) {
      timesUpOverlay.style.display = 'none';
    }
    if (state && state.timesUp) {
      timesUpSound.pause();
      timesUpSound.currentTime = 0;
    }
  }

  state = newState;
}

// Render loop using requestAnimationFrame
function updateUI() {
  // Sync Body Classes for CSS Ambient Glow / Tech Rings
  let currentMode = 'idle';
  let isLowTime = false;

  if (state) {
    if (state.disaster) {
      currentMode = 'disaster';
    } else if (state.timesUp) {
      currentMode = 'timesup';
    } else if (state.isRunning) {
      if (state.isPaused) {
        currentMode = 'paused';
      } else {
        currentMode = 'running';
        
        const elapsedMs = Date.now() - state.startTime;
        const countdownDurationMs = 3000;
        if (elapsedMs >= countdownDurationMs) {
          const timerElapsedMs = elapsedMs - countdownDurationMs;
          const msInCycle = timerElapsedMs % state.durationMs;
          const remainingTimeMs = Math.max(0, state.durationMs - msInCycle);
          if (remainingTimeMs < 10000) {
            isLowTime = true;
          }
        }
      }
    }
  }

  const possibleClasses = ['state-running', 'state-lowtime', 'state-paused', 'state-disaster', 'state-timesup'];
  let targetClass = '';
  if (currentMode === 'disaster') targetClass = 'state-disaster';
  else if (currentMode === 'timesup') targetClass = 'state-timesup';
  else if (currentMode === 'paused') targetClass = 'state-paused';
  else if (currentMode === 'running') {
    targetClass = isLowTime ? 'state-lowtime' : 'state-running';
  }

  possibleClasses.forEach(c => {
    if (c === targetClass) {
      document.body.classList.add(c);
    } else {
      document.body.classList.remove(c);
    }
  });

  const timeDisplay = document.getElementById('time-display');
  const timeLabel = document.getElementById('time-label');
  const progressCircle = document.getElementById('timer-progress');
  const cycleBadge = document.getElementById('cycle-badge');
  const pausedBadge = document.getElementById('paused-badge');
  const timerApp = document.getElementById('timer-app');

  if (!state || !state.isRunning) {
    timeDisplay.textContent = '30';
    timeLabel.textContent = 'seconds';
    progressCircle.style.strokeDashoffset = '0';
    cycleBadge.style.display = 'none';
    pausedBadge.style.display = 'none';
    timerApp.classList.remove('low-time');
    lastCycle = 0;
    lastStartTime = 0;
    return;
  }

  let remainingTimeMs = 0;
  let cycle = 0;
  let elapsedMs = 0;

  if (state.isPaused) {
    elapsedMs = state.pausedAt - state.startTime;
    pausedBadge.style.display = 'inline-block';
  } else {
    elapsedMs = Date.now() - state.startTime;
    pausedBadge.style.display = 'none';
  }

  const countdownDurationMs = 3000;

  // Detect restart or resume (shift of startTime)
  if (state.startTime !== lastStartTime) {
    if (elapsedMs < countdownDurationMs) {
      lastCycle = 0;
    } else {
      const timerElapsedMs = elapsedMs - countdownDurationMs;
      lastCycle = Math.floor(timerElapsedMs / state.durationMs);
    }
    lastStartTime = state.startTime;
  }

  if (elapsedMs < countdownDurationMs) {
    cycle = 0;
    // Update cycle info badge
    cycleBadge.style.display = 'inline-block';
    cycleBadge.textContent = `Wood Spawn #0`;

    // Keep circle full
    progressCircle.style.strokeDashoffset = '0';

    // 3-2-1 countdown
    const countdownSeconds = Math.ceil((countdownDurationMs - elapsedMs) / 1000);
    timeDisplay.textContent = countdownSeconds;
    timeLabel.textContent = 'Get Ready';
    timerApp.classList.remove('low-time');
    return;
  }

  // Adjust elapsed time by subtracting the countdown duration
  const timerElapsedMs = elapsedMs - countdownDurationMs;
  cycle = Math.floor(timerElapsedMs / state.durationMs);
  const msInCycle = timerElapsedMs % state.durationMs;
  remainingTimeMs = Math.max(0, state.durationMs - msInCycle);

  // Play beep2.mp3 when the clock hits 0 on every loop
  if (cycle > lastCycle) {
    beep2Sound.currentTime = 0;
    beep2Sound.play().catch((err) => console.warn("Audio play blocked by browser:", err));
    lastCycle = cycle;
  }

  // Update cycle info badge
  cycleBadge.style.display = 'inline-block';
  cycleBadge.textContent = `Wood Spawn #${cycle}`;

  // Calculate percentage & ring offset (iOS style - circle drains out)
  const percent = remainingTimeMs / state.durationMs;
  const offset = circumference * (1 - percent);
  progressCircle.style.strokeDashoffset = offset;

  // Format countdown text
  const seconds = remainingTimeMs / 1000;
  if (seconds > 10) {
    timeDisplay.textContent = Math.ceil(seconds);
    timeLabel.textContent = 'seconds';
    timerApp.classList.remove('low-time');
  } else {
    // Decimals for tension in final 10 seconds
    timeDisplay.textContent = seconds.toFixed(1);
    timeLabel.textContent = 'seconds';
    timerApp.classList.add('low-time');
  }
}

function tick() {
  updateUI();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// Keyboard hotkey listeners
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  const key = e.key.toLowerCase();

  if (key === '1') {
    // Play beep1
    beep1Sound.currentTime = 0;
    beep1Sound.play().catch((err) => console.warn("Audio play blocked by browser:", err));

    // Start / Restart Loop (30s)
    const newState = {
      startTime: Date.now(),
      durationMs: 30000,
      isRunning: true,
      isPaused: false,
      pausedAt: 0,
      disaster: false,
      timesUp: false
    };
    setTimerState(newState);
  } else if (e.key === ' ' || key === 'p') {
    // Pause / Resume (prevent Space bar screen scrolling)
    e.preventDefault();
    if (state.isRunning) {
      const newState = { ...state };
      if (state.isPaused) {
        // Resume: shift startTime forward by the paused duration
        const elapsedBeforePause = state.pausedAt - state.startTime;
        newState.startTime = Date.now() - elapsedBeforePause;
        newState.isPaused = false;
        newState.pausedAt = 0;
      } else {
        // Pause: freeze elapsed time
        newState.isPaused = true;
        newState.pausedAt = Date.now();
      }
      setTimerState(newState);
    }
  } else if (key === 'd') {
    // Toggle Disaster Mode
    const newState = { ...state };
    if (!state.disaster) {
      newState.disaster = true;
      newState.timesUp = false;
      // Pause timer if it is currently running
      if (state.isRunning && !state.isPaused) {
        newState.isPaused = true;
        newState.pausedAt = Date.now();
      }
    } else {
      newState.disaster = false;
    }
    setTimerState(newState);
  } else if (key === 't') {
    // Toggle Times Up Mode
    const newState = { ...state };
    if (!state.timesUp) {
      newState.timesUp = true;
      newState.disaster = false;
      // Pause timer if it is currently running
      if (state.isRunning && !state.isPaused) {
        newState.isPaused = true;
        newState.pausedAt = Date.now();
      }
    } else {
      newState.timesUp = false;
    }
    setTimerState(newState);
  } else if (key === 'f') {
    // Play/Pause disaster sound from 15 seconds (local only)
    if (disasterSoundPlayMode === 'f') {
      disasterSound.pause();
      disasterSound.currentTime = 0;
      disasterSoundPlayMode = null;
    } else {
      disasterSoundPlayMode = 'f';
      disasterSound.currentTime = 16;
      disasterSound.play().catch((err) => console.warn("Audio play blocked by browser:", err));
    }
  } else if (key === '5') {
    // Play ELZ Jingle
    elzJingleSound.currentTime = 0;
    elzJingleSound.play().catch((err) => console.warn("Audio play blocked by browser:", err));
  } else if (e.key === 'Escape' || key === 'r') {
    // Reset / Stop
    disasterSound.pause();
    disasterSound.currentTime = 0;
    disasterSoundPlayMode = null;
    elzJingleSound.pause();
    elzJingleSound.currentTime = 0;
    timesUpSound.pause();
    timesUpSound.currentTime = 0;

    const newState = {
      startTime: 0,
      durationMs: 30000,
      isRunning: false,
      isPaused: false,
      pausedAt: 0,
      disaster: false,
      timesUp: false
    };
    setTimerState(newState);
  } else if (key === '0') {
    // Toggle Timer Visibility on Big Screen
    document.body.classList.toggle('timer-hidden');
  } else if (key === 'h') {
    // Toggle Hotkeys Panel visibility
    const hotkeyPanel = document.getElementById('hotkey-panel');
    if (hotkeyPanel) {
      hotkeyPanel.classList.toggle('hidden');
    }
  }
});

