'use client';

import { ChangeEvent, PointerEvent, useEffect, useRef, useState } from 'react';

type Terrain = 'water' | 'plains' | 'forest' | 'mountains' | 'desert' | 'marsh' | 'snow';
type MarkerKind = 'capital' | 'city' | 'village' | 'fort' | 'ruin' | 'port' | 'label';
type MapMode = 'paint' | 'place' | 'road' | 'river' | 'erase';
type MapMarker = { id: string; kind: MarkerKind; x: number; y: number; name: string };
type MapLine = { id: string; kind: 'road' | 'river'; from: [number, number]; to: [number, number] };
type EmpireMap = { version: 1; title: string; subtitle: string; cells: Terrain[]; markers: MapMarker[]; lines: MapLine[] };

const columns = 24;
const rows = 16;
const storageKey = 'wayfarer-solenian-empire-map-v1';
const terrains: { value: Terrain; label: string; color: string }[] = [
  { value: 'water', label: 'Water', color: '#253f4b' },
  { value: 'plains', label: 'Plains', color: '#817d50' },
  { value: 'forest', label: 'Forest', color: '#355844' },
  { value: 'mountains', label: 'Mountains', color: '#68655e' },
  { value: 'desert', label: 'Desert', color: '#a17b47' },
  { value: 'marsh', label: 'Marsh', color: '#4d665c' },
  { value: 'snow', label: 'Snow', color: '#a8aca3' },
];
const markerKinds: { value: MarkerKind; label: string }[] = [
  { value: 'capital', label: 'Capital' }, { value: 'city', label: 'City' }, { value: 'village', label: 'Village' },
  { value: 'fort', label: 'Fort' }, { value: 'ruin', label: 'Ruin' }, { value: 'port', label: 'Port' }, { value: 'label', label: 'Region Label' },
];

function id() { return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`; }
function starterCells() {
  return Array.from({ length: columns * rows }, (_, index): Terrain => {
    const x = index % columns; const y = Math.floor(index / columns);
    const inside = ((x - 11.5) / 10.7) ** 2 + ((y - 7.5) / 6.9) ** 2 < 1;
    if (!inside || (x < 4 && y < 6) || (x > 20 && y > 10)) return 'water';
    if (y < 3 || (y < 5 && x > 15)) return 'snow';
    if ((x > 16 && y > 8) || (x > 13 && y > 12)) return 'desert';
    if ((x > 6 && x < 10 && y > 3 && y < 12) || (x > 15 && x < 19 && y > 3 && y < 8)) return 'mountains';
    if ((x < 7 && y > 5) || (x > 10 && x < 16 && y > 4 && y < 8)) return 'forest';
    if (x > 18 && y > 5 && y < 10) return 'marsh';
    return 'plains';
  });
}
const starter: EmpireMap = {
  version: 1, title: 'THE SOLENIAN EMPIRE', subtitle: 'IMPERIAL SURVEY // ERA UNRECORDED', cells: starterCells(),
  markers: [
    { id: 'solen', kind: 'capital', x: 12, y: 8, name: 'Solen' },
    { id: 'northwatch', kind: 'fort', x: 12, y: 3, name: 'Northwatch' },
    { id: 'vale', kind: 'city', x: 6, y: 11, name: 'The Verdant Vale' },
    { id: 'eastern-ruin', kind: 'ruin', x: 18, y: 6, name: 'Unnamed Ruin' },
  ],
  lines: [{ id: 'imperial-road', kind: 'road', from: [6, 11], to: [12, 8] }, { id: 'north-road', kind: 'road', from: [12, 8], to: [12, 3] }],
};

function safeMap(input: unknown): EmpireMap | null {
  if (!input || typeof input !== 'object') return null;
  const map = input as Partial<EmpireMap>;
  if (map.version !== 1 || !Array.isArray(map.cells) || map.cells.length !== columns * rows || !Array.isArray(map.markers) || !Array.isArray(map.lines)) return null;
  return { ...starter, ...map } as EmpireMap;
}

export default function DmWorldMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<EmpireMap>(starter);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<MapMode>('paint');
  const [terrain, setTerrain] = useState<Terrain>('forest');
  const [markerKind, setMarkerKind] = useState<MarkerKind>('city');
  const [markerName, setMarkerName] = useState('New Place');
  const [selectedId, setSelectedId] = useState('solen');
  const [lineStart, setLineStart] = useState<[number, number] | null>(null);
  const [painting, setPainting] = useState(false);
  const [notice, setNotice] = useState('ATLAS SAVES AUTOMATICALLY ON THIS DEVICE');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { const saved = safeMap(JSON.parse(localStorage.getItem(storageKey) || 'null')); if (saved) setMap(saved); } catch { /* Use starter map. */ }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(storageKey, JSON.stringify(map)); }, [map, ready]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const w = canvas.width; const h = canvas.height; const cellW = w / columns; const cellH = h / rows;
    ctx.fillStyle = '#151713'; ctx.fillRect(0, 0, w, h);
    map.cells.forEach((cell, index) => {
      const x = index % columns; const y = Math.floor(index / columns);
      ctx.fillStyle = terrains.find((item) => item.value === cell)?.color || '#333'; ctx.fillRect(x * cellW, y * cellH, cellW + .5, cellH + .5);
      ctx.globalAlpha = .15; ctx.fillStyle = (x + y) % 2 ? '#000' : '#fff'; ctx.fillRect(x * cellW, y * cellH, cellW, cellH); ctx.globalAlpha = 1;
      if (cell === 'forest') { ctx.fillStyle = '#172f25'; ctx.beginPath(); ctx.moveTo((x + .5) * cellW, (y + .2) * cellH); ctx.lineTo((x + .25) * cellW, (y + .78) * cellH); ctx.lineTo((x + .75) * cellW, (y + .78) * cellH); ctx.fill(); }
      if (cell === 'mountains') { ctx.strokeStyle = '#2b2b29'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo((x + .12) * cellW, (y + .82) * cellH); ctx.lineTo((x + .48) * cellW, (y + .22) * cellH); ctx.lineTo((x + .86) * cellW, (y + .82) * cellH); ctx.stroke(); }
      if (cell === 'water') { ctx.strokeStyle = '#49646e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo((x + .15) * cellW, (y + .55) * cellH); ctx.quadraticCurveTo((x + .4) * cellW, (y + .35) * cellH, (x + .65) * cellW, (y + .55) * cellH); ctx.stroke(); }
    });
    map.lines.forEach((line) => { ctx.strokeStyle = line.kind === 'river' ? '#73a5b2' : '#c6a669'; ctx.lineWidth = line.kind === 'river' ? 4 : 3; ctx.setLineDash(line.kind === 'road' ? [8, 6] : []); ctx.beginPath(); ctx.moveTo((line.from[0] + .5) * cellW, (line.from[1] + .5) * cellH); ctx.lineTo((line.to[0] + .5) * cellW, (line.to[1] + .5) * cellH); ctx.stroke(); ctx.setLineDash([]); });
    map.markers.forEach((marker) => {
      const x = (marker.x + .5) * cellW; const y = (marker.y + .5) * cellH; const selected = marker.id === selectedId;
      ctx.fillStyle = selected ? '#f1d889' : '#e5cf9a'; ctx.strokeStyle = '#1b1710'; ctx.lineWidth = 2;
      if (marker.kind === 'label') { ctx.font = 'bold 17px Georgia'; ctx.textAlign = 'center'; ctx.fillText(marker.name.toUpperCase(), x, y); return; }
      ctx.beginPath(); if (marker.kind === 'capital') { ctx.arc(x, y, 9, 0, Math.PI * 2); } else { ctx.rect(x - 6, y - 6, 12, 12); } ctx.fill(); ctx.stroke();
      ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center'; ctx.fillStyle = '#f1e1b5'; ctx.strokeStyle = '#171812'; ctx.lineWidth = 4; ctx.strokeText(marker.name, x, y + 24); ctx.fillText(marker.name, x, y + 24);
    });
    ctx.strokeStyle = 'rgba(231,205,143,.14)'; ctx.lineWidth = 1; for (let x = 0; x <= columns; x++) { ctx.beginPath(); ctx.moveTo(x * cellW, 0); ctx.lineTo(x * cellW, h); ctx.stroke(); } for (let y = 0; y <= rows; y++) { ctx.beginPath(); ctx.moveTo(0, y * cellH); ctx.lineTo(w, y * cellH); ctx.stroke(); }
    ctx.strokeStyle = '#c9a960'; ctx.lineWidth = 7; ctx.strokeRect(4, 4, w - 8, h - 8);
  }, [map, selectedId]);

  function cellFromEvent(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return [Math.max(0, Math.min(columns - 1, Math.floor((event.clientX - rect.left) / rect.width * columns))), Math.max(0, Math.min(rows - 1, Math.floor((event.clientY - rect.top) / rect.height * rows)))] as [number, number];
  }
  function paintCell(x: number, y: number) { setMap((current) => ({ ...current, cells: current.cells.map((cell, index) => index === y * columns + x ? terrain : cell) })); }
  function act(x: number, y: number) {
    if (mode === 'paint') { paintCell(x, y); return; }
    if (mode === 'place') { const marker = { id: id(), kind: markerKind, x, y, name: markerName.trim() || 'Unnamed Place' }; setMap((current) => ({ ...current, markers: [...current.markers, marker] })); setSelectedId(marker.id); return; }
    if (mode === 'erase') { setMap((current) => ({ ...current, markers: current.markers.filter((marker) => marker.x !== x || marker.y !== y), lines: current.lines.filter((line) => line.from[0] !== x || line.from[1] !== y) })); return; }
    if (!lineStart) { setLineStart([x, y]); setNotice(`SELECT THE ${mode.toUpperCase()} END POINT`); return; }
    setMap((current) => ({ ...current, lines: [...current.lines, { id: id(), kind: mode, from: lineStart, to: [x, y] }] })); setLineStart(null); setNotice(`${mode.toUpperCase()} ADDED`);
  }
  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) { event.currentTarget.setPointerCapture(event.pointerId); const [x, y] = cellFromEvent(event); setPainting(true); act(x, y); }
  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) { if (!painting || mode !== 'paint') return; const [x, y] = cellFromEvent(event); paintCell(x, y); }

  const selected = map.markers.find((marker) => marker.id === selectedId);
  function exportJson() { const blob = new Blob([JSON.stringify(map, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'solenian-empire-map.json'; link.click(); URL.revokeObjectURL(link.href); }
  function importJson(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const value = safeMap(JSON.parse(String(reader.result))); if (!value) throw new Error(); setMap(value); setNotice('ATLAS BACKUP RESTORED'); } catch { setNotice('IMPORT FAILED // INVALID ATLAS FILE'); } }; reader.readAsText(file); event.target.value = ''; }
  function downloadPng() { const link = document.createElement('a'); link.href = canvasRef.current?.toDataURL('image/png') || ''; link.download = 'solenian-empire-map.png'; link.click(); setNotice('PLAYER MAP DOWNLOADED'); }

  return <section className="world-map-studio">
    <div className="dm-section-heading"><div><p>THE INDEX // IMPERIAL CARTOGRAPHY</p><h2>SOLENIAN EMPIRE MAP STUDIO</h2></div><span>{notice}</span></div>
    <div className="world-map-layout">
      <aside className="world-map-controls">
        <div className="dm-notice">Paint the land, place named locations, and connect them with roads or rivers. Your atlas stays on this device until you export it.</div>
        <label className="dm-field"><span>MAP TITLE</span><input value={map.title} onChange={(event) => setMap({ ...map, title: event.target.value })} /></label>
        <label className="dm-field"><span>ERA OR SUBTITLE</span><input value={map.subtitle} onChange={(event) => setMap({ ...map, subtitle: event.target.value })} /></label>
        <fieldset className="world-toolset"><legend>DRAWING TOOL</legend><div className="world-mode-buttons">{(['paint', 'place', 'road', 'river', 'erase'] as MapMode[]).map((item) => <button key={item} className={mode === item ? 'active' : ''} onClick={() => { setMode(item); setLineStart(null); }}>{item.toUpperCase()}</button>)}</div></fieldset>
        {mode === 'paint' && <fieldset className="world-toolset"><legend>TERRAIN BRUSH</legend><div className="terrain-palette">{terrains.map((item) => <button key={item.value} className={terrain === item.value ? 'active' : ''} onClick={() => setTerrain(item.value)}><i style={{ background: item.color }} />{item.label}</button>)}</div></fieldset>}
        {mode === 'place' && <fieldset className="world-toolset"><legend>PLACE A LOCATION</legend><label className="dm-field"><span>MARKER TYPE</span><select value={markerKind} onChange={(event) => setMarkerKind(event.target.value as MarkerKind)}>{markerKinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="dm-field"><span>LOCATION NAME</span><input value={markerName} onChange={(event) => setMarkerName(event.target.value)} /></label></fieldset>}
        {(mode === 'road' || mode === 'river') && <p className="dm-notice">Choose a starting space, then an ending space. Add connected segments to make the route curve.</p>}
        {selected && <fieldset className="world-toolset"><legend>SELECTED LOCATION</legend><label className="dm-field"><span>NAME</span><input value={selected.name} onChange={(event) => setMap((current) => ({ ...current, markers: current.markers.map((marker) => marker.id === selected.id ? { ...marker, name: event.target.value } : marker) }))} /></label><button className="danger-button" onClick={() => { setMap((current) => ({ ...current, markers: current.markers.filter((marker) => marker.id !== selected.id) })); setSelectedId(''); }}>REMOVE LOCATION</button></fieldset>}
        <div className="world-location-list"><strong>KNOWN LOCATIONS</strong>{map.markers.map((marker) => <button key={marker.id} className={marker.id === selectedId ? 'active' : ''} onClick={() => setSelectedId(marker.id)}><span>{marker.name}</span><small>{marker.kind}</small></button>)}</div>
        <div className="dm-actions"><button onClick={downloadPng}>DOWNLOAD PLAYER MAP</button><button onClick={exportJson}>EXPORT EDITABLE BACKUP</button><button onClick={() => importRef.current?.click()}>IMPORT BACKUP</button></div>
        <input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={importJson} />
      </aside>
      <section className="world-map-stage"><header><span>{map.title}</span><small>{map.subtitle}</small></header><canvas ref={canvasRef} width="1200" height="800" aria-label="Editable map of the Solenian Empire" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => setPainting(false)} onPointerCancel={() => setPainting(false)} /><footer><span>24 × 16 IMPERIAL SURVEY GRID</span><span>{mode.toUpperCase()} TOOL ACTIVE</span><span>{map.markers.length} LOCATIONS RECORDED</span></footer></section>
    </div>
  </section>;
}
