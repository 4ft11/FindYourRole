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
  { value: 'water', label: 'Water', color: '#718b8c' },
  { value: 'plains', label: 'Plains', color: '#c3ae7d' },
  { value: 'forest', label: 'Forest', color: '#667757' },
  { value: 'mountains', label: 'Mountains', color: '#887d70' },
  { value: 'desert', label: 'Desert', color: '#c69a62' },
  { value: 'marsh', label: 'Marsh', color: '#708276' },
  { value: 'snow', label: 'Snow', color: '#c8c1b2' },
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
    const at = (x: number, y: number) => x < 0 || y < 0 || x >= columns || y >= rows ? 'water' : map.cells[y * columns + x];

    // A muted illustrated-atlas surface. The editor still uses cells beneath it,
    // but the exported player map no longer looks like a tile painter.
    ctx.fillStyle = '#6f8582'; ctx.fillRect(0, 0, w, h);
    const wash = ctx.createRadialGradient(w * .48, h * .42, 40, w * .48, h * .42, w * .72);
    wash.addColorStop(0, 'rgba(231,214,170,.10)'); wash.addColorStop(1, 'rgba(23,42,44,.30)');
    ctx.fillStyle = wash; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = .16;
    for (let i = 0; i < 360; i++) {
      const x = (i * 83) % w; const y = (i * 47) % h; const radius = 1 + (i % 4);
      ctx.fillStyle = i % 3 ? '#f2dfae' : '#253f3e'; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    map.cells.forEach((cell, index) => {
      const x = index % columns; const y = Math.floor(index / columns);
      if (cell !== 'water') {
        ctx.fillStyle = terrains.find((item) => item.value === cell)?.color || '#b6a273';
        ctx.beginPath(); ctx.roundRect(x * cellW - 3, y * cellH - 3, cellW + 7, cellH + 7, 11); ctx.fill();
        ctx.globalAlpha = .11; ctx.fillStyle = (x * 7 + y * 3) % 2 ? '#fff4cf' : '#4c3a28'; ctx.fillRect(x * cellW, y * cellH, cellW, cellH); ctx.globalAlpha = 1;
      }
      const cx = (x + .5) * cellW; const cy = (y + .5) * cellH;
      if (cell === 'forest' && (x + y) % 2 === 0) {
        ctx.fillStyle = '#344c3a'; ctx.strokeStyle = '#28382d'; ctx.lineWidth = 1.6;
        [-9, 8].forEach((offset, treeIndex) => { ctx.beginPath(); ctx.moveTo(cx + offset, cy - 15 + treeIndex * 4); ctx.lineTo(cx + offset - 10, cy + 10); ctx.lineTo(cx + offset + 10, cy + 10); ctx.closePath(); ctx.fill(); ctx.stroke(); });
      }
      if (cell === 'mountains') {
        ctx.strokeStyle = '#554b43'; ctx.fillStyle = '#a99b84'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - 23, cy + 16); ctx.lineTo(cx - 4, cy - 17); ctx.lineTo(cx + 12, cy + 16); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 1, cy + 16); ctx.lineTo(cx + 18, cy - 8); ctx.lineTo(cx + 29, cy + 16); ctx.stroke();
      }
      if (cell === 'desert' && (x + y) % 3 === 0) { ctx.strokeStyle = '#8e6846'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy + 7, 20, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      if (cell === 'marsh') { ctx.strokeStyle = '#3f5f57'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx - 17, cy + 8); ctx.quadraticCurveTo(cx - 8, cy, cx, cy + 8); ctx.quadraticCurveTo(cx + 9, cy + 16, cx + 18, cy + 8); ctx.stroke(); }
      if (cell === 'snow' && (x + y) % 2 === 0) { ctx.fillStyle = 'rgba(239,234,213,.62)'; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill(); }
      if (cell === 'water' && (x * 3 + y) % 4 === 0) { ctx.strokeStyle = 'rgba(214,222,200,.35)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx - 18, cy); ctx.quadraticCurveTo(cx - 8, cy - 6, cx, cy); ctx.quadraticCurveTo(cx + 8, cy + 6, cx + 18, cy); ctx.stroke(); }
    });

    // Ink the coastline after the terrain washes so the land reads as one mass.
    ctx.strokeStyle = '#564a39'; ctx.lineWidth = 2.4;
    map.cells.forEach((cell, index) => {
      if (cell === 'water') return;
      const x = index % columns; const y = Math.floor(index / columns); const left = x * cellW; const top = y * cellH;
      if (at(x, y - 1) === 'water') { ctx.beginPath(); ctx.moveTo(left, top); ctx.quadraticCurveTo(left + cellW * .45, top - 5, left + cellW, top); ctx.stroke(); }
      if (at(x + 1, y) === 'water') { ctx.beginPath(); ctx.moveTo(left + cellW, top); ctx.quadraticCurveTo(left + cellW + 5, top + cellH * .5, left + cellW, top + cellH); ctx.stroke(); }
      if (at(x, y + 1) === 'water') { ctx.beginPath(); ctx.moveTo(left + cellW, top + cellH); ctx.quadraticCurveTo(left + cellW * .5, top + cellH + 5, left, top + cellH); ctx.stroke(); }
      if (at(x - 1, y) === 'water') { ctx.beginPath(); ctx.moveTo(left, top + cellH); ctx.quadraticCurveTo(left - 5, top + cellH * .5, left, top); ctx.stroke(); }
    });

    map.lines.forEach((line) => {
      const fromX = (line.from[0] + .5) * cellW; const fromY = (line.from[1] + .5) * cellH; const toX = (line.to[0] + .5) * cellW; const toY = (line.to[1] + .5) * cellH;
      ctx.strokeStyle = line.kind === 'river' ? '#506f76' : '#745a3f'; ctx.lineWidth = line.kind === 'river' ? 5 : 2.4; ctx.setLineDash(line.kind === 'road' ? [4, 6] : []);
      ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.bezierCurveTo(fromX + (toX - fromX) * .35, fromY - 10, fromX + (toX - fromX) * .65, toY + 10, toX, toY); ctx.stroke(); ctx.setLineDash([]);
    });
    map.markers.forEach((marker) => {
      const x = (marker.x + .5) * cellW; const y = (marker.y + .5) * cellH; const selected = marker.id === selectedId;
      if (marker.kind === 'label') { ctx.font = 'bold 18px Georgia'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(65,48,33,.72)'; ctx.fillText(marker.name.toUpperCase().split('').join(' '), x, y); return; }
      ctx.fillStyle = selected ? '#f0cf76' : '#ead9aa'; ctx.strokeStyle = '#30271d'; ctx.lineWidth = selected ? 4 : 2;
      ctx.beginPath(); ctx.arc(x, y, marker.kind === 'capital' ? 11 : 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#352a1e'; ctx.font = `bold ${marker.kind === 'capital' ? 14 : 11}px Georgia`; ctx.textAlign = 'center';
      const glyph = marker.kind === 'capital' ? '✦' : marker.kind === 'fort' ? '▰' : marker.kind === 'ruin' ? '×' : marker.kind === 'port' ? '≈' : '•'; ctx.fillText(glyph, x, y + 4);
      ctx.font = 'bold 14px Georgia'; ctx.fillStyle = '#33281d'; ctx.strokeStyle = 'rgba(232,216,172,.82)'; ctx.lineWidth = 5; ctx.strokeText(marker.name, x, y + 27); ctx.fillText(marker.name, x, y + 27);
    });
    ctx.strokeStyle = '#372e24'; ctx.lineWidth = 10; ctx.strokeRect(7, 7, w - 14, h - 14);
    ctx.strokeStyle = 'rgba(235,214,158,.68)'; ctx.lineWidth = 2; ctx.strokeRect(15, 15, w - 30, h - 30);
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
        <div className="dm-notice">Shape an illustrated parchment atlas, place named locations, and connect them with roads or rivers. The invisible survey cells keep editing easy; they do not appear on the player map.</div>
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
      <section className="world-map-stage"><header><span>{map.title}</span><small>{map.subtitle}</small></header><canvas ref={canvasRef} width="1200" height="800" aria-label="Editable illustrated map of the Solenian Empire" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => setPainting(false)} onPointerCancel={() => setPainting(false)} /><footer><span>ILLUSTRATED IMPERIAL ATLAS</span><span>{mode.toUpperCase()} TOOL ACTIVE</span><span>{map.markers.length} LOCATIONS RECORDED</span></footer></section>
    </div>
  </section>;
}
