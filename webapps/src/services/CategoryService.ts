import {CSVTransaction} from "../utils/Items";
import axios, {AxiosError} from "axios";
import {CategorySaveData} from "../components/CategoryDialog";
import {API_BASE_URL} from "../config/api";

export interface CategoryEntity{
    id: number;
    category: string;
    plaidCategoryId?: string;
    plaidCategory?: string;
    description?: string;
    isActive: boolean;
}

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

    public async getAllSystemCategories() : Promise<CategoryEntity[]>
    {
        try
        {
            const response = await axios.get<CategoryEntity[]>(`${API_BASE_URL}/category/all-sys-categories`);
            return response.data;
        }catch(error){
            console.error('Error fetching system categories:', error);
            return [];
        }
    }

    public async fetchCategorizedCSVTransactions(userId: number,
                                                 startDate: string, endDate: string): Promise<CSVTransaction[]>{
        try
        {
            const response = await axios.post<CSVTransaction[]>(`${API_BASE_URL}/categorize/${userId}/csv`, {

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