import {User} from "lucide-react";
import {apiUrl} from "../config/api";

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

    public async findEmailByUserId(userId: number) : Promise<string>
    {
        if(userId < 1){
            throw new Error("Invalid UserId: " + userId);
        }
        try {
            const response = await fetch(`${apiUrl}/users/${userId}/email`, {
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

    public async findFirstAndLastNameByUserId(userId: number) : Promise<string>
    {
        if(userId < 1){
            throw new Error("Invalid UserId: " + userId);
        }
        try {
            const response = await fetch(`${apiUrl}/users/${userId}/name`, {
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
            const response = await fetch(`${apiUrl}/${userId}/find-name`, {
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