import jwt from "jsonwebtoken";
const scret_key: string = "UkXp2s5v8y/B?E(H+KbPeShVmYq3t6w9z$C&F)J@NcQfTjWnZr4u7x!A%D*G-KaP";
const minAge = 3 * 24 * 60 * 60; //3 Days in sec

const createToken = (email: string) => {
    return jwt.sign({ email }, scret_key, {
        expiresIn: minAge,
    });
};

export default createToken;
