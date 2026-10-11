// ── SegmentedToggle.tsx ───────────────────────────────────────────────────────
import React from 'react';
import { Box, ButtonBase } from '@mui/material';
import { T } from '../budgetTheme';

export interface SegmentOption<V extends string> { value: V; label: string; disabled?: boolean; }

interface Props<V extends string> {
    label: string;                 // accessible name for the group
    value: V;
    options: SegmentOption<V>[];
    onChange: (value: V) => void;
    size?: 'sm' | 'md';
}

function SegmentedToggle<V extends string>({ label, value, options, onChange, size = 'md' }: Props<V>) {
    const height = size === 'sm' ? 30 : 34;
    return (
        <Box role="group" aria-label={label}
             sx={{ display: 'inline-flex', p: '3px', gap: '2px', bgcolor: size === 'sm' ? T.subtle : T.toggleTrack, borderRadius: '9px' }}>
            {options.map(o => {
                const active = o.value === value;
                return (
                    <ButtonBase key={o.value} aria-pressed={active} disabled={o.disabled} onClick={() => onChange(o.value)}
                                sx={{
                                    height, px: size === 'sm' ? 1.25 : 1.5, borderRadius: '7px',
                                    fontFamily: 'inherit', fontSize: size === 'sm' ? 12 : 13, fontWeight: 600,
                                    bgcolor: active ? T.surface : 'transparent',
                                    color: active ? (size === 'sm' ? T.accent : T.text) : '#4E4644',
                                    boxShadow: active ? '0 1px 2px rgba(40,20,20,0.12)' : 'none',
                                    '&.Mui-disabled': { color: T.mutedSoft },
                                    '&.Mui-focusVisible': { outline: `2px solid ${T.accent}`, outlineOffset: 1 },
                                }}>
                        {o.label}
                    </ButtonBase>
                );
            })}
        </Box>
    );
}

export default SegmentedToggle;