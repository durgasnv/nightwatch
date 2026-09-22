/**
 * Batman / Night Guardian Wellness Dialogue Bank
 * Brooding, protective, watchful personality nudging the user to stay healthy.
 */

const DIALOGUES = {
  hydration: {
    normal: [
      {
        text: "Even the shadows require hydration. Drink water, citizen.",
        action: "Drink 1 glass (250ml) now"
      },
      {
        text: "Dehydration is Gotham's quietest criminal. Fuel up before your mind dulls.",
        action: "Take a tall glass of water"
      },
      {
        text: "Alfred prepared the water carafe. Do not make me deploy the Batmobile to deliver it.",
        action: "Hydrate immediately"
      },
      {
        text: "Gotham's defender requires clean liquid fuel. Grab your bottle.",
        action: "Take 3 big sips"
      },
      {
        text: "The city never sleeps, but it stays hydrated. Drink up.",
        action: "Empty your glass"
      }
    ],
    persistent: [
      {
        text: "You haven't logged water in a while. Even Batman can't fight crime on an empty tank.",
        action: "Drink a full glass now"
      },
      {
        text: "Alfred is tapping his foot. Do not make him come in here.",
        action: "Hydrate and log it"
      }
    ]
  },

  break: [
    {
      title: "The 20-20-20 Bat-Scan",
      text: "Batcomputer cooldown: Look 20 feet away into the darkness for 20 seconds. Give your retinas a rest.",
      action: "Look away from the screen for 20 seconds",
      durationSeconds: 20
    },
    {
      title: "Gargoyle Posture Correction",
      text: "Posture check: Straighten your spine. You're slouching like a weathered gargoyle on Wayne Tower.",
      action: "Roll shoulders back, sit upright, take deep breath",
      durationSeconds: 15
    },
    {
      title: "Perimeter Patrol",
      text: "Perimeter sweep: Stand up from your station and walk around for 2 minutes. The Batcave can wait.",
      action: "Stand up and walk around",
      durationSeconds: 120
    },
    {
      title: "Wrist & Grapple Stretch",
      text: "Release tension in your wrists. You can't fire a grapple-gun with stiff joints and carpal tunnel.",
      action: "Interlace fingers, stretch arms out, rotate wrists",
      durationSeconds: 30
    },
    {
      title: "Oxygen Intake",
      text: "Gotham's smog won't get you here. Inhale 4 seconds, hold 4, exhale 6. Recalibrate your mind.",
      action: "Perform 3 cycles of deep breathing",
      durationSeconds: 30
    }
  ],

  stretch: [
    {
      title: "Gargoyle Posture Correction",
      text: "Posture check: Straighten your spine. You're slouching like a weathered gargoyle on Wayne Tower.",
      action: "Roll shoulders back, sit upright, and take one deep breath",
      durationSeconds: 15
    },
    {
      title: "Wrist & Grapple Stretch",
      text: "Release tension in your wrists. You can't fire a grapple-gun with stiff joints and carpal tunnel.",
      action: "Interlace your fingers, extend your arms, and rotate both wrists",
      durationSeconds: 30
    },
    {
      title: "Neck Recalibration",
      text: "The cowl is heavy enough. Let your neck recover before the next patrol.",
      action: "Gently look left, right, up, and down without forcing the movement",
      durationSeconds: 20
    }
  ],

  mood: {
    prompts: [
      {
        text: "Nightwing, status report. What is your mental fortitude today?",
        subtext: "Log your current mental state to keep records in the Batcomputer."
      },
      {
        text: "The Bat-signal doesn't shine without a vigilant mind. How are you feeling right now?",
        subtext: "Even the Dark Knight checks in on his allies."
      },
      {
        text: "The cowl carries heavy weight. Acknowledge your current state, ally.",
        subtext: "Honesty keeps you in fighting shape."
      }
    ],
    options: [
      {
        id: "victorious",
        emoji: "🦇",
        label: "Victorious",
        description: "High energy, focused, ready for anything",
        response: "Excellent. Channel that momentum. Gotham needs this energy today."
      },
      {
        id: "steady",
        emoji: "🛡️",
        label: "Steady",
        description: "Holding the line, stable pace",
        response: "Discipline beats intensity. Maintain your steady patrol."
      },
      {
        id: "fatigued",
        emoji: "🌧️",
        label: "Fatigued",
        description: "Low stamina, worn out, running low",
        response: "A fatigued guardian is a vulnerable guardian. Step back and recharge."
      },
      {
        id: "overwhelmed",
        emoji: "⚡",
        label: "Overwhelmed",
        description: "High stress, too many fires to put out",
        response: "Breathe. We take it one problem at a time. The night is darkest before dawn."
      }
    ]
  },

  snooze: {
    1: {
      text: "Acknowledged. Snoozing for 5 minutes. Don't test the clock.",
      expression: "idle"
    },
    2: {
      text: "You've snoozed twice now. Procrastination is the enemy of discipline.",
      expression: "hydrate"
    },
    3: {
      text: "Three snoozes? I don't snooze when Gotham calls, and you shouldn't snooze your health. Drink the water / take the break.",
      expression: "escalate"
    }
  },

  celebrate: [
    {
      minStreak: 3,
      text: "3 consecutive check-ins recorded. The shadows acknowledge your dedication.",
      title: "Vigilant Scout"
    },
    {
      minStreak: 5,
      text: "5 health milestones reached today! Even the Dark Knight smiles at this discipline.",
      title: "Guardian of Gotham"
    },
    {
      minStreak: 8,
      text: "8 wellness routines completed! Alfred is preparing a master feast in your honor.",
      title: "Batcave Champion"
    }
  ],

  idle: [
    "I'm keeping watch from the shadows.",
    "Batcomputer monitoring in the background. Stay focused.",
    "No criminal activity detected on your desktop. Carry on."
  ]
};

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getDialogue(type, options = {}) {
  switch (type) {
    case 'hydration': {
      const isPersistent = options.isPersistent || false;
      const pool = isPersistent ? DIALOGUES.hydration.persistent : DIALOGUES.hydration.normal;
      return getRandomItem(pool);
    }
    case 'break': {
      return getRandomItem(DIALOGUES.break);
    }
    case 'stretch': {
      return getRandomItem(DIALOGUES.stretch);
    }
    case 'mood': {
      const prompt = getRandomItem(DIALOGUES.mood.prompts);
      return {
        ...prompt,
        options: DIALOGUES.mood.options
      };
    }
    case 'snooze': {
      const level = Math.min(options.level || 1, 3);
      return DIALOGUES.snooze[level];
    }
    case 'celebrate': {
      const streak = options.streak || 3;
      const eligible = DIALOGUES.celebrate.filter(c => streak >= c.minStreak);
      return eligible.length > 0 ? eligible[eligible.length - 1] : DIALOGUES.celebrate[0];
    }
    case 'idle':
    default:
      return { text: getRandomItem(DIALOGUES.idle) };
  }
}

module.exports = {
  DIALOGUES,
  getDialogue
};
