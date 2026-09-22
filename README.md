# 🐾 Desktop AI Pet Companion (Bat-Buddy)

> An animated, transparent, always-on-top desktop companion that visits you to nudge you to drink water, stretch, and take breaks, with built-in chat, draggable summon controls, health records, and customizable AI mode.

---

## ⚡ Quick Start & Deployment

### 1. Launching from Source
- **Windows**: Simply double-click **[`run.bat`](file:///C:/Users/durga/Desktop/nightwatch/run.bat)** (or run `npm start`).
- **Mac / Linux**: Open a terminal in this folder and run `./run.sh` or `npm start`.

### 2. Standalone Windows Executable
A self-contained Windows application package has been built:
- **Location**: `dist/Nightwatch Desktop Companion-win32-x64/`
- **Executable**: `dist/Nightwatch Desktop Companion-win32-x64/Nightwatch Desktop Companion.exe`
- Share the full folder as a ZIP rather than the `.exe` alone; Electron requires its adjacent runtime files.
- Publish `dist/Nightwatch-Desktop-Companion-win32-x64.zip` as the `v1.0.0` GitHub Release asset so the landing-page download links work.
- To rebuild the package anytime, run:
  ```bash
  npm run package
  ```

### 3. Product Landing Page & Web Simulator
A dedicated landing website with direct download links and an interactive live simulator is available in [`website/`](file:///C:/Users/durga/Desktop/nightwatch/website/):
- Double-click **[`open-website.bat`](file:///C:/Users/durga/Desktop/nightwatch/open-website.bat)** to preview the site locally in your browser.
- Deployable to **GitHub Pages**, **Vercel**, or **Netlify** by pointing to the `website/` folder.

### 4. If the Pet or Button ever disappears off-screen:
- Double-click **[`reset-positions.bat`](file:///C:/Users/durga/Desktop/nightwatch/reset-positions.bat)**. This immediately anchors both the pet and the summon button back to the visible bottom-right corner of your screen!

---

## 🌟 Features & Controls

### 1. Transparent Desktop Pet Window
- **Zero rectangular window borders**: The background is 100% transparent. Only the cute chibi mascot and its speech bubble appear on your screen.
- **Always on top**: Floats gently above your browser, code editor, and documents without blocking your workspace.
- **Smart Active Display Sensing**: Dynamically appears on the monitor where your cursor is currently active.
- **Lifelike Animations**:
  - **Idle breathing & bobbing**: Gentle rhythmic squash-and-stretch.
  - **Blinking**: Natural eye blinks every 4 seconds.
  - **Waddling Walk Cycle**: Cute side-to-side tilting walk motion.
  - **Entering & Leaving**: The pet waddles into view from off-screen, speaks, and turns around to walk off-screen when finished.
  - **Occasional Wandering**: Takes a few curious waddling steps while idling.

### 2. Periodic Visits & Health Protocols
- **Default 5-minute visits** (customizable in Settings).
- Visits with a speech bubble pointing towards the pet:
  - 💧 **Water reminders** (e.g., *"Drink 1 glass (250ml) now"*)
  - 🧘 **Stretch routines** (e.g., *"Gargoyle Posture Correction"*, *"Wrist & Grapple Stretch"*)
  - 🦇 **Cooldowns** (e.g., *"20-20-20 Bat-Scan"*, *"Perimeter Patrol"*)
  - 🛡️ **Fortitude check-ins** (e.g., *"Nightwing, status report. What is your mental fortitude today?"*)
- Click **"Drank"** or **"Done"** to log your action and earn consecutive day streaks!
- The pet stays for ~22 seconds and then walks off screen, or stays if you open chat.

### 3. Draggable Floating Summon Button
- A small circular avatar button pinned to your desktop edge.
- **Click it anytime** to instantly summon Batman to your screen.
- **Click and drag it** to position it anywhere along your screen edge. It automatically clamps so it **never goes off-screen**.
- Remembers where you placed it across app restarts.

### 4. System Tray Controls
Right-click the pet icon in your taskbar notification area for:
- 🦇 **Summon Batman Now**
- 💬 **Bat-Comm Link (Chat)**
- ⚙️ **Batcomputer Settings & Records**
- ⏸️ **Pause Patrol** (30 mins, 1 hour, until tomorrow, or resume)
- 🔄 **Reset Window Positions**
- ❌ **Quit**

### 5. Compact Inline Chat (Offline & AI Mode)
- **Click directly on the pet** at any time to open a compact chat window right beside it.
- **Basic / Offline Mode (Zero config required)**:
  - Instantly responds naturally to greetings (*"hi"*, *"how are you"*), fatigue (*"tired"*, *"burnout"*), water (*"need water"*), posture (*"neck hurts"*), and gratitude.
- **AI Mode (Optional OpenAI Integration)**:
  - Turn on in Settings and enter your OpenAI API key.
  - Encrypted with OS-level credentials (`safeStorage`).
  - Powered by `gpt-4o-mini` with conversation history memory.
  - Built-in 10-second timeout with automatic fallback to offline responses.

---

## ⚙️ Settings & Batcave Health Records

Access via Tray -> **Batcomputer Settings**:
- **Live Batcave Records**: Track glasses drank today/total, breaks taken, and consecutive day streaks.
- **Enable/Disable Pet Companion**
- **Visit Frequency**: 5m, 10m, 15m, 30m, 1h, or custom minutes
- **Water Reminder Frequency**
- **Break Reminder Frequency**
- **Daily water and break goals**, with progress feedback after each completion
- **Custom water/break routines** with individual reminder intervals
- **Snooze reminder controls** for 5 or 15 minutes
- **Random Check-ins & Stretches Toggle**
- **Pet Size**: Small (95px), Medium (125px), Large (160px)
- **Animation Speed**: Relaxed, Natural, Energetic
- **Audio Chimes**: On / Off
- **Always on Top**: On / Off
- **Launch on Startup**: On / Off
- **AI Chat & Encrypted API Key**
- **Quiet Hours**: Define an active time range (e.g., 22:00 to 08:00) where visits pause
- **Reset Window Positions**: Smoothly resets positions without blocking modals.
