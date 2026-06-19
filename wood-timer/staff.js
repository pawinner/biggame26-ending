import { initFirebaseTimer, listenToTimerState, watchConnection } from './firebase-timer.js';

const circumference = 880;

let state = {
  startTime: 0,
  durationMs: 60000,
  isRunning: false,
  isPaused: false,
  pausedAt: 0,
  disaster: false
};

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
    timeDisplay.textContent = '60';
    timeLabel.textContent = 'Ready';
    progressCircle.style.strokeDashoffset = '0';
    cycleBadge.style.display = 'none';
    pausedBadge.style.display = 'none';
    timerApp.classList.remove('low-time');
    return;
  }

  let remainingTimeMs = 0;
  let cycle = 1;

  if (state.isPaused) {
    const elapsedBeforePause = state.pausedAt - state.startTime;
    cycle = Math.floor(elapsedBeforePause / state.durationMs) + 1;
    const msInCycle = elapsedBeforePause % state.durationMs;
    remainingTimeMs = Math.max(0, state.durationMs - msInCycle);
    pausedBadge.style.display = 'inline-block';
  } else {
    const elapsedMs = Date.now() - state.startTime;
    cycle = Math.floor(elapsedMs / state.durationMs) + 1;
    const msInCycle = elapsedMs % state.durationMs;
    remainingTimeMs = Math.max(0, state.durationMs - msInCycle);
    pausedBadge.style.display = 'none';
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
