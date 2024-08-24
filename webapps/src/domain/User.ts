interface Roles {
    id: number;
    name: string;
    permissions: string[]
}

class User {
    private id: number;
    private firstName: string;
    private lastName: string;
    private username: string;
    private email: string;
    private password: string;
    private roles: Roles[];

    constructor(id: number, first: string, last: string, user: string, email: string, pass: string, roles: Roles[]){
        this.id = id;
        this.firstName = first;
        this.lastName = last;
        this.username = user;
        this.email = email;
        this.password = pass;
        this.roles = roles;
    }

}

export {}