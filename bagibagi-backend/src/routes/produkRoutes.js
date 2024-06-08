import express, { Router } from "express";
import supabase from "../supabase.js";
import dotenv from 'dotenv';
import authenticateToken from "../middlewares/authMiddleware.js";
import imgUpload from "../middlewares/imgUpload.js";
import Multer from "multer";
dotenv.config();

const route = express.Router();

const multer = Multer({
    storage: Multer.MemoryStorage,
    fileSize: 5 * 1024 * 1024
})

//GET ALL PRODUCTS
route.get('/allProducts',authenticateToken, async(req,res) => {
    try {
        const data = await supabase.from('barang').select('*');
        return res.status(200).json({data: data});
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//GET PRODUCT'S DETAILS
route.get('/:id', authenticateToken, async(req,res) => {
    try {
        const { id } = req.params;
        const details = await supabase.from('barang').select('*').eq('id', id);
        const ownersName = await supabase.from('users').select('username').eq('id', details.data[0].pemilik);
        details.data[0].pemilik = ownersName.data[0].username;
        return res.status(200).json({data: details});
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//CREATE A PRODUCT
route.post('/upload', authenticateToken, multer.single('foto'), imgUpload.uploadToGcs, async(req,res) => {
    try {
        const {nama_produk, desc, kategori, qty, status, years_of_usage} = req.body;
        var imageUrl = ''

        if (req.file && req.file.cloudStoragePublicUrl) {
            imageUrl = req.file.cloudStoragePublicUrl
        }

        const newProduct = await supabase.from('barang').insert([{
            nama_produk: nama_produk,
            desc: desc,
            kategori: kategori,
            qty: qty,
            status: status,
            years_of_usage: years_of_usage,
            link_foto: imageUrl,
            pemilik: req.user.id
        }]).select();

        return res.status(200).send(newProduct);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//UPDATE a product
route.put('/update/:id', authenticateToken, async(req,res) => {
    try {
        const { id } = req.params;
        const { nama_produk, desc, kategori, qty, status, years_of_usage } = req.body;

        const product = await supabase.from('barang').select('nama_produk').eq('id', id);
        if(product.data[0] == null){
            return res.status(404).json({message: "Product with this id does not exist."})
        }

        const updatedProduct = await supabase
        .from('barang')
        .update({nama_produk: nama_produk, desc: desc, kategori: kategori, qty: qty, status: status, years_of_usage: years_of_usage })
        .eq('id', id)
        .select("*");

        return res.status(200).send(updatedProduct.data);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//DELETE a product
route.delete('/delProduct/:id', authenticateToken, async(req,res) => {
    try {
        const { id } = req.params;
        const product = await supabase.from('barang').select('nama_produk').eq('id', id);

        if(product.data[0] == null){
            return res.status(404).json({message: "Product with this id does not exist."})
        }

        await supabase.from('barang').delete().eq('id', product_id);
        return res.status(200).json({ message: "Delete success."});
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

export default route;