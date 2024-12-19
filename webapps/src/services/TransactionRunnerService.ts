import axios, {AxiosInstance} from "axios";


class TransactionRunnerService
{
    private static instance: TransactionRunnerService;
    private static axios: AxiosInstance;

    constructor(){
        TransactionRunnerService.axios = axios.create({
            baseURL: 'http://localhost:8080/api/transactionRunner',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    public static getInstance(): TransactionRunnerService {
        if (!TransactionRunnerService.instance) {
            TransactionRunnerService.instance = new TransactionRunnerService();
        }
        return TransactionRunnerService.instance;
    }


    public async syncTransactionsByDate(userId: number, startDate: Date, endDate: Date): Promise<void> {
        try {
            const formattedStartDate = startDate.toISOString().split('T')[0];
            const formattedEndDate = endDate.toISOString().split('T')[0];

            await TransactionRunnerService.axios.get(
                `/transactions/sync/dates/${userId}`, {
                    params: {
                        startDate: formattedStartDate,
                        endDate: formattedEndDate
                    }
                }
            );
        } catch (error) {
            console.error('Error syncing transactions by date:', error);
            throw error;
        }
    }

    public async syncTransactions(userId: number): Promise<void> {
        try {
            await TransactionRunnerService.axios.get(`/transactions/sync/${userId}`);
        } catch (error) {
            console.error('Error syncing transactions:', error);
            throw error;
        }
    }
}

export default TransactionRunnerService;