class LoginService {
    private username: string;
    private password: string;

    constructor(user: string, pass: string){
        this.username = user;
        this.password = pass;
    }

    public async fetchUserIdByUsername() : Promise<number>
    {
        try
        {
            
        }catch(err)
        {
            console.error("There was an error fetching the userId: ", err);
        }
    }
}

export default LoginService;