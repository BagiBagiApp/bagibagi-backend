import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();
const secretKey = process.env.JWT_SECRET_KEY;

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) {
        return res.send("Token tidak valid.")
    }
    else {
        jwt.verify(token, secretKey, (error, user) => {
            if (error) {
                return res.send("Token sudah expired.")
            }
            else {
                req.user = user
                next()
            }
        })
    }
};

export default authenticateToken;