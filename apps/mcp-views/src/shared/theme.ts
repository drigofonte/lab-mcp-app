import type React from 'react';

// ── Shadcn light zinc palette ──────────────────────────────────────
export const colors = {
  background: '#ffffff',
  foreground: '#09090b',       // zinc-950
  muted: '#71717a',            // zinc-500
  mutedBg: '#f4f4f5',          // zinc-100
  border: '#e4e4e7',           // zinc-200
  inputBorder: '#d4d4d8',      // zinc-300
  ring: '#a1a1aa',             // zinc-400
  primary: '#18181b',          // zinc-900
  primaryFg: '#fafafa',        // zinc-50
  accent: '#2563eb',           // blue-600
  destructive: '#ef4444',      // red-500
  success: '#15803d',          // green-700
  cardBg: '#ffffff',
} as const;

// ── Status badge styles ────────────────────────────────────────────
const statusBadgeMap: Record<string, { backgroundColor: string; color: string }> = {
  todo:          { backgroundColor: '#f4f4f5', color: '#71717a' },
  'in-progress': { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  done:          { backgroundColor: '#dcfce7', color: '#15803d' },
};

export function getStatusBadge(status: string) {
  return statusBadgeMap[status] ?? statusBadgeMap.todo;
}

// ── Priority badge styles ──────────────────────────────────────────
const priorityBadgeMap: Record<string, { backgroundColor: string; color: string }> = {
  low:    { backgroundColor: '#f4f4f5', color: '#71717a' },
  medium: { backgroundColor: '#fef3c7', color: '#b45309' },
  high:   { backgroundColor: '#fee2e2', color: '#dc2626' },
};

export function getPriorityBadge(priority: string) {
  return priorityBadgeMap[priority] ?? priorityBadgeMap.low;
}

// ── Shared CSS reset ───────────────────────────────────────────────
export const cssText = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    color: ${colors.foreground};
    background: ${colors.background};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;

// ── Reusable component styles ──────────────────────────────────────
export const shared: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    margin: '0 auto',
  },
  card: {
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: colors.cardBg,
  },
  heading: {
    fontSize: '20px',
    fontWeight: 600,
    color: colors.foreground,
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: colors.foreground,
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: colors.foreground,
    backgroundColor: colors.background,
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: colors.foreground,
    backgroundColor: colors.background,
    outline: 'none',
    textTransform: 'capitalize',
    cursor: 'pointer',
  },
  primaryButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: colors.primary,
    color: colors.primaryFg,
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    lineHeight: '20px',
  },
  secondaryButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.background,
    color: colors.foreground,
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    lineHeight: '20px',
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  field: {
    marginBottom: '14px',
  },
  backLink: {
    display: 'inline-block',
    marginBottom: '12px',
    fontSize: '13px',
    color: colors.muted,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 500,
    textTransform: 'capitalize',
    lineHeight: '20px',
  },
  loading: { padding: '24px', textAlign: 'center', color: colors.muted, fontSize: '14px' },
  error: { padding: '24px', textAlign: 'center', color: colors.destructive, fontSize: '14px' },
};
