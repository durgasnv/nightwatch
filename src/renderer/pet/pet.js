// Desktop Batman Chibi Animation & Interaction Controller

const petContainer = document.getElementById('pet-container');
const petSprite = document.getElementById('pet-sprite');
const speechBubble = document.getElementById('speech-bubble');
const bubbleCategory = document.getElementById('bubble-category');
const bubbleMessage = document.getElementById('bubble-message');
const bubbleMicroAction = document.getElementById('bubble-micro-action');
const microActionText = document.getElementById('micro-action-text');
const btnBubbleClose = document.getElementById('btn-bubble-close');
const btnBubbleAction = document.getElementById('btn-bubble-action');
const btnBubbleChat = document.getElementById('btn-bubble-chat');

const chatBox = document.getElementById('chat-box');
const btnChatClose = document.getElementById('btn-chat-close');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

let currentState = 'idle'; // 'idle', 'waddling', 'chatting', 'exiting'
let currentVisit = null;
let visitTimeout = null;
let blinkInterval = null;
let wanderInterval = null;
let conversationHistory = [];
let soundEnabled = true;

// Web Audio Synthesizer: Two-tone Batman sci-fi cue
function playSound(type = 'chime') {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'chime') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'tap') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(554.37, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'celebrate') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.08);
      osc.frequency.setValueAtTime(659.25, now + 0.16);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
}

// Blinking loop (4.2s interval)
function startBlinking() {
  if (blinkInterval) clearInterval(blinkInterval);
  blinkInterval = setInterval(() => {
    if (document.hidden) return;
    petContainer.classList.add('blinking');
    setTimeout(() => {
      petContainer.classList.remove('blinking');
    }, 140);
  }, 4200);
}

// Wandering loop
function startWandering() {
  if (wanderInterval) clearInterval(wanderInterval);
  wanderInterval = setInterval(() => {
    if (currentState !== 'idle' || !speechBubble.classList.contains('hidden') || !chatBox.classList.contains('hidden')) {
      return;
    }
    triggerMiniWander();
  }, 32000);
}

function triggerMiniWander() {
  currentState = 'waddling';
  petContainer.classList.remove('idle');
  petContainer.classList.add('waddling');
  
  const direction = Math.random() > 0.5 ? 1 : -1;
  petContainer.classList.toggle('facing-left', direction === -1);
  petContainer.classList.toggle('facing-right', direction === 1);

  setTimeout(() => {
    petContainer.classList.remove('waddling');
    petContainer.classList.add('idle');
    petContainer.classList.remove('facing-left', 'facing-right');
    currentState = 'idle';
  }, 2200);
}

// Sprite Management
function setSprite(stateName) {
  const spriteMap = {
    idle: '../../../assets/characters/idle.png',
    water: '../../../assets/characters/hydrate.png',
    break: '../../../assets/characters/break.png',
    stretch: '../../../assets/characters/break.png',
    mood: '../../../assets/characters/mood.png',
    celebrate: '../../../assets/characters/celebrate.png',
    escalate: '../../../assets/characters/escalate.png'
  };
  petSprite.src = spriteMap[stateName] || spriteMap.idle;
}

// Pet Size
function applyPetSize(size) {
  const sizeMap = {
    small: '95px',
    medium: '125px',
    large: '160px'
  };
  const val = sizeMap[size] || '125px';
  document.documentElement.style.setProperty('--pet-size', val);
}

// Animation Speed
function applyAnimationSpeed(speed) {
  const speedMap = {
    slow: { anim: '3.6s', walk: '0.45s' },
    normal: { anim: '2.8s', walk: '0.35s' },
    fast: { anim: '1.9s', walk: '0.22s' }
  };
  const cfg = speedMap[speed] || speedMap.normal;
  document.documentElement.style.setProperty('--anim-duration', cfg.anim);
  document.documentElement.style.setProperty('--walk-speed', cfg.walk);
}

// Screen Transitions
function enterScreen(onComplete) {
  currentState = 'waddling';
  petContainer.classList.remove('idle');
  petContainer.classList.add('waddling', 'facing-left');
  
  petContainer.style.transform = 'translateX(80px)';
  petContainer.style.opacity = '0';
  
  requestAnimationFrame(() => {
    petContainer.style.transition = 'transform 0.85s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease';
    petContainer.style.transform = 'translateX(0px)';
    petContainer.style.opacity = '1';

    setTimeout(() => {
      petContainer.classList.remove('waddling', 'facing-left');
      petContainer.classList.add('idle');
      petContainer.style.transition = '';
      currentState = 'idle';
      if (onComplete) onComplete();
    }, 870);
  });
}

function leaveScreen(onComplete) {
  if (!chatBox.classList.contains('hidden')) {
    return;
  }

  currentState = 'exiting';
  speechBubble.classList.add('hidden');
  petContainer.classList.remove('idle');
  petContainer.classList.add('waddling', 'facing-right');

  petContainer.style.transition = 'transform 1s ease-in, opacity 0.8s ease-in';
  petContainer.style.transform = 'translateX(110px)';
  petContainer.style.opacity = '0';

  setTimeout(() => {
    petContainer.classList.remove('waddling', 'facing-right');
    petContainer.style.transform = '';
    petContainer.style.opacity = '1';
    petContainer.classList.add('idle');
    currentState = 'idle';
    if (onComplete) onComplete();
  }, 1050);
}

// Show Visit
function showVisit(visitData) {
  currentVisit = visitData;
  if (visitTimeout) clearTimeout(visitTimeout);

  setSprite(visitData.category || 'idle');
  enterScreen(() => {
    playSound('chime');

    const categoryLabels = {
      water: '💧 HYDRATION PROTOCOL',
      break: '🦇 BATCOMPUTER COOLDOWN',
      stretch: '🧘 POSTURE RECALIBRATION',
      greeting: '🦇 SHADOW PATROL',
      mood: '🛡️ FORTITUDE CHECK'
    };

    const header = visitData.title || categoryLabels[visitData.category] || '🦇 BAT-PROTOCOL';
    bubbleCategory.textContent = header;
    bubbleMessage.textContent = `"${visitData.message}"`;

    if (visitData.action) {
      microActionText.textContent = visitData.action;
      bubbleMicroAction.classList.remove('hidden');
    } else {
      bubbleMicroAction.classList.add('hidden');
    }

    if (visitData.category === 'water') {
      btnBubbleAction.textContent = '💧 Drank';
    } else if (visitData.category === 'stretch' || visitData.category === 'break') {
      btnBubbleAction.textContent = '🦇 Done';
    } else {
      btnBubbleAction.textContent = '✓ Stand By';
    }

    if (visitData.openChat === true) {
      openChat();
      return;
    }

    speechBubble.classList.remove('hidden');

    const stayDuration = (visitData.staySeconds || 22) * 1000;
    visitTimeout = setTimeout(() => {
      dismissVisit();
    }, stayDuration);
  });
}

function dismissVisit() {
  if (visitTimeout) clearTimeout(visitTimeout);
  speechBubble.classList.add('hidden');
  leaveScreen(() => {
    window.petApi.onPetExited();
  });
}

// Bubble Actions
btnBubbleClose.addEventListener('click', () => {
  dismissVisit();
});

btnBubbleAction.addEventListener('click', async () => {
  playSound('celebrate');
  let statsResult = null;
  if (currentVisit?.category === 'water') {
    statsResult = await window.petApi.recordAction('water');
  } else if (currentVisit?.category === 'break' || currentVisit?.category === 'stretch') {
    statsResult = await window.petApi.recordAction('break');
  }
  
  setSprite('celebrate');
  bubbleMicroAction.classList.add('hidden');
  
  const streakText = statsResult?.streak ? ` (Day Streak: ${statsResult.streak}🔥)` : '';
  bubbleMessage.textContent = `"Discipline acknowledged${streakText}. The shadows approve."`;
  
  setTimeout(() => {
    dismissVisit();
  }, 1600);
});

btnBubbleChat.addEventListener('click', () => {
  speechBubble.classList.add('hidden');
  openChat();
});

// Pet Click
petContainer.addEventListener('click', () => {
  if (chatBox.classList.contains('hidden')) {
    speechBubble.classList.add('hidden');
    openChat();
  } else {
    closeChat();
  }
});

// Chat Box Management
function openChat() {
  if (visitTimeout) clearTimeout(visitTimeout);
  chatBox.classList.remove('hidden');
  setSprite('idle');
  chatInput.focus();
  playSound('tap');
}

function closeChat() {
  chatBox.classList.add('hidden');
  setTimeout(() => {
    dismissVisit();
  }, 3000);
}

btnChatClose.addEventListener('click', () => {
  closeChat();
});

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = '';
  appendChatMessage('user', text);
  conversationHistory.push({ sender: 'user', text });

  const typingId = appendTypingIndicator();

  try {
    const reply = await window.petApi.sendChat(text, conversationHistory);
    removeTypingIndicator(typingId);
    appendChatMessage('pet', reply.text);
    conversationHistory.push({ sender: 'pet', text: reply.text });
    playSound('chime');
  } catch (err) {
    removeTypingIndicator(typingId);
    appendChatMessage('pet', "I'm keeping watch from the shadows. Stay focused.");
  }
});

function appendChatMessage(sender, text) {
  const msg = document.createElement('div');
  msg.className = `chat-msg ${sender}`;
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;
  msg.appendChild(bubble);
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendTypingIndicator() {
  const id = 'typing-' + Date.now();
  const msg = document.createElement('div');
  msg.id = id;
  msg.className = 'chat-msg pet';
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = '...';
  msg.appendChild(bubble);
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// IPC Listeners
window.petApi.onVisit((visitData) => {
  showVisit(visitData);
});

window.petApi.onSummon(() => {
  showVisit({
    category: 'greeting',
    title: '🦇 BAT-SIGNAL DETECTED',
    message: "I heard the Bat-signal. What is your status report, citizen?",
    staySeconds: 25
  });
});

window.petApi.onOpenChat(() => {
  showVisit({
    category: 'greeting',
    title: '🦇 BAT-COMM ACTIVE',
    message: "Comm-link open. Speak, citizen.",
    staySeconds: 30,
    openChat: true
  });
});

window.petApi.onConfigUpdated((cfg) => {
  if (cfg.petSize) applyPetSize(cfg.petSize);
  if (cfg.animationSpeed) applyAnimationSpeed(cfg.animationSpeed);
  if (cfg.soundEnabled !== undefined) soundEnabled = cfg.soundEnabled;
});

// Initialization
startBlinking();
startWandering();

window.petApi.getConfig().then((cfg) => {
  if (cfg.petSize) applyPetSize(cfg.petSize);
  if (cfg.animationSpeed) applyAnimationSpeed(cfg.animationSpeed);
  if (cfg.soundEnabled !== undefined) soundEnabled = cfg.soundEnabled;
});
