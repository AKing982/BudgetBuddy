import {API_BASE_URL, apiUrl} from "../config/api";

class UserService {
    private baseURL: string = 'http://localhost:8080/api/users';
    private static instance: UserService;

    private constructor(){

    }

    public static getInstance() : UserService {
        if(!UserService.instance){
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    public async checkUserHasPlaidCSVSyncEnabled(userId: number) : Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/plaid-csv-sync-enabled`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            return await response.json();
        }catch(error){
            console.error("There was an error checking if the user has plaid csv sync enabled: ", error);
            throw error;
        }
    }

    public async findEmailByUserId(userId: number) : Promise<string>
    {
        if(userId < 1){
            throw new Error("Invalid UserId: " + userId);
        }
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/email`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`User with ID ${userId} not found`);
                }
                throw new Error(`Error fetching email: ${response.status}`);
            }

            // Parse the response to get the username
            return await response.text();

        } catch (error) {
            console.error(`There was an error finding the email by id ${userId}`, error);
            throw error;
        }
    }

    public async updateUserUploadEnabledAccess(userId: number, uploadEnabled: boolean) : Promise<string>
    {
        if(userId < 1)
        {
            throw new Error("Invalid UserId: " + userId);
        }
        try
        {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/override-enabled?overrideEnabled=${uploadEnabled}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }
            return response.text();
        }catch(error){
            console.error("There was an error updating the upload enabled status: ", error);
            throw error;
        }
    }

    public async fetchUserOverrideEnabled(userId: number) : Promise<boolean>
    {
        if(userId < 1)
        {
            throw new Error("Invalid UserId: " + userId);
        }
        try
        {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/override-enabled`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if(!response.ok)
            {
                throw new Error(`Error fetching override enabled status: ${response.status}`);
            }
            return await response.json();
        }catch(error){
            console.error("There was an error fetching the override enabled status: ", error);
            throw error;
        }
    }

    public async findFirstAndLastNameByUserId(userId: number) : Promise<string>
    {
        if(userId < 1){
            throw new Error("Invalid UserId: " + userId);
        }
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/name`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`User with ID ${userId} not found`);
                }
                throw new Error(`Error fetching name: ${response.status}`);
            }

            // Parse the response to get the username
            return await response.text();

        } catch (error) {
            console.error(`There was an error finding the name by id ${userId}`, error);
            throw error;
        }
    }

    public async findUserNameByUserId(userId: number) : Promise<string> {
        if(userId < 1){
            throw new Error("Invalid UserId: " + userId);
        }
        try {
            const response = await fetch(`${API_BASE_URL}/${userId}/find-name`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`User with ID ${userId} not found`);
                }
                throw new Error(`Error fetching username: ${response.status}`);
            }

            // Parse the response to get the username
            return await response.text();

        } catch (error) {
            console.error(`There was an error finding the username by id ${userId}`, error);
            throw error;
        }
    }
}
export default UserService;