import express, { Router } from "express";
import supabase from "../supabase.js";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import bcrypt from "bcryptjs";
import authenticateToken from "../middlewares/authMiddleware.js";
import mysql from "mysql";
import Multer from "multer";
dotenv.config();

const upload = Multer();
const route = express.Router();
const secretKey = process.env.JWT_SECRET_KEY;

const connection = mysql.createConnection({
    host: '34.128.74.158',
    user: 'root',
    database: 'bagibagiapp',
    password: 'bagibagi'
})

//REGISTER
route.post('/register',upload.none(),  async (req,res) => {
    try {
        const {username, password, alamat, notelp, email, tgl_lahir, jenis_kelamin} = req.body;
        const foundName = await supabase.from('users').select('username').eq('username', username);

        if (foundName.data[0] != null) {
            // Username already taken
            return res.status(400).json({ message: "Username already taken." });
        } else {
            const salt = await bcrypt.genSalt();
            const finalPass = await bcrypt.hash(password, salt);

            await supabase.from('users').insert([{
                email: email,
                username: username,
                password: finalPass,
                alamat: alamat,
                notelp: notelp,
                tgl_lahir: tgl_lahir,
                jenis_kelamin: jenis_kelamin
            }]).select();

            return res.status(200).json({message:"Registration successful."});
        }

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//LOGIN
route.post('/login', upload.none(),  async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;

        const foundName = await supabase.from('users').select('*').eq('username', username);

        if (foundName.data[0] == null) {
            return res.status(400).json({ message: "User not found." });
        }
        else {
            const valid = await bcrypt.compare(password, foundName.data[0].password);
            if (valid) {
                const token = jwt.sign(foundName.data[0], secretKey);
                return res.status(200).json({ token: token});
            }
            else {
                return res.status(400).json({ message: "Password incorrect." });
            }
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//LOGOUT
route.get('/logout', (req, res) => {
    req.user = null;
    res.status(200).json({ message: "Logout telah berhasil." });
});

//GET USER'S DETAILS (cloud sql)
// route.get('/:id', authenticateToken, async(req,res) => {
//     try {
//         const { id } = req.params;
//         var details = [];
//         var barterSukses = [];

//         connection.query('SELECT * FROM users WHERE id = ?', [id], (error, results, fields) => {
//             if (error) throw error;
//             details = results;
            
//             connection.query('SELECT id FROM barter WHERE (requester = ? OR recepient = ?) AND status = "success"', [id, id], (error, results, fields) => {
//                 if (error) throw error;
//                 barterSukses = results;

//                 if(barterSukses.length == 0){
//                     details[0]["sukses_barter"] = 0;
//                 }else{
//                     details[0]["sukses_barter"] = barterSukses.data.length;
//                 }
        
//                 return res.status(200).send(details);
//             });
//         });
        
//     } catch (error) {
//         return res.status(500).json({ message: error.message });
//     }
// });

//GET USER'S DETAILS for dashboard (supabase)
route.get('/userDashboard', authenticateToken, async(req,res) => {
    try {
        const user_id = req.user.id;

        const details = await supabase.from('users').select('*').eq('id', user_id);

        const barterSukses = await supabase.from('barter').select('id').or(`requester.eq.${id},recepient.eq.${id}`).eq('status', 'Done');
        details.data[0]["sukses_barter"] = barterSukses.data.length;

        return res.status(200).send(details.data);
        
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

export default route;