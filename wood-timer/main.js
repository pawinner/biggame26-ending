import { initFirebaseTimer, setTimerState, listenToTimerState, watchConnection } from './firebase-timer.js';

const circumference = 880;

let state = {
  startTime: 0,
  durationMs: 30000,
  isRunning: false,
  isPaused: false,
  pausedAt: 0,
  disaster: false
};

// Initialize Disaster Sound
const disasterSound = new Audio('/sounds/disaster.mp3');
disasterSound.volume = 0.8;
disasterSound.preload = 'auto';

// Initialize Beep 1 Sound (played when start/restarting)
const beep1Sound = new Audio('/sounds/beep1.mp3');
beep1Sound.volume = 0.8;
beep1Sound.preload = 'auto';

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
  // Check if disaster state transitioned
  if (newState && newState.disaster) {
    document.body.classList.add('disaster-flash');
    if (disasterSound.paused) {
      disasterSound.currentTime = 0;
      disasterSound.play().catch((err) => console.warn("Audio play blocked by browser:", err));
    }
  } else {
    document.body.classList.remove('disaster-flash');
    disasterSound.pause();
    disasterSound.currentTime = 0;
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
    timeLabel.textContent = 'seconds';
    progressCircle.style.strokeDashoffset = '0';
    cycleBadge.style.display = 'none';
    pausedBadge.style.display = 'none';
    timerApp.classList.remove('low-time');
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
      disaster: false
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
      // Pause timer if it is currently running
      if (state.isRunning && !state.isPaused) {
        newState.isPaused = true;
        newState.pausedAt = Date.now();
      }
    } else {
      newState.disaster = false;
    }
    setTimerState(newState);
  } else if (e.key === 'Escape' || key === 'r') {
    // Reset / Stop
    const newState = {
      startTime: 0,
      durationMs: 30000,
      isRunning: false,
      isPaused: false,
      pausedAt: 0,
      disaster: false
    };
    setTimerState(newState);
  } else if (key === '0') {
    // Toggle Timer Visibility on Big Screen
    document.body.classList.toggle('timer-hidden');
  }
});
