// ── csvImport.ts ──────────────────────────────────────────────────────────────
// Pure helpers for turning a CSV file into a SpreadsheetTemplate.
// No React, no dependencies — safe to unit-test in isolation.
//
// Expected CSV shape (the "as-is" layout):
//   Category,1/2–1/15,1/16–1/29,...      ← header row = periods
//   Rent,1200,1200,...                   ← one row per category
//   Salary,2500,2500,...
// Everything about that shape (header row, label column, which columns /
// rows to import, period dates) can be overridden via ImportConfig.
import { generateUUID, generatePeriods, recalcSummaryRows } from '../domain/SpreadsheetTypes';
import type { SpreadsheetTemplate, SpreadsheetRow, MonthGroup, PeriodType } from '../domain/SpreadsheetTypes';

export type CsvGrid = string[][];
export type RowKind = SpreadsheetRow['rowType'];
export type ImportRowType = RowKind | 'skip';
export interface PeriodDate { start: Date; end: Date }

export interface ImportConfig {
    grid: CsvGrid;
    name: string;
    hasHeader: boolean;
    labelCol: number;
    valueCols: number[];          // CSV column indices that become periods
    rowTypes: ImportRowType[];    // one entry per data row (header excluded)
    periodSource: 'headers' | 'generated';
    periodType: PeriodType;
    startDate: string;            // yyyy-mm-dd, used when periodSource === 'generated'
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_IDX: Record<string, number> = Object.fromEntries(MONTH_NAMES.map((m, i) => [m.slice(0, 3).toLowerCase(), i]));
const SUMMARY_HEADER = /^(total|totals|sum|avg|average)$/i;

// ── Parsing ───────────────────────────────────────────────────────────────────
function detectDelimiter(text: string): string {
    const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
    const best = [',', ';', '\t']
        .map(d => ({ d, n: firstLine.split(d).length - 1 }))
        .sort((a, b) => b.n - a.n)[0];
    return best.n > 0 ? best.d : ',';
}

/** RFC-4180-ish parser: quoted fields, escaped quotes, CRLF/LF, BOM, , ; or tab. */
export function parseCsv(text: string): CsvGrid {
    const src = text.replace(/^\uFEFF/, '');
    const delim = detectDelimiter(src);
    const out: CsvGrid = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        if (inQuotes) {
            if (ch === '"') {
                if (src[i + 1] === '"') { field += '"'; i++; }
                else inQuotes = false;
            } else field += ch;
        } else if (ch === '"') inQuotes = true;
        else if (ch === delim) { row.push(field); field = ''; }
        else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && src[i + 1] === '\n') i++;
            row.push(field); out.push(row); row = []; field = '';
        } else field += ch;
    }
    if (field !== '' || row.length) { row.push(field); out.push(row); }

    const rows = out.filter(r => r.some(c => c.trim() !== ''));
    const width = gridWidth(rows);
    return rows.map(r => r.length < width ? [...r, ...Array(width - r.length).fill('')] : r);
}

export const gridWidth = (grid: CsvGrid) => grid.reduce((w, r) => Math.max(w, r.length), 0);

/** "$1,234.50" → 1234.5, "(80)" → -80, "" / "-" / "n/a" → null */
export function parseAmount(raw: string | undefined): number | null {
    if (raw == null) return null;
    let s = raw.trim();
    if (!s || s === '-' || s === '—') return null;
    let neg = false;
    if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
    s = s.replace(/[$€£,\s]/g, '').replace(/^−/, '-');
    if (s.startsWith('-')) { neg = !neg; s = s.slice(1); }
    if (!s || !/^\d*\.?\d+$/.test(s)) return null;
    const n = Number(s);
    return Number.isFinite(n) ? (neg ? -n : n) : null;
}

export function guessRowType(label: string): ImportRowType {
    const l = label.trim().toLowerCase();
    if (!l) return 'skip';
    if (/^(remaining )?balance$|^remaining$|^net$/.test(l)) return 'balance';
    if (/^(total )?expenses( total)?$/.test(l)) return 'expenses';
    if (/salary|income|paycheck|wages/.test(l)) return 'salary';
    return 'expense';
}

// ── Header dates ──────────────────────────────────────────────────────────────
const SEP = '\\s*(?:–|—|-|to|through)\\s*';
const RE_ISO   = new RegExp(`^(\\d{4})-(\\d{1,2})-(\\d{1,2})(?:${SEP}(\\d{4})-(\\d{1,2})-(\\d{1,2}))?$`, 'i');
const RE_US    = new RegExp(`^(\\d{1,2})/(\\d{1,2})(?:/(\\d{2,4}))?(?:${SEP}(\\d{1,2})/(\\d{1,2})(?:/(\\d{2,4}))?)?$`, 'i');
const RE_MONTH = /^([A-Za-z]{3,9})\.?[ ,'-]*(\d{2}|\d{4})$/;

const normYear  = (y: string) => (y.length <= 2 ? 2000 + Number(y) : Number(y));
const isValid   = (d: Date) => !isNaN(d.getTime());
const dayDiff   = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000);
const addDays   = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
/**
 * Parses period headers into date ranges. Returns null unless EVERY header is
 * recognised. Supports: 2026-01-02, 2026-01-02 – 2026-01-15, 1/2/2026,
 * 1/2–1/15 (year inferred, rolls forward across Dec→Jan), Jan 2026 / January 2026.
 * Single dates are treated as period starts; each runs until the next one begins.
 *
 *
 */

export function toIsoDate(date: Date | string): string {
    if (typeof date === 'string') return date;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function parseHeaderDates(labels: string[]): PeriodDate[] | null {
    if (!labels.length) return null;
    const starts: Date[] = [];
    const ends: (Date | null)[] = [];
    let year = new Date().getFullYear();

    for (const raw of labels) {
        const h = raw.trim().replace(/\s+/g, ' ');
        let m: RegExpMatchArray | null;
        let start: Date | null = null;
        let end: Date | null = null;

        if ((m = h.match(RE_ISO))) {
            start = new Date(+m[1], +m[2] - 1, +m[3]);
            if (m[4]) end = new Date(+m[4], +m[5] - 1, +m[6]);
            year = start.getFullYear();
        } else if ((m = h.match(RE_US))) {
            if (m[3]) year = normYear(m[3]);
            start = new Date(year, +m[1] - 1, +m[2]);
            const prev = starts[starts.length - 1];
            if (!m[3] && prev && start < prev) { year++; start = new Date(year, +m[1] - 1, +m[2]); }
            if (m[4]) {
                const endYear = m[6] ? normYear(m[6]) : year;
                end = new Date(endYear, +m[4] - 1, +m[5]);
                if (!m[6] && end < start) end = new Date(endYear + 1, +m[4] - 1, +m[5]);
            }
        } else if ((m = h.match(RE_MONTH))) {
            const mi = MONTH_IDX[m[1].slice(0, 3).toLowerCase()];
            if (mi === undefined) return null;
            year = normYear(m[2]);
            start = new Date(year, mi, 1);
            end = new Date(year, mi + 1, 0);
        }

        if (!start || !isValid(start) || (end && !isValid(end))) return null;
        starts.push(start);
        ends.push(end);
    }

    return starts.map((s, i) => {
        let e = ends[i];
        if (!e) {
            if (i + 1 < starts.length) e = addDays(starts[i + 1], -1);
            else if (i > 0) e = addDays(s, dayDiff(starts[i - 1], s) - 1);
            else e = new Date(s.getFullYear(), s.getMonth() + 1, 0);
        }
        return { start: s, end: e };
    });
}

export function inferPeriodType(dates: PeriodDate[] | null): PeriodType {
    if (!dates?.length) return 'Monthly';
    const avg = dates.reduce((sum, d) => sum + dayDiff(d.start, d.end) + 1, 0) / dates.length;
    if (avg <= 9)  return 'Weekly';
    if (avg <= 18) return 'Biweekly';
    if (avg <= 45) return 'Monthly';
    if (avg <= 75) return '2-Monthly';
    return '3-Monthly';
}

function groupMonths(dates: PeriodDate[] | null, n: number): MonthGroup[] {
    if (!dates) return [{ name: 'Imported', cols: Array.from({ length: n }, (_, i) => i) }];
    const map = new Map<string, number[]>();
    dates.forEach((d, i) => {
        const key = `${MONTH_NAMES[d.start.getMonth()]} ${d.start.getFullYear()}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(i);
    });
    return Array.from(map.entries()).map(([name, cols]) => ({ name, cols }));
}

const fmtRange = (d: PeriodDate) =>
    `${d.start.getMonth() + 1}/${d.start.getDate()}–${d.end.getMonth() + 1}/${d.end.getDate()}`;

// ── Structure detection ───────────────────────────────────────────────────────
const dataRowsOf = (grid: CsvGrid, hasHeader: boolean) => (hasHeader ? grid.slice(1) : grid);

function detectHeader(grid: CsvGrid): boolean {
    const cells = (grid[0] ?? []).slice(1).filter(c => c.trim() !== '');
    const numeric = cells.filter(c => parseAmount(c) !== null).length;
    return numeric < Math.max(1, cells.length / 2);
}

function detectLabelCol(grid: CsvGrid, hasHeader: boolean): number {
    const rows = dataRowsOf(grid, hasHeader);
    let best = 0, bestScore = -1;
    for (let c = 0; c < gridWidth(grid); c++) {
        const score = rows.filter(r => r[c]?.trim() && parseAmount(r[c]) === null).length;
        if (score > bestScore) { best = c; bestScore = score; }
    }
    return best;
}

/** Columns + row types that follow from the header / label-column choice. */
export function deriveStructure(grid: CsvGrid, hasHeader: boolean, labelCol: number) {
    const rows = dataRowsOf(grid, hasHeader);
    const valueCols: number[] = [];
    for (let c = 0; c < gridWidth(grid); c++) {
        if (c === labelCol) continue;
        if (hasHeader && SUMMARY_HEADER.test(grid[0][c]?.trim() ?? '')) continue;
        if (rows.some(r => parseAmount(r[c]) !== null)) valueCols.push(c);
    }
    const rowTypes = rows.map(r => guessRowType(r[labelCol] ?? ''));
    return { valueCols, rowTypes };
}

/** Everything auto-detected. Passing this straight to buildTemplate = "import as-is". */
export function initialConfig(grid: CsvGrid, fileName: string): ImportConfig {
    const hasHeader = detectHeader(grid);
    const labelCol = detectLabelCol(grid, hasHeader);
    const { valueCols, rowTypes } = deriveStructure(grid, hasHeader, labelCol);
    const dates = hasHeader ? parseHeaderDates(valueCols.map(c => grid[0][c] ?? '')) : null;
    const now = new Date();
    return {
        grid,
        name: fileName.replace(/\.[^.]+$/, '').trim() || 'Imported Template',
        hasHeader, labelCol, valueCols, rowTypes,
        periodSource: 'headers',
        periodType: inferPeriodType(dates),
        startDate: toIsoDate(dates?.[0].start ?? new Date(now.getFullYear(), now.getMonth(), 1)),
    };
}

// ── Build ─────────────────────────────────────────────────────────────────────
export function buildTemplate(cfg: ImportConfig): SpreadsheetTemplate {
    const header = cfg.hasHeader ? cfg.grid[0] : [];
    const data = dataRowsOf(cfg.grid, cfg.hasHeader);
    let n = cfg.valueCols.length;
    if (!n) throw new Error('Select at least one column to import.');

    let periods: string[];
    let periodDates: PeriodDate[] | undefined;
    let months: MonthGroup[];

    if (cfg.periodSource === 'generated') {
        const start = new Date(`${cfg.startDate}T00:00:00`);
        if (!isValid(start)) throw new Error('Enter a valid start date.');
        // Generous end so even 3-monthly periods cover every column, then trim.
        const end = new Date(start);
        end.setMonth(end.getMonth() + n * 3 + 1);
        const gen = generatePeriods(cfg.periodType, start, end);
        n = Math.min(n, gen.periods.length);
        periods = gen.periods.slice(0, n);
        periodDates = gen.periodDates?.slice(0, n);
        months = gen.months
            .map((g: MonthGroup) => ({ ...g, cols: g.cols.filter((c: number) => c < n) }))
            .filter((g: MonthGroup) => g.cols.length > 0);
    } else {
        const labels = cfg.valueCols.map((c, i) => header[c]?.trim() || `Period ${i + 1}`);
        const dates = cfg.hasHeader ? parseHeaderDates(labels) : null;
        periods = dates ? dates.map(fmtRange) : labels;
        periodDates = dates ?? undefined;
        months = groupMonths(dates, n);
    }

    const cols = cfg.valueCols.slice(0, n);
    const rows: SpreadsheetRow[] = [];
    data.forEach((r, i) => {
        const type = cfg.rowTypes[i] ?? 'skip';
        if (type === 'skip') return;
        rows.push({
            label: r[cfg.labelCol]?.trim() || `Row ${i + 1}`,
            rowType: type,
            values: cols.map(c => (type === 'balance' ? null : parseAmount(r[c]))),
        });
    });

    const blank = () => Array(n).fill(null) as (number | null)[];
    if (!rows.some(r => r.rowType === 'salary'))   rows.push({ label: 'Salary',            rowType: 'salary',   values: blank() });
    if (!rows.some(r => r.rowType === 'expenses')) rows.push({ label: 'Expenses',          rowType: 'expenses', values: blank() });
    if (!rows.some(r => r.rowType === 'balance'))  rows.push({ label: 'Remaining Balance', rowType: 'balance',  values: blank() });

    // Line items keep CSV order; summary rows go to the bottom like the backend mapper.
    const rank = (t: RowKind) => (t === 'salary' ? 1 : t === 'expenses' ? 2 : t === 'balance' ? 3 : 0);
    rows.sort((a, b) => rank(a.rowType) - rank(b.rowType));

    return {
        id: generateUUID(),
        name: cfg.name.trim() || 'Imported Template',
        periodType: cfg.periodType,
        months, periods, periodDates,
        rows: recalcSummaryRows(rows, n),
    };
}