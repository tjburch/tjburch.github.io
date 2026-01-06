(function() {
  'use strict';

  const STORAGE_KEY = 'nostalgiaMode';
  const toggle = document.getElementById('nostalgia-toggle');

  if (!toggle) return;

  function isActive() {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  }

  function playPowerOnSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      var notes = [
        { freq: 660, start: 0, duration: 0.08 },
        { freq: 880, start: 0.08, duration: 0.08 },
        { freq: 1320, start: 0.16, duration: 0.15 },
      ];

      notes.forEach(function(note) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = note.freq;
        gain.gain.setValueAtTime(0.1, ctx.currentTime + note.start);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + note.start + note.duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + note.start);
        osc.stop(ctx.currentTime + note.start + note.duration + 0.05);
      });
    } catch (e) {}
  }

  function createPixelRunner() {
    const container = document.createElement('div');
    container.className = 'pixel-runner-container';

    // Create pixel art character with CSS (scaled to 75%)
    container.innerHTML = `
      <div class="pixel-runner">
        <!-- Hat -->
        <div style="position:absolute;top:0;left:6px;width:15px;height:6px;background:#e60012;"></div>
        <div style="position:absolute;top:3px;left:3px;width:18px;height:3px;background:#e60012;"></div>
        <!-- Face -->
        <div style="position:absolute;top:6px;left:6px;width:12px;height:6px;background:#ffccaa;"></div>
        <!-- Hair/sideburns -->
        <div style="position:absolute;top:6px;left:3px;width:3px;height:6px;background:#4a2800;"></div>
        <!-- Body/Shirt -->
        <div style="position:absolute;top:12px;left:6px;width:12px;height:6px;background:#e60012;"></div>
        <!-- Arms -->
        <div style="position:absolute;top:12px;left:3px;width:3px;height:6px;background:#e60012;animation:armSwing 0.15s steps(1) infinite;"></div>
        <div style="position:absolute;top:12px;left:18px;width:3px;height:6px;background:#ffccaa;animation:armSwing 0.15s steps(1) infinite reverse;"></div>
        <!-- Overalls -->
        <div style="position:absolute;top:18px;left:6px;width:12px;height:9px;background:#0058f8;"></div>
        <!-- Overall straps -->
        <div style="position:absolute;top:13px;left:7px;width:3px;height:5px;background:#0058f8;"></div>
        <div style="position:absolute;top:13px;left:14px;width:3px;height:5px;background:#0058f8;"></div>
        <!-- Legs -->
        <div style="position:absolute;top:27px;left:6px;width:5px;height:6px;background:#0058f8;animation:legRun 0.15s steps(1) infinite;"></div>
        <div style="position:absolute;top:27px;left:13px;width:5px;height:6px;background:#0058f8;animation:legRun 0.15s steps(1) infinite reverse;"></div>
        <!-- Shoes -->
        <div style="position:absolute;top:33px;left:4px;width:6px;height:3px;background:#4a2800;animation:legRun 0.15s steps(1) infinite;"></div>
        <div style="position:absolute;top:33px;left:14px;width:6px;height:3px;background:#4a2800;animation:legRun 0.15s steps(1) infinite reverse;"></div>
      </div>
    `;

    document.documentElement.appendChild(container);

    setTimeout(function() {
      container.remove();
    }, 3000);
  }

  function playPowerOffSound() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }

  function enableNostalgia(withAnimation) {
    var html = document.documentElement;

    // Disable taco mode if active
    if (sessionStorage.getItem('tacoMode') === 'true') {
      sessionStorage.setItem('tacoMode', 'false');
      html.classList.remove('taco-mode');
      var tacoToggle = document.getElementById('taco-toggle');
      if (tacoToggle) {
        tacoToggle.textContent = 'Taco Mode';
        tacoToggle.setAttribute('aria-pressed', 'false');
      }
    }

    if (withAnimation) {
      html.classList.add('nostalgia-mode', 'crt-turning-on');
      playPowerOnSound();
      createPixelRunner();
      setTimeout(function() {
        html.classList.remove('crt-turning-on');
      }, 600);
    } else {
      html.classList.add('nostalgia-mode');
    }

    sessionStorage.setItem(STORAGE_KEY, 'true');
    toggle.textContent = '8-BIT: ON';
    toggle.setAttribute('aria-pressed', 'true');
  }

  function disableNostalgia() {
    playPowerOffSound();
    document.documentElement.classList.remove('nostalgia-mode', 'crt-turning-on');
    sessionStorage.setItem(STORAGE_KEY, 'false');
    toggle.textContent = 'Nostalgia Mode';
    toggle.setAttribute('aria-pressed', 'false');
  }

  if (isActive()) {
    enableNostalgia(false);
  }

  toggle.addEventListener('click', function() {
    if (isActive()) {
      disableNostalgia();
    } else {
      enableNostalgia(true);
    }
  });
})();
