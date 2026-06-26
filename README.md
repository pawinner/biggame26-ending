# MDCU Freshy Camp 2026 - Central Dashboard & Event Operations

A real-time presentation dashboard, interactive game controllers, timers, and slot machine applications built for **MDCU Freshy Camp 2026**. This workspace coordinates central screens, mobile staff sync, lottery slot draws, and live broadcast overlays via OBS Studio.

---

## 📂 Project Structure & Navigation

The hub is divided into three key functional modules. You can launch any screen directly from the [Central Dashboard (index.html)](file:///Users/pawinner/Documents/Pawinner/Coding/VS%20Code/MDCU%20Freshy%20Camp%202026/biggame26-ending/index.html):

```
├── index.html                  # Central Dashboard Hub (Navigation Portal)
├── package.json                # Vite & dependency setup
├── wood-timer/                 # ⏳ Circular Timer & Spawn Coordination
│   ├── index.html              # Main Spawning Timer Screen (for Projector/Presenter)
│   ├── main.js                 # Timer render loop, keybindings & sound player
│   ├── staff.html              # Mobile Timer Sync Screen (for staff on field)
│   ├── staff.js                # Mobile rendering & audio unlock system
│   └── firebase-timer.js       # Firebase RTDB State Manager (with localStorage fallback)
├── lottery/                    # 🎰 3-Digit Slot Machine Prize Draw
│   ├── index.html              # 3-Digit Lottery slot board UI
│   ├── style.css               # Neon/cyberpunk animations & layouts
│   └── main.js                 # Slot lock engine, sound synthesizer & modal manager
└── biggame-ending/             # 🏆 Game Ending & Broadcaster Presentation
    ├── overlay.html            # OBS transparent 1080p Overlay (shows podium/prizes)
    ├── control.html            # Controller Panel for the production coordinator
    └── js/
        ├── control.js          # Controller action dispatcher
        ├── overlay.js          # OBS overlay animation engine (Reveals, Podium, Prizes)
        └── firebase.js         # Firebase RTDB state manager for ending overlay
```

---

## ⚡ Quick Start & Development

To run the project locally under hot reload:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start local development server:**
   ```bash
   npm run dev
   ```
   *By default, the server runs on [http://localhost:5173](http://localhost:5173).*

3. **Build production bundles:**
   ```bash
   npm run build
   ```

5. **Preview the production build:**
   ```bash
   npm run preview
   ```

---

## ⏳ 1. Wood Spawning Timer

A high-visibility circular countdown timer designed for large presentation screens, paired with a real-time synchronized lightweight screen for field staff.

### Screens:
*   [Main Spawning Board](file:///Users/pawinner/Documents/Pawinner/Coding/VS%20Code/MDCU%20Freshy%20Camp%202026/biggame26-ending/wood-timer/index.html): Fullscreen circular timer displaying active cycles (e.g., *Wood Spawn #3*). Drains in real-time, flashing red and sounding alarms under critical timing.
*   [Staff Mobile Timer](file:///Users/pawinner/Documents/Pawinner/Coding/VS%20Code/MDCU%20Freshy%20Camp%202026/biggame26-ending/wood-timer/staff.html): Scaled-down interface for staff mobile phones. Automatically unlocks sound output after clicking the start modal and features a large red **"DISASTER"** warning overlay when active.

### Keyboard Shortcuts (on Main Timer):
| Key | Action | Description |
| :--- | :--- | :--- |
| **`1`** | **Start/Restart Loop** | Begins a 30s timer with a 3-second "Get Ready" countdown. Plays a chime sound (`beep1.mp3`). |
| **`Space`** or **`p`** | **Pause/Resume** | Pauses or resumes the timer. Shifting duration coordinates dynamically to sync all staff. |
| **`d`** | **Toggle Disaster Mode** | Pauses the timer, turns the board and staff screens flashing red, and plays `disaster.mp3` for 15s. |
| **`t`** | **Toggle Times Up Mode** | Pauses the timer, turns the board and staff screens flashing red, and plays `wwtbamlose.mp3`. |
| **`f`** | **Play Disaster FX** | Local trigger to manually play `disaster.mp3` starting from the 16th second (local only). |
| **`5`** | **Play ELZ Jingle** | Plays custom audio asset `elzjingle.mp3`. |
| **`Esc`** or **`r`** | **Reset** | Stops all countdown loops, resets active states, and silences all sounds. |
| **`0`** | **Toggle Visibility** | Hides or shows the timer widget on the screen (useful for presentation shifts). |

---

## 🎰 2. 3-Digit Lottery Draw

An interactive 3-digit slot machine drawer styled with retro-cyberpunk aesthetics, synthesized sound effects (synthesized dynamically with the Web Audio API), constraints, and local caching.

### How to Play:
1. Press **`Q`**, **`W`**, and **`E`** to start the slots spinning.
2. Direct key numbers **`0` - `9`** are used to lock in the digit values *from left-to-right*.
3. **Digit Constraints**: To prevent accidental entries, digits will only lock if they are in the allowed pool:
    *   **Slot 1 (Q)**: Only accepts **`2`**, **`4`**, or **`8`**
    *   **Slot 2 (W)**: Only accepts **`1`**, **`3`**, **`5`**, **`6`**, or **`7`**
    *   **Slot 3 (E)**: Only accepts **`6`**, **`7`**, or **`9`**
    *   *If an invalid key is pressed, the slot shakes red and plays an error buzzer.*
4. When all three digits are locked, a **Prize Modal** pops up. Assign the combination to a prize tier or discard the draw.
5. Press **`B`** to open the **Summary Results Board** containing all logged winners.

### Keyboard Shortcuts:
| Key | Action | Description |
| :--- | :--- | :--- |
| **`q`** | **Spin Slot 1** | Begins rapid random cycle on the first digit (or unlocks it if already completed). |
| **`w`** | **Spin Slot 2** | Begins rapid random cycle on the second digit. |
| **`e`** | **Spin Slot 3** | Begins rapid random cycle on the third digit. |
| **`0` - `9`** | **Lock Digit** | Stops the currently active spinning slot and assigns the pressed number (if valid). |
| **`b`** | **Toggle Summary Board** | Toggles the overlay showing a breakdown of 1st, 2nd, and 3rd prize draws. |
| **`h`** | **Toggle Guide Overlay** | Toggles the screen guide revealing active hotkeys and allowed digit constraints. |
| **`Esc`** | **Cancel/Close** | Discards current spin states, closes active modals, and resets digits to `X X X`. |

#### Modal Action Shortcuts:
*   **`1`**: Assign current combination to **1st Prize**
*   **`2`**: Assign current combination to **2nd Prize**
*   **`3`**: Assign current combination to **3rd Prize**
*   **`d`**: **Discard Draw** and reset slot machine

---

## 🏆 3. Big Game Ending & OBS Overlay

A remote-controlled production package designed to announce standings, special prize awards, and show final podium placements.

### Screens:
*   [Overlay Controller Dashboard](file:///Users/pawinner/Documents/Pawinner/Coding/VS%20Code/MDCU%20Freshy%20Camp%202026/biggame26-ending/biggame-ending/control.html): Control center used by the operations desk to trigger overlays, cue transitions, and reveal leaderboard ranks.
*   [OBS Overlay Screen](file:///Users/pawinner/Documents/Pawinner/Coding/VS%20Code/MDCU%20Freshy%20Camp%202026/biggame26-ending/biggame-ending/overlay.html): 1920x1080 transparent backdrop added as a browser source inside OBS Studio. Responds instantly to controller updates.

### Controller Cues:
1.  **Announcements**:
    *   **ดวงซวยแห่งปี (Bad Luck Prize)**: Reveals the special unfortunate award winner.
    *   **คนดีของสังคม (Good Citizen Prize)**: Reveals the community service award winner.
    *   **Leaderboard (Ranks 12th - 4th)**: Cues the leaderboard view. Enables sub-controls to reveal ranks one by one:
        *   *Reveal Next*: Displays the next lower rank (starts at 12, works down to 4).
        *   *Hide Last*: Hides the last revealed rank.
        *   *Reveal All / Hide All*: Instantly reveals or hides the full 12-4 block.
    *   **3rd Place**: Displays the third-place podium winner with animations.
    *   **2nd Place**: Displays the runner-up podium winner.
    *   **Winner (1st Place)**: Triggers the championship banner reveal.
    *   **Podium (End Game)**: Displays the completed 1st, 2nd, and 3rd podium visual simultaneously.
2.  **System Controls**:
    *   **Reset Overlay**: Clears active transitions and returns all screens to standby.
    *   **Hide All**: Hides all overlays instantly.

---

## 🛠️ Synchronizations & Real-Time Sync

*   **Firebase Integration**: Firebase Realtime Database handles sync between the Controllers and the presentation screens (Timer Dashboard ⇄ Staff, Remote Controller ⇄ OBS Broadcast Overlay).
*   **Offline Fallback Mode**: If Firebase is unavailable or offline, the screens dynamically fall back to `localStorage` and `sessionStorage` triggers. This enables full manual testing of controller features in multi-tab window setups locally.
*   **Audio Engines**: Custom synthesized sounds (like slot clicks, win alarms, error ticks) use the native **Web Audio API** browser stack, ensuring immediate audio playbacks without requesting external sound asset files.
