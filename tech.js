/* Technique block: 7 weekday topics, each a 3-step mini lesson.
   1 Learn it – the shape in one key.  2 Move it – the same shape in new keys (a free bar to move the hand).
   3 Use it – a one-bar idea that follows today's chords over today's groove.
   Shapes: [string offset (null = rest), fret offset, beats, tech] from the root note.
   Use ideas: [16th step, degree, length in 16ths, tech], relative to each chord. */
(function () {
  "use strict";
  var G = 7, C = 0, A = 9;
  var topics = [
    { name: "Hammer-ons and pull-offs", home: A, rs: [0, 1],
      tip: "Hammer-on (h): pluck the first note, then bring the next finger down firmly – no second pluck. Pull-off (p): pull the finger off sideways so the lower note rings.",
      learn: [[0, 0, 0.5], [0, 2, 0.5, "h"], [0, 0, 0.5, "p"], [0, 0, 0.5], [1, 0, 0.5], [1, 2, 0.5, "h"], [1, 0, 0.5, "p"], [1, 0, 0.5],
              [0, 0, 0.5], [0, 3, 0.5, "h"], [1, 0, 0.5], [1, 2, 0.5, "h"], [2, 0, 0.5], [2, 2, 0.5, "h"], [2, 0, 0.5, "p"], [1, 2, 0.5]],
      useTip: "One pluck, two notes. Listen for the hammer-on and the pull-off.",
      use: [[0, "R", 2], [2, "R", 1], [3, "2", 1, "h"], [4, "T", 2], [6, "5", 2], [8, "R", 2], [10, "5", 1], [11, "6", 1, "h"], [12, "5", 1, "p"], [13, "T", 1], [14, "R", 2]] },
    { name: "Alternate plucking + string crossing", home: G, rs: [0, 1],
      tip: "Index, middle, index, middle – two notes per click. When you cross to the next string, keep alternating. Don't restart with the same finger.",
      learn: [[0, 0, 0.5], [0, 0, 0.5], [0, 0, 0.5], [0, 0, 0.5], [1, 0, 0.5], [1, 0, 0.5], [1, 0, 0.5], [1, 0, 0.5],
              [2, 0, 0.5], [2, 0, 0.5], [2, 0, 0.5], [2, 0, 0.5], [1, 0, 0.5], [1, 0, 0.5], [1, 0, 0.5], [1, 0, 0.5]],
      useTip: "Root four times, then the 5th twice and the octave twice. Keep alternating fingers through the string changes.",
      use: [[0, "R", 2], [2, "R", 2], [4, "R", 2], [6, "R", 2], [8, "5", 2], [10, "5", 2], [12, "8", 2], [14, "8", 2]] },
    { name: "Muting + dead notes", home: A, rs: [0, 1, 2],
      tip: "Rests (·): lift the fretting finger just enough that the note stops. Dead notes (x): rest the finger on the string without pressing and pluck – a 'thud', no note.",
      learn: [[0, 0, 1], [null, 0, 1], [1, 2, 1], [null, 0, 1],
              [0, 0, 0.5], [0, 0, 0.5, "x"], [0, 0, 0.5], [0, 0, 0.5, "x"], [1, 2, 0.5], [1, 2, 0.5, "x"], [1, 2, 0.5], [1, 2, 0.5, "x"]],
      useTip: "Note, thud, note, thud. The thuds are what make it groove.",
      use: [[0, "R", 2], [2, "R", 2, "x"], [4, "R", 2], [6, "R", 2, "x"], [8, "5", 2], [10, "5", 2, "x"], [12, "8", 2], [14, "8", 2, "x"]] },
    { name: "Major scale (moveable)", home: G, rs: [0, 1],
      tip: "Root with your middle finger. Index covers the fret below, ring and pinky the two above. The shape is the same in every key – say the numbers 1 to 8 as you play.",
      learn: [[0, 0, 1], [0, 2, 1], [1, -1, 1], [1, 0, 1], [1, 2, 1], [2, -1, 1], [2, 1, 1], [2, 2, 1],
              [2, 1, 1], [2, -1, 1], [1, 2, 1], [1, 0, 1], [1, -1, 1], [0, 2, 1], [0, 0, 1], [null, 0, 1]],
      useTip: "Walk up the scale to the 5th and back on every chord. On minor chords the 3rd drops one fret – the tab shows it.",
      use: [[0, "R", 2], [2, "2", 2], [4, "T", 2], [6, "4", 2], [8, "5", 2], [10, "4", 2], [12, "T", 2], [14, "2", 2]] },
    { name: "Chord tones: major vs minor", home: C, rs: [0, 1],
      tip: "Root, 3rd, 5th, octave. Major sounds happy, minor sounds sad – the only difference is the 3rd, one fret lower for minor. Listen for it.",
      learn: [[0, 0, 1], [1, -1, 1], [1, 2, 1], [2, 2, 1], [2, 2, 1], [1, 2, 1], [1, -1, 1], [0, 0, 1],
              [0, 0, 1], [0, 3, 1], [1, 2, 1], [2, 2, 1], [2, 2, 1], [1, 2, 1], [0, 3, 1], [0, 0, 1]],
      useTip: "Root, 3rd, 5th, octave on every chord. The app picks the right 3rd for major and minor chords.",
      use: [[0, "R", 4], [4, "T", 4], [8, "5", 4], [12, "8", 4]] },
    { name: "Minor pentatonic (moveable)", home: A, rs: [0],
      tip: "Index on the root fret, ring finger 2 frets up, pinky 3 frets up. Same shape in every key. This is the scale for fills.",
      learn: [[0, 0, 1], [0, 3, 1], [1, 0, 1], [1, 2, 1], [2, 0, 1], [2, 2, 1], [3, 0, 1], [3, 2, 1],
              [3, 0, 1], [2, 2, 1], [2, 0, 1], [1, 2, 1], [1, 0, 1], [0, 3, 1], [0, 0, 1], [null, 0, 1]],
      useTip: "A pentatonic run on each chord. On major chords the app moves the 3rd up a fret so it fits.",
      use: [[0, "R", 2], [2, "T", 2], [4, "4", 2], [6, "5", 2], [8, "c7", 2], [10, "5", 2], [12, "4", 2], [14, "T", 2]] },
    { name: "Octaves + slides", home: G, rs: [0, 1],
      tip: "Octave: index on the root, ring or pinky two strings up and two frets higher – mute the string in between. Slide (/): keep pressing and glide to the new fret without lifting.",
      learn: [[0, 0, 0.5], [2, 2, 0.5], [0, 0, 0.5], [2, 2, 0.5], [0, 0, 0.5], [2, 2, 0.5], [0, 0, 0.5], [2, 2, 0.5],
              [0, 0, 1], [0, 2, 1, "/"], [2, 2, 1], [2, 0, 1, "/"]],
      useTip: "Octave pumps, then a short slide up into the 5th.",
      use: [[0, "R", 2], [2, "8", 2], [4, "R", 2], [6, "8", 2], [8, "4", 1], [9, "5", 3, "/"], [12, "8", 2], [14, "R", 2]] }
  ];
  window.BASS_TECH = topics;

  var KEYS = [7, 0, 9, 2, 5, 4, 10, 11]; /* G C A D F E Bb B */
  var DEG = { R: 0, "2": 2, b3: 3, "4": 5, "5": 7, "6": 9, b7: 10, "8": 12 };
  var LEARN_DUE = 120, MOVE_DUE = 300;

  /* every fretted spot for a shape rooted on pitch class pc */
  function spots(tp, pc, OPEN) {
    var out = [];
    tp.rs.forEach(function (rs) {
      var base = ((pc - OPEN[rs]) % 12 + 12) % 12;
      [base, base + 12].forEach(function (rf) {
        var ok = tp.learn.every(function (e) {
          if (e[0] === null) return true;
          var s = rs + e[0], f = rf + e[1];
          return s <= 3 && f >= 0 && f <= 12;
        });
        if (ok) out.push({ rs: rs, rf: rf });
      });
    });
    return out;
  }
  function bestSpot(tp, pc, OPEN, prev) {
    var c = spots(tp, pc, OPEN), best = null;
    c.forEach(function (p) {
      var cost = (p.rf < 1 || p.rf > 8 ? 5 : 0) + Math.abs(p.rf - (prev ? prev.rf : 4)) * 0.3 + (prev && p.rs !== prev.rs ? 0.4 : 0) + p.rs * 0.2;
      if (!best || cost < best.cost) best = { rs: p.rs, rf: p.rf, cost: cost };
    });
    return best;
  }
  function shapeEvents(tp, spot, OPEN) {
    var st = 0;
    return tp.learn.map(function (e) {
      var len = Math.round(e[2] * 4), ev = { st: st, len: len, tech: e[3] || "" };
      if (e[0] === null) { ev.rest = true; } else { ev.s = spot.rs + e[0]; ev.f = spot.rf + e[1]; ev.m = OPEN[ev.s] + ev.f; }
      st += len; return ev;
    });
  }
  function useEvents(tp, ch, OPEN) {
    var fe = (ch.pc - 4 + 12) % 12, R, a;
    if (fe <= 7) { R = 28 + fe; a = fe; } else { a = (ch.pc - 9 + 12) % 12; R = 33 + a; }
    return tp.use.map(function (n) {
      var t = n[1], m;
      if (t === "T") m = R + (ch.q === "min" ? 3 : 4);
      else if (t === "c7") m = R + (ch.sfx === "maj7" ? 11 : 10);
      else m = R + DEG[t];
      var best = null;
      for (var s = 0; s < 4; s++) {
        var f = m - OPEN[s]; if (f < 0 || f > 12) continue;
        var c = f < a - 1 ? a - 1 - f : f > a + 3 ? f - a - 3 : 0;
        if (f === 0) c = Math.min(c, 1.5);
        c += Math.abs(f - (a + 1)) * 0.01;
        if (!best || c < best.c) best = { s: s, f: f, c: c };
      }
      return { st: n[0], len: n[2], tech: n[3] || "", s: best.s, f: best.f, m: m };
    });
  }
  window.TechShapes = { spots: spots, bestSpot: bestSpot, shapeEvents: shapeEvents, useEvents: useEvents, KEYS: KEYS };

  window.TechMode = function (C, stage) {
    var plan = C.plan(), tp = plan.tech, OPEN = C.OPEN, SN = C.SN, el = C.el, btn = C.btn, FAST = C.FAST || 1;
    var dayN = parseInt(plan.day.replace(/-/g, ""), 10);
    var keys = [], i0 = dayN % KEYS.length;
    for (var i = 0; i < KEYS.length && keys.length < 4; i++) { var k = KEYS[(i0 + i) % KEYS.length]; if (k !== tp.home && spots(tp, k, OPEN).length) keys.push(k); }
    var homeSpot = bestSpot(tp, tp.home, OPEN, null);
    var learnEv = shapeEvents(tp, homeSpot, OPEN);
    var L = Math.ceil(learnEv.reduce(function (a, e) { return a + e.len; }, 0) / 16);
    var loops = Math.max(1, Math.round(8 / L));
    var moves = [], prev = homeSpot;
    keys.forEach(function (k) { var sp = bestSpot(tp, k, OPEN, prev); moves.push({ pc: k, spot: sp, ev: shapeEvents(tp, sp, OPEN) }); prev = sp; });
    var SEG = 1 + L * loops;

    var part = 0, guide = true, hinted = -1, pos = 0, prevM = null, shown = [], hi = -1;
    var NAMES = ["Learn it", "Move it", "Use it"];

    /* ---------- sound ---------- */
    function click(t, acc) {
      var ctx = C.ctx(), o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = acc ? 1600 : 1050;
      g.gain.setValueAtTime(acc ? 0.5 : 0.32, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(g); g.connect(C.out()); o.start(t); o.stop(t + 0.06);
    }
    var thumpBuf = null;
    function pluck(t, e, from, dur) {
      var ctx = C.ctx(), out = C.out();
      if (e.tech === "x") {
        if (!thumpBuf) {
          thumpBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
          var d = thumpBuf.getChannelData(0);
          for (var j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ctx.sampleRate * 0.012));
        }
        var src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), gx = ctx.createGain();
        src.buffer = thumpBuf; lp.type = "lowpass"; lp.frequency.value = 700; gx.gain.value = 0.5;
        src.connect(lp); lp.connect(gx); gx.connect(out); src.start(t); return;
      }
      var f = C.mfreq(e.m), o = ctx.createOscillator(), o2 = ctx.createOscillator(), flt = ctx.createBiquadFilter(), gg = ctx.createGain();
      o.type = "sawtooth"; o2.type = "sine";
      if (e.tech === "/" && from) {
        var f0 = C.mfreq(from);
        o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
        o2.frequency.setValueAtTime(f0 * 2, t); o2.frequency.exponentialRampToValueAtTime(f * 2, t + 0.08);
      } else { o.frequency.value = f; o2.frequency.value = f * 2; }
      flt.type = "lowpass"; flt.frequency.setValueAtTime(1400, t); flt.frequency.exponentialRampToValueAtTime(350, t + 0.35);
      var peak = (e.tech === "h" || e.tech === "p") ? 0.28 : 0.42, end = t + Math.max(0.15, dur * 0.95);
      gg.gain.setValueAtTime(0.0001, t); gg.gain.exponentialRampToValueAtTime(peak, t + 0.006); gg.gain.exponentialRampToValueAtTime(0.0001, end);
      o.connect(flt); o2.connect(flt); flt.connect(gg); gg.connect(out);
      o.start(t); o2.start(t); o.stop(end + 0.05); o2.stop(end + 0.05);
    }

    /* ---------- UI ---------- */
    var head = el("div", "small"), title = el("h2", null, tp.name), big = el("div", null), info = el("div", "small");
    big.style.cssText = "text-align:center;font-size:34px;font-weight:800;min-height:44px;margin:4px 0";
    info.style.cssText = "text-align:center;min-height:20px";
    var tab = el("div", "tabn"), tip = el("p", "tip"), hint = el("div", "card");
    hint.style.display = "none";
    var row = el("div", "lvl");
    var gbtn = btn("", "", function () { guide = !guide; drawGuide(); });
    row.appendChild(gbtn);
    var tempoBox = el("div", null);
    var next = btn("", "Next part →", function () { go(part + 1); });
    next.style.cssText = "width:100%;margin:6px 0;border-radius:30px";
    [head, title, big, info, tab, tip, row, tempoBox, hint, next].forEach(function (x) { stage.appendChild(x); });
    function drawGuide() { gbtn.textContent = guide ? "Guide bass: on" : "Guide bass: off"; gbtn.className = guide ? "tg on" : "tg"; }

    function label(e) {
      if (e.rest) return "·";
      if (e.tech === "x") return "x";
      return (e.tech === "/" ? "/" : e.tech === "h" ? "h" : e.tech === "p" ? "p" : "") + e.f;
    }
    function drawTab() {
      var ev = shown, start = hi < 0 ? 0 : Math.floor(hi / 8) * 8, html = "";
      [3, 2, 1, 0].forEach(function (r) {
        html += "<div class='r'><span class='sn'>" + SN[r] + "</span>";
        for (var k = start; k < start + 8; k++) {
          var e = ev[k], txt = "";
          if (e) txt = e.rest ? "·" : (e.s === r ? label(e) : "");
          html += "<span class='c" + (k === hi ? " cur" : "") + "'>" + (txt ? "<i>" + txt + "</i>" : "") + "</span>";
        }
        html += "</div>";
      });
      tab.innerHTML = html;
    }
    function where(pc, sp) { return C.noteName(pc) + " · root on the " + SN[sp.rs] + " string, fret " + sp.rf; }

    function bpm() { return C.bpmFor(part === 2 ? "techuse" : "tech"); }
    function onStep(step, t) {
      var st16 = step % 16, bar = Math.floor(step / 16);
      var ev, local, d = 60 / bpm() / 4;
      if (part === 0) {
        local = step % (L * 16); ev = learnEv;
        if (st16 % 4 === 0) click(t, st16 === 0);
        if (local === 0) C.vis(t, function () { shown = learnEv; hi = -1; drawTab(); });
      } else if (part === 1) {
        var segI = Math.floor(bar / SEG), b = bar % SEG, mv = moves[segI % moves.length], nx = moves[(segI + 1) % moves.length];
        if (st16 % 4 === 0) click(t, st16 === 0);
        if (b === 0) {
          if (st16 === 0) C.vis(t, function () { big.textContent = "Move to " + C.noteName(mv.pc); info.textContent = where(mv.pc, mv.spot) + " – take this bar to move your hand"; shown = mv.ev; hi = -1; drawTab(); });
          return;
        }
        local = ((b - 1) % L) * 16 + st16; ev = mv.ev;
        if (local === 0 && b === 1) C.vis(t, function () { big.textContent = C.noteName(mv.pc); info.textContent = where(mv.pc, mv.spot); });
        if (b === SEG - 1 && st16 === 0) C.vis(t, function () { info.textContent = "Next: " + where(nx.pc, nx.spot); });
      } else {
        C.bandStep(step, t);
        var chords = plan.chords, ch = chords[bar % 4], nc = chords[(bar + 1) % 4];
        ev = useEvents(tp, ch, OPEN); local = st16;
        if (st16 === 0) { var snap = ev; C.vis(t, function () { big.textContent = ch.name; info.textContent = "next: " + nc.name; shown = snap; hi = -1; drawTab(); }); }
      }
      ev.forEach(function (e, idx) {
        if (e.st !== local || e.rest) return;
        if (guide) pluck(t, e, prevM, e.len * d);
        if (e.tech !== "x") prevM = e.m;
        var arr = ev;
        C.vis(t, function () { if (shown === arr) { hi = idx; drawTab(); } });
      });
    }

    function start() { C.seqStart(bpm(), onStep, pos, part === 2 ? plan.genre.swing : 0); }
    function go(k) {
      C.seqStop(); part = k; pos = 0; prevM = null; hinted = -1; hi = -1;
      head.textContent = "Part " + (k + 1) + " of 3 · " + NAMES[k];
      next.style.display = k < 2 ? "" : "none"; next.className = ""; hint.style.display = "none";
      tempoBox.innerHTML = "";
      C.tempoUI(tempoBox, k === 2 ? "techuse" : "tech", function (b) { C.setBpm(b); });
      if (k === 0) {
        big.textContent = C.noteName(tp.home); info.textContent = where(tp.home, homeSpot);
        tip.textContent = tp.tip; shown = learnEv; drawTab();
      } else if (k === 1) {
        big.textContent = "Move to " + C.noteName(moves[0].pc); info.textContent = where(moves[0].pc, moves[0].spot);
        tip.textContent = "Same shape, new key. Each key starts with one empty bar so you can move your hand calmly.";
        shown = moves[0].ev; drawTab();
      } else {
        C.band.chordAt = null; C.band.lift = null;
        big.textContent = plan.chords[0].name; info.textContent = plan.genre.name + " groove · chords " + plan.chords.map(function (c) { return c.name; }).join(" → ");
        tip.textContent = tp.useTip; shown = useEvents(tp, plan.chords[0], OPEN); drawTab();
      }
      if (C.S.running) start();
    }
    function elapsed() { return (C.S.total - C.S.left) * FAST; }

    drawGuide(); go(0);
    window.__tech = { tp: tp, part: function () { return part; }, go: go, moves: moves, homeSpot: homeSpot, learnEv: learnEv };
    return {
      play: function () { start(); },
      halt: function () { pos = C.seqStep() - (C.seqStep() % 16); C.seqStop(); },
      tick: function () {
        var due = part === 0 ? LEARN_DUE : part === 1 ? MOVE_DUE : 1e9;
        if (elapsed() >= due && hinted !== part) {
          hinted = part; next.className = "primary";
          hint.textContent = part === 0 ? "Ready to move it to other keys? Tap Next part when you are." : "Ready to use it over today's groove? Tap Next part when you are.";
          hint.style.display = "";
        }
      }
    };
  };
})();
