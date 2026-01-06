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

    if (withAnimation) {
      html.classList.add('nostalgia-mode', 'crt-turning-on');
      playPowerOnSound();
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
