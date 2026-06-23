import { initFirebaseTimer, listenToTimerState, watchConnection } from './firebase-timer.js';

const circumference = 880;

let state = {
  startTime: 0,
  durationMs: 30000,
  isRunning: false,
  isPaused: false,
  pausedAt: 0,
  disaster: false
};

// Initialize Beep Sound (played when clock hits 0)
const beep2Sound = new Audio('/sounds/beep2.mp3');
beep2Sound.volume = 0.8;
beep2Sound.preload = 'auto';

let lastCycle = 1;
let lastStartTime = 0;

// Unlock audio context on user interaction (Welcome Popup Modal)
const welcomeOverlay = document.getElementById('welcome-overlay');
const welcomeBtn = document.getElementById('welcome-btn');

function handleWelcomeClick() {
  // Play the sound fully to test it and unlock browser audio policy
  beep2Sound.currentTime = 0;
  beep2Sound.play().catch((err) => {
    console.error("Audio unlock/play failed:", err);
  });

  // Hide the welcome overlay
  if (welcomeOverlay) {
    welcomeOverlay.style.display = 'none';
  }
}

if (welcomeBtn) {
  welcomeBtn.addEventListener('click', handleWelcomeClick, { once: true });
}

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
  const disasterOverlay = document.getElementById('disaster-overlay');
  
  if (newState && newState.disaster) {
    if (disasterOverlay) {
      disasterOverlay.style.display = 'flex';
    }
  } else {
    if (disasterOverlay) {
      disasterOverlay.style.display = 'none';
    }
  }

  state = newState;
}

// Render loop using requestAnimationFrame
function updateUI() {
  const timeDisplay = document.getElementById('time-display');
  const timeLabel = document.getElementById('time-label');
  const progressCircle = document.getElementById('timer-progress');
  const cycleBadge = document.getElementById('cycle-badge');
  const pausedBadge = document.getElementById('paused-badge');
  const timerApp = document.getElementById('timer-app');

  if (!state || !state.isRunning) {
    timeDisplay.textContent = '30';
    timeLabel.textContent = 'Ready';
    progressCircle.style.strokeDashoffset = '0';
    cycleBadge.style.display = 'none';
    pausedBadge.style.display = 'none';
    timerApp.classList.remove('low-time');
    lastCycle = 1;
    lastStartTime = 0;
    return;
  }

  let remainingTimeMs = 0;
  let cycle = 1;
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
      lastCycle = 1;
    } else {
      const timerElapsedMs = elapsedMs - countdownDurationMs;
      lastCycle = Math.floor(timerElapsedMs / state.durationMs) + 1;
    }
    lastStartTime = state.startTime;
  }

  if (elapsedMs < countdownDurationMs) {
    cycle = 1;
    // Update cycle info badge
    cycleBadge.style.display = 'inline-block';
    cycleBadge.textContent = `Wood Spawn #1`;

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
  cycle = Math.floor(timerElapsedMs / state.durationMs) + 1;
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
