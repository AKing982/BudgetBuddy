import React from 'react';
import { PiggyBank, XCircle, Wallet, Flame, TrendingUp, CheckCircle, PauseCircle } from 'lucide-react';

// ── Design tokens ─────────────────────────────────────────────────────────────
export const MAROON      = '#6b1a1a';
export const MAROON_DARK = '#4a1010';

export const ENVELOPE_COLORS: Record<string, string> = {
    SAVINGS:   '#0284c7',
    PAYOFF:    '#dc2626',
    PURCHASE:  '#7c3aed',
    EMERGENCY: '#d97706',
    FUND: '#0284c7'
};

export const ENVELOPE_TYPE_LABELS: Record<string, string> = {
    SAVINGS:   'Savings',
    PAYOFF:    'Pay-Off',
    PURCHASE:  'Purchase',
    EMERGENCY: 'Emergency',
};

export const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    ACTIVE:    { label: 'Active',    color: '#16a34a', icon: React.createElement(TrendingUp,  { size: 11 }) },
    COMPLETED: { label: 'Completed', color: '#0284c7', icon: React.createElement(CheckCircle, { size: 11 }) },
    PAUSED:    { label: 'Paused',    color: '#d97706', icon: React.createElement(PauseCircle, { size: 11 }) },
    CANCELLED: { label: 'Cancelled', color: '#94a3b8', icon: React.createElement(XCircle,     { size: 11 }) },
};

export const TYPE_ICONS: Record<string, React.ReactNode> = {
    SAVINGS:   React.createElement(PiggyBank, { size: 14 }),
    PAYOFF:    React.createElement(XCircle,   { size: 14 }),
    PURCHASE:  React.createElement(Wallet,    { size: 14 }),
    EMERGENCY: React.createElement(Flame,     { size: 14 }),
};

export const FREQUENCY_OPTIONS = [
    { value: 'MONTHLY_1ST',  label: 'Monthly — on the 1st'  },
    { value: 'MONTHLY_15TH', label: 'Monthly — on the 15th' },
    { value: 'BIWEEKLY',     label: 'Bi-weekly'             },
    { value: 'WEEKLY',       label: 'Weekly'                },
];

export const SOURCE_OPTIONS = [
    { value: 'checking_4821', label: 'Checking ····4821' },
    { value: 'savings_9043',  label: 'Savings ····9043'  },
];

export const TL_MONTHS = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const TL_START  = new Date('2026-05-01').getTime();
export const TL_END    = new Date('2026-12-31').getTime();
export const TL_SPAN   = TL_END - TL_START;