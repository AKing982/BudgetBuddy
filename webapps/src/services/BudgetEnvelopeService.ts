import {BudgetEnvelope} from "../components/BudgetEnvelopesPage";
import {API_BASE_URL} from "../config/api";
import axios, {AxiosResponse} from "axios";
import {EnvelopeBuildDetails, EnvelopeCreateRequest} from "../config/Types";

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

    public async fetchBudgetEnvelopes(userId: number): Promise<BudgetEnvelope[]>
    {
        try
        {
            const response = await axios.get<BudgetEnvelope[]>(`${API_BASE_URL}/budget-envelope/${userId}`);
            return response.data;
        } catch (error)
        {
            console.error('Error fetching budget envelopes:', error);
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


