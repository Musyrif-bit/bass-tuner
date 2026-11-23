/* Bass coach practice content. Strings: 0=E 1=A 2=D 3=G. Events: [string, fret, beats]; string -1 = rest. */
window.BASS_DATA = (function () {
  function warm() {
    var ev = [], s, f;
    for (s = 0; s < 4; s++) for (f = 1; f <= 4; f++) ev.push([s, f, 1]);
    for (s = 3; s >= 0; s--) for (f = 4; f >= 1; f--) ev.push([s, f, 1]);
    return ev;
  }
  function openPluck() {
    var ev = [], s, i;
    for (s = 0; s < 4; s++) for (i = 0; i < 4; i++) ev.push([s, 0, 1]);
    for (s = 3; s >= 0; s--) for (i = 0; i < 4; i++) ev.push([s, 0, 1]);
    return ev;
  }

  var warmup = {
    name: "1-2-3-4 finger drill",
    tip: "One finger per fret: index, middle, ring, pinky. Keep each finger down until you need it.",
    bpm: 60, ev: warm()
  };

  /* index = day of week (0 = Sunday, which reviews one of the others) */
  var tech = [
    null,
    { name: "Alternate plucking", tip: "Pluck index, middle, index, middle. Never the same finger twice in a row.", bpm: 60, ev: openPluck() },
    { name: "Muting", tip: "On each rest, ease off the fretting finger so the note stops. Open strings: touch them with a plucking finger.",
      bpm: 60, ev: [[1,5,1],[-1,0,1],[1,5,1],[-1,0,1],[2,5,1],[-1,0,1],[2,5,1],[-1,0,1],
                    [0,0,1],[-1,0,1],[1,0,1],[-1,0,1],[2,0,1],[-1,0,1],[3,0,1],[-1,0,1]] },
    { name: "G major scale", tip: "Say the note names as you play: G A B C D E F# G.",
      bpm: 60, ev: [[0,3,1],[0,5,1],[1,2,1],[1,3,1],[1,5,1],[2,2,1],[2,4,1],[2,5,2],
                    [2,4,1],[2,2,1],[1,5,1],[1,3,1],[1,2,1],[0,5,1],[0,3,2]] },
    { name: "Root, 5th, octave", tip: "The same shape works for every chord: root, then 2 frets up on the next string, then 2 frets up two strings over.",
      bpm: 60, ev: [[0,3,1],[1,5,1],[2,5,1],[1,5,1],[1,3,1],[2,5,1],[3,5,1],[2,5,1],
                    [0,5,1],[1,7,1],[2,7,1],[1,7,1],[1,5,1],[2,7,1],[3,7,1],[2,7,1]] },
    { name: "Minor pentatonic", tip: "This is the scale for fills. Fret 5 with your index, fret 7 and 8 with ring and pinky.",
      bpm: 60, ev: [[0,5,1],[0,8,1],[1,5,1],[1,7,1],[2,5,1],[2,7,1],[3,5,1],[3,8,2],
                    [3,5,1],[2,7,1],[2,5,1],[1,7,1],[1,5,1],[0,8,1],[0,5,2]] },
    { name: "Octaves", tip: "Index on the root, ring or pinky two strings up, two frets higher. Mute the string in between.",
      bpm: 60, ev: [[0,3,1],[2,5,1],[0,3,1],[2,5,1],[0,5,1],[2,7,1],[0,5,1],[2,7,1],
                    [1,3,1],[3,5,1],[1,3,1],[3,5,1],[1,5,1],[3,7,1],[1,5,1],[3,7,1]] }
  ];

  /* Drum patterns: 16 steps per bar (16th notes). v = volume. */
  var genres = [
    { name: "Rock", bpm: [70, 80], swing: 0,
      kick: [0, 8, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
    { name: "Pop", bpm: [70, 80], swing: 0,
      kick: [0, 6, 8], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
    { name: "Funk", bpm: [65, 75], swing: 0,
      kick: [0, 3, 10], snare: [4, 12], ghost: [7, 14], hat: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] },
    { name: "Disco", bpm: [75, 80], swing: 0,
      kick: [0, 4, 8, 12], snare: [4, 12], hat: [0, 4, 8, 12], ohat: [2, 6, 10, 14] },
    { name: "Reggae", bpm: [65, 75], swing: 0,
      kick: [8], snare: [8], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
    { name: "Blues shuffle", bpm: [65, 75], swing: 0.66, prog: 0,
      kick: [0, 8], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] }
  ];

  /* Progressions: chords are [semitones from key, quality, suffix]. The first one is the blues. */
  var progs = [
    { roman: "I7 – IV7 – I7 – V7", ch: [[0,"maj","7"],[5,"maj","7"],[0,"maj","7"],[7,"maj","7"]] },
    { roman: "I – V – vi – IV", ch: [[0,"maj"],[7,"maj"],[9,"min"],[5,"maj"]] },
    { roman: "I – IV – V – IV", ch: [[0,"maj"],[5,"maj"],[7,"maj"],[5,"maj"]] },
    { roman: "vi – IV – I – V", ch: [[9,"min"],[5,"maj"],[0,"maj"],[7,"maj"]] },
    { roman: "I – vi – IV – V", ch: [[0,"maj"],[9,"min"],[5,"maj"],[7,"maj"]] },
    { roman: "i – VII – VI – VII", ch: [[0,"min"],[10,"maj"],[8,"maj"],[10,"maj"]] },
    { roman: "i – iv – v – i", ch: [[0,"min"],[5,"min"],[7,"min"],[0,"min"]] },
    { roman: "I – IV – I – V", ch: [[0,"maj"],[5,"maj"],[0,"maj"],[7,"maj"]] },
    { roman: "ii – V – I – I", ch: [[2,"min"],[7,"maj"],[0,"maj"],[0,"maj"]] },
    { roman: "I – bVII – IV – I", ch: [[0,"maj"],[10,"maj"],[5,"maj"],[0,"maj"]] },
    { roman: "i – VI – III – VII", ch: [[0,"min"],[8,"maj"],[3,"maj"],[10,"maj"]] },
    { roman: "I – iii – IV – V", ch: [[0,"maj"],[4,"min"],[5,"maj"],[7,"maj"]] },
    { roman: "IV – I – V – vi", ch: [[5,"maj"],[0,"maj"],[7,"maj"],[9,"min"]] },
    { roman: "I – V – IV – I", ch: [[0,"maj"],[7,"maj"],[5,"maj"],[0,"maj"]] },
    { roman: "vi – V – IV – V", ch: [[9,"min"],[7,"maj"],[5,"maj"],[7,"maj"]] },
    { roman: "i – VII – i – VII", ch: [[0,"min"],[10,"maj"],[0,"min"],[10,"maj"]] },
    { roman: "I – IV – I – IV", ch: [[0,"maj"],[5,"maj"],[0,"maj"],[5,"maj"]] },
    { roman: "i – iv – i – v", ch: [[0,"min"],[5,"min"],[0,"min"],[7,"min"]] },
    { roman: "I – I – IV – V", ch: [[0,"maj"],[0,"maj"],[5,"maj"],[7,"maj"]] },
    { roman: "vi – ii – V – I", ch: [[9,"min"],[2,"min"],[7,"maj"],[0,"maj"]] },
    { roman: "i – VI – VII – i", ch: [[0,"min"],[8,"maj"],[10,"maj"],[0,"min"]] }
  ];

  /* Original licks. n = [semitones from chord root, beats]. d = difficulty 1-3. q = chord type it fits. Each is one bar. */
  var licks = [
    { d:1, q:"any", name: "Root, 5th, octave walk", n: [[0,1],[7,1],[12,1],[7,1]] },
    { d:1, q:"any", name: "Long root, quick climb", n: [[0,2],[7,1],[12,1]] },
    { d:1, q:"any", name: "Pushed root", n: [[0,1.5],[0,0.5],[7,1],[0,1]] },
    { d:1, q:"any", name: "Low 5th bounce", n: [[0,1],[0,1],[-5,1],[0,1]] },
    { d:1, q:"maj", name: "Happy triad", n: [[0,1],[4,1],[7,1],[4,1]] },
    { d:1, q:"min", name: "Sad triad", n: [[0,1],[3,1],[7,1],[3,1]] },
    { d:1, q:"any", name: "Octave jump", n: [[0,1],[12,1],[0,1],[12,1]] },
    { d:1, q:"any", name: "Double 5th", n: [[0,1],[7,0.5],[7,0.5],[0,2]] },
    { d:1, q:"any", name: "Eighth-note drive", n: [[0,0.5],[0,0.5],[0,0.5],[0,0.5],[7,1],[0,1]] },
    { d:1, q:"min", name: "Down from the 7th", n: [[0,1],[10,1],[7,1],[0,1]] },
    { d:2, q:"min", name: "Pentatonic climb", n: [[0,1],[3,1],[5,1],[7,1]] },
    { d:2, q:"maj", name: "Major climb", n: [[0,1],[2,1],[4,1],[7,1]] },
    { d:2, q:"any", name: "Octave and lean back", n: [[0,1],[7,1],[12,1],[11,1]] },
    { d:2, q:"min", name: "Minor run and settle", n: [[0,0.5],[3,0.5],[5,0.5],[7,0.5],[10,1],[7,1]] },
    { d:2, q:"maj", name: "Major run and settle", n: [[0,0.5],[4,0.5],[7,0.5],[9,0.5],[12,1],[9,1]] },
    { d:2, q:"any", name: "Creep up to the 5th", n: [[0,1],[5,1],[6,1],[7,1]] },
    { d:2, q:"min", name: "Up and over", n: [[0,1.5],[7,0.5],[12,1],[10,0.5],[7,0.5]] },
    { d:2, q:"maj", name: "Walking up", n: [[0,1],[2,1],[4,1],[5,1]] },
    { d:2, q:"min", name: "Low turnaround", n: [[0,1],[-2,1],[-5,1],[-2,1]] },
    { d:2, q:"any", name: "Syncopated octaves", n: [[0,0.75],[12,0.25],[0,1],[12,0.5],[7,0.5],[0,1]] },
    { d:3, q:"min", name: "Pentatonic fall", n: [[12,0.5],[10,0.5],[7,0.5],[5,0.5],[3,0.5],[0,0.5],[0,1]] },
    { d:3, q:"maj", name: "Major fall", n: [[12,0.5],[9,0.5],[7,0.5],[4,0.5],[2,0.5],[0,0.5],[0,1]] },
    { d:3, q:"min", name: "Octave seesaw", n: [[0,0.5],[7,0.5],[12,0.5],[7,0.5],[0,0.5],[7,0.5],[12,0.5],[10,0.5]] },
    { d:3, q:"min", name: "Funk pop", n: [[0,0.25],[0,0.25],[12,0.5],[0,0.5],[10,0.5],[7,0.5],[5,0.5],[7,1]] },
    { d:3, q:"maj", name: "Chromatic lift", n: [[0,0.5],[4,0.5],[5,0.5],[6,0.5],[7,1],[4,0.5],[2,0.5]] },
    { d:3, q:"any", name: "Blues creep", n: [[0,0.5],[2,0.5],[3,0.5],[4,0.5],[5,0.5],[6,0.5],[7,1]] },
    { d:3, q:"min", name: "Blues scale up", n: [[0,0.5],[3,0.5],[5,0.5],[6,0.5],[7,0.5],[10,0.5],[12,1]] },
    { d:3, q:"maj", name: "Major pentatonic wave", n: [[0,0.5],[2,0.5],[4,0.5],[7,0.5],[9,0.5],[12,0.5],[9,0.5],[7,0.5]] },
    { d:3, q:"min", name: "Down and back up", n: [[7,0.5],[5,0.5],[3,0.5],[0,0.5],[-2,0.5],[0,0.5],[3,1]] },
    { d:3, q:"any", name: "Octave fill", n: [[0,1],[12,0.5],[0,0.5],[7,0.5],[5,0.5],[7,0.5],[0,0.5]] }
  ];

  var levels = [
    { name: "New rhythms", goal: "Roots only, but change the rhythm. Add a rest, push a note early, repeat a note." },
    { name: "Root, 5th, octave", goal: "Use the root (green) plus the 5th and octave (blue). Same shape on every chord." },
    { name: "Add 3rds", goal: "Add the amber note. It makes the chord sound happy (major) or sad (minor)." },
    { name: "Approach notes", goal: "On beat 4, before the chord changes, play one fret above or below the next root (purple), then land on it." },
    { name: "Fills", goal: "When the fill cue lights up, play a short pentatonic run and land on the root on beat 1." }
  ];

  return { warmup: warmup, tech: tech, genres: genres, progs: progs, licks: licks, levels: levels };
})();
