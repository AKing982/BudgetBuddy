import {apiUrl} from "../config/api"
import axios, {AxiosError} from "axios";



export interface AuthenticationResponse {
    token: string;
    tokenType: string;
    username: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export async function authenticateUser(credentials: LoginCredentials) : Promise<AuthenticationResponse>
{

    console.log('Credentials: ', credentials);
    try
    {
        const {username, password} = credentials;
        const response = await axios.post<AuthenticationResponse>(`${apiUrl}/api/auth/`, {
            username,
            password
            });
        console.log('Response: ', response);
        return response.data;
    }catch(error)
    {
        if (error instanceof AxiosError) {
            console.error("Authentication error:", error.response?.data || error.message);
        } else {
            console.error("Unexpected error during authentication:", error);
        }
        throw error;
    }
}


