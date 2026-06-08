import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

// Firebase configuration (Placeholder)
// You will replace these details later from the Firebase Console.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let app;
let db;
let isInitialized = false;

export function initFirebase() {
  if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.warn("Firebase credentials are not set yet. Running in local fallback mode.");
    return false;
  }
  
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
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
