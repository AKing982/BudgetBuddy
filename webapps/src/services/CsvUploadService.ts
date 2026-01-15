import axios, {AxiosError} from "axios";
import {API_BASE_URL} from "../config/api";

interface UploadStatus
{
    message: string;
    success: boolean;
}

interface UploadCSVParams {
    userId: number;
    file: File;
    startDate: string;
    endDate: string;
}
class CsvUploadService
{
    private readonly apiUrl: string;
    private static instance: CsvUploadService;


    constructor(apiUrl: string = "http://localhost:8080/api"){
        this.apiUrl = apiUrl;
    }

    public async checkIfTransactionsExistForDateRange(userId: number, startDate: string, endDate: string): Promise<boolean>
    {
        try
        {
            const response = await axios.get<boolean>(
                `${API_BASE_URL}/upload/${userId}/byDates`,
                {
                    params: {
                        startDate,
                        endDate
                    }
                }
            );
            console.log('CSV data exists for date range:', response.data);
            return response.data;
        }catch(error){
            console.error('Error checking if CSV data exists for date range:', error);

            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                console.error('Response status:', axiosError.response?.status);
                console.error('Response data:', axiosError.response?.data);
            }

            return false;
        }
    }

    public async uploadCsv(params: UploadCSVParams): Promise<UploadStatus>
    {
        const {userId, file, startDate, endDate} = params;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if(!dateRegex.test(startDate) || !dateRegex.test(endDate))
        {
            throw new Error("Invalid date format. Must be YYYY-MM-DD")
        }
        if(new Date(startDate) > new Date(endDate))
        {
            throw new Error("Start date must be before end date")
        }
        try
        {
            // Create FormData to send multipart/form-data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('startDate', startDate);
            formData.append('endDate', endDate);

            const response = await axios.post<UploadStatus>(
                `${API_BASE_URL}/upload/${userId}/csv`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            console.log('CSV upload successful:', response.data);
            return response.data;
        }catch(error){
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError<{ message?: string }>;
                const status = axiosError.response?.status;
                const errorMessage = axiosError.response?.data?.message || axiosError.message;

                if (status === 403) {
                    throw new Error('User does not have upload access');
                } else if (status === 400) {
                    throw new Error(errorMessage || 'Invalid request');
                } else if (status === 409) {
                    const dataExistsMsg = `CSV Transaction data already exists for the date range: ${startDate} to ${endDate}`;
                    throw new Error(dataExistsMsg);
                }

                throw new Error(errorMessage || 'Failed to upload CSV file');
            }

            if (error instanceof Error) {
                throw error;
            }

            throw new Error('Failed to upload CSV file');
        }

    }
}
export default CsvUploadService;
export type {UploadStatus, UploadCSVParams};