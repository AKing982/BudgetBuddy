// ── SharedBudgetUI.tsx ────────────────────────────────────────────────────────
// Small, reusable UI primitives shared across budget planner sub-views.
// Kept here so they're not duplicated in every sub-component.
import React, { useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { MAROON, AMBER, SLATE, fmt } from '../domain/SpreadsheetTypes';
import type { PeriodFilter } from '../domain/SpreadsheetTypes';

// ── Maroon gradient card header ───────────────────────────────────────────────
interface CardHeaderProps {
    icon:      React.ReactNode;
    title:     string;
    subtitle:  string;
    right?:    React.ReactNode;
}

export const MaroonCardHeader: React.FC<CardHeaderProps> = ({ icon, title, subtitle, right }) => (
    <Box sx={{
        background: 'linear-gradient(135deg,#4a1010 0%,#6b1a1a 50%,#5a1515 100%)',
        px: 3, py: 2,
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
        <Box sx={{ position:'absolute', top:-16, right:-16, width:80, height:80, borderRadius:'50%', bgcolor:'rgba(255,255,255,0.06)' }}/>
        <Box sx={{ position:'absolute', bottom:-20, right:50, width:50, height:50, borderRadius:'50%', bgcolor:'rgba(255,255,255,0.04)' }}/>
        <Box sx={{ display:'flex', alignItems:'center', gap:1.25, position:'relative' }}>
            <Box sx={{ width:30, height:30, borderRadius:'8px', bgcolor:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {icon}
            </Box>
            <Box>
                <Typography sx={{ fontWeight:700, fontSize:'0.92rem', color:'#fff', letterSpacing:'-0.01em' }}>{title}</Typography>
                <Typography sx={{ fontSize:'0.67rem', color:'rgba(255,255,255,0.7)', mt:0.1 }}>{subtitle}</Typography>
            </Box>
        </Box>
        {right && <Box sx={{ position:'relative' }}>{right}</Box>}
    </Box>
);

// ── Period filter pills ───────────────────────────────────────────────────────
interface PeriodPillsProps {
    active:   PeriodFilter;
    onChange: (p: PeriodFilter) => void;
}

export const PeriodPills: React.FC<PeriodPillsProps> = ({ active, onChange }) => (
    <Box sx={{ display:'flex', alignItems:'center', gap:0.75, mb:2 }}>
        {(['Weekly','Biweekly','Monthly'] as PeriodFilter[]).map(p => (
            <Box
                key={p}
                onClick={() => onChange(p)}
                sx={{
                    px:1.5, py:0.45, borderRadius:'20px', cursor:'pointer',
                    fontSize:'0.74rem', fontWeight:600, transition:'all 0.15s',
                    border: `1px solid ${active === p ? MAROON : alpha('#000', 0.12)}`,
                    bgcolor: active === p ? MAROON : '#fff',
                    color:   active === p ? '#fff'  : SLATE,
                    '&:hover': { borderColor: MAROON, color: active === p ? '#fff' : MAROON },
                    userSelect: 'none',
                }}
            >
                {p}
            </Box>
        ))}
    </Box>
);

// ── Inline editable cell ──────────────────────────────────────────────────────
interface EditCellProps {
    value:    number | null;
    onChange: (v: number | null) => void;
    /** Render as read-only (past column) */
    readOnly?: boolean;
}

export const EditCell: React.FC<EditCellProps> = ({ value, onChange, readOnly }) => {
    const [active, setActive] = useState(false);
    const [local,  setLocal]  = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const activate = () => {
        if (readOnly) return;
        setLocal(value === null ? '' : String(value));
        setActive(true);
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
        }, 0);
    };

    const commit = () => {
        const n = parseFloat(local);
        onChange(local === '' ? null : isNaN(n) ? null : n);
        setActive(false);
    };

    if (!active) {
        return (
            <Box
                onClick={activate}
                sx={{
                    cursor: readOnly ? 'default' : 'cell',
                    textAlign: 'right', px: 0.5, borderRadius: '3px', minWidth: 70,
                    '&:hover': readOnly ? {} : { bgcolor: alpha(MAROON, 0.06) },
                }}
            >
                {value !== null ? `$${fmt(value)}` : ''}
            </Box>
        );
    }

    return (
        <Box
            component="input"
            ref={inputRef}
            value={local}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocal(e.target.value)}
            onBlur={commit}
            onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === 'Tab') commit();
                if (e.key === 'Escape') setActive(false);
            }}
            sx={{
                width: '100%', minWidth: 70,
                border: `1.5px solid ${MAROON}`,
                borderRadius: '3px', px: 0.75, py: 0.25,
                fontSize: '0.78rem', textAlign: 'right',
                bgcolor: '#fff', outline: 'none', fontFamily: 'inherit',
            }}
        />
    );
};

// ── Shared table cell style helpers ──────────────────────────────────────────
export const thSx = (extra?: object) => ({
    fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', color: MAROON, py: 1.25,
    whiteSpace: 'nowrap', bgcolor: '#fdf8f8',
    borderBottom: `1.5px solid ${alpha(MAROON, 0.15)}`,
    ...extra,
});

export const tdSx = (extra?: object) => ({
    fontSize: '0.8rem', py: 0.9, whiteSpace: 'nowrap', ...extra,
});