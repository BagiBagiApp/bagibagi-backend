import express, { Router } from "express";
import supabase from "../supabase.js";
import dotenv from 'dotenv';
import util from 'util';
import mysql from "mysql";
import authenticateToken from "../middlewares/authMiddleware.js";
import Multer from "multer";
dotenv.config();

const upload = Multer();
const route = express.Router();

const connection = mysql.createConnection({
    host: '34.101.139.241',
    user: 'root',
    database: 'bagibagiapp',
    password: 'bagibagi-db'
});

//biar bisa sync
const query = util.promisify(connection.query).bind(connection);

//GET BARTER DETAILS (supabase)
route.get('/bartersb/:id', authenticateToken, async(req,res) => {
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

//GET BARTER DETAILS (cloudsql)
route.get('/barter/:id', authenticateToken, async(req,res) => {
    try {
     const { id } = req.params;
     const barterDetailsQuery = `
            SELECT 
                b.*, 
                u1.username AS requester_username, 
                u1.id AS requester_id, 
                u2.username AS recipient_username, 
                u2.id AS recipient_id, 
                br.*, 
                bq.*
            FROM 
                barter b
            LEFT JOIN 
                users u1 ON b.requester = u1.id
            LEFT JOIN 
                users u2 ON b.recipient = u2.id
            LEFT JOIN 
                barang br ON b.barang_requester = br.id
            LEFT JOIN 
                barang bq ON b.barang_recipient = bq.id
            WHERE 
                b.id = ?`;

    const results = await query(barterDetailsQuery, [id]);

    if (results.length === 0) {
        return res.status(404).json({ message: "Cannot find details for this barter entity." });
    }
        
    const barter = results[0];
    const response = {
        id: barter.id,
        jmlh_barang_dibarter: barter.jmlh_barang_dibarter,
        jmlh_barang_didapat: barter.jmlh_barang_didapat,
        status: barter.status,
        requester: {
            username: barter.requester_username,
            id: barter.requester_id
        },
        recipient: {
            username: barter.recipient_username,
            id: barter.recipient_id
        },
        barang_requester: {
            id: barter.barang_requester,
            nama_produk: barter.nama_produk,
            desc: barter.description,
            qty: barter.qty,
            kategori: barter.kategori,
            status: barter.status,
            years_of_usage: barter.years_of_usage,
            link_foto: barter.link_foto,
            pemilik: barter.pemilik
        },
        barang_recipient: {
            id: barter.barang_recipient,
            nama_produk: barter.nama_produk,
            desc: barter.description,
            qty: barter.qty,
            kategori: barter.kategori,
            status: barter.status,
            years_of_usage: barter.years_of_usage,
            link_foto: barter.link_foto,
            pemilik: barter.pemilik
        }
    };
 
     return res.status(200).send(response);
 
    } catch (error) {
         return res.status(500).json({ message: error.message });
    }
 });

//POST Request Barter (supabase)
route.post('/reqBartersb', upload.none(), authenticateToken, async(req,res) => {
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

//POST Request Barter (cloudsql)
route.post('/reqBarter', upload.none(), authenticateToken, async(req,res) => {
    try {
        const {jmlh_barang_dibarter, jmlh_barang_didapat, barang_requester, barang_recipient, recipient} = req.body;
        const requester = req.user.id;
        
        const insertQuery = 'INSERT INTO barter (jmlh_barang_dibarter, jmlh_barang_didapat, barang_requester, barang_recipient, recipient, requester, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const values = [jmlh_barang_dibarter, jmlh_barang_didapat, barang_requester, barang_recipient, recipient, requester, 'Requested']; 

        await query(insertQuery, values);
        return res.status(200).json({message:"Request Exchange Successful."});

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//GET request barter FROM other users (supabase)
route.get('/bartersb', authenticateToken, async(req,res) => {
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

//GET request barter FROM other users (cloudsql)
route.get('/barter', authenticateToken, async(req,res) => {
    try {
        const recipient_id = req.user.id;
        const barter = await query('SELECT * FROM barter WHERE recipient = ?', [recipient_id]);
        if(barter[0] == null){
            return res.status(200).json({message:"This user doesn't have a barter request from other user."});
        }

        return res.status(200).send(barter);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//GET request barter TO other users (supabase)
route.get('/requestedBartersb', authenticateToken, async(req,res) => {
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

//GET request barter TO other users (cloudsql)
route.get('/requestedBarter', authenticateToken, async(req,res) => {
    try {
        const requester_id = req.user.id;
        const barter = await query('SELECT * FROM barter WHERE requester = ?', [requester_id]);
        if(barter[0] == null){
            return res.status(200).json({message:"This user doesn't have a barter request to other user."});
        }

        return res.status(200).send(barter);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//UPDATE barter status (supabase)
route.put('/updateStatussb/:id', upload.none(), authenticateToken, async(req,res) => {
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

//UPDATE barter status (cloudsql)
route.put('/updateStatus/:id', upload.none(), authenticateToken, async(req,res) => {
    try {
        const { id } = req.params;
        const newStatus = req.body.newStatus;
        const barter = await query('SELECT * FROM barter WHERE id = ?', [id]);
        if(barter[0]==null){
            return res.status(404).json({message:"Cannot find this barter entity."});
        }

        await query('UPDATE barter SET status = ? WHERE id = ?', [newStatus, id]);
        const updatedBarter = await query('SELECT * FROM barter WHERE id = ?', [id]);

        return res.status(200).send(updatedBarter);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

export default route;