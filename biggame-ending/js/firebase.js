import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
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
let analytics;
let isInitialized = false;

export function initFirebase() {
  if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.warn("Firebase credentials are not set yet. Running in local fallback mode.");
    return false;
  }
  
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    // Initialize analytics optionally (might fail or be blocked in OBS/certain environments, so wrap in try-catch)
    try {
      analytics = getAnalytics(app);
    } catch (analyticsError) {
      console.warn("Analytics initialization skipped or blocked:", analyticsError);
    }
    isInitialized = true;
    return true;
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    return false;
  }
}

// Write new state (used by Controller)
// Example: setOverlayState({ currentScene: 'rank-3', timestamp: Date.now() })
export function setOverlayState(state) {
  if (!isInitialized) {
    // Fallback: Dispatch a local custom event (works on the same page/window for testing)
    const event = new CustomEvent('overlay-state-changed', { detail: state });
    window.dispatchEvent(event);
    
    // Save to localStorage so overlay page on the same browser window can sync locally
    localStorage.setItem('local_overlay_state', JSON.stringify(state));
    window.dispatchEvent(new Event('storage'));
    return;
  }
  
  const stateRef = ref(db, 'overlay/state');
  set(stateRef, state)
    .catch((err) => console.error("Error setting Firebase state:", err));
}

// Read and listen to state updates (used by Overlay)
export function listenToOverlayState(callback) {
  if (!isInitialized) {
    // Fallback: Listen to local events/storage for testing without Firebase config
    window.addEventListener('storage', () => {
      const localState = localStorage.getItem('local_overlay_state');
      if (localState) {
        callback(JSON.parse(localState));
      }
    });

    window.addEventListener('overlay-state-changed', (e) => {
      callback(e.detail);
    });

    // Initial load check
    const localState = localStorage.getItem('local_overlay_state');
    if (localState) {
      callback(JSON.parse(localState));
    }
    return;
  }

  const stateRef = ref(db, 'overlay/state');
  onValue(stateRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
}
