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
   polygonCoords traces each state boundary (simplified).
   active: true = shows crags, false = coming soon
════════════════════════════════════════════════════════════ */
const STATES = [
  {
    id: 'QLD',
    name: 'Queensland',
    meta: 'Southeast Queensland · Active',
    active: true,
    center: [-22.0, 145.0],
    zoom: 6,
    // Simplified QLD boundary polygon
    poly: [
      [-10.68, 141.90],[-10.68, 138.00],[-12.0, 136.5],
      [-16.0, 136.0], [-17.5, 139.5], [-19.0, 138.5],
      [-20.0, 138.8], [-22.0, 139.0], [-26.0, 138.0],
      [-29.0, 141.0], [-29.18, 141.98],[-29.18, 148.0],
      [-28.0, 150.0], [-27.5, 153.55],[-26.0, 153.15],
      [-24.0, 152.0], [-22.0, 150.0], [-20.0, 148.7],
      [-18.0, 147.0], [-16.0, 145.5], [-14.0, 144.5],
      [-12.0, 143.5], [-10.68, 141.90]
    ]
  },
  {
    id: 'NSW',
    name: 'New South Wales',
    meta: 'Blue Mountains · Coming Soon',
    active: false,
    center: [-32.5, 147.0],
    zoom: 6,
    poly: [
      [-29.18, 141.98],[-29.18, 148.0],[-28.0, 150.0],
      [-27.5, 153.55], [-29.0, 153.4], [-31.0, 153.1],
      [-33.0, 151.7], [-34.0, 151.2], [-35.0, 150.5],
      [-37.5, 149.9], [-37.5, 148.0], [-36.5, 147.0],
      [-36.0, 146.0], [-34.0, 143.0], [-33.0, 141.0],
      [-29.18, 141.98]
    ]
  },
  {
    id: 'VIC',
    name: 'Victoria',
    meta: 'Grampians · Arapiles · Coming Soon',
    active: false,
    center: [-37.0, 144.5],
    zoom: 7,
    poly: [
      [-34.0, 141.0],[-34.0, 143.0],[-36.0, 146.0],
      [-36.5, 147.0],[-37.5, 148.0],[-37.5, 149.9],
      [-38.5, 149.0],[-39.2, 147.0],[-38.8, 143.5],
      [-38.5, 141.0],[-34.0, 141.0]
    ]
  },
  {
    id: 'SA',
    name: 'South Australia',
    meta: 'Moonarie · Coming Soon',
    active: false,
    center: [-30.0, 135.5],
    zoom: 6,
    poly: [
      [-26.0, 129.0],[-26.0, 138.0],[-29.0, 141.0],
      [-33.0, 141.0],[-34.0, 141.0],[-38.5, 141.0],
      [-38.5, 140.5],[-37.0, 139.5],[-35.5, 138.5],
      [-35.0, 136.0],[-33.0, 134.0],[-31.7, 129.0],
      [-26.0, 129.0]
    ]
  },
  {
    id: 'WA',
    name: 'Western Australia',
    meta: 'Perth Bouldering · Coming Soon',
    active: false,
    center: [-26.0, 121.0],
    zoom: 5,
    poly: [
      [-13.5, 129.0],[-13.5, 126.0],[-15.0, 124.0],
      [-18.0, 121.5],[-22.0, 114.0],[-26.0, 113.0],
      [-31.7, 115.5],[-33.5, 115.0],[-33.9, 122.0],
      [-31.7, 129.0],[-26.0, 129.0],[-13.5, 129.0]
    ]
  },
  {
    id: 'TAS',
    name: 'Tasmania',
    meta: 'Dolerite · Coming Soon',
    active: false,
    center: [-42.0, 146.5],
    zoom: 7,
    poly: [
      [-40.5, 144.5],[-40.5, 148.5],[-43.5, 148.5],
      [-43.5, 145.5],[-42.0, 144.0],[-40.5, 144.5]
    ]
  },
  {
    id: 'NT',
    name: 'Northern Territory',
    meta: 'Coming Soon',
    active: false,
    center: [-19.5, 133.0],
    zoom: 6,
    poly: [
      [-10.68, 129.0],[-10.68, 138.0],[-12.0, 136.5],
      [-16.0, 136.0],[-17.5, 139.5],[-19.0, 138.5],
      [-22.0, 139.0],[-26.0, 138.0],[-26.0, 129.0],
      [-13.5, 129.0],[-10.68, 129.0]
    ]
  },
  {
    id: 'ACT',
    name: 'ACT',
    meta: 'Coming Soon',
    active: false,
    center: [-35.5, 149.0],
    zoom: 9,
    poly: [
      [-35.1, 148.7],[-35.1, 149.4],
      [-35.9, 149.4],[-35.9, 148.7],[-35.1, 148.7]
    ]
  },
];

/* ════════════════════════════════════════════════════════════
   STATUS CONFIG
════════════════════════════════════════════════════════════ */
const STATUS = {
  active:   { bg:'#2D5016', pillBg:'#EAF3DE', pillText:'#2D5016', size:28 },
  progress: { bg:'#C8900A', pillBg:'#FAEEDA', pillText:'#C8900A', size:24 },
  scoping:  { bg:'#888780', pillBg:'#F1EFE8', pillText:'#888780', size:20 },
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
        weight:      isActive ? 2.5       : 1.5,
        opacity:     isActive ? 0.8       : 0.65,
        fillColor:   isActive ? '#2D5016' : '#444441',
        fillOpacity: isActive ? 0.10      : 0.12,
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
        this.setStyle({ fillOpacity: cfg.active ? 0.22 : 0.22, weight: cfg.active ? 3 : 2 });
        this.getElement().style.cursor = 'pointer';
      });
      layer.on('mouseout', function() {
        this.setStyle({ fillOpacity: cfg.active ? 0.10 : 0.12, weight: cfg.active ? 2.5 : 1.5 });
      });

      const popupContent = `
        <div class="state-popup">
          <div class="state-popup-name">${cfg.name}</div>
          <div class="state-popup-meta">${cfg.meta}</div>
          ${cfg.active
            ? `<span class="state-popup-link" onclick="selectState('${cfg.id}')">View crags →</span>`
            : `<span class="state-popup-soon">Coming soon — ACC is expanding nationally</span>`
          }
        </div>`;

      layer.bindPopup(popupContent, { maxWidth:220 });
      layer.on('click', function() {
        this.openPopup();
        selectState(cfg.id);
      });
    }
  }).addTo(map);
}

// Fetch real state boundaries from repo
fetch('states.geojson')
  .then(r => r.json())
  .then(geojson => renderStatePolygons(geojson))
  .catch(err => {
    console.warn('Could not load states.geojson — falling back to simplified polygons', err);
    // Fallback: draw simplified polygons from STATES config
    STATES.forEach(state => {
      if (!state.poly) return;
      const isActive = state.active;
      const poly = L.polygon(state.poly, {
        color: isActive ? '#2D5016' : '#444441',
        weight: isActive ? 2.5 : 1.5,
        opacity: isActive ? 0.8 : 0.65,
        fillColor: isActive ? '#2D5016' : '#444441',
        fillOpacity: isActive ? 0.10 : 0.12,
      }).addTo(map);
      const popupContent = `
        <div class="state-popup">
          <div class="state-popup-name">${state.name}</div>
          <div class="state-popup-meta">${state.meta}</div>
          ${isActive
            ? `<span class="state-popup-link" onclick="selectState('${state.id}')">View crags →</span>`
            : `<span class="state-popup-soon">Coming soon — ACC is expanding nationally</span>`
          }
        </div>`;
      poly.bindPopup(popupContent, { maxWidth:220 });
      poly.on('click', () => { poly.openPopup(); selectState(state.id); });
      statePolygons[state.id] = poly;
    });
  });

/* ════════════════════════════════════════════════════════════
   CRAG DATA — CSV PARSER + FETCH
════════════════════════════════════════════════════════════ */
let allCrags = [];
let allMilestones = [];
const cragMarkers = {};
const cragMarkerLayer = L.layerGroup().addTo(map);

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const vals = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    vals.push(cur.trim());
    return Object.fromEntries(headers.map((h,i) => [h, (vals[i]||'').replace(/"/g,'')]));
  });
}

async function loadData() {
  try {
    const [cr, mr] = await Promise.all([
      fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(SHEETS.crags)).then(r => r.text()),
      fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(SHEETS.milestones)).then(r => r.text()),
    ]);
    allCrags      = parseCSV(cr).map(c => ({...c, lat:parseFloat(c.lat), lng:parseFloat(c.lng), progress:parseInt(c.progress)||0}));
    allMilestones = parseCSV(mr);
    renderAustraliaView();
    renderCragMarkers();
    document.getElementById('loadingView').style.display = 'none';
    document.getElementById('australiaView').classList.add('visible');
  } catch(e) {
    // Fallback — use inline demo data so the map works without Sheets configured
    console.warn('Sheets not configured — using demo data');
    allCrags = [
      { id:'cedar',    name:'Cedar Creek',    subtitle:"Mt Nebo / D'Aguilar Range",          lat:-27.358, lng:152.827, status:'active',   statusLabel:'Council Recognised', council:'Brisbane City Council', councilStatus:'Formal recognition secured', description:'Cedar Creek is one of SEQLDs finest bouldering areas featuring high-quality rhyolite on the eastern escarpment of the DAguilar Range. Following sustained engagement with Brisbane City Council bouldering has been formally recognised as a legitimate recreational activity within the park backed by the installation of access stairs and official signage.', progress:75, problems:'200+', style:'Rhyolite · Highball · Technical', season:'April – October', state:'QLD', region:'SEQLD' },
      { id:'whiterock',name:'White Rock',     subtitle:'White Rock Conservation Park · Ipswich', lat:-27.638, lng:152.742, status:'progress', statusLabel:'In Progress',        council:'Ipswich City Council',   councilStatus:'Active engagement — strong foundation', description:'White Rock is one of SEQLDs most significant but underdocumented climbing areas featuring distinctive pale rhyolite in a conservation park setting. ACC is working closely with a dedicated Ipswich City Council contact toward formal recognition of bouldering.', progress:35, problems:'100+', style:'Rhyolite · Varied · Multi-grade', season:'April – October', state:'QLD', region:'SEQLD' },
      { id:'tooheys',  name:'Tooheys Forest', subtitle:'Tarragindi · Brisbane',               lat:-27.525, lng:153.028, status:'scoping',  statusLabel:'Scoping',            council:'Brisbane City Council',   councilStatus:'Research phase', description:'Tooheys Forest offers accessible urban bouldering within Brisbanes southern suburbs. The area contains quality sandstone problems across a range of grades.', progress:10, problems:'50+', style:'Sandstone · All grades', season:'Year round', state:'QLD', region:'SEQLD' },
      { id:'plunketts',name:'Plunketts',      subtitle:'Samford Valley · Brisbane',           lat:-27.361, lng:152.875, status:'scoping',  statusLabel:'Scoping',            council:'Brisbane City Council',   councilStatus:'Research phase', description:'Plunketts is a quality bouldering area in the Samford Valley with a loyal local following. The area features a range of styles across multiple rock types.', progress:10, problems:'80+', style:'Mixed · Varied', season:'April – October', state:'QLD', region:'SEQLD' },
    ];
    allMilestones = [
      {crag_id:'cedar',    text:'Brisbane City Council engagement initiated', status:'done'},
      {crag_id:'cedar',    text:'Formal bouldering recognition secured',      status:'done'},
      {crag_id:'cedar',    text:'Access stairs installed',                    status:'done'},
      {crag_id:'cedar',    text:'Official signage installed',                 status:'done'},
      {crag_id:'cedar',    text:'KAYA guidebook documentation underway',      status:'progress'},
      {crag_id:'cedar',    text:'Full guidebook published on KAYA',           status:'todo'},
      {crag_id:'whiterock',text:'Ipswich City Council contact established',   status:'done'},
      {crag_id:'whiterock',text:'Formal engagement process initiated',        status:'done'},
      {crag_id:'whiterock',text:'Council recognition secured',                status:'progress'},
      {crag_id:'whiterock',text:'Infrastructure — stairs and signage',        status:'todo'},
      {crag_id:'whiterock',text:'KAYA guidebook documentation',               status:'todo'},
      {crag_id:'whiterock',text:'Full guidebook published on KAYA',           status:'todo'},
      {crag_id:'tooheys',  text:'Crag identified and assessed',               status:'done'},
      {crag_id:'tooheys',  text:'Access research underway',                   status:'progress'},
      {crag_id:'tooheys',  text:'Council engagement initiated',               status:'todo'},
      {crag_id:'tooheys',  text:'Formal recognition secured',                 status:'todo'},
      {crag_id:'tooheys',  text:'KAYA guidebook documentation',               status:'todo'},
      {crag_id:'tooheys',  text:'Full guidebook published on KAYA',           status:'todo'},
      {crag_id:'plunketts',text:'Crag identified and assessed',               status:'done'},
      {crag_id:'plunketts',text:'Access research underway',                   status:'progress'},
      {crag_id:'plunketts',text:'Council engagement initiated',               status:'todo'},
      {crag_id:'plunketts',text:'Formal recognition secured',                 status:'todo'},
      {crag_id:'plunketts',text:'KAYA guidebook documentation',               status:'todo'},
      {crag_id:'plunketts',text:'Full guidebook published on KAYA',           status:'todo'},
    ];
    renderAustraliaView();
    renderCragMarkers();
    document.getElementById('loadingView').style.display = 'none';
    document.getElementById('australiaView').classList.add('visible');
  }
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
function markerIcon(crag, active=false) {
  const cfg = STATUS[crag.status] || STATUS.scoping;
  const s = cfg.size;
  const pulse = crag.status === 'progress'
    ? `<div style="position:absolute;inset:-7px;border-radius:50%;border:2px solid ${cfg.bg};opacity:0;animation:pulse 2.5s ease-out infinite;"></div>` : '';
  return L.divIcon({
    className:'',
    html:`<div style="position:relative;width:${s}px;height:${s}px;background:${cfg.bg};border-radius:50%;border:3px solid white;box-shadow:0 2px 12px rgba(0,0,0,${active?.4:.25});transform:scale(${active?1.3:1});transition:transform .15s;cursor:pointer;">${pulse}</div>`,
    iconSize:[s,s], iconAnchor:[s/2,s/2], popupAnchor:[0,-(s/2)-6],
  });
}

function renderCragMarkers() {
  cragMarkerLayer.clearLayers();
  allCrags.forEach(crag => {
    const cfg = STATUS[crag.status] || STATUS.scoping;
    const marker = L.marker([crag.lat, crag.lng], { icon:markerIcon(crag) });
    marker.bindPopup(`
      <div class="acc-popup">
        <div class="acc-popup-pill" style="background:${cfg.pillBg};color:${cfg.pillText};">
          <div style="width:5px;height:5px;border-radius:50%;background:${cfg.pillText};"></div>
          ${crag.statusLabel}
        </div>
        <div class="acc-popup-name">${crag.name}</div>
        <div class="acc-popup-loc">${crag.subtitle}</div>
        <div class="acc-popup-bar-bg"><div class="acc-popup-bar-fill" style="width:${crag.progress}%;background:${cfg.bg};"></div></div>
        <span class="acc-popup-link" onclick="selectCrag('${crag.id}')">View details →</span>
      </div>`, { maxWidth:260 });
    marker.on('mouseover', () => marker.setIcon(markerIcon(crag, true)));
    marker.on('mouseout',  () => marker.setIcon(markerIcon(crag, false)));
    marker.on('click',     () => selectCrag(crag.id));
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
        <div class="state-meta">${s.meta}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="state-badge ${s.active ? 'badge-active-state' : 'badge-soon'}">${s.active ? 'Active' : 'Soon'}</div>
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
  updateBreadcrumb('australia');
  map.flyTo([-27.0, 134.0], 4, { duration:1.0 });
  map.removeLayer(cragMarkerLayer);
  // Reset all state polygon highlights
  STATES.forEach(s => {
    const p = statePolygons[s.id];
    if (p) p.setStyle({ fillOpacity: s.active ? 0.08 : 0.04, weight: s.active ? 2 : 1.5 });
  });
}

/* ── STATE VIEW ── */
function selectState(stateId) {
  const state = STATES.find(s => s.id === stateId);
  if (!state) return;
  currentState = state;

  document.getElementById('sidebarEyebrow').textContent = state.name;
  document.getElementById('detailBackLabel').textContent = state.name;
  updateBreadcrumb('state', state);

  // Highlight selected state polygon
  STATES.forEach(s => {
    const p = statePolygons[s.id];
    if (!p) return;
    if (s.id === stateId) {
      p.setStyle({ fillOpacity: s.active ? 0.18 : 0.12, weight: s.active ? 2.5 : 2 });
    } else {
      p.setStyle({ fillOpacity: s.active ? 0.05 : 0.02, weight: s.active ? 1.5 : 1 });
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
        <div class="crag-item" data-id="${crag.id}" onclick="selectCrag('${crag.id}')">
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
  const cfg        = STATUS[crag.status] || STATUS.scoping;
  const doneCount  = milestones.filter(m => m.status === 'done').length;

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
    <div class="detail-pill" style="background:${cfg.pillBg};color:${cfg.pillText};">
      <div style="width:6px;height:6px;border-radius:50%;background:${cfg.pillText};"></div>
      ${crag.statusLabel}
    </div>
    <div class="detail-name">${crag.name}</div>
    <div class="detail-location">${crag.subtitle}</div>
    <div class="detail-section">
      <div class="detail-section-label">Overview</div>
      <div class="detail-desc">${crag.description || 'No description added yet.'}</div>
    </div>
    <div class="stat-row">
      <div class="stat-card"><div class="stat-num">${crag.problems||'—'}</div><div class="stat-label">Problems</div></div>
      <div class="stat-card"><div class="stat-num">${doneCount}/${milestones.length}</div><div class="stat-label">Milestones done</div></div>
    </div>
    <div class="detail-section">
      <div class="detail-section-label">Council</div>
      <div class="council-badge">
        <div style="width:8px;height:8px;border-radius:50%;background:${cfg.bg};flex-shrink:0;"></div>
        <div><div class="council-name">${crag.council}</div><div class="council-status-text">${crag.councilStatus}</div></div>
      </div>
    </div>
    <div class="detail-section">
      <div class="detail-section-label">Progress — ${crag.progress}%</div>
      <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${crag.progress}%;background:${cfg.bg};"></div></div>
    </div>
    <div class="detail-section">
      <div class="detail-section-label">Milestones</div>
      <ul class="milestones">${milestonesHTML}</ul>
    </div>
    <div class="info-strip">
      <strong>Style:</strong> ${crag.style||'—'}<br>
      <strong>Best season:</strong> ${crag.season||'—'}<br>
      <strong>Region:</strong> ${crag.state||'—'} · ${crag.region||'—'}
    </div>`;

  showOnly('detailPanel');
  document.getElementById('detailPanel').classList.add('visible');
}

/* ════════════════════════════════════════════════════════════
   BREADCRUMB
════════════════════════════════════════════════════════════ */
function updateBreadcrumb(level, state, crag) {
  const bc = document.getElementById('breadcrumb');
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
   INIT
════════════════════════════════════════════════════════════ */
loadData();
