import express, { Router } from "express";
import supabase from "../supabase.js";
import dotenv from 'dotenv';
import util from 'util';
import mysql from "mysql";
import authenticateToken from "../middlewares/authMiddleware.js";
dotenv.config();

const route = express.Router();

const connection = mysql.createConnection({
    host: '34.101.139.241',
    user: 'root',
    database: 'bagibagiapp',
    password: 'bagibagi-db'
});

//biar bisa sync
const query = util.promisify(connection.query).bind(connection);

//GET ALL ORGANIZATIONS (supabase)
route.get('/allOrgsb',authenticateToken, async(req,res) => {
    try {
        const org = await supabase.from('organizations').select('*');
        return res.status(200).send(org.data);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//GET ALL ORGANIZATIONS (cloudsql)
route.get('/allOrg',authenticateToken, async(req,res) => {
    try {
        const org = await query('SELECT * FROM organizations');
        return res.status(200).send(org);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//GET ORGANIZATION'S DETAILS (supabase)
route.get('/detailssb/:id', authenticateToken, async(req,res) => {
    try {
        const { id } = req.params;
        const details = await supabase.from('organizations').select('*').eq('id', id);
        return res.status(200).send(details.data);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//GET ORGANIZATION'S DETAILS (cloudsql)
route.get('/details/:id', authenticateToken, async(req,res) => {
    try {
        const { id } = req.params;
        const details = await query('SELECT * FROM organizations WHERE id = ?', [id]);
        return res.status(200).send(details);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

export default route;