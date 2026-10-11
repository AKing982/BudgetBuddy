// ── budgetWeeks.ts ────────────────────────────────────────────────────────────
// Pure helpers for splitting a month into weeks and grouping spending. No React, no services.
import { addDays, differenceInCalendarDays, endOfMonth, format, startOfDay, startOfMonth } from 'date-fns';

export type BackendDate = string | number[] | Date | null | undefined;

/** Same shape TransactionCategoryService.fetchCSVTransactionsByCategoryWithDate returns. */
export interface CategoryTransactionsByDate {
    category: string;
    totalCategorySpending: number;
    transactionDate: BackendDate;
}

export interface WeekRange {
    index: number;
    start: Date;
    end: Date;
    days: number;
    title: string;       // "Week 2"
    rangeLabel: string;  // "Oct 8 – 14"
}

export interface CategoryAmount {
    category: string;
    amount: number;
}

/** "2026-10-07", [2026, 10, 7] or a Date → local Date at midnight. */
export function toLocalDate(d: BackendDate): Date | null {
    if (d == null) return null;
    if (d instanceof Date) return startOfDay(d);
    if (Array.isArray(d)) return new Date(d[0], d[1] - 1, d[2]);
    const [y, m, day] = String(d).slice(0, 10).split('-').map(Number);
    return y && m && day ? new Date(y, m - 1, day) : null;
}

export const toIsoDate = (d: Date): string => format(d, 'yyyy-MM-dd');

export const isWithin = (d: Date, start: Date, end: Date): boolean =>
    d.getTime() >= startOfDay(start).getTime() && d.getTime() <= startOfDay(end).getTime();

/** Days 1–7, 8–14, 15–21, and 22 to the end of the month. */
export function splitMonthIntoWeeks(month: Date): WeekRange[] {
    const first = startOfMonth(month);
    const last = startOfDay(endOfMonth(month));
    const starts = [0, 7, 14, 21].map(offset => addDays(first, offset));
    return starts.map((start, i) => {
        const end = i < 3 ? addDays(start, 6) : last;
        return {
            index: i,
            start,
            end,
            days: differenceInCalendarDays(end, start) + 1,
            title: `Week ${i + 1}`,
            rangeLabel: `${format(start, 'MMM d')} – ${format(end, 'd')}`,
        };
    });
}

export const daysInMonth = (month: Date): number => endOfMonth(month).getDate();

/** Total spending per category inside [start, end], largest first. */
export function spendingByCategory(txns: CategoryTransactionsByDate[], start: Date, end: Date): CategoryAmount[] {
    const totals = new Map<string, number>();
    for (const t of txns) {
        const d = toLocalDate(t.transactionDate);
        if (!d || !isWithin(d, start, end)) continue;
        totals.set(t.category, (totals.get(t.category) ?? 0) + (t.totalCategorySpending ?? 0));
    }
    return Array.from(totals, ([category, amount]) => ({ category, amount }))
        .filter(c => c.amount > 0)
        .sort((a, b) => b.amount - a.amount);
}

export const sumSpending = (parts: CategoryAmount[]): number => parts.reduce((t, p) => t + p.amount, 0);

/** Monthly budget × days in the week ÷ days in the month, for each category. */
export function proratedWeekBudgets(monthlyBudgets: Record<string, number>, week: WeekRange, monthDays: number): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [category, monthly] of Object.entries(monthlyBudgets)) {
        out[category] = Math.round((monthly * week.days) / monthDays);
    }
    return out;
}

export const weekContainsToday = (week: WeekRange): boolean => isWithin(startOfDay(new Date()), week.start, week.end);

// ── Pay period, derived from income transactions (no extra service) ─────────
export interface DerivedPayPeriod {
    start: Date;          // last payday
    end: Date;            // day before the next expected payday
    nextPayDate: Date;
    paycheck: number;     // income received on the last payday
}

const INCOME_PATTERN = /income|salary|paycheck|payroll|wages/i;
export const isIncomeCategory = (category: string): boolean => INCOME_PATTERN.test(category);

/**
 * Finds the last payday in the transactions and the gap to the payday before it.
 * Gap defaults to 14 days when only one payday is found. Returns null when no income is found.
 */
export function derivePayPeriod(txns: CategoryTransactionsByDate[], today: Date = new Date()): DerivedPayPeriod | null {
    const byDay = new Map<number, number>();
    for (const t of txns) {
        if (!isIncomeCategory(t.category)) continue;
        const d = toLocalDate(t.transactionDate);
        if (!d || d.getTime() > startOfDay(today).getTime()) continue;
        byDay.set(d.getTime(), (byDay.get(d.getTime()) ?? 0) + (t.totalCategorySpending ?? 0));
    }
    const days = Array.from(byDay.keys()).sort((a, b) => a - b);
    if (days.length === 0) return null;
    const last = new Date(days[days.length - 1]);
    const prev = days.length > 1 ? new Date(days[days.length - 2]) : null;
    const gap = prev ? Math.min(31, Math.max(7, differenceInCalendarDays(last, prev))) : 14;
    const nextPayDate = addDays(last, gap);
    return { start: last, end: addDays(nextPayDate, -1), nextPayDate, paycheck: byDay.get(days[days.length - 1]) ?? 0 };
}

/**
 * fetchCSVTransactionsByCategoryWithDate doesn't always come back as a plain array
 * (it can be wrapped, a map keyed by date or category, or empty/null). Normalise it.
 */
export function toTransactionArray(raw: unknown): CategoryTransactionsByDate[] {
    const isTxn = (v: any): v is CategoryTransactionsByDate =>
        v && typeof v === 'object' && 'category' in v && 'totalCategorySpending' in v;
    if (Array.isArray(raw)) return raw.filter(isTxn);
    if (!raw || typeof raw !== 'object') return [];
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return (obj.data as unknown[]).filter(isTxn);
    // map shape: { "2026-10-07": [...], ... } or { Groceries: [...], ... }
    const flat = Object.values(obj).flatMap(v => (Array.isArray(v) ? v : [v]));
    const txns = flat.filter(isTxn);
    if (txns.length === 0) console.warn('Unexpected transactions response shape', raw);
    return txns;
}

export function weeksFromScheduleRanges(ranges: { startRange: string; endRange: string }[]): WeekRange[] {
    return ranges
        .map(r => ({ start: toLocalDate(r.startRange), end: toLocalDate(r.endRange) }))
        .filter((r): r is { start: Date; end: Date } => !!r.start && !!r.end)
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .map((r, i) => ({
            index: i,
            start: r.start,
            end: r.end,
            days: differenceInCalendarDays(r.end, r.start) + 1,
            title: `Week ${i + 1}`,
            rangeLabel: `${format(r.start, 'MMM d')} – ${format(r.end, 'd')}`,
        }));
}