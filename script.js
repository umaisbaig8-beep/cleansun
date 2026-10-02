/* =========================================================
   CLEAN SUN — shared site script
   Works across index.html / why.html / technology.html / contact.html
   Each init function checks for its own DOM elements first, so this
   one file can be safely included on every page.
   ========================================================= */

/* ---------- DATA (used by interactive widgets) ---------- */
const panelLayers = [
  { label: 'Outer glass', desc: 'Toughened architectural glass designed for outdoor exposure.' },
  { label: 'Photovoltaic layer', desc: 'Transparent photovoltaic cells convert sunlight into electricity.' },
  { label: 'Inner glass', desc: 'Laminated inner glass for structural integrity and safety.' },
  { label: 'Frame', desc: 'Architectural frame for installation and weather sealing.' },
];

/* ---------- HELPERS ---------- */
const wattsFor = (transparency) => Math.round(624 * (1 - transparency / 100));

function cellGridHTML(transparencyPct) {
  const frac = transparencyPct / 100;
  let html = '';
  for (let i = 0; i < 56; i++) {
    const visibleAt = ((i % 7) + Math.floor(i / 7)) / 14;
    const show = visibleAt > frac * 0.95;
    html += `<div class="cell" style="background:${show ? 'linear-gradient(135deg,#1a1a1a,#2a2a2a)' : 'rgba(255,255,255,.04)'};box-shadow:${show ? 'inset 0 0 0 1px rgba(244,97,21,.2)' : 'inset 0 0 0 1px rgba(255,255,255,.06)'};opacity:${show ? 1 : .4}"></div>`;
  }
  return html;
}

/* ---------- REVEAL ON SCROLL ---------- */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '-40px' });
  els.forEach((el, i) => { el.style.transitionDelay = `${Math.min(i % 6, 5) * 0.06}s`; io.observe(el); });
}

/* ---------- HOME: SIMULATOR ---------- */
function initSimulator() {
  const range = document.getElementById('simRange');
  if (!range) return;
  const presetsEl = document.getElementById('simPresets');
  const presets = [{ t: 0, w: 624 }, { t: 20, w: 500 }, { t: 40, w: 374 }, { t: 60, w: 250 }];

  function update(t) {
    const w = wattsFor(t);
    document.getElementById('simCells').innerHTML = cellGridHTML(t);
    document.getElementById('simWatts').textContent = `${w} W`;
    document.getElementById('simBigWatts').innerHTML = `${w}<span style="font-size:1.2rem;color:var(--mute);margin-left:.25rem;">W</span>`;
    document.getElementById('simPct').textContent = `${t}%`;
    document.getElementById('simBar').style.width = `${Math.min(100, (w / 624) * 100)}%`;
    range.style.setProperty('--val', `${(t / 60) * 100}%`);
    presetsEl.querySelectorAll('.preset-btn').forEach(b => b.classList.toggle('active', Number(b.dataset.t) === t));
  }

  presetsEl.innerHTML = presets.map(p => `<button class="preset-btn" data-t="${p.t}"><div class="preset-t">${p.t}% transparency</div><div class="preset-w">${p.w} W</div></button>`).join('');
  presetsEl.querySelectorAll('.preset-btn').forEach(b => b.addEventListener('click', () => { range.value = b.dataset.t; update(Number(b.dataset.t)); }));
  range.addEventListener('input', () => update(Number(range.value)));
  update(20);
}

/* ---------- TECHNOLOGY: EXPLODED PANEL ---------- */
function initExploded() {
  const layersEl = document.getElementById('explodedLayers');
  if (!layersEl) return;
  let openIdx = 0;
  const listEl = document.getElementById('layerListButtons');

  function renderLayers() {
    layersEl.innerHTML = panelLayers.map((l, i) => `
      <button class="layer-btn ${i === openIdx ? 'active' : ''}" data-i="${i}" style="transform:translateY(${i === openIdx ? '10px' : openIdx !== null ? '-4px' : '0'}); opacity:${openIdx !== null && openIdx !== i ? .45 : 1};">
        <div class="layer-top"><div class="layer-left"><span class="layer-num">0${i + 1}</span><span class="layer-name">${l.label}</span></div><span>${i === openIdx ? '–' : '+'}</span></div>
        <div class="layer-desc">${l.desc}</div>
      </button>`).join('');
    listEl.innerHTML = panelLayers.map((l, i) => `
      <button class="layer-list-btn ${i === openIdx ? 'active' : ''}" data-i="${i}">
        <span style="display:flex;align-items:center;gap:.6rem;"><span class="layer-num" style="background:${i === openIdx ? 'var(--orange)' : 'rgba(244,97,21,.1)'};color:${i === openIdx ? '#fff' : 'var(--orange)'};">0${i + 1}</span><span style="font-weight:500;">${l.label}</span></span><span>↗</span>
      </button>`).join('');
    document.querySelectorAll('#explodedLayers .layer-btn, #layerListButtons .layer-list-btn').forEach(b => {
      b.addEventListener('click', () => { const i = Number(b.dataset.i); openIdx = openIdx === i ? null : i; renderLayers(); });
    });
  }
  renderLayers();
}

/* ---------- TECHNOLOGY: CONFIGURATOR ---------- */
function initConfigurator() {
  const cW = document.getElementById('cW');
  if (!cW) return;
  const cH = document.getElementById('cH'), cT = document.getElementById('cT');
  const cGlass = document.getElementById('cGlass'), cFrame = document.getElementById('cFrame'), cQty = document.getElementById('cQty');

  function update() {
    const w = Number(cW.value), h = Number(cH.value), t = Number(cT.value), qty = Math.max(1, Number(cQty.value) || 1);
    document.getElementById('wVal').textContent = w;
    document.getElementById('hVal').textContent = h;
    document.getElementById('tVal').textContent = t;
    cW.style.setProperty('--val', `${((w - 2) / 10) * 100}%`);
    cH.style.setProperty('--val', `${((h - 2) / 8) * 100}%`);
    cT.style.setProperty('--val', `${(t / 60) * 100}%`);

    const wattsPanel = wattsFor(t);
    const totalW = wattsPanel * qty;
    document.getElementById('configPanel').style.aspectRatio = `${w} / ${h}`;
    document.getElementById('configCells').innerHTML = cellGridHTML(t);
    document.getElementById('configFrame').textContent = cFrame.value;
    document.getElementById('configWatts').textContent = `${wattsPanel} W`;
    document.getElementById('configDims').textContent = `${w} × ${h} ft · ${qty} pcs`;
    document.getElementById('metricWattsPanel').textContent = `${wattsPanel} W`;
    document.getElementById('metricTotalW').textContent = `${(totalW / 1000).toFixed(2)} kW`;
    document.getElementById('metricArea').textContent = `${w * h} ft²`;
    document.getElementById('metricT').textContent = `${t}%`;
  }
  [cW, cH, cT, cGlass, cFrame, cQty].forEach(el => el.addEventListener('input', update));
  update();
}

/* ---------- CONTACT ---------- */
/* The contact page now links straight to WhatsApp / email in the HTML
   (no form, no JS needed) — nothing to initialize here. */
function initContactForm() {}

/* ---------- NAVBAR / MOBILE MENU ---------- */
function initChrome() {
  const navbar = document.getElementById('navbar');
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  window.addEventListener('scroll', () => { navbar.classList.toggle('scrolled', window.scrollY > 24); }, { passive: true });
  menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  mobileMenu.querySelectorAll('.mobile-link, .mobile-cta').forEach(el => {
    el.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* ---------- BOOT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initChrome();
  initReveal();
  initSimulator();
  initExploded();
  initConfigurator();
  initContactForm();
});
