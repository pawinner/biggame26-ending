import { initFirebase, listenToOverlayState } from './firebase.js';
import { fetchLeaderboardData } from './sheets.js';

let currentData = [];

// Initialize Firebase
const firebaseActive = initFirebase();
console.log(`Firebase status in Overlay: ${firebaseActive ? 'Connected' : 'Local Fallback'}`);

// Initial load of sheet data
async function loadData() {
  currentData = await fetchLeaderboardData();
  console.log("Overlay data loaded:", currentData);
}

// Render dynamic layouts based on control scene state
function handleStateChange(state) {
  const container = document.getElementById('overlay-content');
  if (!container) return;

  // Clear active styling classes
  container.className = 'fade-in';
  
  const scene = state.currentScene || 'reset';
  console.log(`Transitioning to overlay scene: ${scene}`);

  switch (scene) {
    case 'rank-12-4':
      renderRanks(12, 4);
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
    case 'hide':
    case 'reset':
    default:
      container.innerHTML = `
        <h1 class="glow-text">Ready for Cue</h1>
        <p class="subtitle">Waiting for controller events...</p>
      `;
      break;
  }
}

// Render 12th to 4th leaderboard
function renderRanks(startRank, endRank) {
  const container = document.getElementById('overlay-content');
  const filtered = currentData.filter(team => team.rank <= startRank && team.rank >= endRank);

  let html = `
    <h2 style="font-size: 2.5rem; margin-bottom: 2rem; color: #818cf8; text-transform: uppercase;">Leaderboard (12th - 4th)</h2>
    <div style="display: flex; flex-direction: column; gap: 1rem; width: 600px; max-height: 700px;">
  `;

  filtered.forEach(team => {
    html += `
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 0.75rem 1.5rem;">
        <span style="font-weight: 700; color: #f59e0b; font-size: 1.25rem;">#${team.rank}</span>
        <span style="font-weight: 500; font-size: 1.25rem;">${team.name}</span>
        <span style="color: #a5b4fc; font-weight: 600; font-size: 1.25rem;">${team.score.toLocaleString()}</span>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
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
    <h2 style="font-size: 4rem; color: #fbbf24; text-transform: uppercase; margin-bottom: 1rem; letter-spacing: 0.1em; animation: pulse 1.5s infinite;">🏆 Camp Champion 🏆</h2>
    <div style="background: rgba(15, 23, 42, 0.9); border: 3px solid #fbbf24; border-radius: 30px; padding: 4rem 8rem; text-align: center; box-shadow: 0 0 80px rgba(251, 191, 36, 0.3);">
      <h1 class="glow-text" style="font-size: 6rem; background: linear-gradient(to right, #fbbf24, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 40px rgba(251, 191, 36, 0.6));">${team.name}</h1>
      <p style="font-size: 2.5rem; color: #f59e0b; font-weight: 800; margin-top: 1.5rem;">Score: ${team.score.toLocaleString()}</p>
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
