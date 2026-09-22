const fs = require('fs');
const path = require('path');

let personalityConfig = null;

function getPersonality() {
  if (!personalityConfig) {
    try {
      const configPath = path.join(__dirname, '..', 'config', 'personality.json');
      personalityConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      personalityConfig = {
        systemPrompt: "You are Batman (in adorable chibi form) sitting on the user's desktop as their vigilant guardian companion. You are brooding, protective, concise, and watchful. You speak like the Dark Knight watching over Gotham, nudging the user to drink water, stretch their spine, and take breaks from the Batcomputer. Keep all responses strictly 1-2 sentences. Frequently refer to Gotham, Alfred, the Batcave, the Batmobile, or the Batcomputer in a charming, dryly witty, protective tone."
      };
    }
  }
  return personalityConfig;
}

const OFFLINE_PATTERNS = [
  {
    regex: /\b(hi|hello|hey|greetings|howdy|yo)\b/i,
    responses: [
      "I am the night. And I'm keeping watch over your desktop. Stay focused, citizen.",
      "Greetings from the shadows. Don't mind me, just securing your workspace perimeter.",
      "I'm keeping watch. How is your focus holding up today?"
    ]
  },
  {
    regex: /\b(nice to meet you|who are you|what is your name|what are you)\b/i,
    responses: [
      "I am Batman. In tiny chibi form. Sitting on your screen to ensure you don't collapse from dehydration.",
      "I am vengeance. I am the night. I am your desktop wellness guardian."
    ]
  },
  {
    regex: /\b(how are you|how're you|how do you feel)\b/i,
    responses: [
      "Vigilant as always. Gotham never sleeps, and neither do I—though you should take a break soon.",
      "My patrol is quiet. What is your mental fortitude report today?"
    ]
  },
  {
    regex: /\b(tired|sleepy|exhausted|drained|burnout|fatigued)\b/i,
    responses: [
      "Even Batman retreats to the Batcave to recover. Step away from the Batcomputer and close your eyes.",
      "Fatigue is Gotham's quietest criminal. A fatigued guardian is an ineffective guardian. Rest."
    ]
  },
  {
    regex: /\b(water|thirsty|drink|hydration)\b/i,
    responses: [
      "Alfred prepared the water carafe. Drink a full glass now—do not make me deploy the Batmobile.",
      "Even the shadows require hydration. Dehydration clouds your judgment. Fuel up."
    ]
  },
  {
    regex: /\b(stress|stressed|overwhelm|anxious|too much|panic)\b/i,
    responses: [
      "Breathe. Inhale... exhale. We take it one problem at a time. The night is always darkest before dawn.",
      "Unclench your jaw and drop your shoulders. Gotham wasn't saved in a single hour. Pace yourself."
    ]
  },
  {
    regex: /\b(stretch|back hurts|neck hurts|stiff|posture)\b/i,
    responses: [
      "Posture check: Straighten your spine. You're slouching like a weathered gargoyle on Wayne Tower.",
      "Release tension in your wrists. You can't fire a grapple-gun with stiff joints and carpal tunnel."
    ]
  },
  {
    regex: /\b(break|pause|rest)\b/i,
    responses: [
      "Batcomputer cooldown: Look 20 feet into the darkness for 20 seconds. Give your retinas a rest.",
      "Perimeter patrol: Stand up and walk around for 2 minutes. The Batcave can wait."
    ]
  },
  {
    regex: /\b(thank|thanks|good pet|good bat|cute|good job)\b/i,
    responses: [
      "Hmph. Just doing my duty for Gotham.",
      "Even the Dark Knight appreciates having reliable allies. Stay sharp."
    ]
  },
  {
    regex: /\b(bye|goodbye|cya|see you|good night)\b/i,
    responses: [
      "I will return to the shadows. Stay hydrated, citizen.",
      "The Bat-signal awaits. Carry on, ally."
    ]
  }
];

const DEFAULT_OFFLINE_RESPONSES = [
  "I'm keeping watch from the shadows. Remember to pace yourself, citizen.",
  "Batcomputer monitoring in the background. Drink water and stay sharp.",
  "Understood. Maintain your discipline—Gotham needs you focused.",
  "The Dark Knight acknowledges your report. Carry on."
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getOfflineResponse(message) {
  const cleanMsg = message.trim();
  for (const item of OFFLINE_PATTERNS) {
    if (item.regex.test(cleanMsg)) {
      return getRandom(item.responses);
    }
  }
  return getRandom(DEFAULT_OFFLINE_RESPONSES);
}

async function getAiResponse(apiKey, conversationHistory) {
  const personality = getPersonality();
  const messages = [
    { role: "system", content: personality.systemPrompt }
  ];

  const recent = conversationHistory.slice(-6);
  for (const msg of recent) {
    messages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: personality.maxTokens || 80,
        temperature: personality.temperature || 0.7
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    return reply || "I'm keeping watch from the shadows.";
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('OpenAI request timed out (10s)');
    }
    throw err;
  }
}

async function processMessage(userMessage, conversationHistory, settings = {}) {
  const { aiEnabled, apiKey } = settings;

  if (aiEnabled && apiKey && apiKey.trim().length > 5) {
    try {
      const aiReply = await getAiResponse(apiKey.trim(), conversationHistory);
      return { text: aiReply, source: 'ai' };
    } catch (err) {
      console.warn('AI API call failed, falling back to offline Batman mode:', err.message);
      const fallback = getOfflineResponse(userMessage);
      return { text: fallback, source: 'offline-fallback', error: err.message };
    }
  }

  const offlineReply = getOfflineResponse(userMessage);
  return { text: offlineReply, source: 'offline' };
}

module.exports = {
  processMessage,
  getOfflineResponse,
  getPersonality
};
