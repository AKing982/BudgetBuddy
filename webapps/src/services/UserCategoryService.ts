import { API_BASE_URL } from "../config/api";
import axios, {AxiosError} from "axios";

export interface UserCategory {
    id: number;
    userId?: number;
    category?: string;
    active: boolean;
    type: string;
    is_system_override: boolean;
}

class UserCategoryService
{
    private static instance: UserCategoryService;

    public static getInstance() : UserCategoryService {
        if(!UserCategoryService.instance){
            UserCategoryService.instance = new UserCategoryService();
        }
        return UserCategoryService.instance;
    }

    constructor(){

    }

    public async addCustomUserCategory(userId: number, category: string): Promise<UserCategory> {
        try
        {
            const response = await axios.post<UserCategory>(
                `${API_BASE_URL}/user-category/${userId}/add`,
                null,
                {
                    params: {
                        category: category
                    }
                }
            );
            return response.data;

        }catch(error){
            console.error("There was an error adding a custom user category: ", error);
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                console.error('Response status:', axiosError.response?.status);
                console.error('Response data:', axiosError.response?.data);
            }
            throw error;
        }
    }
}
export default UserCategoryService;