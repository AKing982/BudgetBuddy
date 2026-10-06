import {DateRange} from "../config/Types";

import { API_BASE_URL } from '../config/api';
import axios from "axios";   // same import BudgetPlannerService uses for its base URL

// ── Types (mirror the Java domain objects) ───────────────────────────────────
export type PointerMode = 'CURRENT' | 'FUTURE';
export type BackendDate = string | number[];   // "2026-10-07" or [2026, 10, 7], depending on Jackson config


export interface BPTemplatePointer {
    id: number | null;
    templateDetailId: number;
    pointerMode: PointerMode;
    currentDateRange: DateRange;
    updateEnabled: boolean;
    locked: boolean;
    status: string | null;
}

export interface MoveFuturePointerRequest {
    currentPointerDate: string;   // yyyy-mm-dd
    newPointerDate: string;       // yyyy-mm-dd
    templateDetailId: number;
}

export interface PointerResync {
    currentPointer: BPTemplatePointer;
    futurePointer: BPTemplatePointer;
    futurePointerNeedsMove: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
/** Local-date ISO string (yyyy-mm-dd). Avoids toISOString(), which shifts to UTC. */
export const toIsoDate = (d: Date | string): string => {
    if (typeof d === 'string') return d.slice(0, 10);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
};

const logAxiosError = (action: string, err: unknown) => {
    if (axios.isAxiosError(err)) {
        console.error(`${action} failed: ${err.response?.status}`, err.response?.data);
    } else {
        console.error(`${action} failed:`, err);
    }
};


// ── Service ──────────────────────────────────────────────────────────────────
class BPTemplatePointerService {
    private static instance: BPTemplatePointerService;
    private readonly baseUrl = `${API_BASE_URL}/bp-template-pointers`;

    private constructor() {}

    public static getInstance(): BPTemplatePointerService {
        if (!BPTemplatePointerService.instance) {
            BPTemplatePointerService.instance = new BPTemplatePointerService();
        }
        return BPTemplatePointerService.instance;
    }

    /** GET /{templateDetailId}/all */
    public async getAllPointers(templateDetailId: number): Promise<BPTemplatePointer[]> {
        try {
            const res = await axios.get<BPTemplatePointer[]>(`${this.baseUrl}/${templateDetailId}/all`);
            return res.data ?? [];
        } catch (err) {
            logAxiosError('Get all pointers', err);
            throw err;
        }
    }

    /** POST /{templateDetailId}/new-current?currentDate=yyyy-mm-dd */
    public async createCurrentPointer(templateDetailId: number, currentDate: Date | string): Promise<BPTemplatePointer> {
        try {
            const res = await axios.post<BPTemplatePointer>(
                `${this.baseUrl}/${templateDetailId}/new-current`,
                null,
                { params: { currentDate: toIsoDate(currentDate) } },
            );
            return res.data;
        } catch (err) {
            logAxiosError('Create current pointer', err);
            throw err;
        }
    }

    /** POST /new-future-pointer */
    public async createFuturePointer(request: MoveFuturePointerRequest): Promise<BPTemplatePointer> {
        try {
            const res = await axios.post<BPTemplatePointer>(`${this.baseUrl}/new-future-pointer`, request);
            return res.data;
        } catch (err) {
            logAxiosError('Create future pointer', err);
            throw err;
        }
    }

    /** PUT /{templateDetailId}/resync?currentDate=yyyy-mm-dd */
    public async resyncPointers(templateDetailId: number, currentDate: Date | string): Promise<PointerResync> {
        try {
            const res = await axios.put<PointerResync>(
                `${this.baseUrl}/${templateDetailId}/resync`,
                null,
                { params: { currentDate: toIsoDate(currentDate) } },
            );
            return res.data;
        } catch (err) {
            logAxiosError('Resync pointers', err);
            throw err;
        }
    }

    public findPointer(pointers: BPTemplatePointer[], mode: PointerMode): BPTemplatePointer | null {
        return pointers.find(p => p.pointerMode === mode) ?? null;
    }
}

export default BPTemplatePointerService;


