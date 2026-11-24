/* Song mode for the Bassline builder: learn a verse riff, a chorus riff and a fill,
   then play the whole song 3 times (as written, with a spice move, your own version), then jam. */
(function () {
  "use strict";
  var css = document.createElement("style");
  css.textContent =
    ".t16 .c{font-size:12px}.t16 .c i{padding:0 1px}" +
    ".steps{display:flex;gap:4px;margin:2px 0 8px}.steps span{flex:1;text-align:center;font-size:11px;padding:6px 0;border-radius:8px;background:#1c1c1c;color:var(--dim)}" +
    ".steps span.on{background:#1f3528;color:var(--good);font-weight:700}" +
    ".sec{text-align:center;font-weight:700;font-size:16px;border-radius:10px;padding:6px;margin:4px 0;color:#111}" +
    ".sec.verse{background:var(--blue)}.sec.chorus{background:var(--warn)}.sec.fill{background:var(--purple)}.sec.jam{background:var(--good)}" +
    ".spd{display:flex;gap:8px;justify-content:center;margin:8px 0}.spd button{padding:8px 14px;border-radius:20px}" +
    ".spd button.on,.tg.on{background:#1f3528;color:var(--good);border-color:#2f5a3e;font-weight:700}" +
    ".tag{font-size:11px;padding:2px 8px;border-radius:8px;background:#2a2a2a;color:var(--dim);margin-left:6px;font-weight:400}" +
    ".nav2{display:flex;gap:8px;margin-top:8px}.nav2 button{flex:1;border-radius:30px}" +
    ".dim{opacity:.35}";
  document.head.appendChild(css);

  var DEG = { R: 0, b2: 1, "2": 2, b3: 3, "3": 4, "4": 5, b5: 6, "5": 7, b6: 8, "6": 9, b7: 10, "7": 11, "8": 12, "9": 14, "5-": -5, "6-": -3, "b7-": -2, "58": 19 };
  var STEPS = ["verse", "chorus", "fill", "song", "jam"];
  var STEP_LABEL = ["Verse", "Chorus", "Fill", "Song ×3", "Jam"];

  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* degree token -> MIDI note, relative to the chord root R (MIDI) */
  function degree(tok, ch, nx, R) {
    var third = ch.q === "min" ? 3 : 4;
    if (tok === "T") return R + third;
    if (tok === "T-") return R + third - 1;
    if (tok === "c7") return R + (ch.sfx === "maj7" ? 11 : 10);
    if (tok.charAt(0) === "N") {
      var d = ((nx.pc - ch.pc) % 12 + 12) % 12;
      if (d > 6) d -= 12;
      return R + d + (tok.length > 1 ? parseInt(tok.slice(1), 10) : 0);
    }
    return R + DEG[tok];
  }

  window.SongDegree = degree;

  window.SongMode = function (C, stage) {
    var plan = C.plan(), g = plan.genre, lib = window.BASS_SONGS.songs[g.name], store = C.store;
    var r = rng(parseInt(plan.day.replace(/-/g, ""), 10) + 77);

    /* chorus chords: another progression from the same genre, same key */
    var pool = g.progs ? g.progs.slice() : (g.prog != null ? [g.prog] : []);
    if (!pool.length) for (var i = 1; i <= 20; i++) pool.push(i);
    function modeOf(p) { var c = C.progs[p].ch.filter(function (x) { return x[0] === 0; })[0]; return c ? c[1] : "maj"; }
    var vmode = modeOf(plan.pi);
    pool = pool.filter(function (p) { return p !== plan.pi && modeOf(p) === vmode; });
    if (!pool.length) pool = [plan.pi];
    var cprog = C.progs[pool[Math.floor(r() * pool.length)]];
    var verse = plan.chords;
    var chorus = cprog.ch.map(function (c) {
      var pc = (plan.key + c[0]) % 12;
      return { pc: pc, q: c[1], sfx: c[2] || "", name: C.noteName(pc) + (c[1] === "min" ? "m" : "") + (c[2] || "") };
    });
    var pick = { verse: Math.floor(r() * 4), chorus: Math.floor(r() * 4), fill: Math.floor(r() * 4) };
    var spice = window.BASS_SONGS.spices[Math.floor(r() * window.BASS_SONGS.spices.length)];

    var stepIdx = 0, guide = true, speed = 0.75, pos = 0;
    var shown = null, hi = -1, beat = 0, prevM = null;

    function mode() { return STEPS[stepIdx]; }
    function bpm() { return C.bpmFor("band") * speed; }

    function slot(b) {
      var m = mode(), i;
      if (m === "verse") { i = b % 4; return { sec: "verse", i: i, ch: verse[i], nx: verse[(i + 1) % 4], part: "verse" }; }
      if (m === "chorus") { i = b % 4; return { sec: "chorus", i: i, ch: chorus[i], nx: chorus[(i + 1) % 4], part: "chorus" }; }
      if (m === "fill") {
        return b % 2 === 0 ? { sec: "fill", i: 3, ch: chorus[3], nx: verse[0], part: "fill" }
                           : { sec: "verse", i: 0, ch: verse[0], nx: verse[1], part: "verse" };
      }
      i = b % 8;
      var s = i < 4 ? { sec: "verse", i: i, ch: verse[i], nx: i < 3 ? verse[i + 1] : chorus[0], part: "verse" }
            : i < 7 ? { sec: "chorus", i: i - 4, ch: chorus[i - 4], nx: chorus[i - 3], part: "chorus" }
            : { sec: "fill", i: 3, ch: chorus[3], nx: verse[0], part: "fill" };
      s.round = Math.floor(b / 8);
      s.bar = i;
      s.spice = m === "song" && s.round === 1 && ((s.sec === "verse" && (s.i === 1 || s.i === 3)) || (s.sec === "chorus" && s.i === 1));
      return s;
    }

    function phraseOf(part) { return lib[part][pick[part]]; }

    function withSpice(k) {
      var out = [];
      k.forEach(function (n) {
        if (n[0] >= 12) return;
        var e = n.slice();
        if (e[0] + e[2] > 12) e[2] = 12 - e[0];
        out.push(e);
      });
      return out.concat(spice.k);
    }

    function barEvents(s) {
      var k = phraseOf(s.part).k;
      if (s.spice) k = withSpice(k);
      var fe = (s.ch.pc - 4 + 12) % 12, R, anchor;
      if (fe <= 7) { R = 28 + fe; anchor = fe; } else { anchor = (s.ch.pc - 9 + 12) % 12; R = 33 + anchor; }
      return k.map(function (n) {
        var m = degree(n[1], s.ch, s.nx, R);
        while (m < 28) m += 12;
        while (m > 55) m -= 12;
        var p = placeNote(m, anchor);
        if (n[1].charAt(0) === "N" || n[1] === "5-" || n[1] === "6-" || n[1] === "b7-") {
          [m - 12, m + 12].forEach(function (m2) {
            if (m2 < 28 || m2 > 55) return;
            var p2 = placeNote(m2, anchor);
            if (p2 && (!p || p2.c < p.c - 0.5)) { p = p2; m = m2; }
          });
        }
        p = p || { s: 0, f: m - 28 };
        return { st: n[0], m: m, len: n[2], tech: n[3] || "", s: p.s, f: p.f };
      });
    }

    /* keep the hand in one spot: frets anchor-1 .. anchor+3 cost nothing, open strings are cheap */
    function placeNote(m, a) {
      var best = null;
      for (var s = 0; s < 4; s++) {
        var f = m - C.OPEN[s];
        if (f < 0 || f > 12) continue;
        var c = f < a - 1 ? a - 1 - f : f > a + 3 ? f - a - 3 : 0;
        if (f === 0) c = Math.min(c, 1.5);
        c += Math.abs(f - (a + 1)) * 0.01;
        if (!best || c < best.c) best = { s: s, f: f, c: c };
      }
      return best;
    }
    window.__placeNote = placeNote;

    /* ---------- guide bass (the app plays the line so you can hear it) ---------- */
    var thumpBuf = null;
    function gbass(t, e, from) {
      var ctx = C.ctx(), out = C.out(), dur = e.len * 60 / bpm() / 4;
      if (e.tech === "x") {
        if (!thumpBuf) {
          thumpBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
          var d = thumpBuf.getChannelData(0);
          for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.012));
        }
        var src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), gx = ctx.createGain();
        src.buffer = thumpBuf; lp.type = "lowpass"; lp.frequency.value = 700; gx.gain.value = 0.5;
        src.connect(lp); lp.connect(gx); gx.connect(out); src.start(t);
        return;
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

    /* ---------- sequencer callback ---------- */
    var cur = { b: -1, ev: [] };
    function onStep(step, t) {
      C.bandStep(step, t);
      var b = Math.floor(step / 16), st = step % 16;
      if (st === 0 || cur.b !== b) {
        var s = slot(b), ev = barEvents(s);
        cur = { b: b, s: s, ev: ev };
        var snap = cur;
        C.vis(t, function () { shown = snap; hi = -1; maybeAdvance(snap); draw(); });
      }
      var bar = cur;
      bar.ev.forEach(function (e, i) {
        if (e.st !== st) return;
        if (guide && mode() !== "jam") gbass(t, e, prevM);
        if (e.tech !== "x") prevM = e.m;
        C.vis(t, function () { if (shown === bar) { hi = i; drawTab(); } });
      });
      if (st % 4 === 0) C.vis(t, function () { beat = st / 4; drawBeats(); drawBoard(); });
    }

    function maybeAdvance(snap) {
      if (mode() === "song" && snap.s.round >= 3) { stepIdx = 4; drawSteps(); drawTip(); }
    }

    function hooks(on) {
      C.band.chordAt = on ? function (bar) { return slot(bar).ch; } : null;
      C.band.lift = on ? function (bar) { return slot(bar).sec === "chorus"; } : null;
    }

    function restart() {
      pos = 0; prevM = null; shown = null;
      if (C.S.running) { C.seqStop(); C.seqStart(bpm(), onStep, 0, g.swing); }
      draw();
    }

    /* ---------- UI ---------- */
    var el = C.el, btn = C.btn;
    var stepsEl = el("div", "steps"); stage.appendChild(stepsEl);
    var head = el("div", null);
    head.innerHTML = "<div class='chord'><div class='now' id='snow'></div><div class='nx' id='snext'></div></div>" +
      "<div class='beats'><span id='sb0'></span><span id='sb1'></span><span id='sb2'></span><span id='sb3'></span><span class='kick' id='kk'></span></div>" +
      "<div class='sec verse' id='ssec'></div><div class='small' id='sinfo' style='text-align:center;min-height:20px'></div>";
    stage.appendChild(head);
    var card = el("div", "card"); stage.appendChild(card);
    var title = el("div", null); card.appendChild(title);
    var tab = el("div", "tabn t16"); tab.style.marginTop = "8px"; card.appendChild(tab);
    var legend = el("div", "small", "h hammer-on · p pull-off · / slide in · x dead note"); card.appendChild(legend);
    var tip = el("p", "tip"); card.appendChild(tip);
    var row = el("div", "lvl"); card.appendChild(row);
    var swapB = btn("", "Swap riff", function () {
      var part = STEPS[stepIdx]; if (!lib[part]) return;
      pick[part] = (pick[part] + 1) % lib[part].length; draw();
    });
    var guideB = btn("tg", "", function () { guide = !guide; drawControls(); });
    row.appendChild(swapB); row.appendChild(guideB);

    var spd = el("div", "spd"); stage.appendChild(spd);
    var spdBtns = [0.5, 0.75, 1].map(function (v) {
      var b = btn("", Math.round(v * 100) + "%", function () { speed = v; C.setBpm(bpm()); drawControls(); });
      spd.appendChild(b); return b;
    });
    var nav = el("div", "nav2"); stage.appendChild(nav);
    var backB = btn("", "← Back", function () { if (stepIdx > 0) { stepIdx--; enterStep(); } });
    var nextB = btn("got", "Next step →", function () { if (stepIdx < 4) { stepIdx++; enterStep(); } });
    nav.appendChild(backB); nav.appendChild(nextB);
    C.fbCard(stage, false);
    C.tempoUI(stage, "band", function () { C.setBpm(bpm()); });

    function enterStep() {
      var m = mode();
      guide = m === "verse" || m === "chorus" || m === "fill";
      speed = guide ? 0.75 : 1;
      restart();
    }

    function drawSteps() {
      stepsEl.innerHTML = STEP_LABEL.map(function (l, i) { return "<span class='" + (i === stepIdx ? "on" : "") + "'>" + l + "</span>"; }).join("");
    }
    function drawControls() {
      var m = mode();
      guideB.textContent = "Guide bass: " + (guide ? "on" : "off");
      guideB.className = "tg" + (guide ? " on" : "");
      guideB.style.display = m === "jam" ? "none" : "";
      swapB.style.display = lib[m] ? "" : "none";
      spdBtns.forEach(function (b, i) { b.className = [0.5, 0.75, 1][i] === speed ? "on" : ""; });
      backB.style.visibility = stepIdx > 0 ? "visible" : "hidden";
      nextB.style.visibility = stepIdx < 4 ? "visible" : "hidden";
      nextB.textContent = stepIdx === 2 ? "Play the song →" : stepIdx === 3 ? "Skip to jam →" : "Next step →";
    }
    function drawTip() {
      var m = mode(), t;
      if (m === "verse") t = "Loop the verse riff. The guide bass plays it with you. When it feels easy, turn the guide off and play it alone.";
      else if (m === "chorus") t = "The chorus is busier. Same idea: loop it with the guide, then without.";
      else if (m === "fill") t = "The fill is the last bar before the verse comes back. Listen for how it lands on the verse's first note.";
      else if (m === "song") t = "Verse (4 bars) → chorus (3 bars) → fill. Round 1 as written, round 2 with a spice move, round 3 your own version.";
      else t = "Jam time. The song keeps looping. Use the fretboard and make your own line.";
      tip.textContent = t;
    }
    function drawHead() {
      var s = shown ? shown.s : slot(0), m = mode();
      document.getElementById("snow").textContent = s.ch.name;
      document.getElementById("snext").textContent = "next: " + s.nx.name;
      var sec = document.getElementById("ssec"), info = document.getElementById("sinfo");
      if (m === "jam") { sec.className = "sec jam"; sec.textContent = "JAM · " + s.sec.toUpperCase(); }
      else { sec.className = "sec " + s.sec; sec.textContent = s.sec.toUpperCase() + (m === "song" ? " · round " + (Math.min(s.round, 2) + 1) + " of 3" : ""); }
      var txt = "";
      if (m === "song" || m === "jam") {
        if (s.sec === "verse") txt = "Chorus in " + (4 - s.bar) + (4 - s.bar === 1 ? " bar" : " bars");
        else if (s.sec === "chorus") txt = "Fill in " + (7 - s.bar) + (7 - s.bar === 1 ? " bar" : " bars");
        else txt = "Back to the verse next bar";
        if (m === "song" && s.round === 1) txt += " · Spice: " + spice.n + (s.spice ? " (now!)" : "");
        if (m === "song" && s.round === 2) txt += " · Your version: change one thing";
      } else if (m === "fill" && s.sec === "verse") txt = "Landing on the verse";
      info.textContent = txt;
    }
    function drawTitle() {
      var s = shown ? shown.s : slot(0), ph = phraseOf(s.part);
      title.innerHTML = "<b>" + s.sec.charAt(0).toUpperCase() + s.sec.slice(1) + ": " + ph.n + "</b><span class='tag'>" + (ph.d === 1 ? "Easier" : "Harder") + "</span>" +
        (s.spice ? "<span class='tag' style='color:var(--good)'>+ " + spice.n + "</span>" : "");
    }
    function drawTab() {
      var m = mode(), ev = shown ? shown.ev : barEvents(slot(0));
      tab.className = "tabn t16" + ((m === "song" && shown && shown.s.round === 2) ? " dim" : "");
      tab.style.display = m === "jam" ? "none" : "";
      title.style.display = legend.style.display = m === "jam" ? "none" : "";
      var html = "", rows = [3, 2, 1, 0], SN = C.SN, i, st;
      rows.forEach(function (sIdx) {
        html += "<div class='r'><span class='sn'>" + SN[sIdx] + "</span>";
        for (st = 0; st < 16; st++) {
          var txt = "", isCur = false;
          for (i = 0; i < ev.length; i++) {
            if (ev[i].st === st && ev[i].s === sIdx) {
              txt = ev[i].tech === "x" ? "x" : (ev[i].tech === "h" || ev[i].tech === "p" || ev[i].tech === "/" ? ev[i].tech : "") + ev[i].f;
              isCur = i === hi;
            }
          }
          html += "<span class='c" + (isCur ? " cur" : "") + "'>" + (txt ? "<i>" + txt + "</i>" : "") + "</span>";
        }
        html += "</div>";
      });
      html += "<div class='cnt'><span class='sn'></span>";
      var hiSt = hi >= 0 && ev[hi] ? ev[hi].st : -1;
      for (st = 0; st < 16; st++) html += "<span class='c" + (st === hiSt ? " cur" : "") + "'>" + [String(st / 4 + 1), "e", "&", "a"][st % 4] + "</span>";
      tab.innerHTML = html + "</div>";
    }
    function drawBeats() {
      for (var i = 0; i < 4; i++) { var d = document.getElementById("sb" + i); if (d) d.className = i === beat ? "on" : ""; }
    }
    function drawBoard() {
      var fb = document.getElementById("fb"), s = shown ? shown.s : slot(0);
      C.band.beat = beat;
      if (fb && !store.hideFb) C.drawFb(fb, s.ch, s.nx);
    }
    function draw() { drawSteps(); drawControls(); drawTip(); drawHead(); drawTitle(); drawTab(); drawBeats(); drawBoard(); }

    draw();

    window.__song = { slot: slot, barEvents: barEvents, chorus: chorus, pick: pick, spice: spice, setStep: function (i) { stepIdx = i; enterStep(); } };

    return {
      play: function () { hooks(true); C.seqStop(); C.seqStart(bpm(), onStep, pos, g.swing); },
      halt: function () { var s = C.seqStep(); pos = s - (s % 16); C.seqStop(); hooks(false); },
      tick: function () {}
    };
  };
})();
