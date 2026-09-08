import React, { useEffect, useMemo, useState } from 'react';
import { alpha, Box, Switch, Typography } from '@mui/material';
import { AlertTriangle } from 'lucide-react';
import { BudgetEnvelope } from '../config/Types';
import { MAROON } from '../config/Constants';
import { fmt } from '../config/Helpers';

const BORDER   = '1px solid #ecd9d9';
const PANEL_BG = '#fdf7f7';
const SECTION_LABEL_SX = {
    fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.06em', color: '#a35c5c',
};

const STORAGE_KEY = 'envelopeAlertsEnabled';

/** Reads the on/off preference from localStorage as a stand-in for a real per-user setting.
 * Falls back to enabled if storage is unavailable (private browsing, SSR, etc). */
function readStoredPreference(): boolean {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw === null ? true : raw === 'true';
    } catch {
        return true;
    }
}

interface AlertItem {
    envelopeId:   number;
    envelopeName: string;
    amount:       number;
    date:         string;
    kind:         'behind' | 'due';
}

/**
 * Derives alerts from each envelope's own scheduled-contribution list (the same
 * `env.contributions` array already passed to EnvelopeDetailPanel as scheduledContributions),
 * rather than a separate notifications fetch — no new endpoint needed. MISSED entries, and
 * SCHEDULED entries whose date has already passed, count as "behind"; SCHEDULED entries within
 * `daysAheadThreshold` count as "due soon".
 */
function buildAlerts(envelopes: BudgetEnvelope[], daysAheadThreshold: number, now: Date): AlertItem[] {
    const cutoff = new Date(now.getTime() + daysAheadThreshold * 24 * 60 * 60 * 1000);
    const items: AlertItem[] = [];

    envelopes.forEach(env => {
        (env.contributions ?? []).forEach(sc => {
            const scheduledDate = new Date(sc.scheduledDate);
            if (sc.status === 'MISSED') {
                items.push({ envelopeId: env.id, envelopeName: env.envelopeName, amount: sc.amount, date: sc.scheduledDate, kind: 'behind' });
            } else if (sc.status === 'SCHEDULED' && scheduledDate <= cutoff) {
                items.push({ envelopeId: env.id, envelopeName: env.envelopeName, amount: sc.amount, date: sc.scheduledDate, kind: scheduledDate <= now ? 'behind' : 'due' });
            }
        });
    });

    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

const fmtAlertDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

interface EnvelopeAlertsPanelProps {
    envelopes: BudgetEnvelope[];
    /** Called when the user clicks an alert row's "Pay" action — jumps to that envelope. */
    onSelectEnvelope: (id: number) => void;
    /** Optional — opens the full Notifications dialog for "View all". Omit to hide that link. */
    onViewAll?: () => void;
    /** How many days ahead counts as "due soon". Defaults to 14. */
    daysAheadThreshold?: number;
    /** Cap on how many rows to show before "View all" takes over. Defaults to 3. */
    maxVisible?: number;
}

const EnvelopeAlertsPanel: React.FC<EnvelopeAlertsPanelProps> = ({
                                                                     envelopes, onSelectEnvelope, onViewAll, daysAheadThreshold = 14, maxVisible = 3,
                                                                 }) => {
    const [enabled, setEnabled] = useState<boolean>(readStoredPreference);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, String(enabled)); } catch { /* private browsing etc — non-fatal */ }
    }, [enabled]);

    const alerts = useMemo(() => buildAlerts(envelopes, daysAheadThreshold, new Date()), [envelopes, daysAheadThreshold]);
    const behindCount = alerts.filter(a => a.kind === 'behind').length;
    const visible = alerts.slice(0, maxVisible);

    // Collapsed strip — the toggle stays reachable even while off, rather than the whole
    // panel vanishing with no way back short of a settings page that doesn't exist yet.
    if (!enabled) {
        return (
            <Box sx={{ borderRadius: '12px', border: BORDER, bgcolor: PANEL_BG, px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={SECTION_LABEL_SX}>Alerts — hidden</Typography>
                <Switch size="small" checked={enabled} onChange={(e) => setEnabled(e.target.checked)}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: MAROON }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: MAROON } }} />
            </Box>
        );
    }

    return (
        <Box sx={{ borderRadius: '12px', border: BORDER, bgcolor: PANEL_BG, p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: alerts.length > 0 ? 1.5 : 0.5 }}>
                <Typography sx={SECTION_LABEL_SX}>Alerts</Typography>
                <Switch size="small" checked={enabled} onChange={(e) => setEnabled(e.target.checked)}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: MAROON }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: MAROON } }} />
            </Box>

            {alerts.length === 0 ? (
                <Typography sx={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', py: 1 }}>
                    Nothing needs attention right now
                </Typography>
            ) : (
                <>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        {visible.map((a, i) => {
                            const color = a.kind === 'behind' ? '#dc2626' : '#d97706';
                            const label = a.kind === 'behind' ? 'past due' : 'due soon';
                            return (
                                <Box key={`${a.envelopeId}-${a.date}-${i}`}
                                     sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 1, borderBottom: i < visible.length - 1 ? BORDER : 'none' }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontSize: '0.78rem', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {fmt(a.amount)} {label} · {a.envelopeName}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>{fmtAlertDate(a.date)}</Typography>
                                    </Box>
                                    <Box component="button" onClick={() => onSelectEnvelope(a.envelopeId)}
                                         sx={{ fontSize: '0.72rem', fontWeight: 500, color: MAROON, bgcolor: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, p: 0.5, '&:hover': { textDecoration: 'underline' } }}>
                                        Pay
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>

                    {(alerts.length > maxVisible || onViewAll) && (
                        <Typography onClick={onViewAll} sx={{ fontSize: '0.72rem', color: MAROON, textAlign: 'center', mt: 1.25, cursor: onViewAll ? 'pointer' : 'default', '&:hover': onViewAll ? { opacity: 0.75 } : undefined }}>
                            View all {alerts.length} →
                        </Typography>
                    )}

                    {behindCount > 0 && (
                        <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 0.75, color: '#a34848' }}>
                            <AlertTriangle size={12} />
                            <Typography sx={{ fontSize: '0.65rem' }}>{behindCount} past due — these keep aging until paid</Typography>
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default EnvelopeAlertsPanel;