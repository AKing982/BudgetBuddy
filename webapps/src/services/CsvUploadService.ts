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

            const response = await fetch(`${this.apiUrl}/upload/${userId}/csv`, {
                method: 'POST',
                body: formData,
                // Don't set Content-Type header - browser will set it automatically with boundary
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData?.message || `Server returned ${response.status}`;

                if (response.status === 403) {
                    throw new Error('User does not have upload access');
                } else if (response.status === 400) {
                    throw new Error(errorMessage || 'Invalid request');
                }else if(response.status === 409)
                {
                    const dataExistsMsg = `CSV Transaction data already exists for the date range: ${startDate} to ${endDate}`;
                    throw new Error(dataExistsMsg);
                }

                throw new Error(errorMessage);
            }

            const result: UploadStatus = await response.json();
            console.log('CSV upload successful:', result);
            return result;
        }catch(error){
            console.error('Error uploading CSV file:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to upload CSV file');
        }

    }
}
export default CsvUploadService;
export type {UploadStatus, UploadCSVParams};