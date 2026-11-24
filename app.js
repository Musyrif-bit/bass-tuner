(function () {
  "use strict";
  var D = window.BASS_DATA;
  var FAST = /fast=1/.test(location.search) ? 30 : 1; /* test mode: blocks run 30x faster */
  function $(id) { return document.getElementById(id); }
  var NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
  var OPEN = [28, 33, 38, 43], SN = ["E", "A", "D", "G"];
  function pretty(n) { return n.replace("#", "♯").replace(/^([A-G])b/, "$1♭"); }
  function noteName(pc) { return pretty(NAMES[((pc % 12) + 12) % 12]); }
  function mfreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* ---------- storage ---------- */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dkey(d) { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  var store = (function () {
    var s = {};
    try { s = JSON.parse(localStorage.getItem("bassCoach") || "{}") || {}; } catch (e) { s = {}; }
    s.days = s.days || {}; s.done = s.done || {}; s.level = s.level || 1; s.best = s.best || 0;
    return s;
  })();
  function save() { try { localStorage.setItem("bassCoach", JSON.stringify(store)); } catch (e) {} }
  function streak() {
    var d = new Date(), n = 0;
    if ((store.days[dkey(d)] || 0) < 600) d.setDate(d.getDate() - 1);
    while ((store.days[dkey(d)] || 0) >= 600) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  var unsaved = 0;
  function logSecs(dt) {
    var k = dkey();
    store.days[k] = (store.days[k] || 0) + dt;
    unsaved += dt;
    if (unsaved > 5) { unsaved = 0; store.best = Math.max(store.best, streak()); save(); }
  }
  function doneToday() { return store.done[dkey()] || []; }
  function markDone(id) {
    var k = dkey(), a = store.done[k] || [];
    if (a.indexOf(id) < 0) a.push(id);
    store.done[k] = a; store.best = Math.max(store.best, streak()); save();
  }
  function days(n) { return n + (n === 1 ? " day" : " days"); }
  function fmtMin(sec) {
    var m = Math.round(sec / 60);
    if (m < 60) return m + " min";
    return Math.floor(m / 60) + " h " + (m % 60) + " m";
  }

  /* ---------- today's plan (same all day) ---------- */
  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makePlan() {
    var d = new Date();
    var r = rng(d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate());
    var g = D.genres[Math.floor(r() * D.genres.length)];
    var bpm = g.bpm[0] + Math.floor(r() * (g.bpm[1] - g.bpm[0] + 1));
    var pi = g.progs ? g.progs[Math.floor(r() * g.progs.length)] : (g.prog != null) ? g.prog : 1 + Math.floor(r() * 20);
    var prog = D.progs[pi];
    var key = [4, 9, 2, 7, 0][Math.floor(r() * 5)];
    var chords = prog.ch.map(function (c) {
      var pc = (key + c[0]) % 12;
      return { pc: pc, q: c[1], sfx: c[2] || "", name: noteName(pc) + (c[1] === "min" ? "m" : "") + (c[2] || "") };
    });
    var day = d.getDay(), review = day === 0;
    var tech = review ? D.tech[1 + Math.floor(r() * 6)] : D.tech[day];
    return { day: dkey(d), genre: g, bpm: bpm, chords: chords, tech: tech, review: review, lickR: r() };
  }
  var plan = makePlan();
  var bpmNow = {};
  function checkDay() { if (plan.day !== dkey()) { plan = makePlan(); bpmNow = {}; } }

  /* ---------- audio ---------- */
  var ctx = null, master = null, noiseBuf = null, chordBus = null, echoIn = null, echoDl = null;
  var CHORD_VOL = [0.55, 1, 0], CHORD_LABEL = ["Chords: soft", "Chords: loud", "Chords: off"];
  function audio() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.9;
      var lim = ctx.createDynamicsCompressor(); lim.threshold.value = -10; lim.ratio.value = 4;
      master.connect(lim); lim.connect(ctx.destination);
      chordBus = ctx.createGain(); chordBus.gain.value = CHORD_VOL[store.comp || 0]; chordBus.connect(master);
      echoIn = ctx.createGain(); echoIn.gain.value = 0; echoDl = ctx.createDelay(2); echoDl.delayTime.value = 0.3;
      var efb = ctx.createGain(); efb.gain.value = 0.38; var elp = ctx.createBiquadFilter(); elp.type = "lowpass"; elp.frequency.value = 2200;
      echoIn.connect(echoDl); echoDl.connect(elp); elp.connect(efb); efb.connect(echoDl); elp.connect(chordBus);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      var dd = noiseBuf.getChannelData(0);
      for (var i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1;
    }
    if (ctx.state !== "running") ctx.resume();
    return ctx;
  }
  function setSession(type) { try { if (navigator.audioSession) navigator.audioSession.type = type; } catch (e) {} }
  function env(g, t, peak, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  }
  function tone(t, type, freq, peak, decay) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq; env(g, t, peak, decay);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + decay + 0.05);
  }
  function noise(t, ftype, freq, peak, decay) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = ftype; f.frequency.value = freq; env(g, t, peak, decay);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + decay + 0.05);
  }
  function click(t, acc) { tone(t, "sine", acc ? 1600 : 1050, acc ? 0.6 : 0.4, 0.05); }
  function kick(t, v) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    env(g, t, 0.9 * v, 0.32); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.4);
    noise(t, "lowpass", 3000, 0.12 * v, 0.02);
  }
  function snare(t, v) { noise(t, "bandpass", 1900, 0.7 * v, 0.16); tone(t, "triangle", 190, 0.35 * v, 0.08); }
  function hat(t, v, open) { noise(t, "highpass", 7000, 0.3 * v, open ? 0.22 : 0.05); }
  function rim(t, v) { tone(t, "triangle", 820, 0.35 * v, 0.03); noise(t, "bandpass", 2600, 0.35 * v, 0.03); }
  function ride(t, v) { noise(t, "highpass", 5200, 0.16 * v, 0.4); tone(t, "square", 3400, 0.02 * v, 0.25); }

  /* ---------- chord instruments (the "band" under the drums) ---------- */
  function voiceOf(ch, kind) {
    var b = 48 + ch.pc; if (b < 52) b += 12;
    if (kind === "power") return [b, b + 7, b + 12];
    var n = [b, b + (ch.q === "min" ? 3 : 4), b + 7];
    if (ch.sfx === "7") n.push(b + 10); else if (ch.sfx === "maj7") n.push(b + 11);
    return n;
  }
  function osc(type, f, t, end, dest, detune) {
    var o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
    if (detune) o.detune.value = detune;
    o.connect(dest); o.start(t); o.stop(end);
  }
  function filt(type, f, q) { var x = ctx.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q; return x; }
  function playChord(inst, t, notes, dur, vol) {
    var v = vol * 0.11;
    notes.forEach(function (m, i) {
      var f = mfreq(m), g = ctx.createGain(), gg = g.gain, st = t, end, x, h;
      g.connect(chordBus); g.connect(echoIn);
      gg.setValueAtTime(0.0001, t);
      if (inst === "ep") {
        gg.exponentialRampToValueAtTime(v, st + 0.01); gg.exponentialRampToValueAtTime(v * 0.35, st + Math.max(dur, 0.06));
        gg.exponentialRampToValueAtTime(0.0001, st + dur + 0.3); end = st + dur + 0.35;
        osc("sine", f, st, end, g); h = ctx.createGain(); h.gain.value = 0.25; h.connect(g); osc("sine", f * 2, st, end, h);
      } else if (inst === "piano") {
        gg.exponentialRampToValueAtTime(v, st + 0.005); gg.exponentialRampToValueAtTime(v * 0.2, st + Math.max(0.1, Math.min(dur, 0.8)));
        gg.exponentialRampToValueAtTime(0.0001, st + dur + 0.2); end = st + dur + 0.25;
        osc("triangle", f, st, end, g); h = ctx.createGain(); h.gain.value = 0.3; h.connect(g); osc("sine", f * 2, st, end, h);
      } else if (inst === "organ") {
        gg.exponentialRampToValueAtTime(v * 0.7, st + 0.015); gg.setValueAtTime(v * 0.7, st + dur);
        gg.exponentialRampToValueAtTime(0.0001, st + dur + 0.08); end = st + dur + 0.1;
        osc("sine", f, st, end, g); h = ctx.createGain(); h.gain.value = 0.5; h.connect(g); osc("sine", f * 2, st, end, h); osc("sine", f * 3, st, end, h);
      } else if (inst === "pad") {
        x = filt("lowpass", 1100); x.connect(g);
        gg.linearRampToValueAtTime(v * 0.6, st + 0.35); gg.setValueAtTime(v * 0.6, st + dur);
        gg.exponentialRampToValueAtTime(0.0001, st + dur + 0.5); end = st + dur + 0.55;
        osc("sawtooth", f, st, end, x, -7); osc("sawtooth", f, st, end, x, 7);
      } else if (inst === "gtr") {
        st = t + i * 0.006; x = filt("bandpass", 1500, 0.8); x.connect(g);
        gg.setValueAtTime(0.0001, st); gg.exponentialRampToValueAtTime(v * 1.2, st + 0.003); gg.exponentialRampToValueAtTime(0.0001, st + 0.14); end = st + 0.16;
        osc("sawtooth", f, st, end, x);
      } else if (inst === "drive") {
        st = t + i * 0.006; x = filt("lowpass", 2200); x.connect(g);
        gg.setValueAtTime(0.0001, st); gg.exponentialRampToValueAtTime(v * 0.9, st + 0.005); gg.exponentialRampToValueAtTime(v * 0.5, st + Math.max(0.02, dur * 0.9));
        gg.exponentialRampToValueAtTime(0.0001, st + dur + 0.05); end = st + dur + 0.08;
        osc("sawtooth", f, st, end, x); osc("sawtooth", f, st, end, x, 10);
      } else if (inst === "nylon") {
        st = t + i * 0.018; x = filt("lowpass", 3000); x.connect(g);
        gg.setValueAtTime(0.0001, st); gg.exponentialRampToValueAtTime(v * 1.3, st + 0.003); gg.exponentialRampToValueAtTime(0.0001, st + Math.max(0.4, dur + 0.3)); end = st + Math.max(0.45, dur + 0.35);
        osc("triangle", f, st, end, x);
      } else {
        x = filt("lowpass", 1600); x.connect(g);
        gg.exponentialRampToValueAtTime(v * 1.6, st + 0.003); gg.exponentialRampToValueAtTime(0.0001, st + 0.22); end = st + 0.25;
        osc("square", f, st, end, x);
      }
    });
  }
  function setEcho() { audio(); echoIn.gain.value = plan.genre.echo ? 0.55 : 0; echoDl.delayTime.value = Math.min(1.5, 0.75 * 60 / bpmFor("band")); }
  function pluck(t, m, len) {
    var f = mfreq(m), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    var o = ctx.createOscillator(), o2 = ctx.createOscillator();
    o.type = "sawtooth"; o.frequency.value = f; o2.type = "sine"; o2.frequency.value = f * 2;
    lp.type = "lowpass"; lp.frequency.setValueAtTime(1400, t); lp.frequency.exponentialRampToValueAtTime(350, t + 0.35);
    env(g, t, 0.45, Math.max(0.2, len * 0.95));
    o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(master);
    o.start(t); o2.start(t); o.stop(t + len + 0.1); o2.stop(t + len + 0.1);
  }
  function chime() { audio(); var t = ctx.currentTime + 0.02; tone(t, "sine", 784, 0.25, 0.7); tone(t + 0.14, "sine", 1175, 0.2, 0.9); }

  /* ---------- sequencer (16th-note steps, scheduled ahead) ---------- */
  var seq = { on: false, timer: null, next: 0, step: 0, dur: 0.25, swing: 0, onStep: null, q: [] };
  function seqStart(bpm, onStep, from, swing) {
    audio(); setSession("playback");
    seq.dur = 60 / bpm / 4; seq.onStep = onStep; seq.step = from || 0; seq.swing = swing || 0;
    seq.next = ctx.currentTime + 0.12; seq.q = []; seq.on = true;
    clearInterval(seq.timer); seq.timer = setInterval(seqTick, 25); seqTick();
  }
  function seqTick() {
    if (!seq.on) return;
    while (seq.next < ctx.currentTime + 0.12) {
      var t = seq.next;
      if (seq.swing && seq.step % 4 === 2) t += seq.dur * seq.swing;
      seq.onStep(seq.step, t);
      seq.step++; seq.next += seq.dur;
    }
  }
  function seqStop() { seq.on = false; clearInterval(seq.timer); seq.q = []; }
  function vis(t, fn) { seq.q.push({ t: t, fn: fn }); }
  (function raf() {
    if (ctx && seq.q.length) {
      var now = ctx.currentTime;
      while (seq.q.length && seq.q[0].t <= now) { var it = seq.q.shift(); try { it.fn(); } catch (e) {} }
    }
    requestAnimationFrame(raf);
  })();

  /* ---------- wake lock ---------- */
  var wl = null;
  function wake(on) {
    try {
      if (on && !wl && navigator.wakeLock) navigator.wakeLock.request("screen").then(function (l) { wl = l; l.addEventListener("release", function () { wl = null; }); }).catch(function () {});
      if (!on && wl) { wl.release(); wl = null; }
    } catch (e) {}
  }

  /* ---------- microphone + pitch detection (YIN) ---------- */
  var mic = { stream: null, src: null, timer: null };
  function yin(buf, sr) {
    var minF = 30, maxF = 420;
    var tauMin = Math.floor(sr / maxF), tauMax = Math.min(Math.floor(sr / minF), (buf.length >> 1) - 1);
    var W = buf.length - tauMax, d = new Float32Array(tauMax + 1), tau, i, s, x;
    for (tau = 1; tau <= tauMax; tau++) { s = 0; for (i = 0; i < W; i++) { x = buf[i] - buf[i + tau]; s += x * x; } d[tau] = s; }
    var run = 0; d[0] = 1;
    for (tau = 1; tau <= tauMax; tau++) { run += d[tau]; d[tau] = run ? d[tau] * tau / run : 1; }
    var found = -1;
    for (var t = tauMin; t <= tauMax; t++) {
      if (d[t] < 0.15) { while (t + 1 <= tauMax && d[t + 1] < d[t]) t++; found = t; break; }
    }
    if (found < 0) return -1;
    var x0 = d[found - 1] != null ? d[found - 1] : d[found], x2 = d[found + 1] != null ? d[found + 1] : d[found], x1 = d[found];
    var den = x0 + x2 - 2 * x1;
    return sr / (den ? found + (x0 - x2) / (2 * den) : found);
  }
  function stopMic() {
    clearInterval(mic.timer); mic.timer = null;
    if (mic.stream) mic.stream.getTracks().forEach(function (tr) { tr.stop(); });
    if (mic.src) { try { mic.src.disconnect(); } catch (e) {} }
    mic.stream = null; mic.src = null; setSession("playback");
  }
  function startMic(onFreq) {
    stopMic();
    audio(); setSession("play-and-record");
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
      .then(function (stream) {
        audio();
        mic.stream = stream;
        var src = ctx.createMediaStreamSource(stream);
        var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 28;
        var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 400; lp.Q.value = 0.7;
        var an = ctx.createAnalyser(); an.fftSize = 8192;
        src.connect(hp); hp.connect(lp); lp.connect(an); mic.src = src;
        var buf = new Float32Array(an.fftSize);
        mic.timer = setInterval(function () {
          an.getFloatTimeDomainData(buf);
          var rms = 0; for (var i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
          rms = Math.sqrt(rms / buf.length);
          onFreq(rms > 0.004 ? yin(buf, ctx.sampleRate) : -1);
        }, 70);
      });
  }

  /* =====================================================
     TUNE TAB
     ===================================================== */
  var STR = [{ name: "E", freq: 41.2034 }, { name: "A", freq: 55 }, { name: "D", freq: 73.4162 }, { name: "G", freq: 97.9989 }];
  var noteEl = $("note"), hintEl = $("hint"), needle = $("needle"), modeEl = $("mode");
  var pegs = [].slice.call(document.querySelectorAll(".peg")), strs = [].slice.call(document.querySelectorAll(".string"));
  var locked = -1, lastHeard = 0, hist = [], tunerOn = false;
  pegs.forEach(function (p) {
    p.addEventListener("click", function () {
      var s = +p.dataset.s;
      locked = (locked === s) ? -1 : s;
      modeEl.innerHTML = locked < 0 ? "<b>Auto</b> · tap a peg to lock a string" : "Locked to <b>" + STR[locked].name + "</b> · tap it again for auto";
      tIdle();
    });
  });
  function tPaint(idx, cls) {
    pegs.forEach(function (p) { p.classList.remove("sel", "good"); });
    strs.forEach(function (s) { s.classList.remove("sel", "good"); });
    if (idx < 0) return;
    var c = cls === "good" ? "good" : "sel";
    pegs.filter(function (p) { return +p.dataset.s === idx; })[0].classList.add(c);
    strs.filter(function (s) { return +s.dataset.s === idx; })[0].classList.add(c);
  }
  function tShow(freq) {
    var idx = locked, f = freq;
    if (idx < 0) {
      while (f > 125) f /= 2;
      var best = 1e9;
      STR.forEach(function (s, i) { var c = Math.abs(1200 * Math.log2(f / s.freq)); if (c < best) { best = c; idx = i; } });
    } else {
      var tg = STR[idx].freq;
      while (f > tg * Math.SQRT2) f /= 2;
      while (f < tg / Math.SQRT2) f *= 2;
    }
    var cents = 1200 * Math.log2(f / STR[idx].freq), a = Math.abs(cents);
    var cls = a <= 3 ? "good" : a <= 12 ? "warn" : "bad";
    noteEl.textContent = STR[idx].name; noteEl.className = "note " + cls;
    if (cls === "good") { hintEl.textContent = "In tune ✓"; hintEl.className = "hint good"; }
    else { hintEl.textContent = cents < 0 ? "Tune up ↑" : "Tune down ↓"; hintEl.className = "hint"; }
    needle.style.left = (50 + Math.max(-50, Math.min(50, cents))) + "%";
    needle.className = "needle on" + (cls === "good" ? " good" : "");
    tPaint(idx, cls);
  }
  function tIdle() {
    needle.className = "needle"; needle.style.left = "50%"; noteEl.className = "note";
    if (locked < 0) { noteEl.textContent = "–"; tPaint(-1); } else { noteEl.textContent = STR[locked].name; tPaint(locked, null); }
    hintEl.textContent = locked < 0 ? "Pluck a string" : "Pluck the " + STR[locked].name + " string";
    hintEl.className = "hint";
  }
  function tunerFreq(f) {
    var now = performance.now();
    if (f > 0) {
      hist.push(f); if (hist.length > 5) hist.shift();
      tShow(hist.slice().sort(function (a, b) { return a - b; })[hist.length >> 1]);
      lastHeard = now; return;
    }
    if (now - lastHeard > 1200) { hist.length = 0; tIdle(); }
  }
  $("go").addEventListener("click", function () {
    $("go").textContent = "Starting…";
    startMic(tunerFreq).then(function () {
      tunerOn = true; $("start").classList.add("hidden"); wake(true);
    }).catch(function () {
      $("go").textContent = "Try again";
      $("startMsg").textContent = "Couldn't use the microphone. In Settings › Safari › Microphone, choose Ask or Allow, then try again.";
    });
  });
  function tunerStop() {
    if (!tunerOn) return;
    tunerOn = false; stopMic(); wake(false); hist.length = 0; tIdle();
    $("start").classList.remove("hidden"); $("go").textContent = "Start tuning";
  }

  /* =====================================================
     TAB NOTATION
     ===================================================== */
  function countLabel(beat) {
    var b = Math.floor(beat + 1e-6), fr = Math.round((beat - b) * 4);
    return [String((b % 4) + 1), "e", "&", "a"][fr];
  }
  function renderTab(el, ev, cur, counts) {
    var start = cur < 0 ? 0 : Math.floor(cur / 8) * 8, html = "", r, i, e;
    var rows = [3, 2, 1, 0];
    for (var k = 0; k < rows.length; k++) {
      r = rows[k];
      html += "<div class='r'><span class='sn'>" + SN[r] + "</span>";
      for (i = start; i < start + 8; i++) {
        e = ev[i];
        var txt = "";
        if (e) txt = e[0] === r ? String(e[1]) : (e[0] === -1 ? "·" : "");
        html += "<span class='c" + (i === cur ? " cur" : "") + "'>" + (txt ? "<i>" + txt + "</i>" : "") + "</span>";
      }
      html += "</div>";
    }
    if (counts) {
      html += "<div class='cnt'><span class='sn'></span>";
      for (i = start; i < start + 8; i++) html += "<span class='c" + (i === cur ? " cur" : "") + "'>" + (counts[i] || "") + "</span>";
      html += "</div>";
    }
    el.innerHTML = html;
  }

  /* =====================================================
     PRACTICE: session
     ===================================================== */
  var BLOCKS = [
    { id: "warm", name: "Warm-up", min: 5 },
    { id: "tech", name: "Technique", min: 7 },
    { id: "quiz", name: "Fretboard quiz", min: 3 },
    { id: "groove", name: "Groove", min: 5 },
    { id: "build", name: "Bassline builder", min: 10 }
  ];
  var S = { mode: "home", i: 0, left: 0, running: false, last: 0, block: null, total: 0 };
  var pw = $("pwrap");

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function btn(cls, text, fn) { var b = el("button", cls, text); b.addEventListener("click", fn); return b; }
  function barHtml(i) {
    var d = doneToday(), h = "<div class='bar'>";
    BLOCKS.forEach(function (b, k) { h += "<span class='" + (d.indexOf(b.id) >= 0 ? "done" : (k === i ? "now" : "")) + "'></span>"; });
    return h + "</div>";
  }
  function nextUndone() {
    var d = doneToday();
    for (var k = 0; k < BLOCKS.length; k++) if (d.indexOf(BLOCKS[k].id) < 0) return k;
    return -1;
  }

  function renderHome() {
    checkDay(); S.mode = "home";
    var d = doneToday(), st = streak(), nu = nextUndone();
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var now = new Date();
    pw.innerHTML = "";
    pw.appendChild(el("div", "small", days[now.getDay()] + " · " + (st ? st + "-day streak" : "Let's start a streak")));
    pw.appendChild(el("h1", null, "Today's practice"));
    pw.appendChild(el("div", "chips",
      "<span class='chip'>" + plan.genre.name + " · " + plan.bpm + " BPM</span>" +
      "<span class='chip g'>" + (plan.review ? "Review: " : "") + plan.tech.name + "</span>"));
    pw.appendChild(btn("link", "Tune first", function () { showView("tune"); }));
    var rows = el("div", "card rows");
    BLOCKS.forEach(function (b) {
      rows.appendChild(el("div", null, "<span>" + (d.indexOf(b.id) >= 0 ? "<span class='tick'>✓</span> " : "") + b.name + "</span><span class='small'>" + b.min + " min</span>"));
    });
    pw.appendChild(rows);
    var label = nu === -1 ? "Practise again" : (d.length ? "Continue: " + BLOCKS[nu].name : "Start today's practice");
    pw.appendChild(btn("primary", label, function () { renderIntro(nu === -1 ? 0 : nu, null); }));
    pw.appendChild(el("p", "small", "Turn off silent mode (the switch on the side of your iPhone) so you can hear the drums and metronome."));
  }

  function introText(id) {
    if (id === "warm") return "5 minutes of the 1-2-3-4 drill. Follow the green note, one note per click. Slow and clean beats fast.";
    if (id === "tech") return "Today: " + plan.tech.name + ". " + plan.tech.tip;
    if (id === "quiz") return "The app names a note. Find it on the neck and play it. The mic checks it for you. Stuck? Tap \"Show me\".";
    if (id === "groove") return "Today: " + plan.genre.name + " at " + bpmFor("band") + " BPM, chords " + plan.chords.map(function (c) { return c.name; }).join(" → ") + ". Roots only. Lock in with the kick drum (the orange square)." + (plan.genre.feel ? " Feel: " + plan.genre.feel : "");
    return "Same beat. Now make it yours. Level " + store.level + ": " + D.levels[store.level - 1].name + ". The last 2 minutes are yours to jam.";
  }

  function renderIntro(i, msg) {
    S.mode = "intro"; S.i = i; S.running = false; wake(false);
    var b = BLOCKS[i];
    pw.innerHTML = barHtml(i);
    pw.appendChild(el("div", "small", "Block " + (i + 1) + " of " + BLOCKS.length + " · " + b.min + " min"));
    pw.appendChild(el("h1", null, b.name));
    if (msg) pw.appendChild(el("div", "card", msg));
    pw.appendChild(el("p", "tip", introText(b.id)));
    var sp = el("div", null); sp.style.flex = "1"; pw.appendChild(sp);
    pw.appendChild(btn("primary", "Start " + b.name.toLowerCase(), function () { startBlock(i); }));
    pw.appendChild(btn("link", "Back to today's plan", function () { seqStop(); renderHome(); }));
  }

  function startBlock(i) {
    var b = BLOCKS[i];
    S.mode = "run"; S.i = i; S.left = b.min * 60 / FAST; S.total = S.left;
    pw.innerHTML = barHtml(i);
    pw.appendChild(el("div", "small", "Block " + (i + 1) + " of " + BLOCKS.length + " · " + b.name));
    var tm = el("div", "timer"); tm.id = "tm"; pw.appendChild(tm);
    var stage = el("div", "stage"); stage.id = "stage"; pw.appendChild(stage);
    var c = el("div", "controls");
    var pz = btn("pause", "Pause", togglePause); pz.id = "pz";
    c.appendChild(pz);
    c.appendChild(btn("skip", "Skip", function () { endBlock(false); }));
    pw.appendChild(c);
    var back = btn("link", "Back to today's plan", function () { pause(); seqStop(); S.block = null; renderHome(); });
    back.style.alignSelf = "center"; pw.appendChild(back);
    S.block = makeBlock(b.id, stage);
    resume();
  }
  function makeBlock(id, stage) {
    if (id === "warm") return exBlock(stage, D.warmup, "warm");
    if (id === "tech") return exBlock(stage, plan.tech, "tech");
    if (id === "quiz") return quizBlock(stage);
    return bandBlock(stage, id === "build");
  }
  function drawTimer() {
    var t = $("tm"); if (!t) return;
    var s = Math.max(0, Math.ceil(S.left * FAST));
    t.textContent = Math.floor(s / 60) + ":" + pad(s % 60);
    t.className = "timer" + (S.running ? "" : " paused");
  }
  function resume() {
    S.running = true; S.last = performance.now(); wake(true);
    if (S.block) S.block.play();
    var p = $("pz"); if (p) p.textContent = "Pause";
    drawTimer();
  }
  function pause() {
    if (!S.running) return;
    S.running = false; wake(false);
    if (S.block) S.block.halt();
    var p = $("pz"); if (p) p.textContent = "Resume";
    drawTimer();
  }
  function togglePause() { if (S.running) pause(); else resume(); }
  setInterval(function () {
    if (S.mode !== "run" || !S.running) return;
    var now = performance.now(), dt = (now - S.last) / 1000; S.last = now;
    S.left -= dt; logSecs(dt * FAST);
    if (S.block && S.block.tick) S.block.tick();
    drawTimer();
    if (S.left <= 0) endBlock(true);
  }, 250);

  function endBlock(finished) {
    var b = BLOCKS[S.i], keepBeat = b.id === "groove" && seq.on && S.running;
    S.running = false; wake(false);
    if (S.block) { if (keepBeat) { if (S.block.leave) S.block.leave(); } else S.block.halt(); }
    S.block = null;
    if (!keepBeat) seqStop();
    if (finished) { markDone(b.id); chime(); }
    store.best = Math.max(store.best, streak()); save();
    if (S.i === BLOCKS.length - 1) { seqStop(); renderDone(); return; }
    var msg = finished ? "Time's up. Nice work." : "Skipped. No problem.";
    if (keepBeat) msg += " The beat keeps going. Start the builder when you're ready.";
    renderIntro(S.i + 1, msg);
  }

  function renderDone() {
    S.mode = "done";
    var today = store.days[dkey()] || 0;
    pw.innerHTML = barHtml(-1);
    pw.appendChild(el("h1", null, "Session done ✓"));
    pw.appendChild(el("div", "card", "<div style='font-size:20px;font-weight:700'>" + fmtMin(today) + " today</div><div class='small' style='margin-top:4px'>" +
      (streak() ? streak() + "-day streak. See you tomorrow." : "Play 10 minutes a day to build a streak.") + "</div>"));
    var sp = el("div", null); sp.style.flex = "1"; pw.appendChild(sp);
    pw.appendChild(btn("primary", "Back to today's plan", renderHome));
  }

  function bpmFor(key) {
    if (!bpmNow[key]) bpmNow[key] = key === "band" ? plan.bpm : 60;
    return bpmNow[key];
  }
  function tempoUI(stage, key, onChange) {
    var w = el("div", "tempo"), lab = el("b", null, bpmFor(key) + " BPM");
    function set(d) {
      bpmNow[key] = Math.max(40, Math.min(140, bpmFor(key) + d));
      lab.textContent = bpmNow[key] + " BPM"; onChange(bpmNow[key]);
    }
    w.appendChild(btn("", "−", function () { set(-5); }));
    w.appendChild(lab);
    w.appendChild(btn("", "+", function () { set(5); }));
    stage.appendChild(w);
  }

  /* ---------- warm-up / technique: follow the green note ---------- */
  function exBlock(stage, ex, key) {
    var starts = [], total = 0, cur = -1;
    ex.ev.forEach(function (e) { starts.push(total); total += Math.round(e[2] * 4); });
    total = Math.ceil(total / 16) * 16;
    stage.appendChild(el("h2", null, ex.name));
    var tab = el("div", "tabn"); stage.appendChild(tab);
    stage.appendChild(el("p", "tip", ex.tip));
    renderTab(tab, ex.ev, -1);
    tempoUI(stage, key, function (b) { seq.dur = 60 / b / 4; });
    var pos = 0;
    function onStep(step, t) {
      var st = step % total;
      if (st % 4 === 0) click(t, st % 16 === 0);
      var idx = starts.indexOf(st);
      if (idx >= 0) vis(t, function () { cur = idx; renderTab(tab, ex.ev, cur); });
    }
    return {
      play: function () { seqStart(bpmFor(key), onStep, pos); },
      halt: function () { pos = seq.step - (seq.step % 16); seqStop(); }
    };
  }

  /* ---------- fretboard quiz ---------- */
  function quizBlock(stage) {
    var ask = el("div", "ask"), heard = el("div", "heard"), score = el("div", "small");
    score.style.textAlign = "center";
    stage.appendChild(ask); stage.appendChild(heard);
    var row = el("div", "lvl");
    row.appendChild(btn("", "Show me", function () { if (target) { heard.className = "heard"; heard.textContent = "It's fret " + target.f + " on the " + SN[target.s] + " string."; } }));
    row.appendChild(btn("", "New note", function () { pick(); }));
    stage.appendChild(row); stage.appendChild(el("p", "small", "")).appendChild(score);
    var target = null, right = 0, recent = [], wait = 0, prevPc = -1, rand = Math.random;
    function pick() {
      var s, f, pc;
      do { s = Math.floor(rand() * 2); f = Math.floor(rand() * 13); pc = (OPEN[s] + f) % 12; } while (pc === prevPc);
      prevPc = pc; target = { s: s, f: f, pc: pc }; recent = [];
      ask.innerHTML = "Play <b>" + noteName(pc) + "</b><br>on the " + SN[s] + " string";
      heard.className = "heard"; heard.textContent = "Listening…";
      score.textContent = right ? right + " right so far" : "";
    }
    function onFreq(f) {
      if (!target || performance.now() < wait) return;
      if (f <= 0) { recent = []; return; }
      var m = 69 + 12 * Math.log2(f / 440), n = Math.round(m);
      if (Math.abs(m - n) > 0.4) return;
      recent.push(n % 12); if (recent.length > 4) recent.shift();
      if (recent.length < 3) return;
      var a = recent[recent.length - 1];
      if (recent[recent.length - 2] !== a || recent[recent.length - 3] !== a) return;
      if (a === target.pc) {
        right++; heard.className = "heard ok"; heard.textContent = "Yes! That's " + noteName(a) + " ✓";
        wait = performance.now() + 1300; target = null;
        setTimeout(function () { if (S.running) pick(); else target = null; }, 1300);
      } else if (recent.length >= 4 && recent.every(function (v) { return v === a; })) {
        heard.className = "heard"; heard.textContent = "That's " + noteName(a) + ". Try again.";
      }
    }
    window.__quiz = { target: function () { return target; }, feed: onFreq };
    ask.textContent = "Getting the mic ready…";
    return {
      play: function () {
        startMic(onFreq).then(function () { if (!target) pick(); else heard.textContent = "Listening…"; })
          .catch(function () { ask.textContent = "Couldn't use the microphone."; heard.textContent = "Allow it in Settings › Safari › Microphone, or tap Skip."; });
      },
      halt: function () { stopMic(); }
    };
  }

  /* ---------- groove + bassline builder ---------- */
  var band = { bar: 0, beat: 0 };
  function bandStep(step, t) {
    var g = plan.genre, st = step % 16, bar = Math.floor(step / 16);
    if (g.kick.indexOf(st) >= 0) { kick(t, g.kickV || 1); vis(t, function () { var k = $("kk"); if (k) { k.classList.add("on"); setTimeout(function () { k.classList.remove("on"); }, 110); } }); }
    if (g.snare.indexOf(st) >= 0) snare(t, g.name === "Reggae" ? 0.5 : 0.8);
    if (g.ghost && g.ghost.indexOf(st) >= 0) snare(t, 0.18);
    if (g.hat.indexOf(st) >= 0) hat(t, st % 4 === 0 ? 0.5 : 0.3, false);
    if (g.ohat && g.ohat.indexOf(st) >= 0) hat(t, 0.35, true);
    if (g.rim && g.rim.indexOf(st) >= 0) rim(t, 0.6);
    if (g.ride && g.ride.indexOf(st) >= 0) ride(t, st % 4 === 0 ? 0.6 : 0.45);
    if (g.tamb && g.tamb.indexOf(st) >= 0) hat(t, 0.45, true);
    if (g.comp && store.comp !== 2) g.comp.forEach(function (part) {
      var idx = part.steps.indexOf(st); if (idx < 0) return;
      var ch = plan.chords[bar % 4], d = part.len * seq.dur;
      if (part.inst === "arp") { var vv = voiceOf(ch, ""), an = vv.concat([vv[0] + 12]); playChord("arp", t, [an[idx % an.length] + 12], d, part.vol); }
      else playChord(part.inst, t, voiceOf(ch, part.voice), d, part.vol);
    });
    if (st % 4 === 0) vis(t, function () { band.bar = bar; band.beat = st / 4; bandDraw(); });
  }
  function bandDraw() {
    var c = plan.chords, ci = band.bar % 4, nx = c[(ci + 1) % 4];
    var now = $("cnow"); if (!now) return;
    now.textContent = c[ci].name;
    $("cnext").textContent = "next: " + nx.name;
    for (var i = 0; i < 4; i++) $("b" + i).className = i === band.beat ? "on" : "";
    var cue = $("cue");
    if (cue) {
      var lv = store.level, yours = S.left <= 120 / FAST, on = false, txt = "";
      if (!yours && lv >= 5 && ci === 3) { on = true; txt = "Fill bar"; }
      else if (!yours && lv === 4 && band.beat === 3) { on = true; txt = "Approach " + noteName(nx.pc); }
      cue.textContent = txt || "."; cue.className = "cue" + (on ? " on" : "");
    }
    var fb = $("fb"); if (fb && !store.hideFb) drawFb(fb, c[ci], nx);
  }
  function drawFb(fb, ch, nx) {
    var lv = fb.dataset.groove ? 1 : store.level, root = ch.pc, third = (root + (ch.q === "min" ? 3 : 4)) % 12, fifth = (root + 7) % 12;
    var appr = (lv >= 4 && band.beat === 3) ? [(nx.pc + 1) % 12, (nx.pc + 11) % 12] : [];
    var h = "", rows = [3, 2, 1, 0];
    rows.forEach(function (s) {
      h += "<div class='lab'>" + SN[s] + "</div>";
      for (var f = 0; f <= 12; f++) {
        var pc = (OPEN[s] + f) % 12, cls = "";
        if (pc === root) cls = "R";
        else if (appr.indexOf(pc) >= 0) cls = "A";
        else if (lv >= 2 && pc === fifth) cls = "F";
        else if (lv >= 3 && pc === third) cls = "T";
        h += "<div class='" + cls + "'>" + noteName(pc) + "</div>";
      }
    });
    h += "<div class='lab'></div>";
    for (var f2 = 0; f2 <= 12; f2++) h += "<div class='lab" + ([3, 5, 7, 9, 12].indexOf(f2) >= 0 ? " mk" : "") + "'>" + f2 + "</div>";
    fb.innerHTML = h;
  }

  function todaysLick() {
    var lv = store.level, d = lv <= 2 ? 1 : lv <= 4 ? 2 : 3, ch = plan.chords[0];
    var list = D.licks.filter(function (l) { return l.d === d && (l.q === "any" || l.q === ch.q); });
    var L = list[Math.floor(plan.lickR * list.length)];
    var fe = (ch.pc - 4 + 12) % 12, rootM, anchor;
    if (fe <= 7) { rootM = 28 + fe; anchor = fe; } else { anchor = (ch.pc - 9 + 12) % 12; rootM = 33 + anchor; }
    var low = Math.min.apply(null, L.n.map(function (n) { return rootM + n[0]; }));
    if (low < 28) { rootM += 12; anchor = place(rootM, anchor).f; }
    var ev = [], counts = [], beat = 0;
    L.n.forEach(function (n) {
      var p = place(rootM + n[0], anchor);
      ev.push([p.s, p.f, n[1]]); counts.push(countLabel(beat)); beat += n[1];
    });
    return { lick: L, chord: ch, ev: ev, counts: counts };
  }
  function place(m, anchor) {
    var best = null;
    for (var s = 0; s < 4; s++) {
      var f = m - OPEN[s];
      if (f < 0 || f > 12) continue;
      var c = Math.abs(f - (anchor + 1.5));
      if (f === 0) c = Math.min(c, 2);
      if (!best || c < best.c) best = { s: s, f: f, c: c };
    }
    return best;
  }
  var lickPlaying = false;
  function playLick(info, tab) {
    if (lickPlaying) return;
    if (S.running) pause();
    audio(); setSession("playback"); lickPlaying = true;
    var beat = 60 / 70, t0 = ctx.currentTime + 0.2, i;
    for (i = 0; i < 4; i++) click(t0 + i * beat, i === 0);
    var t = t0 + 4 * beat;
    info.ev.forEach(function (e, k) {
      pluck(t, OPEN[e[0]] + e[1], e[2] * beat);
      (function (k, at) { setTimeout(function () { renderTab(tab, info.ev, k, info.counts); }, (at - ctx.currentTime) * 1000); })(k, t);
      t += e[2] * beat;
    });
    setTimeout(function () { lickPlaying = false; renderTab(tab, info.ev, -1, info.counts); }, (t - ctx.currentTime) * 1000 + 200);
  }

  function fbCard(stage, groove) {
    var wrap = el("div", "card"), fb = el("div", "fb"); fb.id = "fb";
    if (groove) fb.dataset.groove = "1";
    var leg = el("div", "legend", groove
      ? "<span><i style='background:var(--good)'></i>Root: play this now</span><span><i style='background:#444'></i>Every other note, for reference</span>"
      : "<span><i style='background:var(--good)'></i>Root</span><span><i style='background:var(--blue)'></i>5th</span><span><i style='background:var(--warn)'></i>3rd</span><span><i style='background:var(--purple)'></i>Approach</span>");
    var tg = btn("link", store.hideFb ? "Show fretboard" : "Hide fretboard", function () {
      store.hideFb = !store.hideFb; save();
      tg.textContent = store.hideFb ? "Show fretboard" : "Hide fretboard";
      fb.style.display = leg.style.display = store.hideFb ? "none" : "";
      if (!store.hideFb) bandDraw();
    });
    fb.style.display = leg.style.display = store.hideFb ? "none" : "";
    wrap.appendChild(fb); wrap.appendChild(leg); wrap.appendChild(tg); stage.appendChild(wrap);
  }

  function bandBlock(stage, builder) {
    var wrap = el("div", null);
    wrap.innerHTML = "<div class='chord'><div class='now' id='cnow'>" + plan.chords[0].name + "</div><div class='nx' id='cnext'></div></div>" +
      "<div class='beats'><span id='b0'></span><span id='b1'></span><span id='b2'></span><span id='b3'></span><span class='kick' id='kk'></span></div>";
    stage.appendChild(wrap);
    var info = el("p", "tip"); info.style.textAlign = "center"; stage.appendChild(info);
    if (!builder) fbCard(stage, true);
    if (builder) {
      var cue = el("div", "cue", "."); cue.id = "cue"; stage.appendChild(cue);
      var lvl = el("div", "card"); stage.appendChild(lvl);
      var drawLvl = function () {
        var n = store.level, L = D.levels[n - 1], yours = S.left <= 120 / FAST;
        lvl.innerHTML = yours
          ? "<b>Your line</b><div class='tip'>Jam over the beat with anything you've learned. No rules.</div>"
          : "<div class='small'>Level " + n + " of 5</div><b>" + L.name + "</b><div class='tip'>" + L.goal + "</div>";
        if (yours) return;
        var r = el("div", "lvl");
        if (n > 1) r.appendChild(btn("", "Back a level", function () { store.level--; save(); drawLvl(); bandDraw(); }));
        if (n < 5) r.appendChild(btn("got", "Got it", function () { store.level++; save(); drawLvl(); bandDraw(); }));
        else r.appendChild(el("div", "small", "Top level. Keep making it yours."));
        lvl.appendChild(r);
      };
      drawLvl();
      fbCard(stage, false);
      var li = todaysLick();
      var det = el("details", null, "<summary>Lick of the day: " + li.lick.name + "</summary>");
      det.appendChild(el("div", "small", "Over " + li.chord.name + " (the first chord). Count shown under the tab."));
      var ltab = el("div", "tabn"); ltab.style.marginTop = "8px"; det.appendChild(ltab);
      renderTab(ltab, li.ev, -1, li.counts);
      det.appendChild(btn("", "▶ Listen", function () { playLick(li, ltab); }));
      stage.appendChild(det);
    }
    tempoUI(stage, "band", function (b) { seq.dur = 60 / b / 4; if (echoDl) echoDl.delayTime.value = Math.min(1.5, 0.75 * 60 / b); });
    var cb = btn("", CHORD_LABEL[store.comp || 0], function () {
      store.comp = ((store.comp || 0) + 1) % 3; save(); cb.textContent = CHORD_LABEL[store.comp];
      audio(); chordBus.gain.value = CHORD_VOL[store.comp];
    });
    cb.style.display = "block"; cb.style.margin = "4px auto 0"; stage.appendChild(cb);
    var lastYours = false;
    function tick() {
      if (builder) {
        var yours = S.left <= 120 / FAST;
        if (yours !== lastYours) { lastYours = yours; drawLvl(); }
        info.textContent = "";
      } else {
        info.textContent = S.left > S.total / 2 ? "One note per beat. Roots only." : "Two notes per beat. Still roots only.";
      }
    }
    tick(); bandDraw();
    var pos = 0;
    return {
      tick: tick,
      play: function () { if (!seq.on) { setEcho(); seqStart(bpmFor("band"), bandStep, pos, plan.genre.swing); } bandDraw(); },
      halt: function () { pos = seq.step - (seq.step % 16); seqStop(); },
      leave: function () {}
    };
  }

  /* =====================================================
     PROGRESS TAB
     ===================================================== */
  function renderProgress() {
    var g = $("gwrap"), now = new Date(), dow = (now.getDay() + 6) % 7, week = 0, all = 0, mins = [], k;
    for (k in store.days) all += store.days[k];
    for (var i = 0; i < 7; i++) {
      var d = new Date(now); d.setDate(now.getDate() - dow + i);
      var v = store.days[dkey(d)] || 0; week += v; mins.push(v / 60);
    }
    var mx = Math.max(30, Math.max.apply(null, mins));
    var bars = "", L = ["M", "T", "W", "T", "F", "S", "S"];
    mins.forEach(function (m, i) {
      bars += "<div><span>" + (m >= 1 ? Math.round(m) : "") + "</span><i class='" + (m < 1 ? "z" : "") + "' style='height:" + Math.max(3, m / mx * 100) + "px'></i>" + L[i] + "</div>";
    });
    g.innerHTML = "<h1>Progress</h1>" +
      "<div class='grid2'>" +
      "<div class='m'><div class='k'>Streak</div><div class='v'>" + days(streak()) + "</div></div>" +
      "<div class='m'><div class='k'>Best streak</div><div class='v'>" + days(Math.max(store.best, streak())) + "</div></div>" +
      "<div class='m'><div class='k'>This week</div><div class='v'>" + fmtMin(week) + "</div></div>" +
      "<div class='m'><div class='k'>All time</div><div class='v'>" + fmtMin(all) + "</div></div></div>" +
      "<div class='small' style='margin-top:18px'>Minutes this week</div><div class='chart'>" + bars + "</div>" +
      "<p class='small'>A day counts toward your streak at 10 minutes or more. Bassline builder level: " + store.level + " of 5.</p>" +
      "<details><summary>Set a daily reminder</summary><ol>" +
      "<li>Open the <b>Shortcuts</b> app, tap <b>Automation</b>, then <b>New Automation</b>.</li>" +
      "<li>Choose <b>Time of Day</b>, pick your practice time, set it to <b>Daily</b> and <b>Run Immediately</b>.</li>" +
      "<li>Add the <b>Open App</b> action and choose <b>Bass Tuner</b>.</li>" +
      "<li>If Bass Tuner isn't in the list, use the <b>Reminders</b> app instead: a reminder that repeats daily at your practice time.</li>" +
      "</ol></details>" +
      "<p class='small'>Your progress is saved on this phone only. Deleting the home-screen icon deletes it too.</p>";
  }

  /* =====================================================
     TABS + lifecycle
     ===================================================== */
  var cur = "tune";
  function showView(v) {
    if (v === cur) return;
    if (cur === "practice") { if (S.running) pause(); else if (S.mode === "intro") seqStop(); }
    if (cur === "tune") tunerStop();
    cur = v;
    [].forEach.call(document.querySelectorAll(".view"), function (x) { x.classList.toggle("on", x.id === v); });
    [].forEach.call(document.querySelectorAll(".tabs button"), function (b) { b.classList.toggle("on", b.dataset.v === v); });
    if (v === "practice" && (S.mode === "home" || S.mode === "done")) renderHome();
    if (v === "progress") renderProgress();
  }
  [].forEach.call(document.querySelectorAll(".tabs button"), function (b) { b.addEventListener("click", function () { showView(b.dataset.v); }); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { if (S.running) pause(); else if (S.mode === "intro") seqStop(); }
    else { if (ctx) ctx.resume(); if (tunerOn) wake(true); }
  });

  window.__bc = { plan: function () { return plan; }, store: store, show: showView, lick: todaysLick, audio: function () { return { ctx: ctx, master: master }; } };
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () {});
})();
