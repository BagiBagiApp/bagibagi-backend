import express, { Router } from "express";
import supabase from "../supabase.js";
import dotenv from 'dotenv';
import authenticateToken from "../middlewares/authMiddleware.js";
dotenv.config();

const route = express.Router();

//GET ALL ORGANIZATIONS
route.get('/allOrg',authenticateToken, async(req,res) => {
    try {
        const org = await supabase.from('organizations').select('*');
        return res.status(200).send(org.data);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//GET ORGANIZATION'S DETAILS
route.get('/:id', authenticateToken, async(req,res) => {
    try {
        const { id } = req.params;
        const details = await supabase.from('organizations').select('*').eq('id', id);
        return res.status(200).send(details.data);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

export default route;