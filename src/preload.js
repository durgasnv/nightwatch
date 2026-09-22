const { contextBridge, ipcRenderer } = require('electron');

// Safe IPC Bridge for Pet Window
contextBridge.exposeInMainWorld('petApi', {
  onVisit: (cb) => ipcRenderer.on('pet-visit', (_e, data) => cb(data)),
  onSummon: (cb) => ipcRenderer.on('pet-summon', (_e, data) => cb(data)),
  onOpenChat: (cb) => ipcRenderer.on('pet-open-chat', (_e) => cb()),
  onConfigUpdated: (cb) => ipcRenderer.on('config-updated', (_e, cfg) => cb(cfg)),

  sendChat: (text, history) => ipcRenderer.invoke('send-chat', { text, history }),
  recordAction: (type, routineId = null) => ipcRenderer.invoke('pet-action', { type, routineId }),
  snoozeReminder: (minutes) => ipcRenderer.invoke('snooze-reminder', { minutes }),
  getStats: () => ipcRenderer.invoke('get-stats'),
  onPetExited: () => ipcRenderer.send('pet-exited'),
  getConfig: () => ipcRenderer.invoke('get-pet-config')
});

// Safe IPC Bridge for Summon Button Window
contextBridge.exposeInMainWorld('summonApi', {
  startDrag: () => ipcRenderer.send('summon-drag-start'),
  dragMove: (dx, dy) => ipcRenderer.send('summon-drag-move', { dx, dy }),
  endDrag: () => ipcRenderer.send('summon-drag-end'),
  summonPet: () => ipcRenderer.send('summon-click')
});

// Safe IPC Bridge for Settings Window
contextBridge.exposeInMainWorld('settingsApi', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getStats: () => ipcRenderer.invoke('get-stats'),
  resetPositions: () => ipcRenderer.invoke('reset-positions'),
  closeWindow: () => ipcRenderer.send('close-settings')
});
