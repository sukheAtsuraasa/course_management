interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    phone: string;
    role: string;
    gender: string | null;
}

export { User };
