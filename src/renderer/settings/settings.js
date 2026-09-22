const setPetEnabled = document.getElementById('set-pet-enabled');
const setAlwaysTop = document.getElementById('set-always-top');
const setLaunchStartup = document.getElementById('set-launch-startup');
const setSound = document.getElementById('set-sound');
const setVisitFreq = document.getElementById('set-visit-freq');
const customFreqRow = document.getElementById('custom-freq-row');
const setCustomVisit = document.getElementById('set-custom-visit');
const setWaterFreq = document.getElementById('set-water-freq');
const setBreakFreq = document.getElementById('set-break-freq');
const setCheckins = document.getElementById('set-checkins');
const setPetSize = document.getElementById('set-pet-size');
const setAnimSpeed = document.getElementById('set-anim-speed');
const setAiChat = document.getElementById('set-ai-chat');
const aiKeyContainer = document.getElementById('ai-key-container');
const setApiKey = document.getElementById('set-api-key');
const setQuietHours = document.getElementById('set-quiet-hours');
const quietTimeRow = document.getElementById('quiet-time-row');
const setQuietStart = document.getElementById('set-quiet-start');
const setQuietEnd = document.getElementById('set-quiet-end');

// Stats Elements
const statWaterToday = document.getElementById('stat-water-today');
const statWaterTotal = document.getElementById('stat-water-total');
const statBreaksToday = document.getElementById('stat-breaks-today');
const statBreaksTotal = document.getElementById('stat-breaks-total');
const statStreakDays = document.getElementById('stat-streak-days');

const btnClose = document.getElementById('btn-close');
const btnSave = document.getElementById('btn-save');
const btnResetPos = document.getElementById('btn-reset-pos');
const saveStatus = document.getElementById('save-status');

// Dynamic UI updates
setVisitFreq.addEventListener('change', () => {
  if (setVisitFreq.value === 'custom') {
    customFreqRow.classList.remove('hidden');
  } else {
    customFreqRow.classList.add('hidden');
  }
});

setAiChat.addEventListener('change', () => {
  aiKeyContainer.classList.toggle('hidden', !setAiChat.checked);
});

setQuietHours.addEventListener('change', () => {
  quietTimeRow.classList.toggle('hidden', !setQuietHours.checked);
});

function loadStats() {
  if (window.settingsApi.getStats) {
    window.settingsApi.getStats().then(stats => {
      if (!stats) return;
      const s = stats.streaks || {};
      statWaterToday.textContent = s.hydrationToday || 0;
      statWaterTotal.textContent = `Total: ${s.totalHydration || 0}`;
      statBreaksToday.textContent = s.breaksToday || 0;
      statBreaksTotal.textContent = `Total: ${s.totalBreaks || 0}`;
      const streak = Math.max(s.hydrationStreak || 0, s.breakStreak || 0);
      statStreakDays.textContent = streak;
    }).catch(err => {
      console.warn('Failed to load stats:', err);
    });
  }
}

// Load settings
window.settingsApi.getSettings().then(cfg => {
  setPetEnabled.checked = cfg.petEnabled !== false;
  setAlwaysTop.checked = cfg.alwaysOnTop !== false;
  setLaunchStartup.checked = !!cfg.launchOnStartup;
  setSound.checked = cfg.soundEnabled !== false;

  // Visit Freq
  const standardFreqs = ['5', '10', '15', '30', '60'];
  const curFreq = String(cfg.visitIntervalMinutes || 5);
  if (standardFreqs.includes(curFreq)) {
    setVisitFreq.value = curFreq;
    customFreqRow.classList.add('hidden');
  } else {
    setVisitFreq.value = 'custom';
    setCustomVisit.value = curFreq;
    customFreqRow.classList.remove('hidden');
  }

  setWaterFreq.value = cfg.waterIntervalMinutes || 30;
  setBreakFreq.value = cfg.breakIntervalMinutes || 25;
  setCheckins.checked = cfg.checkInsEnabled !== false;
  setPetSize.value = cfg.petSize || 'medium';
  setAnimSpeed.value = cfg.animationSpeed || 'normal';

  setAiChat.checked = !!cfg.aiChatEnabled;
  aiKeyContainer.classList.toggle('hidden', !cfg.aiChatEnabled);
  setApiKey.value = cfg.apiKey || '';

  setQuietHours.checked = !!cfg.quietHoursEnabled;
  quietTimeRow.classList.toggle('hidden', !cfg.quietHoursEnabled);
  setQuietStart.value = cfg.quietStart || '22:00';
  setQuietEnd.value = cfg.quietEnd || '08:00';
});

loadStats();

// Save settings
btnSave.addEventListener('click', async () => {
  let visitMins = 5;
  if (setVisitFreq.value === 'custom') {
    visitMins = parseInt(setCustomVisit.value, 10) || 5;
  } else {
    visitMins = parseInt(setVisitFreq.value, 10) || 5;
  }

  const updated = {
    petEnabled: setPetEnabled.checked,
    alwaysOnTop: setAlwaysTop.checked,
    launchOnStartup: setLaunchStartup.checked,
    soundEnabled: setSound.checked,
    visitIntervalMinutes: visitMins,
    waterIntervalMinutes: parseInt(setWaterFreq.value, 10) || 30,
    breakIntervalMinutes: parseInt(setBreakFreq.value, 10) || 25,
    checkInsEnabled: setCheckins.checked,
    petSize: setPetSize.value,
    animationSpeed: setAnimSpeed.value,
    aiChatEnabled: setAiChat.checked,
    apiKey: setApiKey.value.trim(),
    quietHoursEnabled: setQuietHours.checked,
    quietStart: setQuietStart.value,
    quietEnd: setQuietEnd.value
  };

  await window.settingsApi.saveSettings(updated);
  saveStatus.textContent = 'Settings saved!';
  saveStatus.classList.remove('hidden');
  setTimeout(() => {
    saveStatus.classList.add('hidden');
  }, 2200);
});

// Reset window positions
btnResetPos.addEventListener('click', async () => {
  await window.settingsApi.resetPositions();
  saveStatus.textContent = 'Window positions reset to bottom right!';
  saveStatus.classList.remove('hidden');
  setTimeout(() => {
    saveStatus.classList.add('hidden');
  }, 2500);
});

btnClose.addEventListener('click', () => {
  window.settingsApi.closeWindow();
});
