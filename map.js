/* Acacia Climbing Coalition — Crag Map Logic */

/* ════════════════════════════════════════════════════════════
   CONFIG — paste your Google Sheets CSV URLs here
════════════════════════════════════════════════════════════ */
const SHEETS = {
  crags:      'https://docs.google.com/spreadsheets/d/e/2PACX-1vS6CIymbHLOnMBnVOeFpDD1rBWtSjZqPbS5dYDEc-_3NQvBV-f89M9xrRiDeKBS8aiDTXwiC37yjAOS/pub?gid=0&single=true&output=csv',
  milestones: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS6CIymbHLOnMBnVOeFpDD1rBWtSjZqPbS5dYDEc-_3NQvBV-f89M9xrRiDeKBS8aiDTXwiC37yjAOS/pub?gid=577633604&single=true&output=csv',
};

/* ════════════════════════════════════════════════════════════
   STATES CONFIG
   Centre + zoom for each state's map view.
   Boundaries are drawn from states.geojson.
   active: true = shows crags, false = coming soon
════════════════════════════════════════════════════════════ */
const STATES = [
  { id: 'QLD', name: 'Queensland',         active: true,  center: [-22.0, 145.0], zoom: 6 },
  { id: 'NSW', name: 'New South Wales',    active: false, center: [-32.5, 147.0], zoom: 6 },
  { id: 'VIC', name: 'Victoria',           active: false, center: [-37.0, 144.5], zoom: 7 },
  { id: 'SA',  name: 'South Australia',    active: false, center: [-30.0, 135.5], zoom: 6 },
  { id: 'WA',  name: 'Western Australia',  active: false, center: [-26.0, 121.0], zoom: 5 },
  { id: 'TAS', name: 'Tasmania',           active: false, center: [-42.0, 146.5], zoom: 7 },
  { id: 'NT',  name: 'Northern Territory', active: false, center: [-19.5, 133.0], zoom: 6 },
  { id: 'ACT', name: 'ACT',                active: false, center: [-35.5, 149.0], zoom: 9 },
];

/* ════════════════════════════════════════════════════════════
   STATUS CONFIG
════════════════════════════════════════════════════════════ */
const STATUS = {
  active:   { size: 28 },
  progress: { size: 24 },
  scoping:  { size: 20 },
};

/* ════════════════════════════════════════════════════════════
   MAP INIT
════════════════════════════════════════════════════════════ */
const map = L.map('map', {
  center: [-27.0, 134.0],
  zoom: 4,
  zoomControl: false,
  minZoom: 3,
});
L.control.zoom({ position:'bottomleft' }).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com">CARTO</a>',
  subdomains:'abcd', maxZoom:19
}).addTo(map);

/* ════════════════════════════════════════════════════════════
   STATE — POLYGON LAYERS (from states.geojson in repo)

   states.geojson maps these name properties to state IDs:
   "Queensland" → QLD, "New South Wales" → NSW, etc.
════════════════════════════════════════════════════════════ */
const statePolygons = {};

const STATE_NAME_MAP = {
  'Queensland':            'QLD',
  'New South Wales':       'NSW',
  'Victoria':              'VIC',
  'South Australia':       'SA',
  'Western Australia':     'WA',
  'Tasmania':              'TAS',
  'Northern Territory':    'NT',
  'Australian Capital Territory': 'ACT',
};

function getStateConfig(stateId) {
  return STATES.find(s => s.id === stateId);
}

function renderStatePolygons(geojson) {
  L.geoJSON(geojson, {
    style: function(feature) {
      const stateId = STATE_NAME_MAP[feature.properties.STATE_NAME] ||
                      STATE_NAME_MAP[feature.properties.name] ||
                      STATE_NAME_MAP[feature.properties.NAME];
      const cfg = getStateConfig(stateId);
      const isActive = cfg ? cfg.active : false;
      return {
        color:       isActive ? '#2D5016' : '#444441',
        weight:      isActive ? 2.5       : 2.0,
        opacity:     isActive ? 0.8       : 0.85,
        fillColor:   isActive ? '#2D5016' : '#444441',
        fillOpacity: isActive ? 0.10      : 0.28,
      };
    },
    onEachFeature: function(feature, layer) {
      const stateId = STATE_NAME_MAP[feature.properties.STATE_NAME] ||
                      STATE_NAME_MAP[feature.properties.name] ||
                      STATE_NAME_MAP[feature.properties.NAME];
      const cfg = getStateConfig(stateId);
      if (!cfg) return;

      statePolygons[cfg.id] = layer;

      layer.on('mouseover', function() {
        this.setStyle({ fillOpacity: cfg.active ? 0.22 : 0.38, weight: cfg.active ? 3 : 2 });
        this.getElement().style.cursor = 'pointer';
      });
      layer.on('mouseout', function() {
        this.setStyle({ fillOpacity: cfg.active ? 0.10 : 0.28, weight: cfg.active ? 2.5 : 2.0 });
      });

      const popupContent = `
        <div class="state-popup">
          <div class="state-popup-name">${cfg.name}</div>
          ${cfg.active
            ? `<span class="state-popup-link" onclick="map.closePopup();selectState('${cfg.id}')">View crags →</span>`
            : `<span class="state-popup-soon">Coming soon — ACC is expanding nationally</span>`
          }
        </div>`;

      layer.bindPopup(popupContent, { maxWidth:220 });
      layer.on('click', function() {
        this.openPopup();
      });
    }
  }).addTo(map);
}

fetch('states.geojson')
  .then(r => r.json())
  .then(geojson => renderStatePolygons(geojson))
  .catch(err => console.error('Could not load states.geojson', err));

/* ════════════════════════════════════════════════════════════
   CRAG DATA — CSV PARSER + FETCH
════════════════════════════════════════════════════════════ */
let allCrags = [];
let allMilestones = [];
const cragMarkers = {};
const cragMarkerLayer = L.layerGroup().addTo(map);

async function loadData() {
  const [cr, mr] = await Promise.all([
    fetch('data/crags.json').then(r => r.json()),
    fetch('data/milestones.json').then(r => r.json()),
  ]);
  allCrags      = cr;
  allMilestones = mr;
  renderAustraliaView();
  renderCragMarkers();
  document.getElementById('loadingView').style.display = 'none';
  document.getElementById('australiaView').classList.add('visible');
}

/* ════════════════════════════════════════════════════════════
   CRAG MARKERS — hidden at Australia view, shown on QLD
   Also auto-show on zoom >= 7 without requiring state click
════════════════════════════════════════════════════════════ */

// Zoom threshold at which crag markers auto-appear
const CRAG_ZOOM_THRESHOLD = 7;

map.on('zoom', function() {
  const z = map.getZoom();
  if (z >= CRAG_ZOOM_THRESHOLD) {
    if (!map.hasLayer(cragMarkerLayer)) {
      cragMarkerLayer.addTo(map);
    }
    // If no state is selected yet, auto-select QLD when zoomed in
    if (!currentState) {
      const center = map.getCenter();
      // Find which state polygon contains the map center
      STATES.forEach(s => {
        const p = statePolygons[s.id];
        if (p && s.active) {
          // Show markers but don't change sidebar unless user clicks
        }
      });
    }
  } else {
    // Only hide markers if we're back at Australia overview level
    if (!currentState || !currentState.active) {
      if (map.hasLayer(cragMarkerLayer)) {
        map.removeLayer(cragMarkerLayer);
      }
    }
  }
});
function openCragPopup(id) {
  if (window.innerWidth <= 700) {
    selectCrag(id);
    return;
  }
  const marker = cragMarkers[id];
  if (!marker) return;
  map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 13), { duration: 0.6 });
  marker.openPopup();
}

function markerIcon(crag, active = false) {
  const s = (STATUS[crag.status] || STATUS.scoping).size;
  const pulse = crag.status === 'progress' ? `<div class="marker-pulse"></div>` : '';
  return L.divIcon({
    className: `status-${crag.status}`,
    html: `<div class="marker-dot${active ? ' active' : ''}" style="width:${s}px;height:${s}px;">${pulse}</div>`,
    iconSize: [s, s], iconAnchor: [s / 2, s / 2], popupAnchor: [0, -(s / 2) - 6],
  });
}

function renderCragMarkers() {
  cragMarkerLayer.clearLayers();
  allCrags.forEach(crag => {
    const marker = L.marker([crag.lat, crag.lng], { icon: markerIcon(crag) });
    const popupMilestones = allMilestones.filter(m => m.crag_id === crag.id);
    const popupProgress = popupMilestones.length
      ? Math.round(popupMilestones.filter(m => m.status === 'done').length / popupMilestones.length * 100)
      : 0;
    marker.bindPopup(`
      <div class="acc-popup status-${crag.status}">
        <div class="acc-popup-pill">
          <div class="status-dot"></div>
          ${crag.statusLabel}
        </div>
        <div class="acc-popup-name">${crag.name}</div>
        <div class="acc-popup-loc">${crag.subtitle}</div>
        <div class="acc-popup-bar-bg"><div class="acc-popup-bar-fill" style="width:${popupProgress}%;"></div></div>
        <span class="acc-popup-link" onclick="map.closePopup();selectCrag('${crag.id}')">View details →</span>
      </div>`, { maxWidth: 260 });
    marker.on('mouseover', () => marker.setIcon(markerIcon(crag, true)));
    marker.on('mouseout',  () => marker.setIcon(markerIcon(crag, false)));
    marker.on('click',     () => marker.openPopup());
    marker.addTo(cragMarkerLayer);
    cragMarkers[crag.id] = marker;
  });
  // Start hidden — only show when QLD is selected
  map.removeLayer(cragMarkerLayer);
}

/* ════════════════════════════════════════════════════════════
   VIEW MANAGEMENT
   Three levels: Australia → State → Crag
════════════════════════════════════════════════════════════ */
let currentState = null;

function showOnly(viewId) {
  ['loadingView','australiaView','stateView','comingSoon','detailPanel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'none';
      el.classList.remove('visible');
    }
  });
  const target = document.getElementById(viewId);
  if (target) {
    target.style.display = 'flex';
    target.classList.add('visible');
  }
}

/* ── AUSTRALIA VIEW ── */
function renderAustraliaView() {
  const el = document.getElementById('australiaView');
  el.innerHTML = STATES.map(s => `
    <div class="state-item ${s.active ? '' : ''}" onclick="selectState('${s.id}')">
      <div>
        <div class="state-name">${s.name}</div>
      </div>
      <div class="state-item-actions">
        <div class="state-badge ${s.active ? 'badge-active-state' : 'badge-soon'}">${s.active ? 'Active' : 'Coming Soon'}</div>
        <div class="state-arrow">›</div>
      </div>
    </div>`).join('');
}

function goAustralia() {
  currentState = null;
  showOnly('australiaView');
  document.getElementById('sidebarEyebrow').textContent = 'Select a state';
  document.getElementById('sidebarTitle').textContent   = 'Australian Climbing Access';
  document.getElementById('sidebarIntro').textContent   = 'ACC is building the access and guidebook infrastructure for Australian bouldering. Select a state to see what\'s active.';
  document.getElementById('sidebarNav').style.display   = 'none';
  updateBreadcrumb('australia');
  map.flyTo([-27.0, 134.0], 4, { duration:1.0 });
  map.removeLayer(cragMarkerLayer);
  // Reset all state polygon highlights
  STATES.forEach(s => {
    const p = statePolygons[s.id];
    if (p) p.setStyle({ fillOpacity: s.active ? 0.08 : 0.28, weight: s.active ? 2 : 2.0 });
  });
}

/* ── STATE VIEW ── */
function selectState(stateId) {
  const state = STATES.find(s => s.id === stateId);
  if (!state) return;
  currentState = state;
  showMobileTab('crags');

  document.getElementById('sidebarEyebrow').textContent = state.name;
  document.getElementById('detailBackLabel').textContent = state.name;
  document.getElementById('sidebarNav').style.display   = 'flex';
  updateBreadcrumb('state', state);

  // Highlight selected state polygon
  STATES.forEach(s => {
    const p = statePolygons[s.id];
    if (!p) return;
    if (s.id === stateId) {
      p.setStyle({ fillOpacity: s.active ? 0.18 : 0.12, weight: s.active ? 2.5 : 2 });
    } else {
      p.setStyle({ fillOpacity: s.active ? 0.05 : 0.22, weight: s.active ? 1.5 : 2.0 });
    }
  });

  map.flyTo(state.center, state.zoom, { duration:0.9 });

  if (state.active) {
    // Show crags for this state
    const stateCrags = allCrags.filter(c => c.state === stateId);
    document.getElementById('sidebarTitle').textContent = `${stateCrags.length} Crag${stateCrags.length!==1?'s':''} · ${state.name}`;
    document.getElementById('sidebarIntro').textContent = 'Select a crag to view access status, council progress, and guidebook milestones.';

    const stateView = document.getElementById('stateView');
    stateView.innerHTML = stateCrags.map(crag => {
      const milestones = allMilestones.filter(m => m.crag_id === crag.id);
      const doneCount  = milestones.filter(m => m.status === 'done').length;
      const hasProgress= milestones.some(m => m.status === 'progress');
      return `
        <div class="crag-item" data-id="${crag.id}" onclick="openCragPopup('${crag.id}')">
          <div class="crag-item-top">
            <div class="crag-name">${crag.name}</div>
            <div class="crag-badge badge-${crag.status}">${crag.statusLabel}</div>
          </div>
          <div class="crag-meta">${crag.council}</div>
          <div class="crag-status-row">
            ${doneCount>0?`<div class="crag-status-item"><div class="sdot sdot-done"></div><div class="crag-status-label">${doneCount} milestone${doneCount>1?'s':''} complete</div></div>`:''}
            ${hasProgress?`<div class="crag-status-item"><div class="sdot sdot-progress"></div><div class="crag-status-label">In progress</div></div>`:''}
          </div>
        </div>`;
    }).join('');

    showOnly('stateView');
    // Show crag markers
    if (!map.hasLayer(cragMarkerLayer)) cragMarkerLayer.addTo(map);

  } else {
    // Coming soon
    document.getElementById('sidebarTitle').textContent = state.name;
    document.getElementById('sidebarIntro').textContent = '';
    document.getElementById('csTitle').textContent = `${state.name} — Coming Soon`;
    document.getElementById('csSub').textContent   = `ACC is currently focused on Southeast Queensland. We plan to expand to ${state.name} as the coalition grows. Get involved to help us get there sooner.`;
    showOnly('comingSoon');
    map.removeLayer(cragMarkerLayer);
  }
}

function goState() {
  if (!currentState) { goAustralia(); return; }
  selectState(currentState.id);
}

/* ── CRAG DETAIL ── */
function selectCrag(id) {
  const crag      = allCrags.find(c => c.id === id);
  if (!crag) return;
  const milestones = allMilestones.filter(m => m.crag_id === id);
  const doneCount  = milestones.filter(m => m.status === 'done').length;
  const progress   = milestones.length ? Math.round(doneCount / milestones.length * 100) : 0;
  showMobileTab('crags');

  // Highlight marker
  Object.entries(cragMarkers).forEach(([k,m]) =>
    m.setIcon(markerIcon(allCrags.find(c=>c.id===k), k===id))
  );

  map.flyTo([crag.lat, crag.lng], 13, { duration:0.9 });
  updateBreadcrumb('crag', currentState, crag);

  const milestonesHTML = milestones.length
    ? milestones.map(m => `
        <li class="milestone">
          <div class="mdot mdot-${m.status}"></div>
          <div class="mtext mtext-${m.status}">${m.text}</div>
        </li>`).join('')
    : '<li class="milestone"><div class="mtext mtext-todo">No milestones added yet</div></li>';

  document.getElementById('detailContent').innerHTML = `
    <div class="detail-pill status-${crag.status}">
      <div class="status-dot"></div>
      ${crag.statusLabel}
    </div>
    <div class="detail-name">${crag.name}</div>
    <div class="detail-location">${crag.subtitle}</div>
    <div class="detail-council">${crag.council}</div>
    <div class="detail-section">
      <div class="detail-section-label">Overview</div>
      <div class="detail-desc">${crag.description || 'No description added yet.'}</div>
    </div>
    <div class="stat-row">
      <div class="stat-card"><div class="stat-num">${crag.problems || '—'}</div><div class="stat-label">Problems</div></div>
      <div class="stat-card"><div class="stat-num">${doneCount}/${milestones.length}</div><div class="stat-label">Milestones done</div></div>
    </div>
    <div class="detail-section">
      <div class="detail-section-label">Progress — ${progress}%</div>
      <div class="progress-bar-bg"><div class="progress-bar-fill status-${crag.status}" style="width:${progress}%;"></div></div>
    </div>
    <div class="detail-section">
      <div class="detail-section-label">Milestones</div>
      <ul class="milestones">${milestonesHTML}</ul>
    </div>
    <div class="info-strip">
      <strong>Rock Type:</strong> ${crag.style || '—'}<br>
      <strong>Best season:</strong> ${crag.season || '—'}<br>
      <strong>Region:</strong> ${crag.region || '—'}
    </div>`;

  showOnly('detailPanel');
  document.getElementById('detailPanel').classList.add('visible');
}

/* ════════════════════════════════════════════════════════════
   BREADCRUMB
════════════════════════════════════════════════════════════ */
function updateBreadcrumb(level, state, crag) {
  const bc = document.getElementById('breadcrumb');
  if (!bc) return;
  if (level === 'australia') {
    bc.innerHTML = `<span class="breadcrumb-item active">Australia</span>`;
  } else if (level === 'state') {
    bc.innerHTML = `
      <span class="breadcrumb-item" onclick="goAustralia()">Australia</span>
      <span class="breadcrumb-sep">›</span>
      <span class="breadcrumb-item active">${state.name}</span>`;
  } else if (level === 'crag') {
    bc.innerHTML = `
      <span class="breadcrumb-item" onclick="goAustralia()">Australia</span>
      <span class="breadcrumb-sep">›</span>
      <span class="breadcrumb-item" onclick="goState()">${state.name}</span>
      <span class="breadcrumb-sep">›</span>
      <span class="breadcrumb-item active">${crag.name}</span>`;
  }
}

/* ════════════════════════════════════════════════════════════
   MOBILE — BOTTOM SHEET TABS
════════════════════════════════════════════════════════════ */
function showMobileTab(tab) {
  const sidebar  = document.querySelector('.sidebar');
  const tabMap   = document.getElementById('tabMap');
  const tabCrags = document.getElementById('tabCrags');
  if (!tabMap || !tabCrags) return;
  tabMap.classList.toggle('active',   tab === 'map');
  tabCrags.classList.toggle('active', tab === 'crags');
  sidebar.classList.toggle('sheet-open', tab === 'crags');
}

/* ════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════ */
loadData();
