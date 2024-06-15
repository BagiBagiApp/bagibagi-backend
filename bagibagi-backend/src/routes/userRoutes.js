import express, { Router } from "express";
import supabase from "../supabase.js";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import bcrypt from "bcryptjs";
import util from "util";
import authenticateToken from "../middlewares/authMiddleware.js";
import mysql from "mysql";
import Multer from "multer";
dotenv.config();

const upload = Multer();
const route = express.Router();
const secretKey = process.env.JWT_SECRET_KEY;

const connection = mysql.createConnection({
    host: '34.101.139.241',
    user: 'root',
    database: 'bagibagiapp',
    password: 'bagibagi-db'
});

//biar bisa sync
const query = util.promisify(connection.query).bind(connection);

//REGISTER (supabase)
route.post('/registersb',upload.none(),  async (req,res) => {
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

//REGISTER (cloudsql)
route.post('/register',upload.none(),  async (req,res) => {
    try {
        const {username, password, alamat, notelp, email, tgl_lahir, jenis_kelamin} = req.body;

        const foundName = await query('SELECT username FROM users WHERE username = ?', [username]);

        if (foundName[0] != null) {
            // Username already taken
            return res.status(400).json({ message: "Username already taken." });
        } else {
            const salt = await bcrypt.genSalt();
            const finalPass = await bcrypt.hash(password, salt);
            const query = `INSERT INTO users (email, username, password, alamat, notelp, tgl_lahir, jenis_kelamin) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            const values = [email, username, finalPass, alamat, notelp, tgl_lahir, jenis_kelamin];
            
            connection.query(query, values, (error, results)  => {
                if (error) throw error;
                console.log(results);
            })

            return res.status(200).json({message:"Registration successful."});
        }

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//LOGIN (supabase)
route.post('/loginsb', upload.none(),  async (req, res) => {
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

//LOGIN (cloudsql)
route.post('/login', upload.none(),  async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        
        const foundName = await query('SELECT * FROM users WHERE username = ?', [username]);

        if (foundName[0] == null) {
            return res.status(400).json({ message: "User not found." });
        }
        else {
            const valid = await bcrypt.compare(password, foundName[0].password);
            if (valid) {
                const user = { ...foundName[0] }; //mengubah rowdatapacket object menjadi plain object
                const token = jwt.sign(user, secretKey);
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
route.get('/userDashboard', authenticateToken, async(req,res) => {
    try {
        const user_id = req.user.id;
        // var details = [];
        // var barterSukses = [];

        const details = await query('SELECT * FROM users WHERE id = ?', [user_id]);
        const barterSukses = await query('SELECT id FROM barter WHERE (requester = ? OR recipient = ?) AND status = "success"', [user_id, user_id]);

        details[0]["sukses_barter"] = barterSukses.length;

        return res.status(200).send(details);

        // connection.query('SELECT * FROM users WHERE id = ?', [user_id], (error, results, fields) => {
        //     if (error) throw error;
        //     details = results;
        //     console.log(results);
        //     console.log(fields);
            
        //     connection.query('SELECT id FROM barter WHERE (requester = ? OR recipient = ?) AND status = "success"', [user_id, user_id], (error, results, fields) => {
        //         if (error) throw error;
        //         barterSukses = results;

        //         if(barterSukses.length == 0){
        //             details[0]["sukses_barter"] = 0;
        //         }else{
        //             details[0]["sukses_barter"] = barterSukses.length;
        //         }
        
        //         return res.status(200).send(details);
        //     });
        // });
        
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//GET USER'S DETAILS for dashboard (supabase)
route.get('/userDashboardsb', authenticateToken, async(req,res) => {
    try {
        const user_id = req.user.id;

        const details = await supabase.from('users').select('*').eq('id', user_id);

        const barterSukses = await supabase.from('barter').select('id').or(`requester.eq.${user_id},recipient.eq.${user_id}`).eq('status', 'Completed');
        details.data[0]["sukses_barter"] = barterSukses.data.length;

        return res.status(200).send(details.data);
        
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// FOR PROFILE PAGE

// GET profile users and the profile's products owned (supabase)
route.get('/getProfilesb', authenticateToken, async(req,res) => {
    try {
        const user_id = req.user.id;
        const profile = await supabase.from('users').select('*').eq('id', user_id);
        const products = await supabase.from('barang').select('*').eq('pemilik', user_id);
        profile.data[0]["produk"] = products.data;

        return res.status(200).send(profile.data);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// GET profile users and the profile's products owned (cloudsql)
route.get('/getProfile', authenticateToken, async(req,res) => {
    try {
        const user_id = req.user.id;
        // var profile = [];
        // var products = [];

        const profile = await query('SELECT * FROM users WHERE id = ?', [user_id]);
        const products = await query('SELECT * FROM barang WHERE pemilik = ?', [user_id]);
        profile[0]["produk"] = products;

        // connection.query('SELECT * FROM users WHERE id = ?', [user_id], (error, results) => {
        //     if (error) throw error;
        //     profile = results;
        // });
        // connection.query('SELECT * FROM barang WHERE pemilik = ?', [user_id], (error, results) => {
        //     if (error) throw error;
        //     products = results;
        // });
        // profile[0]["produk"] = products;

        return res.status(200).send(profile);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//UPDATE profile (supabase)
route.put('/updateProfilesb', upload.none(), authenticateToken, async(req,res) => {
    try {
        const user_id = req.user.id;
        const { username, alamat, notelp } = req.body;

        const updatedProfile = await supabase
        .from('users')
        .update({
            username: username,  
            alamat: alamat, 
            notelp: notelp
        })
        .eq('id', user_id)
        .select('*');

        return res.status(200).send(updatedProfile.data);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//UPDATE profile (cloudsql)
route.put('/updateProfile', upload.none(), authenticateToken, async(req,res) => {
    try {
        const user_id = req.user.id;
        const { username, alamat, notelp } = req.body;
        // var updatedProfile = [];

        await query('UPDATE users SET username = ?, alamat = ?, notelp = ? WHERE id = ?', [username, alamat, notelp, user_id]);
        const updatedProfile = await query('SELECT * FROM users WHERE id = ?', [user_id]);

        // connection.query('UPDATE users SET username = ?, alamat = ?, notelp = ? WHERE id = ?', [username, alamat, notelp, user_id], (error, results) => {
        //     if (error) throw error;
        //     console.log(results);
        // });
        // connection.query('SELECT * FROM users WHERE id = ?', [user_id], (error, results) => {
        //     if (error) throw error;
        //     updatedProfile = results;
        // });        

        return res.status(200).send(updatedProfile);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});


export default route;