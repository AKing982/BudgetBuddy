
import {apiUrl} from "../config/api";
import axios from "axios";

class LoginService {

    constructor(){
    }


    public async fetchUserIdByUsername(user: string | null) : Promise<number>
    {
        console.log('Fetching UserId for username: ', user);
        try
        {
            const response = await axios.get(`${apiUrl}/api/users/username`, {
                params: {
                    username: user
                }
            });
            console.log('UserID: ', response.data);
            return response.data;
        }catch(err)
        {
            console.error("There was an error fetching the userId: ", err);
            throw err;
        }
    }

    public async fetchMaximumUserId() : Promise<number> {
        try
        {
            const response = await axios.get(`${apiUrl}/api/users/max-id`);
            return response.data;

        }catch(error){
            console.error('There was an error fetching the latest userId: ', error);
            throw error;
        }
    }
}

export default LoginService;