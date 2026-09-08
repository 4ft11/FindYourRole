'use client';

import type { CSSProperties } from 'react';
import type { RoleStatus } from '@/lib/campaign-types';

export const defaultRoleStatus: RoleStatus = { label: 'ROLES LOCATED', total: 5, filled: 4, displayValue: '4 / 5', bubbles: ['filled', 'filled', 'filled', 'filled', 'empty'], flickerFifth: true, statusMessage: '', accentColor: '#715328', filledColor: '#4b361d', emptyColor: '#c9b77f' };

export default function RoleStatusBar({ status = defaultRoleStatus }: { status?: RoleStatus }) {
  const bubbles = Array.from({ length: status.total }, (_, index) => status.bubbles[index] || 'unknown');
  const colors = { '--status-accent': status.accentColor, '--status-filled': status.filledColor, '--status-empty': status.emptyColor } as CSSProperties;
  return <aside className="role-status" style={colors} aria-label={`${status.filled} of ${status.total} roles located${status.statusMessage ? `. ${status.statusMessage}` : ''}`}>
    <span className="role-status-label">{status.label}</span>
    <span className="role-bubbles" aria-hidden="true">{bubbles.map((state, index) => <i key={index} className={`role-bubble bubble-${state} ${status.flickerFifth && index === 4 ? 'may-flicker' : ''}`} />)}</span>
    <strong>{status.displayValue || `${status.filled} / ${status.total}`}</strong>
    {status.statusMessage && <small>{status.statusMessage}</small>}
  </aside>;
}
