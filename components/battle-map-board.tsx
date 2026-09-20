'use client';

import type { BattleMapState, MapToken } from '@/lib/battle-map-types';
import { mapDistance } from '@/lib/battle-map-types';

type Cell = { x: number; y: number };

export default function BattleMapBoard({ state, selectedTokenId = '', interactive = false, hoverCell, measureStart, moveStart, rangeOrigin, rangeFeet = 0, onCellClick, onCellHover, onTokenClick }: {
  state: BattleMapState;
  selectedTokenId?: string;
  interactive?: boolean;
  hoverCell?: Cell | null;
  measureStart?: Cell | null;
  moveStart?: Cell | null;
  rangeOrigin?: Cell | null;
  rangeFeet?: number;
  onCellClick?: (cell: Cell) => void;
  onCellHover?: (cell: Cell | null) => void;
  onTokenClick?: (token: MapToken) => void;
}) {
  const visibleTokens = state.tokens.filter((token) => interactive || token.visible);
  const lineStart = measureStart || moveStart;
  const lineDistance = lineStart && hoverCell ? mapDistance(lineStart, hoverCell, state.feetPerCell) : 0;
  const effect = state.effect;
  const cells = Array.from({ length: state.columns * state.rows }, (_, index) => ({ x: index % state.columns, y: Math.floor(index / state.columns) }));

  return <div className={`battle-board grid-${state.gridKind} ${state.gridVisible ? 'show-grid' : ''}`} style={{ aspectRatio: `${state.columns} / ${state.rows}`, backgroundImage: state.backgroundDataUrl ? `linear-gradient(rgba(5,8,12,.08),rgba(5,8,12,.08)),url(${state.backgroundDataUrl})` : undefined }} onMouseLeave={() => onCellHover?.(null)}>
    <div className="battle-cells" style={{ gridTemplateColumns: `repeat(${state.columns}, 1fr)`, gridTemplateRows: `repeat(${state.rows}, 1fr)` }}>
      {cells.map((cell) => <button key={`${cell.x}-${cell.y}`} type="button" tabIndex={interactive ? 0 : -1} aria-label={interactive ? `Map square ${cell.x + 1}, ${cell.y + 1}` : undefined} onMouseEnter={() => onCellHover?.(cell)} onFocus={() => onCellHover?.(cell)} onClick={() => onCellClick?.(cell)} disabled={!interactive} />)}
    </div>
    {lineStart && hoverCell && <svg className="map-line-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1={(lineStart.x + .5) / state.columns * 100} y1={(lineStart.y + .5) / state.rows * 100} x2={(hoverCell.x + .5) / state.columns * 100} y2={(hoverCell.y + .5) / state.rows * 100} vectorEffect="non-scaling-stroke" /></svg>}
    {lineStart && hoverCell && <span className="map-distance-tag" style={{ left: `${(hoverCell.x + .5) / state.columns * 100}%`, top: `${(hoverCell.y + .5) / state.rows * 100}%` }}>{lineDistance} FT</span>}
    {rangeOrigin && rangeFeet > 0 && <div className="map-range-ring" style={{ left: `${(rangeOrigin.x + .5) / state.columns * 100}%`, top: `${(rangeOrigin.y + .5) / state.rows * 100}%`, width: `${(rangeFeet / state.feetPerCell) * 2 / state.columns * 100}%`, aspectRatio: '1' }}><span>{rangeFeet} FT RANGE</span></div>}
    {visibleTokens.map((token) => <button type="button" key={token.id} className={`map-token token-${token.kind} ${selectedTokenId === token.id ? 'selected' : ''} ${state.activeTurnId === token.id ? 'active-turn' : ''} ${token.visible ? '' : 'dm-hidden-token'}`} style={{ left: `${(token.x + .5) / state.columns * 100}%`, top: `${(token.y + .5) / state.rows * 100}%`, width: `${Math.max(1, token.size) / state.columns * 86}%`, aspectRatio: '1', background: token.color }} onClick={(event) => { event.stopPropagation(); onTokenClick?.(token); }} disabled={!interactive} aria-label={`${token.name}, ${token.kind}`}><span>{token.name.slice(0, 2).toUpperCase()}</span><small>{token.name}</small></button>)}
    {effect && <div key={effect.id} className={`map-spell-effect effect-${effect.effectKind} outcome-${effect.outcome} area-${effect.areaKind}`} style={{ left: `${(effect.x + .5) / state.columns * 100}%`, top: `${(effect.y + .5) / state.rows * 100}%`, width: `${Math.max(1.2, (effect.areaFeet / state.feetPerCell) * 2) / state.columns * 100}%`, aspectRatio: '1' }} aria-label={`${effect.spellName}: ${effect.outcome}`}><i /><i /><i /><strong>{effect.spellName}<small>{effect.outcome}</small></strong></div>}
  </div>;
}
