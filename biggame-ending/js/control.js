import { initFirebase, setOverlayState } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const statusBar = document.getElementById('status-bar');
  const buttons = document.querySelectorAll('.cue-btn');

  // Initialize Firebase
  const firebaseActive = initFirebase();
  
  // Update status bar UI
  if (statusBar) {
    if (firebaseActive) {
      statusBar.textContent = "Firebase Connected (Live Sync)";
      statusBar.className = "status-connected";
    } else {
      statusBar.textContent = "Local Sync Mode (Same Browser Tab Testing)";
      statusBar.className = "status-disconnected";
      statusBar.style.color = "#f59e0b";
      statusBar.style.borderColor = "rgba(245, 158, 11, 0.2)";
      statusBar.style.backgroundColor = "rgba(245, 158, 11, 0.1)";
    }
  }

  // Bind click events to control buttons
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      const action = button.getAttribute('data-action');
      if (!action) return;

      console.log(`Cue button clicked: ${action}`);

      // Highlight active button briefly
      const originalBg = button.style.backgroundColor;
      button.style.filter = "brightness(1.3)";
      setTimeout(() => {
        button.style.filter = "";
      }, 200);

      // Publish the active scene update
      setOverlayState({
        currentScene: action,
        timestamp: Date.now()
      });
    });
  });
});
