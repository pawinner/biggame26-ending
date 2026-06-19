import { inject } from '@vercel/analytics';
import { initFirebase, listenToOverlayState } from './firebase.js';
import { fetchLeaderboardData } from './sheets.js';

inject();

let currentData = [];
let previousRevealLimit = null;

// Initialize whoosh sound
const whooshSound = new Audio('/sounds/Whoosh.mp3');

// Initialize Firebase
const firebaseActive = initFirebase();
console.log(`Firebase status in Overlay: ${firebaseActive ? 'Connected' : 'Local Fallback'}`);

// Initial load of sheet data
async function loadData() {
  currentData = await fetchLeaderboardData();
  console.log("Overlay data loaded:", currentData);
}

let currentSceneName = null;
let transitionTimeout = null;

// Render dynamic layouts based on control scene state
function handleStateChange(state) {
  const container = document.getElementById('overlay-content');
  if (!container) return;

  const newScene = state.currentScene || 'reset';
  console.log(`State update received. Target scene: ${newScene}`);

  // Helper to render the content for the target scene
  const performRender = () => {
    switch (newScene) {
      case 'rank-12-4':
        renderRanks(12, 4, state.revealLimit);
        break;
      case 'rank-3':
        renderSingleRank(3);
        break;
      case 'rank-2':
        renderSingleRank(2);
        break;
      case 'winner':
        renderWinner();
        break;
      case 'podium':
        renderPodium();
        break;
      case 'hide':
        container.innerHTML = ''; // Absolutely blank
        break;
      case 'reset':
      default:
        container.innerHTML = `
          <h1 class="glow-text">Ready for Cue</h1>
          <p class="subtitle">Waiting for controller events...</p>
        `;
        break;
    }
  };

  // If we are already in this scene, just update content (e.g. reveal limit changes)
  if (newScene === currentSceneName) {
    performRender();
    return;
  }

  // Clear any existing transition timeout
  if (transitionTimeout) {
    clearTimeout(transitionTimeout);
    transitionTimeout = null;
  }

  // Record the new scene name
  const previousScene = currentSceneName;
  currentSceneName = newScene;

  // Reset previous reveal limit on scene change to avoid playing sound on initial transition
  previousRevealLimit = null;

  // Helper to cleanly trigger a fade-in animation
  const triggerFadeIn = () => {
    container.classList.remove('fade-in', 'fade-out');
    void container.offsetWidth; // Force layout reflow
    container.classList.add('fade-in');
  };

  // If the previous scene was 'hide' or it's the initial load (previousScene === null),
  // we do not need to fade out (since it is already blank or just starting up).
  const shouldFadeOut = previousScene !== null && previousScene !== 'hide';

  if (shouldFadeOut) {
    // Add fade-out class to trigger animation
    container.classList.remove('fade-in');
    container.classList.add('fade-out');

    // Wait for the fade-out animation to complete (500ms) before rendering and fading in
    transitionTimeout = setTimeout(() => {
      performRender();
      triggerFadeIn();
      transitionTimeout = null;
    }, 500);
  } else {
    // Just render directly and apply fade-in
    performRender();
    triggerFadeIn();
  }
}

// Render 12th to 4th leaderboard
function renderRanks(startRank, endRank, revealLimit) {
  const container = document.getElementById('overlay-content');
  if (!container) return;

  const limit = revealLimit !== undefined ? revealLimit : 4;

  // Play whoosh sound when a new rank is revealed (limit decreases)
  if (previousRevealLimit !== null && limit < previousRevealLimit && limit >= 4 && limit <= 12) {
    whooshSound.currentTime = 0;
    whooshSound.play().catch(err => console.log('Audio playback prevented or failed:', err));
  }

  const getCardHtml = (rankNum) => {
    const team = currentData.find(t => t.rank === rankNum);
    const name = team ? team.name : '';
    const score = team ? team.score : 0;
    const isRevealed = rankNum >= limit;
    
    let displayName = '';
    let displayScore = '';
    let animClass = '';
    
    if (isRevealed && name) {
      displayName = name.toUpperCase();
      displayScore = score.toLocaleString();
      
      // If it was just revealed in this transition, give it an active reveal animation
      if (rankNum === limit && previousRevealLimit !== limit) {
        animClass = 'just-revealed';
      } else {
        animClass = 'revealed';
      }
    }

    return `
      <div class="rank-card" data-rank="${rankNum}">
        <span class="rank-number">${rankNum}.</span>
        <div class="card-content ${animClass}">
          <span class="team-name">${displayName}</span>
          <span class="team-score">${displayScore}</span>
        </div>
      </div>
    `;
  };

  const leftRanks = [4, 5, 6, 7];
  const rightRanks = [8, 9, 10, 11];
  const bottomRank = 12;

  let leftHtml = leftRanks.map(r => getCardHtml(r)).join('');
  let rightHtml = rightRanks.map(r => getCardHtml(r)).join('');
  let bottomHtml = getCardHtml(bottomRank);

  container.innerHTML = `
    <div class="leaderboard-container">
      <div class="columns-row">
        <div class="leaderboard-column">
          ${leftHtml}
        </div>
        <div class="leaderboard-column">
          ${rightHtml}
        </div>
      </div>
      <div class="bottom-container">
        ${bottomHtml}
      </div>
    </div>
  `;

  // Update previousRevealLimit for next render
  previousRevealLimit = limit;
}

// Render single ranking (e.g. 2nd or 3rd place highlight)
function renderSingleRank(rankNum) {
  const container = document.getElementById('overlay-content');
  const team = currentData.find(t => t.rank === rankNum);

  if (!team) {
    container.innerHTML = `<h1 class="glow-text">Rank #${rankNum}</h1><p class="subtitle">No data found</p>`;
    return;
  }

  // Choose colors based on place
  const color = rankNum === 2 ? '#cbd5e1' : '#b45309'; // Silver vs Bronze
  const label = rankNum === 2 ? '2nd Place' : '3rd Place';

  container.innerHTML = `
    <h2 style="font-size: 3rem; color: ${color}; text-transform: uppercase; margin-bottom: 1rem;">${label}</h2>
    <div style="background: rgba(30, 41, 59, 0.85); border: 2px solid ${color}; border-radius: 24px; padding: 3rem 5rem; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
      <h1 class="glow-text" style="font-size: 4rem; filter: drop-shadow(0 0 20px ${color});">${team.name}</h1>
      <p style="font-size: 2rem; color: ${color}; font-weight: 600; margin-top: 1rem;">${team.score.toLocaleString()}</p>
    </div>
  `;
}

// Render overall Winner (1st place)
function renderWinner() {
  const container = document.getElementById('overlay-content');
  const team = currentData.find(t => t.rank === 1);

  if (!team) {
    container.innerHTML = `<h1 class="glow-text">Winner</h1><p class="subtitle">No winner data found</p>`;
    return;
  }

  container.innerHTML = `
    <h2 style="font-size: 4rem; color: #fbbf24; text-transform: uppercase; margin-bottom: 1rem; letter-spacing: 0.1em; animation: pulse 1.5s infinite;">🏆 Big Game Winner 🏆</h2>
    <div style="background: rgba(15, 23, 42, 0.9); border: 3px solid #fbbf24; border-radius: 30px; padding: 4rem 8rem; text-align: center; box-shadow: 0 0 80px rgba(251, 191, 36, 0.3);">
      <h1 class="glow-text" style="font-size: 6rem; background: linear-gradient(to right, #fbbf24, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 40px rgba(251, 191, 36, 0.6));">${team.name}</h1>
      <p style="font-size: 2.5rem; color: #f59e0b; font-weight: 800; margin-top: 1.5rem;">Score: ${team.score.toLocaleString()}</p>
    </div>
  `;
}

// Render podium (1st, 2nd, 3rd) and ranks 4-12
function renderPodium() {
  const container = document.getElementById('overlay-content');
  if (!container) return;

  const t1 = currentData.find(t => t.rank === 1);
  const t2 = currentData.find(t => t.rank === 2);
  const t3 = currentData.find(t => t.rank === 3);

  const getCardHtml = (rankNum) => {
    const team = currentData.find(t => t.rank === rankNum);
    const name = team ? team.name : '';
    const score = team ? team.score : 0;
    
    return `
      <div class="rank-card" data-rank="${rankNum}">
        <span class="rank-number">${rankNum}.</span>
        <div class="card-content revealed">
          <span class="team-name">${name.toUpperCase()}</span>
          <span class="team-score">${score.toLocaleString()}</span>
        </div>
      </div>
    `;
  };

  const leftRanks = [4, 5, 6, 7];
  const rightRanks = [8, 9, 10, 11];
  const bottomRank = 12;

  let leftHtml = leftRanks.map(r => getCardHtml(r)).join('');
  let rightHtml = rightRanks.map(r => getCardHtml(r)).join('');
  let bottomHtml = getCardHtml(bottomRank);

  container.innerHTML = `
    <div class="podium-view-container">
      <div class="podium-top-section">
        <!-- 2nd Place -->
        <div class="podium-column second-place">
          <div class="podium-team-details">
            <span class="podium-rank-label silver">2nd Place</span>
            <div class="podium-team-name">${t2 ? t2.name.toUpperCase() : ''}</div>
            <div class="podium-team-score">${t2 ? t2.score.toLocaleString() : '0'}</div>
          </div>
          <div class="podium-pedestal">
            <span class="pedestal-number">2</span>
          </div>
        </div>

        <!-- 1st Place -->
        <div class="podium-column first-place">
          <div class="podium-team-details">
            <span class="podium-rank-label gold">🏆 1st Place 🏆</span>
            <div class="podium-team-name">${t1 ? t1.name.toUpperCase() : ''}</div>
            <div class="podium-team-score">${t1 ? t1.score.toLocaleString() : '0'}</div>
          </div>
          <div class="podium-pedestal">
            <span class="pedestal-number">1</span>
          </div>
        </div>

        <!-- 3rd Place -->
        <div class="podium-column third-place">
          <div class="podium-team-details">
            <span class="podium-rank-label bronze">3rd Place</span>
            <div class="podium-team-name">${t3 ? t3.name.toUpperCase() : ''}</div>
            <div class="podium-team-score">${t3 ? t3.score.toLocaleString() : '0'}</div>
          </div>
          <div class="podium-pedestal">
            <span class="pedestal-number">3</span>
          </div>
        </div>
      </div>

      <div class="podium-bottom-section">
        <div class="leaderboard-container">
          <div class="columns-row">
            <div class="leaderboard-column">
              ${leftHtml}
            </div>
            <div class="leaderboard-column">
              ${rightHtml}
            </div>
          </div>
          <div class="bottom-container">
            ${bottomHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Initialize Lifecycle
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  
  // Start listening to control commands
  listenToOverlayState((state) => {
    handleStateChange(state);
  });
});
