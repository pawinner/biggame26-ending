import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDNMu9-lXy-RHnxee2Fc7uBI-tE9fYBKOQ",
  authDomain: "biggame26-ending.firebaseapp.com",
  databaseURL: "https://biggame26-ending-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "biggame26-ending",
  storageBucket: "biggame26-ending.firebasestorage.app",
  messagingSenderId: "789565679516",
  appId: "1:789565679516:web:0efb859d29338f38264a59",
  measurementId: "G-2BDH98RY5J"
};

let app;
let db;
let isInitialized = false;

export function initFirebaseTimer() {
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    isInitialized = true;
    return true;
  } catch (error) {
    console.error("Failed to initialize Firebase for Timer:", error);
    return false;
  }
}

export function setTimerState(state) {
  if (!isInitialized) {
    // Fallback locally
    localStorage.setItem('local_timer_state', JSON.stringify(state));
    window.dispatchEvent(new Event('storage'));
    return;
  }
  const stateRef = ref(db, 'wood-timer/state');
  set(stateRef, state).catch(err => console.error("Error setting Firebase state:", err));
}

export function listenToTimerState(callback) {
  if (!isInitialized) {
    // Fallback locally
    window.addEventListener('storage', () => {
      const localState = localStorage.getItem('local_timer_state');
      if (localState) {
        callback(JSON.parse(localState));
      }
    });
    const localState = localStorage.getItem('local_timer_state');
    if (localState) {
      callback(JSON.parse(localState));
    }
    return;
  }

  const stateRef = ref(db, 'wood-timer/state');
  onValue(stateRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
}

// Watch connection status
export function watchConnection(onStatusChange) {
  if (!isInitialized) {
    onStatusChange(false);
    return;
  }
  const connectedRef = ref(db, '.info/connected');
  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      onStatusChange(true);
    } else {
      onStatusChange(false);
    }
  });
}
