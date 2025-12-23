export interface User {
    id: number;
    username: string;
    password: string;
    email: string;
}

export interface JWToken {
    access: string;
    refresh: string;
}
