const fs = require('fs');
const path = require('path');
const { safeStorage } = require('electron');

function getTodayString(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getTodayString(d);
}

const DEFAULT_SETTINGS = {
  petEnabled: true,
  visitIntervalMinutes: 5,
  waterIntervalMinutes: 30,
  breakIntervalMinutes: 25,
  dailyWaterGoal: 8,
  dailyBreakGoal: 4,
  customRoutines: [],
  checkInsEnabled: true,
  soundEnabled: true,
  animationSpeed: 'normal', // 'slow', 'normal', 'fast'
  petSize: 'medium', // 'small' (95px), 'medium' (125px), 'large' (160px)
  aiChatEnabled: false,
  apiKey: '',
  launchOnStartup: false,
  alwaysOnTop: true,
  quietHoursEnabled: false,
  quietStart: '22:00',
  quietEnd: '08:00',
  idleThresholdSeconds: 300,
  summonPosition: null, // { x, y }
  pauseUntil: null // timestamp
};

const DEFAULT_DATA = {
  settings: DEFAULT_SETTINGS,
  encryptedApiKey: null,
  streaks: {
    date: getTodayString(),
    hydrationToday: 0,
    breaksToday: 0,
    hydrationStreak: 0, // consecutive days
    breakStreak: 0, // consecutive days
    totalHydration: 0,
    totalBreaks: 0,
    lastHydrationDate: null,
    lastBreakDate: null,
    lastHydrationAt: null,
    lastBreakAt: null
  }
};

const BOOLEAN_SETTINGS = [
  'petEnabled', 'checkInsEnabled', 'soundEnabled', 'aiChatEnabled',
  'launchOnStartup', 'alwaysOnTop', 'quietHoursEnabled'
];

function getBoundedInteger(value, min, max) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

function getValidTime(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  return value;
}

function sanitizeSettings(newSettings) {
  const input = newSettings && typeof newSettings === 'object' ? newSettings : {};
  const sanitized = {};

  for (const key of BOOLEAN_SETTINGS) {
    if (typeof input[key] === 'boolean') sanitized[key] = input[key];
  }

  const visitInterval = getBoundedInteger(input.visitIntervalMinutes, 1, 180);
  const waterInterval = getBoundedInteger(input.waterIntervalMinutes, 5, 180);
  const breakInterval = getBoundedInteger(input.breakIntervalMinutes, 5, 180);
  const idleThreshold = getBoundedInteger(input.idleThresholdSeconds, 30, 3600);
  const dailyWaterGoal = getBoundedInteger(input.dailyWaterGoal, 1, 30);
  const dailyBreakGoal = getBoundedInteger(input.dailyBreakGoal, 1, 30);
  if (visitInterval !== null) sanitized.visitIntervalMinutes = visitInterval;
  if (waterInterval !== null) sanitized.waterIntervalMinutes = waterInterval;
  if (breakInterval !== null) sanitized.breakIntervalMinutes = breakInterval;
  if (idleThreshold !== null) sanitized.idleThresholdSeconds = idleThreshold;
  if (dailyWaterGoal !== null) sanitized.dailyWaterGoal = dailyWaterGoal;
  if (dailyBreakGoal !== null) sanitized.dailyBreakGoal = dailyBreakGoal;

  if (['slow', 'normal', 'fast'].includes(input.animationSpeed)) {
    sanitized.animationSpeed = input.animationSpeed;
  }
  if (['small', 'medium', 'large'].includes(input.petSize)) {
    sanitized.petSize = input.petSize;
  }

  const quietStart = getValidTime(input.quietStart);
  const quietEnd = getValidTime(input.quietEnd);
  if (quietStart) sanitized.quietStart = quietStart;
  if (quietEnd) sanitized.quietEnd = quietEnd;

  if (typeof input.apiKey === 'string' && input.apiKey.length <= 500) {
    sanitized.apiKey = input.apiKey.trim();
  }

  if (Array.isArray(input.customRoutines)) {
    sanitized.customRoutines = input.customRoutines.slice(0, 12).flatMap((routine) => {
      if (!routine || typeof routine !== 'object') return [];
      const name = typeof routine.name === 'string' ? routine.name.trim().slice(0, 60) : '';
      const intervalMinutes = getBoundedInteger(routine.intervalMinutes, 5, 1440);
      const type = routine.type === 'water' ? 'water' : routine.type === 'break' ? 'break' : null;
      if (!name || intervalMinutes === null || !type) return [];
      return [{
        id: typeof routine.id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(routine.id)
          ? routine.id
          : `routine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        intervalMinutes,
        type,
        enabled: routine.enabled !== false,
        lastTriggeredAt: Number.isFinite(routine.lastTriggeredAt) ? routine.lastTriggeredAt : null
      }];
    });
  }

  return sanitized;
}

class LocalStore {
  constructor(storageDir) {
    this.filePath = path.join(storageDir || process.cwd(), 'pet_config.json');
    this.data = this.load();
    this.checkDailyReset();
  }

  encryptKey(apiKey) {
    if (!apiKey) return null;
    try {
      if (safeStorage && safeStorage.isEncryptionAvailable && safeStorage.isEncryptionAvailable()) {
        const buffer = safeStorage.encryptString(apiKey);
        return buffer.toString('hex');
      }
    } catch (e) {
      console.warn('safeStorage encryption unavailable, using fallback:', e.message);
    }
    return null;
  }

  decryptKey(encryptedHex) {
    if (!encryptedHex) return '';
    try {
      if (safeStorage && safeStorage.isEncryptionAvailable && safeStorage.isEncryptionAvailable()) {
        const buffer = Buffer.from(encryptedHex, 'hex');
        return safeStorage.decryptString(buffer);
      }
    } catch (e) {
      console.warn('safeStorage decryption failed:', e.message);
    }
    return '';
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        const data = {
          ...DEFAULT_DATA,
          ...parsed,
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          streaks: { ...DEFAULT_DATA.streaks, ...(parsed.streaks || {}) }
        };

        // Decrypt API key if encrypted, or migrate plaintext API key
        if (data.encryptedApiKey) {
          data.settings.apiKey = this.decryptKey(data.encryptedApiKey);
        } else if (data.settings.apiKey) {
          data.encryptedApiKey = this.encryptKey(data.settings.apiKey);
        }

        return data;
      }
    } catch (err) {
      console.error('Failed to read config file, using defaults:', err);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  save() {
    try {
      const clone = JSON.parse(JSON.stringify(this.data));
      // Encrypt API key on save
      if (clone.settings.apiKey) {
        const encrypted = this.encryptKey(clone.settings.apiKey);
        if (encrypted) {
          clone.encryptedApiKey = encrypted;
          clone.settings.apiKey = ''; // Don't persist plaintext if encrypted
        }
      } else {
        clone.encryptedApiKey = null;
      }

      fs.writeFileSync(this.filePath, JSON.stringify(clone, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write config file:', err);
    }
  }

  checkDailyReset() {
    const today = getTodayString();
    const yesterday = getYesterdayString();

    if (this.data.streaks.date !== today) {
      const prevDate = this.data.streaks.date;

      // Check if hydration streak was maintained yesterday
      if (this.data.streaks.lastHydrationDate !== yesterday && this.data.streaks.lastHydrationDate !== today) {
        this.data.streaks.hydrationStreak = 0;
      }

      // Check if break streak was maintained yesterday
      if (this.data.streaks.lastBreakDate !== yesterday && this.data.streaks.lastBreakDate !== today) {
        this.data.streaks.breakStreak = 0;
      }

      this.data.streaks.date = today;
      this.data.streaks.hydrationToday = 0;
      this.data.streaks.breaksToday = 0;
      this.save();
    }
  }

  getSettings() {
    return { ...this.data.settings };
  }

  updateSettings(newSettings) {
    const sanitized = sanitizeSettings(newSettings);
    this.data.settings = { ...this.data.settings, ...sanitized };
    if (sanitized.apiKey !== undefined) {
      this.data.encryptedApiKey = this.encryptKey(sanitized.apiKey);
    }
    this.save();
    return this.getSettings();
  }

  setSummonPosition(x, y) {
    this.data.settings.summonPosition = { x, y };
    this.save();
  }

  getSummonPosition() {
    return this.data.settings.summonPosition;
  }

  setPause(durationMinutes) {
    if (!durationMinutes) {
      this.data.settings.pauseUntil = null;
    } else if (durationMinutes === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      this.data.settings.pauseUntil = tomorrow.getTime();
    } else {
      this.data.settings.pauseUntil = Date.now() + durationMinutes * 60 * 1000;
    }
    this.save();
    return this.data.settings.pauseUntil;
  }

  isPaused() {
    const pauseUntil = this.data.settings.pauseUntil;
    if (!pauseUntil) return false;
    if (Date.now() < pauseUntil) return true;
    this.data.settings.pauseUntil = null;
    this.save();
    return false;
  }

  isQuietHours() {
    if (!this.data.settings.quietHoursEnabled) return false;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = (this.data.settings.quietStart || '22:00').split(':').map(Number);
    const [endH, endM] = (this.data.settings.quietEnd || '08:00').split(':').map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (startTotal <= endTotal) {
      return currentMins >= startTotal && currentMins < endTotal;
    } else {
      // Overnight (e.g. 22:00 to 08:00)
      return currentMins >= startTotal || currentMins < endTotal;
    }
  }

  recordHydration() {
    this.checkDailyReset();
    const today = getTodayString();
    const yesterday = getYesterdayString();

    if (this.data.streaks.lastHydrationDate !== today) {
      if (this.data.streaks.lastHydrationDate === yesterday) {
        this.data.streaks.hydrationStreak += 1;
      } else {
        this.data.streaks.hydrationStreak = 1;
      }
      this.data.streaks.lastHydrationDate = today;
    }

    this.data.streaks.hydrationToday += 1;
    this.data.streaks.totalHydration += 1;
    this.data.streaks.lastHydrationAt = Date.now();
    this.save();

    return {
      today: this.data.streaks.hydrationToday,
      streak: this.data.streaks.hydrationStreak,
      total: this.data.streaks.totalHydration
    };
  }

  recordBreak() {
    this.checkDailyReset();
    const today = getTodayString();
    const yesterday = getYesterdayString();

    if (this.data.streaks.lastBreakDate !== today) {
      if (this.data.streaks.lastBreakDate === yesterday) {
        this.data.streaks.breakStreak += 1;
      } else {
        this.data.streaks.breakStreak = 1;
      }
      this.data.streaks.lastBreakDate = today;
    }

    this.data.streaks.breaksToday += 1;
    this.data.streaks.totalBreaks += 1;
    this.data.streaks.lastBreakAt = Date.now();
    this.save();

    return {
      today: this.data.streaks.breaksToday,
      streak: this.data.streaks.breakStreak,
      total: this.data.streaks.totalBreaks
    };
  }

  getStats() {
    this.checkDailyReset();
    return {
      streaks: { ...this.data.streaks },
      settings: this.getSettings()
    };
  }

  getLastHydrationAt() {
    return Number.isFinite(this.data.streaks.lastHydrationAt) ? this.data.streaks.lastHydrationAt : null;
  }

  getLastBreakAt() {
    return Number.isFinite(this.data.streaks.lastBreakAt) ? this.data.streaks.lastBreakAt : null;
  }

  markRoutineTriggered(routineId) {
    const routine = this.data.settings.customRoutines.find((item) => item.id === routineId);
    if (!routine) return false;
    routine.lastTriggeredAt = Date.now();
    this.save();
    return true;
  }
}

module.exports = {
  LocalStore,
  DEFAULT_SETTINGS
};
