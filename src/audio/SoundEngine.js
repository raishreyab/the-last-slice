// 100% Procedural Web Audio API Horror Sound Engine
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterVolume = 0.8;

    // Heartbeat state
    this.heartbeatOsc = null;
    this.heartbeatGain = null;
    this.heartbeatInterval = null;
    this.heartbeatBpm = 60;
    this.monsterDistance = 999;

    // Ambient Drone state
    this.droneGain = null;
    this.ambientRunning = false;

    // Initialize on first user interaction
    this.initContext();
  }

  initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.ambientRunning) {
      this.startAmbientDrone();
    }
  }

  startAmbientDrone() {
    if (!this.ctx || this.ambientRunning) return;
    this.ambientRunning = true;

    // Deep sub-bass horror drone (38Hz and 42Hz beating frequency)
    const masterDrone = this.ctx.createGain();
    masterDrone.gain.setValueAtTime(0.18 * this.masterVolume, this.ctx.currentTime);
    masterDrone.connect(this.ctx.destination);
    this.droneGain = masterDrone;

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(42, this.ctx.currentTime);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(38, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(masterDrone);

    osc1.start();
    osc2.start();

    // Start proximity heartbeat loop
    this.initHeartbeatLoop();
  }

  initHeartbeatLoop() {
    let beatPhase = 0;
    const tick = () => {
      if (this.monsterDistance < 18) {
        // Double thump (lub-dub)
        this.playHeartbeatThump(beatPhase % 2 === 0 ? 55 : 45);
        beatPhase++;
      }
      // Speed scales up from 60bpm (1000ms) to 150bpm (400ms) as beast draws closer!
      const delay = Math.max(380, Math.min(1100, (this.monsterDistance / 18) * 1000));
      this.heartbeatTimeout = setTimeout(tick, delay);
    };
    tick();
  }

  updateMonsterDistance(dist) {
    this.monsterDistance = dist;
  }

  playHeartbeatThump(freq = 50) {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.14);

    const volume = Math.min(0.65, Math.max(0.05, (1.0 - this.monsterDistance / 18) * 0.7));
    gain.gain.setValueAtTime(volume * this.masterVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playFootstep(type = 'walk') {
    if (!this.ctx || this.isMuted) return;
    const duration = type === 'soft' ? 0.08 : 0.12;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(type === 'run' ? 380 : 260, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    const vol = (type === 'run' ? 0.28 : (type === 'soft' ? 0.08 : 0.16)) * this.masterVolume;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  playDoorCreak() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(220, this.ctx.currentTime + 0.3);
    osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.7);

    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18 * this.masterVolume, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.75);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }

  playLockClick() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.3 * this.masterVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  playLockedRattle() {
    if (!this.ctx || this.isMuted) return;
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(160 + i * 20, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12 * this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.06);
      }, i * 60);
    }
  }

  playWerewolfGrowl(isClose = false) {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(95, this.ctx.currentTime + 0.4);
    osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, this.ctx.currentTime);

    const vol = (isClose ? 0.45 : 0.18) * this.masterVolume;
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.4);
  }

  playWerewolfHowl() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(460, this.ctx.currentTime + 0.8);
    osc.frequency.linearRampToValueAtTime(340, this.ctx.currentTime + 2.4);

    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.35 * this.masterVolume, this.ctx.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 2.6);
  }

  playPumpkinBurst() {
    if (!this.ctx || this.isMuted) return;
    // Bright ethereal blast + thunder rumble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.55 * this.masterVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.9);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.95);
  }

  playPumpkinAbilityHum() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(660, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.18 * this.masterVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
  }

  playPickup() {
    if (!this.ctx || this.isMuted) return;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.2 * this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.22);
      }, idx * 75);
    });
  }

  playJumpscare() {
    if (!this.ctx || this.isMuted) return;
    // Violent discordant horror sting
    [180, 188, 370, 740, 1200].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.6 * this.masterVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.25);
    });
  }

  // --- CINEMATIC INTRODUCTION AUDIO SUITE ---
  startIntroMusic() {
    if (!this.ctx) this.initContext();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.introMusicActive) return;
    this.introMusicActive = true;

    // Master Intro Gain
    this.introGain = this.ctx.createGain();
    this.introGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.introGain.gain.linearRampToValueAtTime(0.45 * this.masterVolume, this.ctx.currentTime + 3.0);
    this.introGain.connect(this.ctx.destination);

    // 1. Haunting Cello Drone (F# / C tritone dissonance)
    this.introOsc1 = this.ctx.createOscillator();
    this.introOsc1.type = 'sawtooth';
    this.introOsc1.frequency.setValueAtTime(46.25, this.ctx.currentTime); // F#1

    this.introOsc2 = this.ctx.createOscillator();
    this.introOsc2.type = 'sine';
    this.introOsc2.frequency.setValueAtTime(65.41, this.ctx.currentTime); // C2

    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

    this.introOsc1.connect(droneFilter);
    this.introOsc2.connect(droneFilter);
    droneFilter.connect(this.introGain);

    this.introOsc1.start();
    this.introOsc2.start();

    // 2. Slow ominous chime arpeggio (Music box in empty pizzeria)
    const notes = [261.63, 311.13, 392.00, 415.30, 246.94]; // C4, Eb4, G4, Ab4, B3
    let noteIdx = 0;
    this.introChimeInterval = setInterval(() => {
      if (!this.introMusicActive || !this.ctx || this.isMuted) return;
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(notes[noteIdx % notes.length], this.ctx.currentTime);
      chimeGain.gain.setValueAtTime(0.12 * this.masterVolume, this.ctx.currentTime);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.0);
      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.introGain);
      chimeOsc.start();
      chimeOsc.stop(this.ctx.currentTime + 2.1);
      noteIdx++;
    }, 2400);
  }

  stopIntroMusic() {
    if (!this.introMusicActive) return;
    this.introMusicActive = false;
    clearInterval(this.introChimeInterval);
    if (this.introGain && this.ctx) {
      try {
        this.introGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
        setTimeout(() => {
          try {
            if (this.introOsc1) { this.introOsc1.stop(); this.introOsc1.disconnect(); }
            if (this.introOsc2) { this.introOsc2.stop(); this.introOsc2.disconnect(); }
          } catch (e) {}
        }, 1300);
      } catch (e) {}
    }
  }

  playThunder() {
    if (!this.ctx || this.isMuted) return;
    const dur = 3.5;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55 * this.masterVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  playWhisper() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(320, this.ctx.currentTime + 1.5);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);
    filter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18 * this.masterVolume, this.ctx.currentTime + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.7);
  }

  playCinematicStinger() {
    if (!this.ctx || this.isMuted) return;
    // Dramatic C minor horror hit
    [65.4, 130.8, 155.6, 196.0, 311.1].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.4 * this.masterVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 2.6);
    });
  }
}

