
import apiUrl from "../config/api";
import axios from "axios";

class LoginService {
    private username: string;
    private password: string;

    constructor(user: string, pass: string){
        this.username = user;
        this.password = pass;
    }

    public async fetchUserIdByUsername(user: string) : Promise<number>
    {
        try
        {
            const response = await axios.get(`${apiUrl}/api/users/username`, {
                params: {
                    username: user
                }
            });
            return response.data;
        }catch(err)
        {
            console.error("There was an error fetching the userId: ", err);
            throw err;
        }
    }
}

export default LoginService;