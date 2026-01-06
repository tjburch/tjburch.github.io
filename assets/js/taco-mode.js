(function() {
  'use strict';

  const STORAGE_KEY = 'tacoMode';
  const NOSTALGIA_KEY = 'nostalgiaMode';
  const toggle = document.getElementById('taco-toggle');

  if (!toggle) return;

  function isActive() {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  }

  function playTacoCrunch() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      // White noise burst for "crunch" texture
      const bufferSize = ctx.sampleRate * 0.15;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      // Bandpass filter for "crispy" texture
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3000;
      filter.Q.value = 2;

      // Quick amplitude envelope
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (e) {}
  }

  function playTacoOff() {
    try {
      // Softer, shorter crunch for toggle off
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const bufferSize = ctx.sampleRate * 0.08;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (e) {}
  }

  function createGeometricWipe() {
    const overlay = document.createElement('div');
    overlay.className = 'taco-wipe-overlay';
    document.body.appendChild(overlay);

    setTimeout(function() {
      overlay.remove();
    }, 300);
  }

  function createTacoShower() {
    const tacoCount = 50;
    const container = document.createElement('div');
    container.className = 'taco-shower-container';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10001;overflow:hidden;';
    document.body.appendChild(container);

    for (let i = 0; i < tacoCount; i++) {
      const taco = document.createElement('div');
      taco.textContent = '🌮';
      taco.style.cssText = `
        position: absolute;
        font-size: ${20 + Math.random() * 30}px;
        left: ${Math.random() * 100}%;
        top: -50px;
        animation: tacoFall ${1.5 + Math.random() * 1.5}s ease-in forwards;
        animation-delay: ${Math.random() * 0.5}s;
        transform: rotate(${Math.random() * 360}deg);
      `;
      container.appendChild(taco);
    }

    setTimeout(function() {
      container.remove();
    }, 3500);
  }

  function enableTacoMode(withAnimation) {
    var html = document.documentElement;

    // Disable nostalgia mode if active
    if (sessionStorage.getItem(NOSTALGIA_KEY) === 'true') {
      sessionStorage.setItem(NOSTALGIA_KEY, 'false');
      html.classList.remove('nostalgia-mode', 'crt-turning-on');
      var nostalgiaToggle = document.getElementById('nostalgia-toggle');
      if (nostalgiaToggle) {
        nostalgiaToggle.textContent = 'Nostalgia Mode';
        nostalgiaToggle.setAttribute('aria-pressed', 'false');
      }
    }

    if (withAnimation) {
      playTacoCrunch();
      createTacoShower();
      html.classList.add('taco-mode');
    } else {
      html.classList.add('taco-mode');
    }

    sessionStorage.setItem(STORAGE_KEY, 'true');
    toggle.innerHTML = '<span class="taco-spin">🌮</span>';
    toggle.setAttribute('aria-pressed', 'true');
  }

  function disableTacoMode() {
    playTacoOff();
    document.documentElement.classList.remove('taco-mode');
    sessionStorage.setItem(STORAGE_KEY, 'false');
    toggle.textContent = 'Taco Mode';
    toggle.setAttribute('aria-pressed', 'false');
  }

  // On page load: if taco mode is active, show the wipe transition
  if (isActive()) {
    createGeometricWipe();
    enableTacoMode(false);
  }

  toggle.addEventListener('click', function() {
    if (isActive()) {
      disableTacoMode();
    } else {
      enableTacoMode(true);
    }
  });
})();
