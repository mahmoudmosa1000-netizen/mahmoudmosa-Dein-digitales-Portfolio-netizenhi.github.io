/* ═══════════════════════════════════════════════════════
   FOLIO — Portfolio Builder
   main.js — Gesamte Applogik (State, Navigation, Rendering, API, Export)
   ═══════════════════════════════════════════════════════ */

// ═══ STATE ═══
var D = {
  fn: '',
  ln: '',
  title: '',
  tagline: '',
  bio: '',
  highlight: '',
  email: '',
  phone: '',
  github: '',
  linkedin: '',
  website: '',
  location: '',
  photo: null,
  skills: {
    tech: [],
    soft: [],
    lang: []
  },
  projects: [],
  experience: [],
  education: []
};
var portfolioStyle = 'noir',
  accentColor = '#16a085',
  curStep = 0,
  fontChoice = 'elegant',
  animChoice = 'reveal';
var animSpeed = 'normal',
  darkMode = true;

var PALETTE = {
  noir: ['#16a085', '#00E5A0', '#60A5FA', '#A855F7', '#8F9790', '#ef4444'],
  solaire: ['#16a085', '#0d9488', '#6d28d9', '#c2410c', '#1d4ed8', '#15803d'],
  cyber: ['#00E5A0', '#60A5FA', '#16a085', '#A855F7', '#f59e0b', '#ef4444'],
  mono: ['#ffffff', '#aaaaaa', '#888888', '#cccccc', '#666666', '#ffffff'],
  aurora: ['#A855F7', '#60A5FA', '#16a085', '#00E5A0', '#8F9790', '#f59e0b'],
  slate: ['#8F9790', '#16a085', '#60A5FA', '#A855F7', '#00E5A0', '#f59e0b']
};

// ═══ MODE ═══
function toggleMode() {
  darkMode = !darkMode;
  document.documentElement.setAttribute('data-mode', darkMode ? 'dark' : 'light');
  liveRender();
}

// ═══ NAVIGATION ═══
function go(n) {
  document.querySelectorAll('.scr').forEach(function (s) {
    s.classList.remove('on');
  });
  var el = document.getElementById('s' + n);
  if (el) el.classList.add('on');
  var hb = document.getElementById('hdr-back');
  if (hb) hb.style.display = n > 0 ? 'block' : 'none';
  if (n === 2) {
    runExportTerminal();
  }
}

function startBuild() {
  go(1);
  goStep(0);
  liveRender();
}

function goExport() {
  syncD();
  go(2);
}

function goStep(n) {
  document.querySelectorAll('.step').forEach(function (s) {
    s.classList.remove('on');
  });
  var el = document.getElementById('step' + n);
  if (el) el.classList.add('on');
  curStep = n;
  for (var i = 0; i < 7; i++) {
    var d = document.getElementById('dot' + i);
    if (!d) continue;
    d.classList.remove('done', 'cur');
    if (i < n) d.classList.add('done');
    else if (i === n) d.classList.add('cur');
  }
  var hs = document.getElementById('hdr-step');
  if (hs) {
    hs.textContent = 'Schritt ' + (n + 1) + ' / 7';
    hs.style.display = 'block';
  }
  liveRender();
}

// ═══ TABS ═══
function switchTab(btn, paneId) {
  btn.closest('.step').querySelectorAll('.tab-btn').forEach(function (b) {
    b.classList.remove('on');
  });
  btn.classList.add('on');
  btn.closest('.step').querySelectorAll('.tab-pane').forEach(function (p) {
    p.classList.remove('on');
  });
  var p = document.getElementById(paneId);
  if (p) p.classList.add('on');
}

// ═══ PHOTO ═══
function photoSet(e) {
  var f = e.target.files[0];
  if (!f) return;
  var r = new FileReader();
  r.onload = function (ev) {
    D.photo = ev.target.result;
    var el = document.getElementById('photoRing');
    if (el) el.innerHTML = '<img src="' + D.photo + '" style="width:100%;height:100%;object-fit:cover">';
    document.getElementById('photoClearBtn').style.display = 'inline';
    liveRender();
  };
  r.readAsDataURL(f);
}

function clearPhoto() {
  D.photo = null;
  document.getElementById('photoRing').innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>';
  document.getElementById('photoClearBtn').style.display = 'none';
  liveRender();
}

// ═══ UPLOAD & KI-EXTRAKTION ═══
function dragOver(e, zoneId) {
  e.preventDefault();
  document.getElementById(zoneId).classList.add('drag');
}

function dragLeave(zoneId) {
  document.getElementById(zoneId).classList.remove('drag');
}

function dropFile(e, type) {
  e.preventDefault();
  dragLeave(type + '-zone');
  var file = e.dataTransfer.files[0];
  if (!file) return;
  processUploadedFile(file, type);
}

function fileUpload(e, type) {
  var file = e.target.files[0];
  if (!file) return;
  processUploadedFile(file, type);
}

function processUploadedFile(file, type) {
  var statusEl = document.getElementById(type + '-status');
  statusEl.style.display = 'block';
  statusEl.textContent = '📂 Lese Datei...';
  var r = new FileReader();
  r.onload = function (ev) {
    var text = ev.target.result;
    // Strip HTML tags if HTML file
    if (file.name.match(/\.html?$/i)) {
      var tmp = document.createElement('div');
      tmp.innerHTML = text;
      text = tmp.innerText || tmp.textContent;
    }
    statusEl.textContent = '🤖 KI extrahiert Daten...';
    termLog('info', '$ folio --extract --type=' + type);
    termLog('cmd', '  Analysiere: ' + file.name + ' (' + Math.round(file.size / 1024) + 'KB)');
    aiExtract(text, type, statusEl);
  };
  r.readAsText(file, 'UTF-8');
}

function termLog(type, msg) {
  var body = document.getElementById('term-body');
  if (!body) return;
  var div = document.createElement('div');
  div.className = 'term-line';
  var cls = type === 'info' ? 'term-prompt' : type === 'cmd' ? 'term-cmd' : type === 'ok' ? 'term-ok' : 'term-out';
  div.innerHTML = '<span class="' + cls + '">' + msg + '</span>';
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

async function aiExtract(text, type, statusEl) {
  var prompt = type === 'cv' ?
    'Du bist ein Experte für Lebenslauf-Analyse. Extrahiere aus folgendem Text alle Informationen und gib sie als JSON zurück. Schema: {"fn":"","ln":"","title":"","bio":"","tagline":"","email":"","phone":"","github":"","linkedin":"","website":"","location":"","skills":{"tech":[],"soft":[],"lang":[]},"experience":[{"title":"","company":"","period":"","bullets":""}],"education":[{"degree":"","school":"","year":""}]}. Gib NUR JSON zurück, kein Markdown.\n\nText:\n' + text.substring(0, 3000) :
    'Du bist ein Experte für Anschreiben-Analyse. Extrahiere aus folgendem Anschreiben: Tagline (max 10 Wörter), Bio-Erweiterung, und Highlight-Zitat. Schema: {"tagline":"","bio_addition":"","highlight":""}. Nur JSON.\n\nText:\n' + text.substring(0, 2000);
  try {
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });
    var data = await res.json();
    var raw = data.content.map(function (c) {
      return c.text || '';
    }).join('').replace(/```json|```/g, '').trim();
    var parsed = JSON.parse(raw);
    if (type === 'cv') {
      fillFromExtracted(parsed);
      statusEl.textContent = '✅ Erfolgreich extrahiert!';
    } else {
      if (parsed.tagline && !D.tagline) {
        D.tagline = parsed.tagline;
        var el = document.getElementById('i-tag');
        if (el) el.value = parsed.tagline;
      }
      if (parsed.highlight) {
        D.highlight = parsed.highlight;
        var el2 = document.getElementById('i-hl');
        if (el2) el2.value = parsed.highlight;
      }
      statusEl.textContent = '✅ Anschreiben verarbeitet!';
    }
    termLog('ok', '  ✓ Extraktion abgeschlossen.');
    liveRender();
  } catch (err) {
    statusEl.textContent = '⚠️ Extraktion fehlgeschlagen — bitte manuell eingeben.';
    termLog('err', '  ✗ Fehler: ' + err.message);
  }
}

function fillFromExtracted(p) {
  var map = {
    fn: 'i-fn',
    ln: 'i-ln',
    title: 'i-title',
    tagline: 'i-tag',
    bio: 'i-bio',
    highlight: 'i-hl',
    email: 'i-email',
    phone: 'i-phone',
    github: 'i-gh',
    linkedin: 'i-li',
    website: 'i-web',
    location: 'i-loc'
  };
  for (var k in map) {
    if (p[k]) {
      D[k] = p[k];
      var el = document.getElementById(map[k]);
      if (el) el.value = p[k];
    }
  }
  if (p.skills) {
    ['tech', 'soft', 'lang'].forEach(function (c) {
      if (p.skills[c] && p.skills[c].length) {
        D.skills[c] = (D.skills[c] || []).concat(p.skills[c]);
        renderTags(c + '-tags', c);
      }
    });
  }
  if (p.experience && p.experience.length) {
    p.experience.forEach(function (e) {
      addExp(e);
    });
  }
  if (p.education && p.education.length) {
    p.education.forEach(function (e) {
      addEdu(e);
    });
  }
  termLog('ok', '  ✓ ' + Object.keys(p).length + ' Felder befüllt.');
}

// ═══ JSON IMPORT/EXPORT ═══
function exportJSON() {
  syncD();
  var json = JSON.stringify(D, null, 2);
  var area = document.getElementById('json-import-area');
  if (area) area.value = json;
  var blob = new Blob([json], {
    type: 'application/json'
  });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'folio-data.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJSON() {
  var area = document.getElementById('json-import-area');
  if (!area) return;
  try {
    var parsed = JSON.parse(area.value);
    fillFromExtracted(parsed);
    var map = {
      fn: 'i-fn',
      ln: 'i-ln',
      title: 'i-title',
      tagline: 'i-tag',
      bio: 'i-bio',
      highlight: 'i-hl',
      email: 'i-email',
      phone: 'i-phone',
      github: 'i-gh',
      linkedin: 'i-li',
      website: 'i-web',
      location: 'i-loc'
    };
    for (var k in map) {
      if (parsed[k]) {
        var el = document.getElementById(map[k]);
        if (el) el.value = parsed[k];
      }
    }
    liveRender();
    alert('✅ Daten erfolgreich importiert!');
  } catch (e) {
    alert('⚠️ Ungültiges JSON. Bitte überprüfen.');
  }
}

// ═══ TAGS ═══
function tagKey(e, boxId, inpId) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    var inp = document.getElementById(inpId);
    var val = inp.value.replace(/,$/, '').trim();
    if (!val) return;
    var category = boxId.replace('-tags', '');
    if (!D.skills[category]) D.skills[category] = [];
    D.skills[category].push(val);
    inp.value = '';
    renderTags(boxId, category);
    liveRender();
  }
  if (e.key === 'Backspace' && document.getElementById(inpId).value === '') {
    var cat = boxId.replace('-tags', '');
    if (D.skills[cat] && D.skills[cat].length) {
      D.skills[cat].pop();
      renderTags(boxId, cat);
      liveRender();
    }
  }
}

function renderTags(boxId, cat) {
  var box = document.getElementById(boxId);
  if (!box) return;
  var inpId = boxId.replace('-tags', '-inp');
  var chips = D.skills[cat].map(function (t, i) {
    return '<span class="chip">' + t + '<button class="chip-x" onclick="removeTag(\'' + cat + '\',' + i + ')">×</button></span>';
  }).join('');
  box.innerHTML = chips + '<input class="tag-inp" id="' + inpId + '" onkeydown="tagKey(event,\'' + boxId + '\',\'' + inpId + '\')" placeholder="">';
}

function removeTag(cat, i) {
  D.skills[cat].splice(i, 1);
  renderTags(cat + '-tags', cat);
  liveRender();
}

// ═══ PROJECTS ═══
var projCount = 0;

function addProject(data) {
  var id = 'prj' + projCount++;
  if (!data) data = {
    name: '',
    desc: '',
    tech: '',
    url: ''
  };
  D.projects.push({
    id: id,
    name: data.name || '',
    desc: data.desc || '',
    tech: data.tech || '',
    url: data.url || ''
  });
  var list = document.getElementById('proj-list');
  var div = document.createElement('div');
  div.className = 'pc';
  div.id = 'pc-' + id;
  div.innerHTML = '<button class="card-del" onclick="removeItem(\'project\',\'' + id + '\',this)">✕</button>' +
    '<div class="f2" style="margin-bottom:10px"><div class="fld" style="margin:0"><label>Projektname</label><input value="' + esc(data.name) + '" oninput="updateItem(\'project\',\'' + id + '\',\'name\',this.value)" placeholder="Portfolio Website"></div>' +
    '<div class="fld" style="margin:0"><label>URL / GitHub</label><input value="' + esc(data.url) + '" oninput="updateItem(\'project\',\'' + id + '\',\'url\',this.value)" placeholder="github.com/..."></div></div>' +
    '<div class="fld" style="margin-bottom:10px"><label>Beschreibung</label><textarea rows="2" oninput="updateItem(\'project\',\'' + id + '\',\'desc\',this.value)" placeholder="Was hast du gebaut?">' + esc(data.desc) + '</textarea></div>' +
    '<div class="fld" style="margin:0"><label>Tech Stack (kommagetrennt)</label><input value="' + esc(data.tech) + '" oninput="updateItem(\'project\',\'' + id + '\',\'tech\',this.value)" placeholder="React, TypeScript, Firebase"></div>';
  list.appendChild(div);
}

function addExp(data) {
  var id = 'exp' + projCount++;
  if (!data) data = {
    title: '',
    company: '',
    period: '',
    bullets: ''
  };
  D.experience.push({
    id: id,
    title: data.title || '',
    company: data.company || '',
    period: data.period || '',
    bullets: data.bullets || ''
  });
  var list = document.getElementById('exp-list');
  var div = document.createElement('div');
  div.className = 'tlc';
  div.dataset.id = id;
  div.innerHTML = '<button class="card-del" onclick="removeItem(\'experience\',\'' + id + '\',this)">✕</button>' +
    '<div class="f2" style="margin-bottom:10px"><div class="fld" style="margin:0"><label>Position</label><input oninput="updateItem(\'experience\',\'' + id + '\',\'title\',this.value)" value="' + esc(data.title) + '" placeholder="Senior Developer"></div>' +
    '<div class="fld" style="margin:0"><label>Unternehmen</label><input oninput="updateItem(\'experience\',\'' + id + '\',\'company\',this.value)" value="' + esc(data.company) + '" placeholder="Musterfirma GmbH"></div></div>' +
    '<div class="fld" style="margin-bottom:10px"><label>Zeitraum</label><input oninput="updateItem(\'experience\',\'' + id + '\',\'period\',this.value)" value="' + esc(data.period) + '" placeholder="2023 – heute" style="max-width:200px"></div>' +
    '<div class="fld" style="margin:0"><label>Highlights (eine pro Zeile)</label><textarea rows="2" oninput="updateItem(\'experience\',\'' + id + '\',\'bullets\',this.value)" placeholder="React-Komponenten aufgebaut">' + esc(data.bullets) + '</textarea></div>';
  list.appendChild(div);
}

function addEdu(data) {
  var id = 'edu' + projCount++;
  if (!data) data = {
    degree: '',
    school: '',
    year: ''
  };
  D.education.push({
    id: id,
    degree: data.degree || '',
    school: data.school || '',
    year: data.year || ''
  });
  var list = document.getElementById('edu-list');
  var div = document.createElement('div');
  div.className = 'tlc';
  div.dataset.id = id;
  div.innerHTML = '<button class="card-del" onclick="removeItem(\'education\',\'' + id + '\',this)">✕</button>' +
    '<div class="f2"><div class="fld" style="margin:0"><label>Abschluss</label><input oninput="updateItem(\'education\',\'' + id + '\',\'degree\',this.value)" value="' + esc(data.degree) + '" placeholder="B.Sc. Informatik"></div>' +
    '<div class="fld" style="margin:0"><label>Schule / Uni</label><input oninput="updateItem(\'education\',\'' + id + '\',\'school\',this.value)" value="' + esc(data.school) + '" placeholder="TU Berlin"></div></div>' +
    '<div class="fld" style="margin-top:10px;margin-bottom:0"><label>Jahr</label><input oninput="updateItem(\'education\',\'' + id + '\',\'year\',this.value)" value="' + esc(data.year) + '" placeholder="2024" style="max-width:120px"></div>';
  list.appendChild(div);
}

function removeItem(type, id, btn) {
  D[type] = D[type].filter(function (x) {
    return x.id !== id;
  });
  var card = btn.closest('.pc,.tlc');
  if (card) card.remove();
  liveRender();
}

function updateItem(type, id, field, val) {
  var item = D[type].find(function (x) {
    return x.id === id;
  });
  if (item) item[field] = val;
  liveRender();
}

function esc(s) {
  return (s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ═══ SYNC FIELDS ═══
function syncD() {
  var m = {
    fn: 'i-fn',
    ln: 'i-ln',
    title: 'i-title',
    tagline: 'i-tag',
    bio: 'i-bio',
    highlight: 'i-hl',
    email: 'i-email',
    phone: 'i-phone',
    github: 'i-gh',
    linkedin: 'i-li',
    website: 'i-web',
    location: 'i-loc'
  };
  for (var k in m) {
    var el = document.getElementById(m[k]);
    if (el) D[k] = el.value;
  }
}

// ═══ STYLE & COLOR ═══
function setStyle(s) {
  portfolioStyle = s;
  ['noir', 'solaire', 'cyber', 'mono', 'aurora', 'slate'].forEach(function (x) {
    var c = document.getElementById('stc-' + x);
    if (c) c.classList.toggle('sel', x === s);
  });
  buildSwatches();
  liveRender();
}

function setFont(f) {
  fontChoice = f;
  document.querySelectorAll('.font-opt').forEach(function (o) {
    o.classList.toggle('sel', o.dataset.font === f);
  });
  liveRender();
}

function setAnim(a) {
  animChoice = a;
  document.querySelectorAll('.anim-card').forEach(function (c) {
    c.classList.remove('sel');
  });
  var card = document.getElementById('ac-' + a);
  if (card) card.classList.add('sel');
  var infos = {
    reveal: 'Scroll-Reveal: Jeder Abschnitt erscheint sanft mit einer leichten Aufwärtsbewegung, sobald er in den sichtbaren Bereich gescrollt wird. Funktioniert in allen Browsern perfekt.',
    terminal: 'Terminal-Typing: Überschriften und Texte werden Zeichen für Zeichen eingetippt — wie auf einer Kommandozeile. Perfekt für IT- und Developer-Profile.',
    glitch: 'Glitch-Effect: Der Herobereich zeigt RGB-Farbverschiebungen und kurze Störimpulse. Erzeugt eine kraftvolle Cyberpunk-Ästhetik — am besten mit dem Cyber-Theme.',
    fade: 'Sanftes Fade: Inhalte blenden ohne jede Bewegung weich ein. Sehr dezent und professionell — ideal für kreative oder konservative Branchen.',
    bounce: 'Bounce-In: Elemente federn beim Einblenden leicht über ihr Ziel hinaus und schwingen ein. Gibt der Seite Energie und Persönlichkeit ohne übertrieben zu wirken.',
    zoom: 'Zoom-Reveal: Inhalte zoomen aus einer leicht kleineren Größe heraus — gibt ein Gefühl von Tiefe und Fokus. Wirkt modern und hochwertig.',
    slide: 'Slide-In: Abschnitte wechseln sich ab — mal von links, mal von rechts einfliegend. Erzeugt eine dynamische, narrative Struktur.',
    neon: 'Neon-Wave: Ein pulsierender Neon-Glow-Effekt in deiner Akzentfarbe breitet sich wellenförmig über die Seite aus. Besonders eindrucksvoll mit dem Cyber- oder Aurora-Theme.'
  };
  var infoEl = document.getElementById('anim-info-text');
  if (infoEl) infoEl.textContent = infos[a] || '';
  liveRender();
}

function setSpeed(s) {
  animSpeed = s;
  document.querySelectorAll('.speed-btn').forEach(function (b) {
    b.classList.remove('sel');
  });
  var el = document.getElementById('spd-' + s);
  if (el) el.classList.add('sel');
  liveRender();
}

function setAccent(c) {
  accentColor = c;
  // Sync custom inputs
  var cc = document.getElementById('custom-color');
  if (cc) cc.value = c;
  var ch = document.getElementById('custom-hex');
  if (ch) ch.value = c;
  // Update palette swatches
  document.querySelectorAll('.pal-swatch').forEach(function (s) {
    s.classList.toggle('sel', s.dataset.hex === c);
  });
  buildSwatches();
  liveRender();
}

function hexInput(v) {
  if (/^#[0-9a-fA-F]{6}$/.test(v)) {
    setAccent(v);
  }
}

function buildSwatches() {
  var pal = PALETTE[portfolioStyle] || PALETTE.noir;
  var row = document.getElementById('sw-row');
  if (!row) return;
  row.innerHTML = pal.map(function (c) {
    return '<div class="sw' + (c === accentColor ? ' sel' : '') + '" style="background:' + c + '" onclick="setAccent(\'' + c + '\')" title="' + c + '"></div>';
  }).join('');
}

// ═══ LIVE RENDER ═══
function liveRender() {
  syncD();
  var fr = document.getElementById('prev-fr');
  if (!fr) return;
  fr.srcdoc = buildPortfolio(false);
}

// ═══ AI POLISH ═══
async function aiPolish() {
  syncD();
  var btn = document.querySelector('[onclick="aiPolish()"]');
  if (btn) {
    btn.textContent = '⟳ KI arbeitet...';
    btn.disabled = true;
  }
  termLog('cmd', '$ folio --ai-polish --lang=de');
  try {
    var p = 'Du bist ein Experte für deutschsprachige IT-Karriere-Texte. Verbessere Tagline (max 10 Wörter, prägnant, auf Deutsch) und Bio (2-3 polierte deutsche Sätze). Antworte NUR mit JSON: {"tagline":"","bio":""}.\n\nProfil: Name=' + D.fn + ' ' + D.ln + ', Titel=' + D.title + ', Skills=' + D.skills.tech.join(', ') + ', Tagline=' + D.tagline + ', Bio=' + D.bio;
    var r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: p
        }]
      })
    });
    var data = await r.json();
    var res = JSON.parse(data.content.map(function (c) {
      return c.text || '';
    }).join('').replace(/```json|```/g, '').trim());
    if (res.tagline) {
      D.tagline = res.tagline;
      var e = document.getElementById('i-tag');
      if (e) e.value = res.tagline;
    }
    if (res.bio) {
      D.bio = res.bio;
      var e2 = document.getElementById('i-bio');
      if (e2) e2.value = res.bio;
    }
    liveRender();
    termLog('ok', '  ✓ Texte verbessert.');
  } catch (e) {
    termLog('err', '  ✗ KI-Fehler.');
  }
  if (btn) {
    btn.textContent = '✨ KI verbessern';
    btn.disabled = false;
  }
}

// ═══ DEMO DATA ═══
function loadDemoData() {
  var d = {
    fn: 'Mahmoud',
    ln: 'Al-Mosa',
    title: 'Full-Stack Developer & DevOps Engineer',
    tagline: 'Code. Deploy. Scale. Repeat.',
    bio: 'Leidenschaftlicher Full-Stack-Entwickler mit Expertise in Cloud-Infrastruktur und modernen Web-Technologien. Ich verwandle komplexe Anforderungen in elegante, skalierbare Lösungen — von der Datenbank bis zum UI.',
    highlight: 'Die beste Architektur ist die, die man nicht sieht.',
    email: 'mahmoud@example.com',
    phone: '+49 172 123 4567',
    github: 'github.com/mahmoud',
    linkedin: 'linkedin.com/in/mahmoud',
    website: 'mahmoud.dev',
    location: 'Frankfurt am Main',
    skills: {
      tech: ['Python', 'TypeScript', 'React', 'Docker', 'Kubernetes', 'PostgreSQL', 'AWS', 'FastAPI', 'Git', 'Linux'],
      soft: ['Problemlösung', 'Teamführung', 'Agile/Scrum', 'Code-Review'],
      lang: ['Deutsch (C1)', 'Englisch (C1)', 'Arabisch (Muttersprache)']
    },
    projects: [{
      id: 'p1',
      name: 'CloudOps Dashboard',
      desc: 'Echtzeit-Kubernetes-Monitoring-Dashboard mit automatischer Alerting-Pipeline und Kostenanalyse.',
      tech: 'React, TypeScript, Python, Prometheus, Grafana',
      url: 'github.com/mahmoud/cloudops'
    }, {
      id: 'p2',
      name: 'DevFlow CI/CD',
      desc: 'Vollautomatisierte Deployment-Pipeline mit Blue-Green-Deployments und automatischen Rollbacks.',
      tech: 'Docker, Kubernetes, GitHub Actions, Helm',
      url: 'github.com/mahmoud/devflow'
    }],
    experience: [{
      id: 'e1',
      title: 'Senior Developer',
      company: 'TechCorp GmbH',
      period: '2022 – heute',
      bullets: 'Microservices-Architektur für 500k+ User migriert\nCI/CD-Pipeline Deploymentzeit von 45 auf 8 Minuten reduziert\nKubernetes-Cluster aufgebaut und betrieben'
    }],
    education: [{
      id: 'ed1',
      degree: 'B.Sc. Informatik',
      school: 'Goethe-Universität Frankfurt',
      year: '2021'
    }]
  };
  Object.assign(D, d);
  var map = {
    fn: 'i-fn',
    ln: 'i-ln',
    title: 'i-title',
    tagline: 'i-tag',
    bio: 'i-bio',
    highlight: 'i-hl',
    email: 'i-email',
    phone: 'i-phone',
    github: 'i-gh',
    linkedin: 'i-li',
    website: 'i-web',
    location: 'i-loc'
  };
  for (var k in map) {
    var el = document.getElementById(map[k]);
    if (el) el.value = D[k] || '';
  }
  ['tech', 'soft', 'lang'].forEach(function (c) {
    D.skills[c] = d.skills[c].slice();
    renderTags(c + '-tags', c);
  });
  document.getElementById('proj-list').innerHTML = '';
  D.projects = [];
  d.projects.forEach(function (p) {
    var tmp = JSON.parse(JSON.stringify(p));
    D.projects.push(tmp);
    addProjectCard(tmp);
  });
  document.getElementById('exp-list').innerHTML = '';
  D.experience = [];
  d.experience.forEach(function (e) {
    D.experience.push(JSON.parse(JSON.stringify(e)));
    addExpCard(e);
  });
  document.getElementById('edu-list').innerHTML = '';
  D.education = [];
  d.education.forEach(function (e) {
    D.education.push(JSON.parse(JSON.stringify(e)));
    addEduCard(e);
  });
  portfolioStyle = 'cyber';
  accentColor = '#00E5A0';
  ['noir', 'solaire', 'cyber', 'mono', 'aurora', 'slate'].forEach(function (x) {
    var c = document.getElementById('stc-' + x);
    if (c) c.classList.toggle('sel', x === 'cyber');
  });
  buildSwatches();
  startBuild();
}

function addProjectCard(data) {
  var id = data.id;
  var list = document.getElementById('proj-list');
  var div = document.createElement('div');
  div.className = 'pc';
  div.id = 'pc-' + id;
  div.innerHTML = '<button class="card-del" onclick="removeItem(\'project\',\'' + id + '\',this)">✕</button>' +
    '<div class="f2" style="margin-bottom:10px"><div class="fld" style="margin:0"><label>Projektname</label><input value="' + esc(data.name) + '" oninput="updateItem(\'project\',\'' + id + '\',\'name\',this.value)"></div>' +
    '<div class="fld" style="margin:0"><label>URL</label><input value="' + esc(data.url) + '" oninput="updateItem(\'project\',\'' + id + '\',\'url\',this.value)"></div></div>' +
    '<div class="fld" style="margin-bottom:10px"><label>Beschreibung</label><textarea rows="2" oninput="updateItem(\'project\',\'' + id + '\',\'desc\',this.value)">' + esc(data.desc) + '</textarea></div>' +
    '<div class="fld" style="margin:0"><label>Tech Stack</label><input value="' + esc(data.tech) + '" oninput="updateItem(\'project\',\'' + id + '\',\'tech\',this.value)"></div>';
  list.appendChild(div);
}

function addExpCard(data) {
  var id = data.id;
  var list = document.getElementById('exp-list');
  var div = document.createElement('div');
  div.className = 'tlc';
  div.innerHTML = '<button class="card-del" onclick="removeItem(\'experience\',\'' + id + '\',this)">✕</button>' +
    '<div class="f2" style="margin-bottom:10px"><div class="fld" style="margin:0"><label>Position</label><input oninput="updateItem(\'experience\',\'' + id + '\',\'title\',this.value)" value="' + esc(data.title) + '"></div>' +
    '<div class="fld" style="margin:0"><label>Unternehmen</label><input oninput="updateItem(\'experience\',\'' + id + '\',\'company\',this.value)" value="' + esc(data.company) + '"></div></div>' +
    '<div class="fld" style="margin-bottom:10px"><label>Zeitraum</label><input oninput="updateItem(\'experience\',\'' + id + '\',\'period\',this.value)" value="' + esc(data.period) + '" style="max-width:200px"></div>' +
    '<div class="fld" style="margin:0"><label>Highlights</label><textarea rows="2" oninput="updateItem(\'experience\',\'' + id + '\',\'bullets\',this.value)">' + esc(data.bullets) + '</textarea></div>';
  list.appendChild(div);
}

function addEduCard(data) {
  var id = data.id;
  var list = document.getElementById('edu-list');
  var div = document.createElement('div');
  div.className = 'tlc';
  div.innerHTML = '<button class="card-del" onclick="removeItem(\'education\',\'' + id + '\',this)">✕</button>' +
    '<div class="f2"><div class="fld" style="margin:0"><label>Abschluss</label><input oninput="updateItem(\'education\',\'' + id + '\',\'degree\',this.value)" value="' + esc(data.degree) + '"></div>' +
    '<div class="fld" style="margin:0"><label>Schule/Uni</label><input oninput="updateItem(\'education\',\'' + id + '\',\'school\',this.value)" value="' + esc(data.school) + '"></div></div>' +
    '<div class="fld" style="margin-top:10px;margin-bottom:0"><label>Jahr</label><input oninput="updateItem(\'education\',\'' + id + '\',\'year\',this.value)" value="' + esc(data.year) + '" style="max-width:120px"></div>';
  list.appendChild(div);
}

// ═══ EXPORT TERMINAL ═══
function runExportTerminal() {
  var term = document.getElementById('export-term');
  if (!term) return;
  term.innerHTML = '';
  var lines = [{
      t: 0,
      cls: 'term-prompt',
      txt: '$ folio --export --format=html --standalone'
    },
    {
      t: 300,
      cls: 'term-cmd',
      txt: '  Building portfolio...'
    },
    {
      t: 600,
      cls: 'term-out',
      txt: '  [████████░░] Compiling styles...'
    },
    {
      t: 900,
      cls: 'term-out',
      txt: '  [████████████] Embedding assets...'
    },
    {
      t: 1200,
      cls: 'term-ok',
      txt: '  ✓ Build complete · ' + (D.fn || 'portfolio') + '.html'
    }
  ];
  lines.forEach(function (l) {
    setTimeout(function () {
      var d = document.createElement('div');
      d.className = 'term-line';
      d.innerHTML = '<span class="' + l.cls + '">' + l.txt + '</span>';
      term.appendChild(d);
      term.scrollTop = term.scrollHeight;
    }, l.t);
  });
}

// ═══ DOWNLOAD ═══
function downloadPortfolio() {
  syncD();
  var html = buildPortfolio(true);
  var blob = new Blob([html], {
    type: 'text/html'
  });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'portfolio-' + (D.fn + '-' + D.ln).toLowerCase().replace(/\s+/g, '-') + '.html';
  a.click();
  URL.revokeObjectURL(a.href);
}

function previewFull() {
  syncD();
  var w = window.open('', '_blank');
  if (w) {
    w.document.write(buildPortfolio(true));
    w.document.close();
  }
}

// ═══ BUILD PORTFOLIO ═══
function buildPortfolio(full) {
  syncD();
  var name = (D.fn + ' ' + D.ln).trim() || 'Portfolio';
  var ac = accentColor;
  var allSkills = [].concat(D.skills.tech || []).concat(D.skills.soft || []).concat(D.skills.lang || []);
  var isDark = darkMode;
  var skillDisplayMode = document.getElementById('skill-display') ? document.getElementById('skill-display').value : 'cloud';
  var bgEffect = document.getElementById('bg-effect') ? document.getElementById('bg-effect').value : 'mesh';
  var cursorType = document.getElementById('cursor-type') ? document.getElementById('cursor-type').value : 'dot';
  var heroStyleVal = document.getElementById('hero-style') ? document.getElementById('hero-style').value : 'default';
  var sectionDivider = document.getElementById('section-divider') ? document.getElementById('section-divider').value : 'line';
  var staggerOn = document.getElementById('stagger-on') ? document.getElementById('stagger-on').checked : true;
  var curAnim = animChoice;
  // Speed multiplier
  var speedMap = {
    slow: 1.4,
    normal: 0.7,
    fast: 0.35
  };
  var spd = speedMap[animSpeed] || 0.7;

  // Style configs
  var S = {
    noir: {
      bg: '#040406',
      bg2: '#0c0c10',
      bg3: '#14141a',
      text: '#f0ebe2',
      text2: '#786f62',
      hr: 'rgba(240,235,226,.06)',
      serif: "'Georgia',serif",
      sans: "'Outfit','Trebuchet MS',sans-serif",
      monoFont: "'JetBrains Mono',monospace"
    },
    solaire: {
      bg: '#f7f3ec',
      bg2: '#efe9e0',
      bg3: '#e5ddd2',
      text: '#0e0c0a',
      text2: '#6b5f50',
      hr: 'rgba(14,12,10,.08)',
      serif: "Georgia,serif",
      sans: "'Trebuchet MS',Geneva,sans-serif",
      monoFont: "'Courier New',monospace"
    },
    cyber: {
      bg: '#050a08',
      bg2: '#0a110e',
      bg3: '#0f1a14',
      text: '#d4ffe8',
      text2: '#4a7a5e',
      hr: 'rgba(0,229,160,.07)',
      serif: "'JetBrains Mono',monospace",
      sans: "'JetBrains Mono','Courier New',monospace",
      monoFont: "'JetBrains Mono',monospace"
    },
    mono: {
      bg: '#080808',
      bg2: '#111111',
      bg3: '#1a1a1a',
      text: '#f5f5f5',
      text2: '#777',
      hr: 'rgba(245,245,245,.08)',
      serif: "'Courier New',monospace",
      sans: "'Courier New',monospace",
      monoFont: "'Courier New',monospace"
    },
    aurora: {
      bg: '#0f0520',
      bg2: '#160930',
      bg3: '#1e0d3f',
      text: '#e8d5ff',
      text2: '#7a5a9a',
      hr: 'rgba(168,85,247,.07)',
      serif: "'Georgia',serif",
      sans: "'Outfit','Trebuchet MS',sans-serif",
      monoFont: "'JetBrains Mono',monospace"
    },
    slate: {
      bg: '#0f1412',
      bg2: '#161c1a',
      bg3: '#1c2421',
      text: '#c8d4cc',
      text2: '#5a6e64',
      hr: 'rgba(143,151,144,.08)',
      serif: "'Georgia',serif",
      sans: "'Outfit','Trebuchet MS',sans-serif",
      monoFont: "'JetBrains Mono',monospace"
    }
  };
  var c = S[portfolioStyle] || S.noir;

  // Font override
  var fontOverrides = {
    elegant: {
      serif: "'Playfair Display',Georgia,serif",
      sans: "'Outfit','Trebuchet MS',sans-serif"
    },
    mono: {
      serif: "'JetBrains Mono',monospace",
      sans: "'JetBrains Mono',monospace"
    },
    modern: {
      serif: "'Outfit',sans-serif",
      sans: "'Outfit',sans-serif"
    },
    serif: {
      serif: "Georgia,'Times New Roman',serif",
      sans: "Georgia,serif"
    }
  };
  if (fontOverrides[fontChoice]) {
    c.serif = fontOverrides[fontChoice].serif;
    c.sans = fontOverrides[fontChoice].sans;
  }

  // Skills HTML
  var skillCloud = '';
  if (skillDisplayMode === 'bars') {
    skillCloud = '<div style="display:flex;flex-direction:column;gap:12px;max-width:500px">';
    allSkills.slice(0, 12).forEach(function (s, i) {
      var pct = Math.floor(70 + Math.random() * 30);
      skillCloud += '<div><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:12px;font-family:' + c.monoFont + ';color:' + c.text + '">' + s + '</span><span style="font-size:11px;color:' + ac + '">' + pct + '%</span></div><div style="background:' + c.bg3 + ';border-radius:20px;height:4px;overflow:hidden"><div class="reveal" style="height:100%;width:' + pct + '%;background:' + ac + ';border-radius:20px;transition:width 1s ease ' + (.05 * i) + 's"></div></div></div>';
    });
    skillCloud += '</div>';
  } else if (skillDisplayMode === 'matrix') {
    skillCloud = '<div style="font-family:' + c.monoFont + ';display:flex;flex-direction:column;gap:6px">';
    allSkills.forEach(function (s, i) {
      skillCloud += '<div class="reveal sk-chip" style="animation-delay:' + (.05 * i) + 's"><span style="color:' + ac + ';margin-right:8px">' + String.fromCharCode(9654) + '</span>' + s + '</div>';
    });
    skillCloud += '</div>';
  } else {
    skillCloud = allSkills.map(function (s, i) {
      return '<span class="sk-chip reveal" style="animation-delay:' + (.06 * i).toFixed(2) + 's">' + s + '</span>';
    }).join('');
  }

  // Projects HTML
  var projHTML = D.projects.map(function (p, i) {
    var tech = (p.tech || '').split(',').filter(Boolean).map(function (t) {
      return '<span class="p-tech">' + t.trim() + '</span>';
    }).join('');
    var projUrl = p.url ? 'https://' + p.url.replace(/^https?:\/\//, '') : '';
    var inner = '<div class="proj-card reveal" style="animation-delay:' + (.12 * i).toFixed(2) + 's">' +
      '<div class="proj-num">0' + (i + 1) + '</div><div class="proj-body">' +
      '<div class="proj-name">' + p.name + (projUrl ? ' <span style="font-size:12px;opacity:.5">\u2197</span>' : '') + '</div>' +
      '<div class="proj-desc">' + p.desc + '</div>' +
      '<div class="proj-tech">' + tech + '</div>' +
      (projUrl ? '<span class="proj-link">\u2192 ' + p.url + '</span>' : '') +
      '</div></div>';
    return projUrl
      ? '<a href="' + projUrl + '" target="_blank" rel="noopener" style="text-decoration:none;display:block;color:inherit">' + inner + '</a>'
      : inner;
  }).join('');

  // Experience & Education
  var expHTML = D.experience.map(function (e, i) {
    var bullets = (e.bullets || '').split('\n').filter(Boolean).map(function (b) {
      return '<li>' + b + '</li>';
    }).join('');
    return '<div class="tl-row reveal" style="animation-delay:' + (.1 * i).toFixed(2) + 's"><div class="tl-dot"></div><div class="tl-body"><div class="tl-period">' + e.period + '</div><div class="tl-title">' + e.title + '</div><div class="tl-company">' + e.company + '</div>' + (bullets ? '<ul class="tl-ul">' + bullets + '</ul>' : '') + '</div></div>';
  }).join('');
  var eduHTML = D.education.map(function (e, i) {
    return '<div class="tl-row reveal" style="animation-delay:' + (.3 + .1 * i).toFixed(2) + 's"><div class="tl-dot" style="background:' + c.bg3 + ';border:2px solid ' + ac + '55"></div><div class="tl-body"><div class="tl-period">' + e.year + '</div><div class="tl-title">' + e.degree + '</div><div class="tl-company">' + e.school + '</div></div></div>';
  }).join('');

  // Contacts
  var contacts = [
    D.email && {
      icon: '✉',
      label: 'E-Mail',
      val: D.email,
      href: 'mailto:' + D.email
    },
    D.github && {
      icon: '◈',
      label: 'GitHub',
      val: D.github,
      href: 'https://' + D.github.replace(/^https?:\/\//, '')
    },
    D.linkedin && {
      icon: '◉',
      label: 'LinkedIn',
      val: D.linkedin,
      href: 'https://' + D.linkedin.replace(/^https?:\/\//, '')
    },
    D.website && {
      icon: '◎',
      label: 'Website',
      val: D.website,
      href: 'https://' + D.website.replace(/^https?:\/\//, '')
    },
    D.phone && {
      icon: '◻',
      label: 'Telefon',
      val: D.phone,
      href: 'tel:' + D.phone
    }
  ].filter(Boolean);
  var contactHTML = contacts.map(function (ct, i) {
    return '<a class="ct-item reveal" href="' + ct.href + '" style="animation-delay:' + (.08 * i).toFixed(2) + 's"><span class="ct-icon">' + ct.icon + '</span><div><div class="ct-lbl">' + ct.label + '</div><div class="ct-val">' + ct.val + '</div></div></a>';
  }).join('');

  // Background effects
  var bgEffectCSS = '';
  if (bgEffect === 'particles') {
    bgEffectCSS = '.hero-bg::after{content:"";position:absolute;inset:0;background-image:radial-gradient(circle at 20% 20%,' + ac + '15 1px,transparent 1px),radial-gradient(circle at 80% 80%,' + ac + '10 1px,transparent 1px),radial-gradient(circle at 50% 10%,' + ac + '08 1px,transparent 1px);background-size:60px 60px,80px 80px,40px 40px;animation:particleDrift 20s linear infinite;}';
  } else if (bgEffect === 'grid') {
    bgEffectCSS = '.hero-bg{background-image:linear-gradient(' + ac + '08 1px,transparent 1px),linear-gradient(90deg,' + ac + '08 1px,transparent 1px);background-size:40px 40px;background-position:center center;}';
  }

  // Cursor CSS
  var cursorCSS = '';
  if (cursorType === 'dot') {
    cursorCSS = 'body{cursor:none}.cursor{width:8px;height:8px;background:' + ac + ';border-radius:50%;position:fixed;pointer-events:none;z-index:9999;transition:transform .15s;mix-blend-mode:difference}.cursor-ring{width:32px;height:32px;border:1px solid ' + ac + '66;border-radius:50%;position:fixed;pointer-events:none;z-index:9998;mix-blend-mode:difference}';
  } else if (cursorType === 'crosshair') {
    cursorCSS = 'body{cursor:none}.cursor{width:20px;height:20px;border:1px solid ' + ac + ';position:fixed;pointer-events:none;z-index:9999;transform:translate(-50%,-50%)}.cursor::before,.cursor::after{content:"";position:absolute;background:' + ac + '}.cursor::before{width:1px;height:8px;left:50%;top:-4px}.cursor::after{height:1px;width:8px;top:50%;left:-4px}.cursor-ring{display:none}';
  }

  // Animation CSS — 8 modes
  var animDur = spd + 's';
  var animCSS = '';
  var animJS = '';
  if (curAnim === 'terminal') {
    animCSS = '.reveal{opacity:0}.reveal.vis{opacity:1}.hero-name .last,.hero-name>span>span{animation:none!important;opacity:1!important;transform:none!important}';
    animJS = 'var termChars=document.querySelectorAll(".hero-name,.hero-title,.hero-tag,.s-title");termChars.forEach(function(el){var orig=el.innerHTML;el.innerHTML="";var i=0;el.style.opacity=1;function type(){if(i<orig.length){el.innerHTML+=orig[i++];setTimeout(type,18+Math.random()*12);}};setTimeout(type,300);});';
  } else if (curAnim === 'glitch') {
    animCSS = '.hero-name{position:relative}.hero-name::before,.hero-name::after{content:attr(data-text);position:absolute;top:0;left:0;width:100%}.hero-name::before{color:' + ac + ';animation:glitch1 3s infinite}.hero-name::after{color:#60A5FA;animation:glitch2 3s infinite}@keyframes glitch1{0%,95%,100%{clip-path:none;transform:none}96%{clip-path:polygon(0 20%,100% 20%,100% 30%,0 30%);transform:translate(-3px)}97%{clip-path:polygon(0 60%,100% 60%,100% 70%,0 70%);transform:translate(3px)}}@keyframes glitch2{0%,95%,100%{clip-path:none;transform:none}97%{clip-path:polygon(0 40%,100% 40%,100% 50%,0 50%);transform:translate(3px)}98%{clip-path:polygon(0 80%,100% 80%,100% 90%,0 90%);transform:translate(-3px)}}';
  } else if (curAnim === 'fade') {
    animCSS = '.reveal{opacity:0;transition:opacity ' + animDur + ' ease}.reveal.vis{opacity:1;transform:none}';
  } else if (curAnim === 'bounce') {
    animCSS = '.reveal{opacity:0;transform:scale(.85) translateY(20px);transition:opacity ' + animDur + ' cubic-bezier(.34,1.56,.64,1),transform ' + animDur + ' cubic-bezier(.34,1.56,.64,1)}.reveal.vis{opacity:1;transform:none}';
  } else if (curAnim === 'zoom') {
    animCSS = '.reveal{opacity:0;transform:scale(.93);transition:opacity ' + animDur + ' ease,transform ' + animDur + ' cubic-bezier(.22,1,.36,1)}.reveal.vis{opacity:1;transform:scale(1)}';
  } else if (curAnim === 'slide') {
    animCSS = '.reveal{opacity:0;transform:translateX(-32px);transition:opacity ' + animDur + ' ease,transform ' + animDur + ' cubic-bezier(.22,1,.36,1)}.reveal.vis{opacity:1;transform:none}.reveal:nth-child(even){transform:translateX(32px)}.reveal.vis:nth-child(even){transform:none}';
  } else if (curAnim === 'neon') {
    animCSS = '.reveal{opacity:0;transition:opacity ' + animDur + ' ease,text-shadow ' + animDur + ' ease,box-shadow ' + animDur + ' ease}.reveal.vis{opacity:1}.section .s-title.reveal.vis{text-shadow:0 0 20px ' + ac + '66,0 0 60px ' + ac + '22}.sk-chip.reveal.vis:hover{box-shadow:0 0 16px ' + ac + '66}@keyframes neonPulse{0%,100%{text-shadow:0 0 10px ' + ac + '44}50%{text-shadow:0 0 30px ' + ac + '99,0 0 60px ' + ac + '44}}.hero-name{animation:neonPulse 3s ease-in-out infinite}';
  }

  // Hero entrance style
  var heroNameCSS = '.hero-name{font-family:' + c.serif + ';font-size:clamp(44px,7vw,90px);font-weight:900;line-height:.95;letter-spacing:-2px;margin-bottom:20px}';
  var heroNameHTML = '<span><span style="animation-delay:.3s">' + (D.fn || '') + '</span></span><span><span class="last" style="animation-delay:.45s">' + (D.ln || '') + '</span></span>';
  var heroNameJS = '';
  if (heroStyleVal === 'split') {
    heroNameCSS += '.hero-name .last{color:' + ac + ';display:block}.hero-name span{display:block;overflow:hidden}.hero-name span span{display:block;animation:slideUp .7s cubic-bezier(.4,0,.2,1) both}';
  } else if (heroStyleVal === 'typewriter') {
    heroNameCSS += '.hero-name .last{color:' + ac + '}.hero-name span{display:inline}.hero-name span span{display:inline}';
    heroNameJS = '(function(){var el=document.querySelector(".hero-name");if(!el)return;var txt=el.textContent;el.textContent="";el.style.opacity=1;var i=0;(function t(){if(i<txt.length){el.textContent+=txt[i++];setTimeout(t,60);}})();})();';
  } else if (heroStyleVal === 'blur') {
    heroNameCSS += '.hero-name{filter:blur(12px);opacity:0;transition:filter 1.2s ease,opacity 1.2s ease;animation:none!important}.hero-name span span{animation:none!important}.hero-name .last{color:' + ac + '}';
    heroNameJS = 'setTimeout(function(){var el=document.querySelector(".hero-name");if(el){el.style.opacity="1";el.style.filter="blur(0)"}},300);';
  } else if (heroStyleVal === 'scramble') {
    heroNameCSS += '.hero-name .last{color:' + ac + '}.hero-name span{display:inline}.hero-name span span{display:inline}';
    heroNameJS = '(function(){var el=document.querySelector(".hero-name"),orig=el?el.textContent.trim():"",chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@";if(!el)return;el.style.opacity=1;var iter=0;var interval=setInterval(function(){el.textContent=orig.split("").map(function(c,i){if(i<iter)return c;return chars[Math.floor(Math.random()*chars.length)];}).join("");iter+=1;if(iter>orig.length+2)clearInterval(interval);},55);})();';
  } else {
    // default
    heroNameCSS += '.hero-name .last{color:' + ac + ';display:block}.hero-name span{display:block;overflow:hidden}.hero-name span span{display:block;animation:slideUp .7s cubic-bezier(.4,0,.2,1) both}';
  }

  // Final color values — must be defined BEFORE sectionBorderTop uses them
  var finalBg = isDark ? c.bg : '#f4f1ec';
  var finalText = isDark ? c.text : '#0d0d12';
  var finalText2 = isDark ? c.text2 : '#5a5248';
  var finalHr = isDark ? c.hr : 'rgba(13,13,18,.08)';
  var finalBg2 = isDark ? c.bg2 : '#ebe6dd';
  var finalBg3 = isDark ? c.bg3 : '#ddd8ce';

  // Section divider CSS
  var sectionBorderTop = 'border-top:1px solid ' + finalHr;
  if (sectionDivider === 'gradient') {
    sectionBorderTop = 'border-top:none;background-image:linear-gradient(to right,transparent,' + ac + '30,transparent);background-size:100% 1px;background-repeat:no-repeat;background-position:top';
  } else if (sectionDivider === 'dots') {
    sectionBorderTop = 'border-top:none;background-image:radial-gradient(circle,' + finalHr + ' 1px,transparent 1px);background-size:6px 1px;background-repeat:repeat-x;background-position:top';
  } else if (sectionDivider === 'none') {
    sectionBorderTop = 'border-top:none';
  }

  var modeClass = isDark ? 'dark' : 'light';
  var modeVars = isDark ?
    '--bg:' + c.bg + ';--bg2:' + c.bg2 + ';--bg3:' + c.bg3 + ';--text:' + c.text + ';--text2:' + c.text2 + ';--hr:' + c.hr :
    '--bg:#f4f1ec;--bg2:#ebe6dd;--bg3:#ddd8ce;--text:#0d0d12;--text2:#5a5248;--hr:rgba(13,13,18,.08)';

  return '<!DOCTYPE html><html lang="de" data-mode="' + (isDark ? 'dark' : 'light') + '"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + name + '</title>' +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">' +
    '<style>*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}' +
    'body{background:' + finalBg + ';color:' + finalText + ';font-family:' + c.sans + ';overflow-x:hidden}' +
    '::selection{background:' + ac + ';color:' + finalBg + '}' +
    '::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:' + ac + '44;border-radius:2px}' +
    cursorCSS + animCSS + bgEffectCSS +

    // Nav
    'nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:18px 48px;display:flex;align-items:center;justify-content:space-between;background:' + finalBg + 'cc;backdrop-filter:blur(20px);border-bottom:1px solid ' + finalHr + '}' +
    '.nav-logo{font-family:' + c.serif + ';font-size:18px;font-weight:900;letter-spacing:2px;color:' + finalText + '}' +
    '.nav-links{display:flex;gap:28px}.nav-links a{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:' + finalText2 + ';text-decoration:none;transition:color .2s}.nav-links a:hover{color:' + ac + '}' +
    '.nav-dot{position:fixed;right:24px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:8px;z-index:100}' +
    '.nd{width:6px;height:6px;border-radius:50%;background:' + finalText2 + ';opacity:.3;cursor:pointer;transition:all .2s}.nd.a{background:' + ac + ';opacity:1;transform:scale(1.4)}' +

    // Hero
    '.hero{min-height:100vh;display:flex;align-items:center;padding:100px 10vw 80px;position:relative;overflow:hidden}' +
    '.hero-bg{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 50% 70% at 85% 50%,' + ac + '09 0,transparent 60%)}' +
    '.hero-content{max-width:680px;position:relative;z-index:1}' +
    '.hero-pre{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:' + ac + ';margin-bottom:28px;opacity:0;animation:fi .8s .2s both;font-family:' + c.monoFont + '}' +
    heroNameCSS +
    '.hero-title{font-size:16px;color:' + finalText2 + ';font-weight:300;margin-bottom:28px;opacity:0;animation:fi .8s .7s both}' +
    (D.tagline ? '.hero-tag{font-family:' + c.serif + ';font-size:clamp(16px,2.2vw,24px);font-style:italic;color:' + ac + ';margin-bottom:36px;opacity:0;animation:fi .8s .9s both}' : '') +
    '.hero-cta{display:flex;gap:12px;flex-wrap:wrap;opacity:0;animation:fi .8s 1.1s both}' +
    '.btn-hero{padding:13px 30px;font-family:' + c.sans + ';font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;transition:all .2s}' +
    '.btn-hero.fill{background:' + ac + ';color:' + finalBg + ';border:none}.btn-hero.fill:hover{filter:brightness(1.15);transform:translateY(-2px);box-shadow:0 10px 32px ' + ac + '44}' +
    '.btn-hero.line{background:transparent;color:' + finalText + ';border:1px solid ' + finalHr + '}.btn-hero.line:hover{border-color:' + ac + '88;color:' + ac + '}' +
    '.scroll-ind{position:absolute;bottom:32px;left:10vw;display:flex;align-items:center;gap:12px;opacity:0;animation:fi 1s 1.6s both}' +
    '.scroll-ind span{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:' + finalText2 + ';font-family:' + c.monoFont + '}' +
    '.scroll-line{width:40px;height:1px;background:' + finalHr + ';position:relative;overflow:hidden}' +
    '.scroll-line::after{content:"";position:absolute;left:-100%;top:0;width:100%;height:100%;background:' + ac + ';animation:scanLine 2s ease-in-out infinite}' +
    '@keyframes scanLine{0%{left:-100%}100%{left:200%}}' +

    // Terminal badge (only for cyber style or terminal animation)
    (portfolioStyle === 'cyber' || curAnim === 'terminal' ? '.term-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(0,229,160,.06);border:1px solid rgba(0,229,160,.15);border-radius:4px;padding:6px 14px;font-family:' + c.monoFont + ';font-size:11px;color:' + ac + ';margin-bottom:20px;letter-spacing:1px}.term-badge-dot{width:6px;height:6px;border-radius:50%;background:' + ac + ';animation:blink2 1s step-end infinite}@keyframes blink2{0%,100%{opacity:1}50%{opacity:0}}' : '') +

    // Sections — use dynamic section border
    '.section{padding:90px 10vw;' + sectionBorderTop + '}' +
    '.s-label{font-size:10px;letter-spacing:4px;text-transform:uppercase;color:' + ac + ';margin-bottom:14px;font-weight:500;font-family:' + c.monoFont + '}' +
    '.s-title{font-family:' + c.serif + ';font-size:clamp(26px,3.8vw,50px);font-weight:800;margin-bottom:44px;line-height:1.1}' +

    // Scroll reveal base (overridden by animCSS for non-reveal modes)
    '.reveal{opacity:0;transform:translateY(22px);transition:opacity ' + animDur + ' cubic-bezier(.4,0,.2,1),transform ' + animDur + ' cubic-bezier(.4,0,.2,1)}.reveal.vis{opacity:1;transform:none}' +

    // Skills
    '.skills-cloud{display:flex;flex-wrap:wrap;gap:10px}' +
    '.sk-chip{padding:7px 16px;border:1px solid ' + finalHr + ';border-radius:24px;font-size:13px;cursor:default;transition:all .25s;font-family:' + (portfolioStyle === 'cyber' || portfolioStyle === 'mono' ? c.monoFont : c.sans) + ';color:' + finalText2 + '}' +
    '.sk-chip:hover{border-color:' + ac + ';color:' + ac + ';background:' + ac + '0d;transform:translateY(-2px);box-shadow:0 6px 20px ' + ac + '22}' +

    // Projects
    '.proj-grid{display:grid;gap:2px}' +
    '.proj-card{display:grid;grid-template-columns:64px 1fr;gap:0;background:' + finalBg2 + ';border:1px solid ' + finalHr + ';overflow:hidden;cursor:pointer;transition:border-color .2s,background .2s}' +
    '.proj-card:hover{border-color:' + ac + '44;background:' + finalBg3 + '}' +
    '.proj-num{font-family:' + c.serif + ';font-size:30px;font-weight:900;color:' + finalText2 + ';opacity:.2;display:flex;align-items:center;justify-content:center;padding:24px 0;transition:opacity .2s,color .2s;border-right:1px solid ' + finalHr + '}' +
    '.proj-card:hover .proj-num{opacity:.8;color:' + ac + '}' +
    '.proj-body{padding:22px 26px}.proj-name{font-family:' + c.serif + ';font-size:19px;font-weight:700;margin-bottom:7px;transition:color .2s}' +
    '.proj-card:hover .proj-name{color:' + ac + '}.proj-desc{font-size:12px;color:' + finalText2 + ';line-height:1.7;margin-bottom:10px}' +
    '.proj-tech{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px}.p-tech{font-size:10px;font-family:' + c.monoFont + ';background:' + ac + '12;color:' + ac + ';padding:2px 8px;border-radius:3px}' +
    '.proj-link{font-size:11px;color:' + finalText2 + ';text-decoration:none;letter-spacing:.5px;transition:color .2s;font-family:' + c.monoFont + '}.proj-link:hover{color:' + ac + '}' +

    // Timeline
    '.tl-wrap{position:relative;padding-left:28px}.tl-wrap::before{content:"";position:absolute;left:7px;top:6px;bottom:6px;width:1px;background:' + finalHr + '}' +
    '.tl-row{position:relative;margin-bottom:34px;display:flex;gap:18px;align-items:flex-start}' +
    '.tl-dot{width:14px;height:14px;border-radius:50%;background:' + ac + ';flex-shrink:0;margin-top:4px;box-shadow:0 0 0 4px ' + ac + '22}' +
    '.tl-period{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:' + ac + ';margin-bottom:5px;font-family:' + c.monoFont + '}' +
    '.tl-title{font-size:15px;font-weight:600;margin-bottom:3px}.tl-company{font-size:12px;color:' + finalText2 + ';margin-bottom:8px}' +
    '.tl-ul{padding-left:14px;font-size:11px;color:' + finalText2 + ';line-height:2;font-family:' + c.monoFont + '}' +

    // About
    '.bio-text{font-size:17px;font-weight:300;line-height:1.9;color:' + finalText + ';max-width:640px;margin-bottom:32px}' +
    '.bio-text::first-letter{font-family:' + c.serif + ';font-size:50px;font-weight:700;color:' + ac + ';float:left;line-height:.85;margin:6px 10px 0 0}' +
    '.hl-block{border-left:3px solid ' + ac + ';padding:14px 22px;background:' + ac + '07;margin-top:22px;font-family:' + c.serif + ';font-size:17px;font-style:italic;color:' + finalText2 + ';line-height:1.6}' +

    // Contact
    '.ct-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px}' +
    '.ct-item{display:flex;align-items:center;gap:14px;padding:18px 22px;background:' + finalBg2 + ';border:1px solid ' + finalHr + ';border-radius:4px;text-decoration:none;color:inherit;transition:all .2s}' +
    '.ct-item:hover{border-color:' + ac + '44;background:' + finalBg3 + ';transform:translateY(-2px)}' +
    '.ct-icon{font-size:20px;color:' + ac + ';width:24px;text-align:center}.ct-lbl{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:' + finalText2 + ';margin-bottom:2px;font-family:' + c.monoFont + '}' +
    '.ct-val{font-size:12px;color:' + finalText + '}' +

    // Footer
    'footer{padding:44px 10vw;border-top:1px solid ' + finalHr + ';display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px}' +
    '.foot-name{font-family:' + c.serif + ';font-size:20px;font-weight:800;letter-spacing:2px}' +
    '.foot-cr{font-size:11px;color:' + finalText2 + ';letter-spacing:1px;font-family:' + c.monoFont + '}' +

    // Keyframes
    '@keyframes fi{from{opacity:0}to{opacity:1}}' +
    '@keyframes slideUp{from{transform:translateY(105%)}to{transform:none}}' +
    '@keyframes particleDrift{0%{background-position:0 0,0 0,0 0}100%{background-position:60px 60px,80px 80px,40px 40px}}' +

    // Print/responsive
    '@media print{nav,.nav-dot,.cursor,.cursor-ring{display:none!important}.section{break-inside:avoid}.hero{min-height:auto;padding:60px 32px}.reveal{opacity:1!important;transform:none!important}}' +
    '@media(max-width:768px){.nav-links{display:none}nav{padding:14px 20px}.section{padding:60px 6vw}.hero{padding:90px 6vw 60px}}' +
    '</style></head><body>' +

    // Cursor elements
    (cursorType !== 'none' ? '<div class="cursor" id="cur"></div><div class="cursor-ring" id="cring"></div>' : '') +

    // Nav
    '<nav><div class="nav-logo">' + name + '</div><div class="nav-links">' +
    (D.bio ? '<a href="#sec-about">Über mich</a>' : '') +
    (allSkills.length ? '<a href="#sec-skills">Skills</a>' : '') +
    (D.projects.length ? '<a href="#sec-projekte">Projekte</a>' : '') +
    (D.experience.length || D.education.length ? '<a href="#sec-karriere">Karriere</a>' : '') +
    (contacts.length ? '<a href="#sec-kontakt">Kontakt</a>' : '') +
    '</div></nav>' +

    // Dot nav
    '<div class="nav-dot">' + ['hero', 'about', 'skills', 'projekte', 'karriere', 'kontakt'].map(function (s, i) {
      return '<div class="nd" id="nd' + i + '" onclick="document.getElementById(\'sec-' + s + '\')&&document.getElementById(\'sec-' + s + '\').scrollIntoView({behavior:\'smooth\'})" title="' + s + '"></div>';
    }).join('') +
    '</div>' +

    // HERO
    '<section id="sec-hero" class="hero"><div class="hero-bg"></div><div class="hero-content">' +
    (portfolioStyle === 'cyber' || curAnim === 'terminal' ? '<div class="term-badge"><div class="term-badge-dot"></div>system.online · portfolio.exe</div>' : '<div class="hero-pre">Portfolio · ' + (D.location || '') + '</div>') +
    '<h1 class="hero-name" data-text="' + (D.fn || '') + ' ' + (D.ln || '') + '">' + heroNameHTML + '</h1>' +
    '<div class="hero-title">' + (D.title || '') + '</div>' +
    (D.tagline ? '<div class="hero-tag">&ldquo;' + D.tagline + '&rdquo;</div>' : '') +
    '<div class="hero-cta">' +
    (contacts[0] ? '<a href="' + contacts[0].href + '"><button class="btn-hero fill">Kontakt aufnehmen</button></a>' : '') +
    (D.projects.length ? '<button class="btn-hero line" onclick="document.getElementById(\'sec-projekte\').scrollIntoView({behavior:\'smooth\'})">Projekte ansehen</button>' : '') +
    '</div></div>' +
    '<div class="scroll-ind"><span>Scroll</span><div class="scroll-line"></div></div>' +
    '</section>' +

    // ABOUT
    (D.bio ? '<section id="sec-about" class="section"><div class="s-label">Über mich</div><div class="s-title">Wer ich bin.</div><div class="bio-text reveal">' + D.bio + '</div>' + (D.highlight ? '<div class="hl-block reveal">&ldquo;' + D.highlight + '&rdquo;</div>' : '') + '</section>' : '') +

    // SKILLS
    (allSkills.length ? '<section id="sec-skills" class="section"><div class="s-label">Kompetenzen</div><div class="s-title">Was ich kann.</div><div class="skills-cloud">' + skillCloud + '</div></section>' : '') +

    // PROJECTS
    (D.projects.length ? '<section id="sec-projekte" class="section"><div class="s-label">Ausgewählte Projekte</div><div class="s-title">Was ich gebaut habe.</div><div class="proj-grid">' + projHTML + '</div></section>' : '') +

    // KARRIERE
    ((D.experience.length || D.education.length) ? '<section id="sec-karriere" class="section"><div class="s-label">Karriere & Bildung</div><div class="s-title">Mein Weg.</div><div class="tl-wrap">' + expHTML + eduHTML + '</div></section>' : '') +

    // KONTAKT
    (contacts.length ? '<section id="sec-kontakt" class="section"><div class="s-label">Kontakt</div><div class="s-title">Lass uns reden.</div><div class="ct-grid">' + contactHTML + '</div></section>' : '') +

    // FOOTER
    '<footer><div class="foot-name">' + name + '</div><div class="foot-cr">' + (D.title || '') + (D.location ? ' · ' + D.location : '') + '</div></footer>' +

    // JS
    '<script>' +
    // Cursor
    (cursorType !== 'none' ? '(function(){var cur=document.getElementById("cur"),ring=document.getElementById("cring"),mx=0,my=0,rx=0,ry=0;document.addEventListener("mousemove",function(e){mx=e.clientX;my=e.clientY;cur.style.left=mx-' + (cursorType === 'crosshair' ? 10 : 4) + '+"px";cur.style.top=my-' + (cursorType === 'crosshair' ? 10 : 4) + '+"px"});function animRing(){rx+=(mx-rx)*.1;ry+=(my-ry)*.1;if(ring){ring.style.left=rx-16+"px";ring.style.top=ry-16+"px"}requestAnimationFrame(animRing)}animRing();document.querySelectorAll("a,button").forEach(function(el){el.addEventListener("mouseenter",function(){cur.style.transform="scale(2.5)"});el.addEventListener("mouseleave",function(){cur.style.transform=""})});})();' : '') +
    // Scroll reveal + optional stagger
    '(function(){var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){' +
    (staggerOn ? 'var idx=Array.from(e.target.parentNode.children).indexOf(e.target);e.target.style.transitionDelay=(idx*0.07)+"s";' : '') + 'e.target.classList.add("vis")}})},{threshold:.08});document.querySelectorAll(".reveal").forEach(function(el){obs.observe(el)});})();' +
    // Dot nav
    '(function(){var secs=["hero","about","skills","projekte","karriere","kontakt"];var obs2=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){var i=secs.indexOf(e.target.id.replace("sec-",""));document.querySelectorAll(".nd").forEach(function(d){d.classList.remove("a")});var nd=document.getElementById("nd"+i);if(nd)nd.classList.add("a")}})},{threshold:.35});secs.forEach(function(s){var el=document.getElementById("sec-"+s);if(el)obs2.observe(el)});})();' +
    // Terminal typing animation
    (curAnim === 'terminal' ? animJS : '') +
    // Hero name JS (typewriter, blur-focus, scramble)
    heroNameJS +
    '<\/script></body></html>';
}

// ═══ INIT ═══
buildSwatches();
