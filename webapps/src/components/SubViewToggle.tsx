// ── SubViewToggle.tsx ─────────────────────────────────────────────────────────
// Pill toggle rendered inside a MaroonCardHeader for switching between
// Classic / Rolling / Dashboard sub-views.
import React from 'react';
import { Box } from '@mui/material';
import { TableIcon, BarChart2, LayoutDashboard } from 'lucide-react';
import type { SubViewMode } from '../domain/SpreadsheetTypes';

interface Option {
    key:   SubViewMode;
    label: string;
    icon:  React.ReactNode;
}

const ALL_OPTIONS: Option[] = [
    { key: 'classic',   label: 'Classic',   icon: <TableIcon size={11} />       },
    { key: 'rolling',   label: 'Rolling',   icon: <BarChart2 size={11} />       },
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={11} /> },
];

interface Props {
    active:       SubViewMode;
    onChange:     (v: SubViewMode) => void;
    /** Which options to show. Defaults to ['classic','rolling','dashboard'] */
    options?:     SubViewMode[];
}

const SubViewToggle: React.FC<Props> = ({ active, onChange, options }) => {
    const shown = options
        ? ALL_OPTIONS.filter(o => options.includes(o.key))
        : ALL_OPTIONS;

    return (
        <Box sx={{
            display: 'flex',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '6px',
            overflow: 'hidden',
        }}>
            {shown.map(({ key, label, icon }) => (
                <Box
                    key={key}
                    onClick={() => onChange(key)}
                    sx={{
                        px: 1.25, py: 0.5,
                        display: 'flex', alignItems: 'center', gap: 0.5,
                        cursor: 'pointer',
                        bgcolor: active === key ? 'rgba(255,255,255,0.22)' : 'transparent',
                        color: '#fff',
                        fontSize: '0.72rem', fontWeight: 600,
                        borderRight: '1px solid rgba(255,255,255,0.2)',
                        transition: 'all .15s',
                        '&:last-child': { borderRight: 'none' },
                        '&:hover': active !== key ? { bgcolor: 'rgba(255,255,255,0.12)' } : {},
                        userSelect: 'none',
                    }}
                >
                    {icon}{label}
                </Box>
            ))}
        </Box>
    );
};

export default SubViewToggle;