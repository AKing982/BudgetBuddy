// ── Shared types, constants, and helpers for all envelope step components ────
import React from 'react';
import {
    PiggyBank, Wallet, XCircle,
    Layers, Target, Calendar, TrendingUp, CheckCircle, CreditCard,
    PiggyBank as PB,
} from 'lucide-react';

// ── Design tokens ─────────────────────────────────────────────────────────────
export const MAROON      = '#6b1a1a';
export const MAROON_DARK = '#4a1010';

export const ENVELOPE_COLORS: Record<string, string> = {
    FUND:     '#0284c7',
    PAYOFF:   '#dc2626',
    PURCHASE: '#7c3aed',
};

export const ENVELOPE_ICONS: Record<string, React.ReactNode> = {
    FUND:     React.createElement(PiggyBank, { size: 22 }),
    PAYOFF:   React.createElement(XCircle,   { size: 22 }),
    PURCHASE: React.createElement(Wallet,    { size: 22 }),
};

export const ENVELOPE_DESCRIPTIONS: Record<string, string> = {
    FUND:     'Set aside money toward a future goal — vacation, education, big life moment.',
    PAYOFF:   'Eliminate a specific debt or purchase balance before interest kicks in.',
    PURCHASE: 'Save up for a specific item you plan to buy — laptop, appliance, gear.',
};

export const FREQUENCY_LABELS: Record<string, string> = {
    WEEKLY:   'Weekly',
    BIWEEKLY: 'Bi-weekly',
    MONTHLY:  'Monthly',
};

// ── Domain types ──────────────────────────────────────────────────────────────
export interface PaymentInfo {
    numberOfPayments:   number;
    totalMonths:        number;
    totalAmount:        number;
    endDate:            string;
    firstPaymentDate:   string;
    firstPaymentAmount: number;
    isPayInFour:        boolean;
    merchant:           string;
    description:        string;
}

export interface NewEnvelopeForm {
    envelopeType:          'FUND' | 'PAYOFF' | 'PURCHASE' | '';
    envelopeName:          string;
    targetAmount:          number | '';
    startingAmount:        number | '';
    targetDate:            string;
    contributionMode:      'manual' | 'auto' | '';
    monthlyContribution:   number | '';
    contributionFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    description:           string;
    paymentInfo:           PaymentInfo | null;
}

// Convenience type for the update callback every step receives
export type FormUpdater = (k: keyof NewEnvelopeForm, v: any) => void;

// ── Blank factories ───────────────────────────────────────────────────────────
export const BLANK_FORM = (): NewEnvelopeForm => ({
    envelopeType:          '',
    envelopeName:          '',
    targetAmount:          '',
    startingAmount:        '',
    targetDate:            '',
    contributionMode:      '',
    monthlyContribution:   '',
    contributionFrequency: 'MONTHLY',
    description:           '',
    paymentInfo:           null,
});

export const BLANK_PAYMENT_INFO = (): PaymentInfo => ({
    numberOfPayments:   12,
    totalMonths:        12,
    totalAmount:        0,
    endDate:            '',
    firstPaymentDate:   '',
    firstPaymentAmount: 0,
    isPayInFour:        false,
    merchant:           '',
    description:        '',
});

// ── Step config ───────────────────────────────────────────────────────────────
export interface StepConfig { id: string; label: string; icon: React.ReactNode }

export const ALL_STEPS: StepConfig[] = [
    { id: 'mode',         label: 'Envelope Mode', icon: React.createElement(Layers,      { size: 14 }) },
    { id: 'type',         label: 'Goal Type',     icon: React.createElement(Target,      { size: 14 }) },
    { id: 'name',         label: 'Details',       icon: React.createElement(Wallet,      { size: 14 }) },
    { id: 'payment',      label: 'Payment Info',  icon: React.createElement(CreditCard,  { size: 14 }) },
    { id: 'amount',       label: 'Amounts',       icon: React.createElement(PB,          { size: 14 }) },
    { id: 'timeline',     label: 'Timeline',      icon: React.createElement(Calendar,    { size: 14 }) },
    { id: 'contribution', label: 'Contributions', icon: React.createElement(TrendingUp,  { size: 14 }) },
    { id: 'review',       label: 'Review',        icon: React.createElement(CheckCircle, { size: 14 }) },
];

/** Returns the step list, inserting the Payment step only for PAYOFF envelopes. */
export function buildSteps(envelopeType: string): StepConfig[] {
    return ALL_STEPS.filter(s => s.id !== 'payment' || envelopeType === 'PAYOFF');
}

// ── Shared helpers ────────────────────────────────────────────────────────────
export function monthsToReach(target: number, current: number, monthly: number): number | null {
    const remaining = target - current;
    if (monthly <= 0 || remaining <= 0) return null;
    return Math.ceil(remaining / monthly);
}

export function addMonths(months: number): Date {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d;
}

export function dateFromStr(s: string): Date | null {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}

export function monthsBetween(from: Date, to: Date): number {
    return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

export function autoMonthly(target: number, current: number, targetDate: string): number {
    const d = dateFromStr(targetDate);
    if (!d) return 0;
    const months = monthsBetween(new Date(), d);
    if (months <= 0) return target - current;
    return Math.ceil((target - (current || 0)) / months);
}

export function fmtDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function fmt(n: number): string {
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}