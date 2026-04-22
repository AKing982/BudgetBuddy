// ── SpreadsheetTypes.ts ───────────────────────────────────────────────────────
// All shared interfaces, type aliases, constants, and pure helper functions
// for the Budget Planner feature. No React imports — keep this framework-free.

// ── Design tokens ─────────────────────────────────────────────────────────────
export const MAROON      = '#6b1a1a';
export const MAROON_DARK = '#4a1010';
export const TEAL        = '#0d9488';
export const GREEN       = '#059669';
export const AMBER       = '#d97706';
export const RED         = '#dc2626';
export const NAVY        = '#1e293b';
export const SLATE       = '#64748b';
export const BG          = '#f0f2f5';
export const BLUE        = '#378ADD';

export const CAT_COLORS: Record<string, string> = {
    Housing:       '#1D9E75',
    Food:          '#6b1a1a',
    Transportation:'#BA7517',
    Entertainment: '#378ADD',
    Other:         '#D4537E',
};

export const CHART_COLORS = [
    '#1D9E75','#6b1a1a','#BA7517','#378ADD','#D4537E','#7c3aed','#0ea5e9',
];

export const CATEGORY_GROUPS: Record<string, string> = {
    Rent:             'Housing',
    Utilities:        'Housing',
    Electric:         'Housing',
    'Gas Bill':       'Housing',
    Groceries:        'Food',
    'Order out':      'Food',
    'Coffee Supplies':'Food',
    Gas:              'Transportation',
    Golf:             'Entertainment',
    Subscriptions:    'Entertainment',
    'Trip Cost':      'Entertainment',
    Haircut:          'Entertainment',
    Insurance:        'Other',
    'Phone Insurance':'Other',
    Payments:         'Other',
    'Other Stuff':    'Other',
    Savings:          'Other',
};

export const GROUP_ORDER = ['Housing','Food','Transportation','Entertainment','Other'];

export const CAT_PCTS: Record<string, number> = {
    Housing: 0.44, Food: 0.22, Transportation: 0.09, Entertainment: 0.16, Other: 0.09,
};

// ── Type aliases ──────────────────────────────────────────────────────────────
export type PeriodType    = 'Weekly' | 'Biweekly' | 'Monthly' | '2-Monthly' | '3-Monthly';
export type TopViewMode   = 'current-month' | 'planning' | 'analytics';
export type SubViewMode   = 'classic' | 'rolling' | 'dashboard';
export type PeriodFilter  = 'Weekly' | 'Biweekly' | 'Monthly';
export type ColumnType    = 'past' | 'present' | 'future';

// ── Core data shapes ──────────────────────────────────────────────────────────
export interface SpreadsheetRow {
    label:   string;
    rowType: 'expense' | 'salary' | 'expenses' | 'balance' | 'extra'|'fixed-expense';
    values:  (number | null)[];
}

export interface MonthGroup {
    name: string;
    cols: number[];
}

export interface SpreadsheetTemplate {
    id:          string;
    name:        string;
    periodType:  PeriodType | 'standard';
    months:      MonthGroup[];
    periods:     string[];
    rows:        SpreadsheetRow[];
    // Optional raw date ranges parallel to periods[] — used to classify past/present/future
    periodDates?: Array<{ start: Date; end: Date }>;
    viewOverride?: 'rolling-balance' | 'rolling-planned-actual' | 'forecast-classic' | 'forecast-visual' | 'income-dashboard';
}

// ── Budget criteria (per-month goal set) ──────────────────────────────────────
export interface MiniGoal {
    id:          string;
    label:       string;
    targetAmount: number;
    category?:   string;
    met?:        boolean;
}

export interface BudgetCriteria {
    monthKey:           string;           // "YYYY-MM"
    income:             number;
    categoryTargets:    Record<string, number>; // category group → budget $
    miniGoals:          MiniGoal[];
    autoGenerate:       boolean;
    budgetRuleId:       string;           // e.g. '50-30-20'
    savingsTargetPct:   number;           // 0–100
}

// ── Budget rules ──────────────────────────────────────────────────────────────
export interface BudgetRule {
    id:          string;
    name:        string;
    shortName:   string;
    description: string;
    tagline:     string;
    color:       string;
    allocations: Record<string, number>;
    bestFor:     string;
}

// ── Forecast data ─────────────────────────────────────────────────────────────
export interface ForecastPeriod {
    label:    string;
    isFuture: boolean;
    income:   number;
    expenses: number;
    balance:  number;
    catVals:  number[];
}

// ── Pure helper functions ─────────────────────────────────────────────────────
export const generateUUID = (): string =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });

export const fmt  = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtS = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
export const fmtC = (n: number) => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString();

export function addDays(d: Date, n: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

export function fmtDate(d: Date): string {
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function monthKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Classify a period column relative to today
export function classifyColumn(
    periodDates: SpreadsheetTemplate['periodDates'],
    colIndex: number,
    today: Date = new Date(),
): ColumnType {
    if (!periodDates || !periodDates[colIndex]) return 'past';
    const { start, end } = periodDates[colIndex];
    if (end < today)   return 'past';
    if (start > today) return 'future';
    return 'present';
}

export function generatePeriods(
    type: PeriodType,
    start: Date,
    end: Date,
): { periods: string[]; months: MonthGroup[]; periodDates: Array<{ start: Date; end: Date }> } {
    const periods: string[] = [];
    const periodDates: Array<{ start: Date; end: Date }> = [];
    const mm = new Map<string, number[]>();

    if (['Monthly', '2-Monthly', '3-Monthly'].includes(type)) {
        const step = type === 'Monthly' ? 1 : type === '2-Monthly' ? 2 : 3;
        let cur = new Date(start.getFullYear(), start.getMonth(), 1), idx = 0;
        while (cur <= end) {
            const periodEnd = new Date(cur.getFullYear(), cur.getMonth() + step, 0);
            periods.push(cur.toLocaleString('default', { month: 'short', year: '2-digit' }));
            periodDates.push({ start: new Date(cur), end: periodEnd });
            const g = step === 1
                ? cur.toLocaleString('default', { month: 'long' })
                : `${cur.toLocaleString('default', { month: 'short' })}–${new Date(cur.getFullYear(), cur.getMonth() + step - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' })}`;
            if (!mm.has(g)) mm.set(g, []);
            mm.get(g)!.push(idx++);
            cur = new Date(cur.getFullYear(), cur.getMonth() + step, 1);
        }
    } else {
        const step = type === 'Weekly' ? 7 : 14;
        let cur = new Date(start), idx = 0;
        while (cur <= end) {
            const periodEnd = addDays(cur, step - 1);
            periods.push(`${fmtDate(cur)}–${fmtDate(periodEnd)}`);
            periodDates.push({ start: new Date(cur), end: periodEnd });
            const g = cur.toLocaleString('default', { month: 'long' });
            if (!mm.has(g)) mm.set(g, []);
            mm.get(g)!.push(idx++);
            cur = addDays(cur, step);
        }
    }

    return {
        periods,
        months: Array.from(mm.entries()).map(([name, cols]) => ({ name, cols })),
        periodDates,
    };
}

export const DEFAULT_EXPENSE_LABELS = [
    'Rent','Gas','Groceries','Insurance','Phone Insurance','Payments',
    'Utilities','Electric','Gas Bill','Golf','Order out','Subscriptions',
    'Trip Cost','Haircut','Other Stuff','Coffee Supplies','Savings',
];

export function makeBlankRows(n: number): SpreadsheetRow[] {
    const b = () => Array(n).fill(null) as null[];
    return [
        ...DEFAULT_EXPENSE_LABELS.map(l => ({ label: l, rowType: 'expense' as const, values: b() })),
        { label: 'Salary',            rowType: 'salary'   as const, values: b() },
        { label: 'Expenses',          rowType: 'expenses' as const, values: b() },
        { label: 'Extra',             rowType: 'extra'    as const, values: b() },
        { label: 'Remaining Balance', rowType: 'balance'  as const, values: b() },
    ];
}

// ── Derived data helpers ──────────────────────────────────────────────────────
export function deriveGroupTotals(t: SpreadsheetTemplate): Record<string, number[]> {
    const g: Record<string, number[]> = {};
    GROUP_ORDER.forEach(k => { g[k] = Array(t.periods.length).fill(0); });
    t.rows.filter(r => r.rowType === 'expense').forEach(row => {
        const grp = CATEGORY_GROUPS[row.label] ?? 'Other';
        row.values.forEach((v, i) => { if (v !== null) g[grp][i] += v; });
    });
    return g;
}

export function derivePeriodSummary(t: SpreadsheetTemplate) {
    const sal = t.rows.find(r => r.label === 'Salary')?.values ?? [];
    const exp = t.rows.find(r => r.label === 'Expenses')?.values ?? [];
    const bal = t.rows.find(r => r.rowType === 'balance')?.values ?? [];
    return t.periods.map((_, i) => ({
        period:      t.periods[i],
        income:      sal[i] ?? 0,
        expenses:    exp[i] ?? 0,
        balance:     bal[i] ?? 0,
        savings:     (sal[i] ?? 0) - (exp[i] ?? 0),
        savingsPct:  sal[i] ? ((sal[i]! - (exp[i] ?? 0)) / sal[i]!) * 100 : 0,
        spendPct:    sal[i] ? ((exp[i] ?? 0) / sal[i]!) * 100 : 0,
    }));
}

export function filterByPeriod(t: SpreadsheetTemplate, pf: PeriodFilter): SpreadsheetTemplate {
    if (pf !== 'Monthly') return t;

    const newPeriods = t.months.map(m => m.name);
    const newMonths: MonthGroup[] = t.months.map((m, mi) => ({ name: m.name, cols: [mi] }));

    const newRows: SpreadsheetRow[] = t.rows.map(row => ({
        ...row,
        values: t.months.map(m => {
            if (row.rowType === 'expenses' || row.rowType === 'balance') return null;
            const sum = m.cols.reduce((a, ci) => a + (row.values[ci] ?? 0), 0);
            return sum === 0 && m.cols.every(ci => row.values[ci] === null) ? null : sum;
        }),
    }));

    const expIdx = newRows.findIndex(r => r.rowType === 'expenses');
    const balIdx = newRows.findIndex(r => r.rowType === 'balance');
    const salIdx = newRows.findIndex(r => r.rowType === 'salary');

    if (expIdx >= 0) {
        const er = newRows.filter(r => r.rowType === 'expense');
        newRows[expIdx] = {
            ...newRows[expIdx],
            values: newRows[expIdx].values.map((_, ci) =>
                er.reduce((s, r) => s + (r.values[ci] ?? 0), 0)
            ),
        };
    }

    if (balIdx >= 0 && salIdx >= 0) {
        let run = 0;
        newRows[balIdx] = {
            ...newRows[balIdx],
            values: newRows[balIdx].values.map((_, ci) => {
                const s = newRows[salIdx].values[ci] ?? 0;
                const e = expIdx >= 0 ? newRows[expIdx].values[ci] ?? 0 : 0;
                run = run + s - e;
                return run;
            }),
        };
    }

    // Filter periodDates in parallel if present
    const newPeriodDates = t.periodDates
        ? t.months.map(m => {
            const first = t.periodDates![m.cols[0]];
            const last  = t.periodDates![m.cols[m.cols.length - 1]];
            return first && last ? { start: first.start, end: last.end } : first;
        }).filter(Boolean) as Array<{ start: Date; end: Date }>
        : undefined;

    return { ...t, periods: newPeriods, months: newMonths, rows: newRows, periodDates: newPeriodDates };
}

export function buildForecastData(
    template: SpreadsheetTemplate,
    forecastCount: number,
    startBal: number,
): ForecastPeriod[] {
    const sal    = template.rows.find(r => r.label === 'Salary')?.values ?? [];
    const expRow = template.rows.find(r => r.rowType === 'expenses');
    const hist   = Math.min(template.periods.length, 5);
    const total  = hist + forecastCount;
    const incomePerPeriod = sal.find(v => v != null) ?? 2200;
    let bal = startBal;
    const result: ForecastPeriod[] = [];

    for (let i = 0; i < total; i++) {
        const fut = i >= hist;
        const inc = fut ? incomePerPeriod : (sal[i] ?? incomePerPeriod);
        const catVals = fut
            ? GROUP_ORDER.map(g => Math.round(inc * CAT_PCTS[g]))
            : GROUP_ORDER.map(g => {
                const gt = deriveGroupTotals(template);
                return gt[g][i] ?? Math.round(inc * CAT_PCTS[g]);
            });
        const exp = fut
            ? catVals.reduce((a, b) => a + b, 0)
            : (expRow?.values[i] ?? catVals.reduce((a, b) => a + b, 0));
        bal += inc - exp;
        result.push({
            label:    template.periods[i] ?? (fut ? `F+${i - hist + 1}` : String(i)),
            isFuture: fut,
            income:   inc,
            expenses: exp,
            balance:  Math.round(bal),
            catVals,
        });
    }
    return result;
}

// Filter a template to only the columns belonging to a given month (by monthKey "YYYY-MM")
export function filterToCurrentMonth(
    t: SpreadsheetTemplate,
    targetMonthKey: string,
): SpreadsheetTemplate {
    if (!t.periodDates) return t;

    const colIndices: number[] = [];
    t.periodDates.forEach((pd, i) => {
        const mk = monthKey(pd.start);
        if (mk === targetMonthKey) colIndices.push(i);
    });

    if (colIndices.length === 0) return { ...t, periods: [], months: [], rows: t.rows.map(r => ({ ...r, values: [] })), periodDates: [] };

    const newPeriods     = colIndices.map(i => t.periods[i]);
    const newPeriodDates = colIndices.map(i => t.periodDates![i]);
    const newRows        = t.rows.map(row => ({ ...row, values: colIndices.map(i => row.values[i] ?? null) }));
    const newMonths: MonthGroup[] = [{ name: t.months.find(m => m.cols.includes(colIndices[0]))?.name ?? '', cols: colIndices.map((_, ci) => ci) }];

    return { ...t, periods: newPeriods, months: newMonths, rows: newRows, periodDates: newPeriodDates };
}

// Auto-generate category targets from historical averages
export function autoGenerateCriteria(
    t: SpreadsheetTemplate,
    targetMonthKey: string,
    budgetRuleId: string,
): Partial<BudgetCriteria> {
    const groupTotals = deriveGroupTotals(t);
    const salRow = t.rows.find(r => r.rowType === 'salary');
    const historicalIncome = salRow
        ? salRow.values.filter((v): v is number => v !== null)
        : [];
    const avgIncome = historicalIncome.length
        ? historicalIncome.reduce((a, b) => a + b, 0) / historicalIncome.length
        : 0;

    const categoryTargets: Record<string, number> = {};
    GROUP_ORDER.forEach(grp => {
        const vals = groupTotals[grp].filter(v => v > 0);
        categoryTargets[grp] = vals.length
            ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
            : Math.round(avgIncome * CAT_PCTS[grp]);
    });

    return {
        monthKey:         targetMonthKey,
        income:           Math.round(avgIncome),
        categoryTargets,
        autoGenerate:     true,
        budgetRuleId,
        savingsTargetPct: 20,
        miniGoals:        [],
    };
}

// ── Preset data helpers ───────────────────────────────────────────────────────
export type RowType = SpreadsheetRow['rowType'];

export function recalcSummaryRows(rows: SpreadsheetRow[], n: number): SpreadsheetRow[] {
    const result = rows.map(r => ({ ...r, values: [...r.values] }));
    const ei = result.findIndex(r => r.rowType === 'expenses');
    const bi = result.findIndex(r => r.rowType === 'balance');
    const si = result.findIndex(r => r.rowType === 'salary');

    if (ei >= 0) {
        const er = result.filter(r => r.rowType === 'expense');
        result[ei] = {
            ...result[ei],
            values: Array.from({ length: n }, (_, j) =>
                er.reduce((s, r) => s + (r.values[j] ?? 0), 0)
            ),
        };
    }

    if (bi >= 0 && si >= 0) {
        let run = 0;
        result[bi] = {
            ...result[bi],
            values: Array.from({ length: n }, (_, j) => {
                const s = result[si].values[j] ?? 0;
                const e = ei >= 0 ? result[ei].values[j] ?? 0 : 0;
                run = run + s - e;
                return run;
            }),
        };
    }

    return result;
}