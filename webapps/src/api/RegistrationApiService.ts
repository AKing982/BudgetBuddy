import apiUrl from "../config/api";
import axios from "axios";

export interface Registration
{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    username: string;
    balance: number;
    currency: string;
}

export async function registerUser(registration: Registration) : Promise<any> {
    const {firstName, lastName, email, password, username, balance, currency} = registration;
    try
    {
        const response = await axios.post(`${apiUrl}/api/register/`, registration);
        console.log('Response: ', response);
        return response;
    } catch (error)
    {
        if (axios.isAxiosError(error)) {
            console.error("Registration Error: ", error.response?.data);
            throw new Error(error.response?.data?.message || "An error occurred during registration");
        } else {
            console.error("Unexpected error: ", error);
            throw error;
        }
    }
}
