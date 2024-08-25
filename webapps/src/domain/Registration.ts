class Registration {
    private firstName: string;
    private lastName: string;
    private email: string;
    private password: string;
    private confirmPassword: string;
    private initialBalance: number;
    private currency: string

    constructor(first: string, last: string, email: string, password: string, confirmPass: string, balance: number, currency: string){
        this.firstName = first;
        this.lastName = last;
        this.email = email;
        this.password = password;
        this.confirmPassword = confirmPass;
        this.initialBalance = balance;
        this.currency = currency;
    }

}

export {}