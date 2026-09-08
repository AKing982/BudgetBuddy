import {BudgetEnvelope, Contributions, EnvelopeAccount} from '../config/Types';
import {API_BASE_URL} from "../config/api";
import axios, {AxiosResponse} from "axios";
import {EnvelopeBuildDetails, EnvelopeCreateRequest} from "../config/Types";

interface EnvelopeEntity{
    id:                  number;
    name:                string;
    type:        string;
    description?:        string;
    targetAmount:        number;
    budgeted:            number;   // → allocatedAmount
    currentSaved:        number;   // → currentAmount
    startDate:           string;
    targetDate?:         string;
    status:              string;
    active:            boolean;
    frequency?:          string;   // → contributionFrequency
    duration:            number;
    contributionMode:    string;
    linked?:           boolean;
    balanceThreshold?:   number;
    contributions?: Contributions[]
    account?: EnvelopeAccount;
}


interface LinkedEnvelopesEntity {
    id:                   number;
    linkName:             string;
    sharedBudget:         number;
    totalAllocation:      number;
    totalSpent:           number;
    score:                number;
    linkedEnvelopeMembers: EnvelopeEntity[];  // ← was linkedEnvelopeMembers
}

// ── Frontend type for a linked group ─────────────────────────────────────────
export interface LinkedEnvelopeGroup {
    id:              number;
    linkName:        string;
    sharedBudget:    number;
    totalAllocation: number;
    totalSpent:      number;
    score:           number;
    envelopes:       BudgetEnvelope[];
}

// ── Mapper ────────────────────────────────────────────────────────────────────
function mapLinkedEntity(e: LinkedEnvelopesEntity): LinkedEnvelopeGroup {
    return {
        id:              e.id,
        linkName:        e.linkName,
        sharedBudget:    e.sharedBudget,
        totalAllocation: e.totalAllocation,
        totalSpent:      e.totalSpent,
        score:           e.score,
        envelopes:       (e.linkedEnvelopeMembers ?? []).map(mapEntity),  // ← was e.linkedEnvelopeMembers
    };
}

function toEnvelopeType(raw: string): BudgetEnvelope['envelopeType'] {
    console.log('Raw Type: ', raw);
    const map: Record<string, BudgetEnvelope['envelopeType']> = {
        FUND:     'FUND',
        PAYOFF:   'PAYOFF',
        PURCHASE: 'PURCHASE',
    };
    return map[raw] ?? 'SAVINGS';
}

function toStatus(entity: EnvelopeEntity): BudgetEnvelope['status'] {
    if (!entity.active) return 'PAUSED';
    const s = entity.status?.toUpperCase();
    if (s === 'ACTIVE' || s === 'COMPLETED' || s === 'PAUSED' || s === 'CANCELLED') return s;
    return 'ACTIVE';
}

function mapEntity(e: EnvelopeEntity, index: number): BudgetEnvelope {
    const target    = e.targetAmount   ?? 0;
    const current   = e.currentSaved   ?? 0;
    const remaining = Math.max(target - current, 0);
    console.log('Envelope Entity: ', e);
    return {
        id:                    e.id,
        envelopeName:          e.name,
        envelopeType:          toEnvelopeType(e.type),
        description:           e.description,
        targetAmount:          target,
        allocatedAmount:       e.budgeted         ?? 0,
        currentAmount:         current,
        remainingAmount:       remaining,
        contributionFrequency: e.frequency        ?? 'MONTHLY',
        startDate:             e.startDate,
        targetDate:            e.targetDate,
        status:                toStatus(e),
        priority:              index + 1,          // backend has no priority field yet
        contributionMode:      'MANUAL', // default until backend exposes it
        streakMonths:          0,
        linked:              e.linked ?? false,
        balanceThreshold:      e.balanceThreshold,
        account:               e.account,
        contributions: (e.contributions ?? []).map(c => ({
            id:            c.id,
            scheduledDate: c.scheduledDate,
            amount:        c.contributionAmount,
            status:        c.status as 'SCHEDULED' | 'PAID' | 'MISSED',
            frequency:     c.frequency,
        })),
    };
}


class BudgetEnvelopeService
{
    private static instance: BudgetEnvelopeService;

    private constructor() {

    }

    public static getInstance(): BudgetEnvelopeService {
        if (!BudgetEnvelopeService.instance) {
            BudgetEnvelopeService.instance = new BudgetEnvelopeService();
        }
        return BudgetEnvelopeService.instance;
    }

    public async fetchBudgetEnvelopes(userId: number, monthStart: string, monthEnd: string): Promise<BudgetEnvelope[]> {
        const response = await axios.get<EnvelopeEntity[]>(
            `${API_BASE_URL}/budget-envelope/${userId}/envelopes`,
            { params: { monthStart, monthEnd } }
        );
        return response.data.map(mapEntity);
    }

    public async updateContributionMode(envelopeId: number, mode: 'MANUAL' | 'AUTO') : Promise<BudgetEnvelope>
    {
        if(!envelopeId || !mode)
        {
            throw new Error('Invalid input');
        }
        try
        {
            const response = await axios.put<BudgetEnvelope>(`${API_BASE_URL}/budget-envelope/${envelopeId}/contribution-mode`, null, {
                params: { contributionMode: mode }
            });
            return response.data;
        }catch(error){
            console.error(`There was an error updating the contribution mode for envelope ${envelopeId}: `, error);
            throw error;
        }
    }

    public async fetchLinkedEnvelopes(userId: number, monthStart: string, monthEnd: string): Promise<LinkedEnvelopeGroup[]> {
        const response = await axios.get<LinkedEnvelopesEntity[]>(
            `${API_BASE_URL}/budget-envelope/${userId}/linked-envelopes`,
            { params: { monthStart, monthEnd } }
        );
        return response.data.map(mapLinkedEntity);
    }

    public async linkAccountToEnvelope(envelopeId: number, accountId: string): Promise<BudgetEnvelope>
    {
        if (!envelopeId || !accountId)
        {
            throw new Error('envelopeId and accountId are required to link an account to an envelope.');
        }
        try
        {
            const response = await axios.put<BudgetEnvelope>(`${API_BASE_URL}/budget-envelope/${envelopeId}/link-plaid-account`, null, {
                params: { accountId }
            });
            return response.data;
        }catch(error){
            console.error(`There was an error linking account ${accountId} to envelope ${envelopeId}: `, error);
            throw error;
        }
    }

    public async createEnvelope(
        request: EnvelopeCreateRequest,
        userId: number,
        startDate: string,
        endDate: string
    ): Promise<EnvelopeBuildDetails> {
        const response: AxiosResponse<EnvelopeBuildDetails> = await axios.post(
            `${API_BASE_URL}/budget-envelope/create`,   // ← was just '/create'
            request,
            {
                params: { userId, startDate, endDate }   // ← was missing startDate/endDate
            }
        );
        return response.data;
    }
}
export default BudgetEnvelopeService;


