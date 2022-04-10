import jwt from "jsonwebtoken";
const my_scret_key: string = "UkXp2s5v8y/B?E(H+KbPeShVmYq3t6w9z$C&F)J@NcQfTjWnZr4u7x!A%D*G-KaP";


const verify_auth = (token: string): Promise<any> => {

    return new Promise((resolve, reject) => {
        if (token) {
            jwt.verify(token, my_scret_key, (err, decodedToken) => {
                if (err) {
                    reject(false)
                } else {
                    resolve(decodedToken)
                }
            });
        } else {
            reject(false)
        }
    });


};

export { verify_auth };
