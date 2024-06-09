import express, { Router } from "express";
import supabase from "../supabase.js";
import dotenv from 'dotenv';
import authenticateToken from "../middlewares/authMiddleware.js";
import Multer from "multer";
dotenv.config();

const upload = Multer();
const route = express.Router();

//GET BARTER DETAILS
route.get('/barter/:id', authenticateToken, async(req,res) => {
   try {
    const { id } = req.params;
    const barter = await supabase.from('barter').select('*').eq('id', id);
    if(barter.data[0]==null){
        return res.status(404).json({message:"Cannot find details for this barter entity."});
    }
    
    const requester = await supabase.from('users').select('username, id').eq('id', barter.data[0].requester);
    const recipient = await supabase.from('users').select('username, id').eq('id', barter.data[0].recipient);
    const barang_requester = await supabase.from('barang').select('*').eq('id', barter.data[0].barang_requester);
    const barang_recipient = await supabase.from('barang').select('*').eq('id', barter.data[0].barang_recipient);

    barter.data[0]['requester'] = requester.data;
    barter.data[0]['recipient'] = recipient.data;
    barter.data[0]['barang_requester'] = barang_requester.data;
    barter.data[0]['barang_recipient'] = barang_recipient.data;

    return res.status(200).send(barter.data);

   } catch (error) {
        return res.status(500).json({ message: error.message });
   }
});

//POST Request Barter
route.post('/reqBarter', upload.none(), authenticateToken, async(req,res) => {
    try {
        const {jmlh_barang_dibarter, jmlh_barang_didapat, barang_requester, barang_recipient, recipient} = req.body;
        const requester = req.user.id;
        
        await supabase.from('barter').insert([{
            jmlh_barang_dibarter: jmlh_barang_dibarter, 
            jmlh_barang_didapat: jmlh_barang_didapat,
            barang_requester: barang_requester,
            barang_recipient: barang_recipient,
            recipient: recipient,
            requester: requester,
            status: "Requested"
        }]);

        return res.status(200).json({message:"Request Exchange Successful."});

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//GET request barter FROM other users
route.get('/barter', authenticateToken, async(req,res) => {
    try {
        const recipient_id = req.user.id;
        const barter = await supabase.from('barter').select('*').eq('recipient', recipient_id);
        if(barter.data[0] == null){
            return res.status(200).json({message:"This user doesn't have a barter request from other user."});
        }

        return res.status(200).send(barter.data);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//GET request barter TO other users
route.get('/requestedBarter', authenticateToken, async(req,res) => {
    try {
        const requester_id = req.user.id;
        const barter = await supabase.from('barter').select('*').eq('requester', requester_id);
        if(barter.data[0] == null){
            return res.status(200).json({message:"This user doesn't have a barter request to other user."});
        }

        return res.status(200).send(barter.data);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//UPDATE barter status
route.put('/updateStatus/:id', upload.none(), authenticateToken, async(req,res) => {
    try {
        const { id } = req.params;
        const newStatus = req.body.newStatus;
        const barter = await supabase.from('barter').select('*').eq('id', id);
        if(barter.data[0]==null){
            return res.status(404).json({message:"Cannot find this barter entity."});
        }

        const updatedBarter = await supabase
        .from('barter')
        .update({ status: newStatus })
        .eq('id', id)
        .select("*");

        return res.status(200).send(updatedBarter.data);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

export default route;