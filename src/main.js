const { app, BrowserWindow, Tray, Menu, screen, powerMonitor, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { LocalStore } = require('./storage/store');
const { processMessage } = require('./ai/chatService');
const { getDialogue } = require('./dialogue/dialogueBank');

let tray = null;
let petWindow = null;
let summonWindow = null;
let settingsWindow = null;
let store = null;

// Fallback visit messages
let visitMessages = null;
function getFallbackMessages() {
  if (!visitMessages) {
    try {
      const msgPath = path.join(__dirname, 'config', 'messages.json');
      visitMessages = JSON.parse(fs.readFileSync(msgPath, 'utf8'));
    } catch (e) {
      visitMessages = {
        greeting: ["I'm keeping watch from the shadows. Stay focused, citizen."],
        water: ["Even the shadows require hydration. Drink water, citizen."],
        stretch: ["Posture check: Straighten your spine. You're slouching like a weathered gargoyle on Wayne Tower."],
        break: ["Batcomputer cooldown: Look 20 feet away into the darkness for 20 seconds."],
        mood: ["Nightwing, status report. What is your mental fortitude today?"]
      };
    }
  }
  return visitMessages;
}

function getVisitPayload(category) {
  try {
    if (category === 'water' || category === 'break' || category === 'mood' || category === 'greeting' || category === 'stretch') {
      const diag = getDialogue(category === 'water' ? 'hydration' : category);
      if (diag && (diag.text || typeof diag === 'string')) {
        return {
          category,
          title: diag.title || null,
          message: diag.text || (typeof diag === 'string' ? diag : diag.action),
          action: diag.action || null,
          durationSeconds: diag.durationSeconds || null,
          options: diag.options || null
        };
      }
    }
  } catch (e) {
    console.warn('DialogueBank lookup fallback:', e);
  }

  const msgs = getFallbackMessages();
  const list = msgs[category] || msgs.greeting;
  const text = list[Math.floor(Math.random() * list.length)];
  return { category, message: text };
}

// Scheduler state
let visitTimer = null;
let lastVisitTime = Date.now();
let lastWaterTime = Date.now();
let lastBreakTime = Date.now();
let dragStartPos = { x: 0, y: 0 };

const PET_WIN_WIDTH = 440;
const PET_WIN_HEIGHT = 270;
const SUMMON_SIZE = 64;

function getActiveDisplay() {
  try {
    const cursor = screen.getCursorScreenPoint();
    return screen.getDisplayNearestPoint(cursor) || screen.getPrimaryDisplay();
  } catch (e) {
    return screen.getPrimaryDisplay();
  }
}

// 1. Create Pet Window (Frameless & Transparent)
function createPetWindow() {
  const display = getActiveDisplay();
  const { width, height, x: areaX, y: areaY } = display.workArea;

  const posX = areaX + width - PET_WIN_WIDTH - 20;
  const posY = areaY + height - PET_WIN_HEIGHT - 10;

  petWindow = new BrowserWindow({
    width: PET_WIN_WIDTH,
    height: PET_WIN_HEIGHT,
    x: Math.round(posX),
    y: Math.round(posY),
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  petWindow.loadFile(path.join(__dirname, 'renderer', 'pet', 'pet.html'));
  petWindow.setAlwaysOnTop(true, 'screen-saver');
}

// 2. Create Floating Summon Button Window
function createSummonWindow() {
  const display = getActiveDisplay();
  const { width, height, x: areaX, y: areaY } = display.workArea;

  let savedPos = store.getSummonPosition();
  let posX = savedPos ? savedPos.x : (areaX + width - SUMMON_SIZE - 12);
  let posY = savedPos ? savedPos.y : (areaY + height - 320);

  posX = Math.max(areaX, Math.min(areaX + width - SUMMON_SIZE, posX));
  posY = Math.max(areaY, Math.min(areaY + height - SUMMON_SIZE, posY));

  summonWindow = new BrowserWindow({
    width: SUMMON_SIZE,
    height: SUMMON_SIZE,
    x: Math.round(posX),
    y: Math.round(posY),
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  summonWindow.loadFile(path.join(__dirname, 'renderer', 'summon', 'summon.html'));
  summonWindow.setAlwaysOnTop(true, 'screen-saver');

  summonWindow.once('ready-to-show', () => {
    const settings = store.getSettings();
    if (settings.petEnabled !== false) {
      summonWindow.show();
      summonWindow.setAlwaysOnTop(true, 'screen-saver');
    }
  });
}

// 3. Create Settings Window
function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 540,
    height: 680,
    title: 'Batcomputer Settings & Health Records',
    frame: true,
    resizable: false,
    autoHideMenuBar: true,
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWindow.loadFile(path.join(__dirname, 'renderer', 'settings', 'settings.html'));
}

function resetPositions() {
  const display = getActiveDisplay();
  const { width, height, x: areaX, y: areaY } = display.workArea;

  if (petWindow && !petWindow.isDestroyed()) {
    const petX = areaX + width - PET_WIN_WIDTH - 20;
    const petY = areaY + height - PET_WIN_HEIGHT - 10;
    petWindow.setPosition(Math.round(petX), Math.round(petY));
  }

  if (summonWindow && !summonWindow.isDestroyed()) {
    const sumX = areaX + width - SUMMON_SIZE - 12;
    const sumY = areaY + height - 320;
    summonWindow.setPosition(Math.round(sumX), Math.round(sumY));
    summonWindow.show();
    summonWindow.setAlwaysOnTop(true, 'screen-saver');
    store.setSummonPosition(sumX, sumY);
  }
}

function triggerPetVisit(category = null, customMessage = null, routine = null) {
  if (!petWindow || petWindow.isDestroyed()) return false;

  const settings = store.getSettings();
  if (settings.petEnabled === false) return false;

  // Re-anchor to visible bottom right of current active display
  const display = getActiveDisplay();
  const { width, height, x: areaX, y: areaY } = display.workArea;
  const posX = areaX + width - PET_WIN_WIDTH - 20;
  const posY = areaY + height - PET_WIN_HEIGHT - 10;
  petWindow.setPosition(Math.round(posX), Math.round(posY));

  if (!category) {
    const now = Date.now();
    const waterIntervalMs = (settings.waterIntervalMinutes || 30) * 60 * 1000;
    const breakIntervalMs = (settings.breakIntervalMinutes || 25) * 60 * 1000;
    if (now - lastWaterTime >= waterIntervalMs) {
      category = 'water';
      lastWaterTime = now;
    } else if (now - lastBreakTime >= breakIntervalMs) {
      category = 'break';
      lastBreakTime = now;
    } else if (settings.checkInsEnabled !== false) {
      const categories = ['greeting', 'stretch', 'mood'];
      category = categories[Math.floor(Math.random() * categories.length)];
    } else {
      return false;
    }
  }

  let payload = getVisitPayload(category);
  if (category === 'routine' && routine) {
    payload = {
      category: 'routine',
      sprite: routine.type,
      routineId: routine.id,
      routineType: routine.type,
      title: `🦇 CUSTOM ROUTINE: ${routine.name.toUpperCase()}`,
      message: `Time for ${routine.name}. Gotham can spare ${routine.intervalMinutes} minutes.`,
      action: routine.type === 'water' ? 'Drink and log a glass of water' : 'Complete the routine and log your break'
    };
    store.markRoutineTriggered(routine.id);
  }
  if (customMessage) {
    payload.message = customMessage;
  }
  payload.staySeconds = 22;

  petWindow.show();
  petWindow.setAlwaysOnTop(settings.alwaysOnTop !== false, 'screen-saver');
  petWindow.webContents.send('pet-visit', payload);

  lastVisitTime = Date.now();
  return true;
}

function startScheduler() {
  if (visitTimer) clearInterval(visitTimer);

  visitTimer = setInterval(() => {
    const settings = store.getSettings();

    if (settings.petEnabled === false) return;
    if (store.isPaused()) return;
    if (store.isQuietHours()) return;

    const idleSeconds = powerMonitor.getSystemIdleTime();
    if (idleSeconds > (settings.idleThresholdSeconds || 300)) {
      return;
    }

    const now = Date.now();
    const visitDue = now - lastVisitTime >= (settings.visitIntervalMinutes || 5) * 60 * 1000;
    const waterDue = now - lastWaterTime >= (settings.waterIntervalMinutes || 30) * 60 * 1000;
    const breakDue = now - lastBreakTime >= (settings.breakIntervalMinutes || 25) * 60 * 1000;
    const routineDue = (settings.customRoutines || []).find((routine) => {
      if (!routine.enabled) return false;
      const lastTriggered = Number.isFinite(routine.lastTriggeredAt) ? routine.lastTriggeredAt : 0;
      return now - lastTriggered >= routine.intervalMinutes * 60 * 1000;
    });

    if (waterDue || breakDue) {
      triggerPetVisit();
    } else if (routineDue) {
      triggerPetVisit('routine', null, routineDue);
    } else if (settings.checkInsEnabled !== false && visitDue) {
      triggerPetVisit();
    }
  }, 25 * 1000);
}

function createTray() {
  const isWin = process.platform === 'win32';
  const iconFileName = isWin ? 'tray-icon.ico' : 'tray-icon.png';
  let iconPath = path.join(__dirname, '..', 'assets', 'characters', iconFileName);
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, '..', 'assets', 'characters', 'tray-icon.png');
  }

  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon);
  tray.setToolTip('Batman — Desktop Guardian Companion');

  const updateMenu = () => {
    const isPaused = store.isPaused();

    const menu = Menu.buildFromTemplate([
      { label: '🦇 Batman — Desktop Guardian', enabled: false },
      { type: 'separator' },
      {
        label: '🦇 Summon Batman Now',
        click: () => {
          if (petWindow && !petWindow.isDestroyed()) {
            petWindow.show();
            petWindow.setAlwaysOnTop(true, 'screen-saver');
            petWindow.webContents.send('pet-summon');
          }
        }
      },
      {
        label: '💬 Bat-Comm Link (Chat)',
        click: () => {
          if (petWindow && !petWindow.isDestroyed()) {
            petWindow.show();
            petWindow.setAlwaysOnTop(true, 'screen-saver');
            petWindow.webContents.send('pet-open-chat');
          }
        }
      },
      {
        label: '⚙️ Batcomputer Settings & Records',
        click: () => openSettingsWindow()
      },
      { type: 'separator' },
      {
        label: isPaused ? '▶️ Resume Gotham Patrol' : '⏸️ Pause Patrol',
        submenu: isPaused ? [
          {
            label: 'Resume Now',
            click: () => {
              store.setPause(null);
              updateMenu();
            }
          }
        ] : [
          {
            label: 'Pause for 30 Minutes',
            click: () => {
              store.setPause(30);
              updateMenu();
            }
          },
          {
            label: 'Pause for 1 Hour',
            click: () => {
              store.setPause(60);
              updateMenu();
            }
          },
          {
            label: 'Pause Until Tomorrow',
            click: () => {
              store.setPause('tomorrow');
              updateMenu();
            }
          }
        ]
      },
      {
        label: '🔄 Reset Window Positions',
        click: () => resetPositions()
      },
      { type: 'separator' },
      {
        label: '❌ Quit',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(menu);
  };

  updateMenu();

  tray.on('click', () => {
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.show();
      petWindow.setAlwaysOnTop(true, 'screen-saver');
      petWindow.webContents.send('pet-summon');
    }
  });
}

// App Lifecycle
app.whenReady().then(() => {
  store = new LocalStore(app.getPath('userData'));
  lastWaterTime = store.getLastHydrationAt() || Date.now();
  lastBreakTime = store.getLastBreakAt() || Date.now();

  createPetWindow();
  createSummonWindow();
  createTray();
  startScheduler();

  // Instant welcome visit (800ms) so user immediately sees Batman
  setTimeout(() => {
    triggerPetVisit('greeting', "I'm keeping watch from the shadows. Stay focused and hydrated, citizen.");
  }, 800);
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

// IPC: Pet Window
ipcMain.on('pet-exited', () => {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.hide();
  }
});

ipcMain.handle('pet-action', (_event, { type, routineId }) => {
  let result = null;
  if (type === 'water') {
    result = store.recordHydration();
    lastWaterTime = Date.now();
  } else if (type === 'break') {
    result = store.recordBreak();
    lastBreakTime = Date.now();
  }
  if (routineId && typeof routineId === 'string') store.markRoutineTriggered(routineId);
  return result;
});

ipcMain.handle('snooze-reminder', (_event, { minutes }) => {
  const duration = Number(minutes);
  if (![5, 15].includes(duration)) return false;
  store.setPause(duration);
  return true;
});

ipcMain.handle('get-pet-config', () => {
  return store.getSettings();
});

ipcMain.handle('get-stats', () => {
  return store.getStats();
});

ipcMain.handle('send-chat', async (_event, { text, history }) => {
  const settings = store.getSettings();
  const reply = await processMessage(text, history || [], {
    aiEnabled: settings.aiChatEnabled,
    apiKey: settings.apiKey
  });
  return reply;
});

// IPC: Summon Button Dragging
ipcMain.on('summon-drag-start', () => {
  if (!summonWindow || summonWindow.isDestroyed()) return;
  const [x, y] = summonWindow.getPosition();
  dragStartPos = { x, y };
});

ipcMain.on('summon-drag-move', (_event, { dx, dy }) => {
  if (!summonWindow || summonWindow.isDestroyed()) return;
  const [curX, curY] = summonWindow.getPosition();
  const display = getActiveDisplay();
  const { width, height, x: areaX, y: areaY } = display.workArea;

  let newX = curX + dx;
  let newY = curY + dy;

  newX = Math.max(areaX, Math.min(areaX + width - SUMMON_SIZE, newX));
  newY = Math.max(areaY, Math.min(areaY + height - SUMMON_SIZE, newY));

  summonWindow.setPosition(Math.round(newX), Math.round(newY));
});

ipcMain.on('summon-drag-end', () => {
  if (!summonWindow || summonWindow.isDestroyed()) return;
  const [x, y] = summonWindow.getPosition();
  store.setSummonPosition(x, y);
});

ipcMain.on('summon-click', () => {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.show();
    petWindow.setAlwaysOnTop(true, 'screen-saver');
    petWindow.webContents.send('pet-summon');
  }
});

// IPC: Settings Window
ipcMain.handle('get-settings', () => {
  return store.getSettings();
});

ipcMain.handle('save-settings', (_event, newSettings) => {
  const updated = store.updateSettings(newSettings);

  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.setAlwaysOnTop(!!updated.alwaysOnTop, 'screen-saver');
    petWindow.webContents.send('config-updated', updated);
  }
  if (summonWindow && !summonWindow.isDestroyed()) {
    summonWindow.setAlwaysOnTop(!!updated.alwaysOnTop, 'screen-saver');
    if (updated.petEnabled === false) {
      summonWindow.hide();
      if (petWindow && !petWindow.isDestroyed()) petWindow.hide();
    } else {
      summonWindow.show();
    }
  }

  try {
    app.setLoginItemSettings({
      openAtLogin: !!updated.launchOnStartup
    });
  } catch (e) {
    console.warn('Startup setting error:', e);
  }

  startScheduler();
  return updated;
});

ipcMain.handle('reset-positions', () => {
  resetPositions();
  return true;
});

ipcMain.on('close-settings', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
  }
});
