import {CSVTransaction} from "../utils/Items";
import axios, {AxiosError} from "axios";
import {CategorySaveData} from "../components/CategoryDialog";

class CategoryService
{
    private static instance: CategoryService;
    private readonly apiUrl;

    constructor(apiUrl: string = "http://localhost:8080/api/category"){
        this.apiUrl = apiUrl;
    }

    public static getInstance() : CategoryService {
        if(!CategoryService.instance){
            CategoryService.instance = new CategoryService();
        }
        return CategoryService.instance;
    }


    public async fetchCategorizedCSVTransactions(userId: number,
                                                 startDate: string, endDate: string): Promise<CSVTransaction[]>{
        try
        {
            const response = await axios.post<CSVTransaction[]>(`${this.apiUrl}/categorize/${userId}/csv`, {

            }, {
                params: {
                    startDate,
                    endDate
                }
            });
            return response.data;
        }catch(error){
            console.error('Error fetching categorized CSV transactions:', error);
            if(axios.isAxiosError(error)){
                const axiosError = error as AxiosError;
                console.error('Response status:', axiosError.response?.status);
                console.error('Response data:', axiosError.response?.data);
            }
            return [];
        }
    }
}

export default CategoryService;