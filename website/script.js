// Nightwatch Interactive Landing Page Controller

document.addEventListener('DOMContentLoaded', () => {
  // Live Simulator Elements
  const simButtons = document.querySelectorAll('.sim-btn');
  const simTag = document.getElementById('sim-tag');
  const simMessage = document.getElementById('sim-message');
  const simActionPill = document.getElementById('sim-action-pill');
  const simActionText = document.getElementById('sim-action-text');
  const simSprite = document.getElementById('sim-sprite');

  // Hero Live Card Elements
  const heroDemoBubble = document.getElementById('hero-demo-bubble');
  const heroDemoText = document.getElementById('hero-demo-text');
  const heroDemoAction = document.getElementById('hero-demo-action');
  const heroMascotImg = document.getElementById('hero-mascot-img');

  const spriteMap = {
    hydrate: '../assets/characters/hydrate.png',
    break: '../assets/characters/break.png',
    mood: '../assets/characters/mood.png',
    celebrate: '../assets/characters/celebrate.png',
    idle: '../assets/characters/idle.png'
  };

  // Web Audio Synth for Browser preview
  function playWebChime(type = 'chime') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'chime') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'celebrate') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.08);
        osc.frequency.setValueAtTime(659.25, now + 0.16);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // Handle Simulator Button Clicks
  simButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      simButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const pose = btn.dataset.pose;
      const tag = btn.dataset.tag;
      const text = btn.dataset.text;
      const action = btn.dataset.action;

      // Animate Simulator View
      simTag.textContent = tag;
      simMessage.textContent = `"${text}"`;
      simActionText.textContent = action;
      
      // Animate Mascot Sprite
      simSprite.style.transform = 'scale(0.85)';
      simSprite.style.opacity = '0.4';
      
      setTimeout(() => {
        simSprite.src = spriteMap[pose] || spriteMap.idle;
        simSprite.style.transform = 'scale(1)';
        simSprite.style.opacity = '1';
      }, 150);

      if (pose === 'celebrate') {
        playWebChime('celebrate');
      } else {
        playWebChime('chime');
      }
    });
  });

  // Hero Mascot Cyclic Dialogue Demo (every 7 seconds)
  const heroQuotes = [
    {
      tag: '🦇 BAT-PROTOCOL',
      text: "Even the shadows require hydration. Drink water, citizen.",
      action: "🎯 Drink 1 tall glass (250ml) now",
      pose: 'hydrate'
    },
    {
      tag: '🦇 BATCOMPUTER COOLDOWN',
      text: "Batcomputer cooldown: Look 20 feet away into the darkness for 20 seconds.",
      action: "🎯 Rest retinas for 20 seconds",
      pose: 'break'
    },
    {
      tag: '🧘 POSTURE RECALIBRATION',
      text: "Posture check: Straighten your spine. You're slouching like a weathered gargoyle on Wayne Tower.",
      action: "🎯 Roll shoulders back, sit upright",
      pose: 'break'
    },
    {
      tag: '🌟 BATCAVE CHAMPION',
      text: "Discipline acknowledged. The shadows approve of your consistency.",
      action: "🔥 Daily streak maintained!",
      pose: 'celebrate'
    }
  ];

  let quoteIdx = 0;
  setInterval(() => {
    quoteIdx = (quoteIdx + 1) % heroQuotes.length;
    const q = heroQuotes[quoteIdx];

    heroDemoBubble.style.opacity = '0';
    heroDemoBubble.style.transform = 'translateY(10px)';

    setTimeout(() => {
      heroDemoText.textContent = `"${q.text}"`;
      heroDemoAction.textContent = q.action;
      heroMascotImg.src = spriteMap[q.pose] || spriteMap.idle;
      
      heroDemoBubble.style.opacity = '1';
      heroDemoBubble.style.transform = 'translateY(0)';
    }, 300);
  }, 6500);

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
});
