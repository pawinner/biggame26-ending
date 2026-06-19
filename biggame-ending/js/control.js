import { inject } from '@vercel/analytics';
import { initFirebase, setOverlayState, listenToOverlayState } from './firebase.js';

inject();

document.addEventListener('DOMContentLoaded', () => {
  const statusBar = document.getElementById('status-bar');
  const buttons = document.querySelectorAll('.cue-btn:not(.reveal-btn)');

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

  // Track the current overlay state
  let currentScene = 'reset';
  let currentRevealLimit = 13;

  const revealControls = document.getElementById('reveal-controls-section');
  const revealStatus = document.getElementById('reveal-status');
  const revealNextBtn = document.getElementById('reveal-next-btn');
  const revealPrevBtn = document.getElementById('reveal-prev-btn');
  const revealAllBtn = document.getElementById('reveal-all-btn');
  const revealNoneBtn = document.getElementById('reveal-none-btn');

  // Synchronize controller UI with the database state
  listenToOverlayState((state) => {
    currentScene = state.currentScene || 'reset';
    currentRevealLimit = state.revealLimit !== undefined ? state.revealLimit : 13;

    // Show/hide reveal sub-controls based on active scene
    if (revealControls && revealStatus) {
      if (currentScene === 'rank-12-4') {
        revealControls.style.display = 'block';
        if (currentRevealLimit > 12) {
          revealStatus.textContent = "Current Reveal Status: All Hidden (None)";
        } else if (currentRevealLimit === 4) {
          revealStatus.textContent = "Current Reveal Status: All Revealed (Ranks 12 - 4)";
        } else {
          revealStatus.textContent = `Current Reveal Status: Ranks 12 down to ${currentRevealLimit}`;
        }
      } else {
        revealControls.style.display = 'none';
      }
    }

    // Highlight the button of the active scene
    buttons.forEach(btn => {
      const action = btn.getAttribute('data-action');
      if (action === currentScene) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  });

  // Bind click events to main control buttons (Announcements & System controls)
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      const action = button.getAttribute('data-action');
      if (!action) return;

      console.log(`Cue button clicked: ${action}`);

      // Highlight active button briefly
      button.style.filter = "brightness(1.3)";
      setTimeout(() => {
        button.style.filter = "";
      }, 200);

      // Create update state
      const stateUpdate = {
        currentScene: action,
        timestamp: Date.now()
      };

      // Reset reveal limit to 13 (none revealed) when selecting 12-4 scene
      if (action === 'rank-12-4') {
        stateUpdate.revealLimit = 13;
      }

      // Publish the active scene update
      setOverlayState(stateUpdate);
    });
  });

  // Bind click events to Reveal controls
  if (revealNextBtn) {
    revealNextBtn.addEventListener('click', () => {
      if (currentRevealLimit > 4) {
        const nextLimit = currentRevealLimit - 1;
        setOverlayState({
          currentScene: currentScene,
          revealLimit: nextLimit,
          timestamp: Date.now()
        });
      }
    });
  }

  if (revealPrevBtn) {
    revealPrevBtn.addEventListener('click', () => {
      if (currentRevealLimit < 13) {
        const nextLimit = currentRevealLimit + 1;
        setOverlayState({
          currentScene: currentScene,
          revealLimit: nextLimit,
          timestamp: Date.now()
        });
      }
    });
  }

  if (revealAllBtn) {
    revealAllBtn.addEventListener('click', () => {
      setOverlayState({
        currentScene: currentScene,
        revealLimit: 4,
        timestamp: Date.now()
      });
    });
  }

  if (revealNoneBtn) {
    revealNoneBtn.addEventListener('click', () => {
      setOverlayState({
        currentScene: currentScene,
        revealLimit: 13,
        timestamp: Date.now()
      });
    });
  }
});
