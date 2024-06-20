import express, { Router } from "express";
import supabase from "../supabase.js";
import dotenv from 'dotenv';
import util from 'util';
import mysql from "mysql";
import authenticateToken from "../middlewares/authMiddleware.js";
import imgUpload from "../middlewares/imgUpload.js";
import Multer from "multer";
dotenv.config();

const route = express.Router();

const multer = Multer({
    storage: Multer.MemoryStorage,
    fileSize: 5 * 1024 * 1024
})

const connection = mysql.createConnection({
    host: '34.101.139.241',
    user: 'root',
    database: 'bagibagiapp',
    password: 'bagibagi-db'
});

//biar bisa sync
const query = util.promisify(connection.query).bind(connection);

//GET ALL PRODUCTS + SEARCH QUERY (supabase)
route.get('/allProductssb', authenticateToken, async (req, res) => {
    try {
        const { nama_produk } = req.query;

        const { data } = await supabase.from('barang').select('*');

        let filteredData = data;

        if (nama_produk) {
            const searchQuery = decodeURIComponent(nama_produk).toLowerCase();
            filteredData = data.filter(product =>
                product.nama_produk.toLowerCase().includes(searchQuery)
            );
        }

        if (filteredData.length > 0) {
            return res.status(200).json({ data: filteredData });
        } else {
            return res.status(200).json({ data: [], message: 'No products found' });
        }

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//GET ALL PRODUCTS + SEARCH QUERY (cloudsql)
route.get('/allProducts', authenticateToken, async (req, res) => {
    try {
        const { nama_produk } = req.query;

        const data = await query('SELECT * FROM barang');

        let filteredData = data;

        if (nama_produk) {
            const searchQuery = decodeURIComponent(nama_produk).toLowerCase();
            filteredData = data.filter(product =>
                product.nama_produk.toLowerCase().includes(searchQuery)
            );
        }

        if (filteredData.length > 0) {
            return res.status(200).json({ data: filteredData });
        } else {
            return res.status(200).json({ data: [], message: 'No products found' });
        }

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//GET PRODUCT'S DETAILS(supabase)
route.get('/detailssb/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const details = await supabase.from('barang').select('*').eq('id', id);
        const ownersName = await supabase.from('users').select('username, alamat').eq('id', details.data[0].pemilik);
        details.data[0].pemilik = ownersName.data[0];
        return res.status(200).send(details);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//GET PRODUCT'S DETAILS (cloudsql)
route.get('/details/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const details = await query(' SELECT * FROM barang WHERE id = ?', [id]);
        const ownersName = await query(' SELECT username,alamat FROM users WHERE id = ?', [details[0].pemilik]);
        details[0].pemilik = ownersName[0];
        return res.status(200).json({ data: details });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//CREATE A PRODUCT (supabase)
route.post('/uploadsb', authenticateToken, multer.single('foto'), imgUpload.uploadToGcs, async (req, res) => {
    try {
        const { nama_produk, desc, kategori, qty, status, years_of_usage } = req.body;
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

//CREATE A PRODUCT (cloudsql)
route.post('/upload', authenticateToken, multer.single('foto'), imgUpload.uploadToGcs, async (req, res) => {
    try {
        const { nama_produk, desc, kategori, qty, status, years_of_usage } = req.body;
        var imageUrl = ''

        if (req.file && req.file.cloudStoragePublicUrl) {
            imageUrl = req.file.cloudStoragePublicUrl
        }

        const insertQuery = 'INSERT INTO barang (nama_produk, `desc`, kategori, qty, status, years_of_usage, link_foto, pemilik) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

        const values = [nama_produk, desc, kategori, qty, status, years_of_usage, imageUrl, req.user.id];

        const insertProduct = await query(insertQuery, values);
        const newProduct = await query('SELECT * FROM barang WHERE id = ?', [insertProduct.insertId]);

        return res.status(200).send(newProduct);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//UPDATE a product (supabase)
route.put('/updatesb/:id', multer.none(), authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_produk, desc, kategori, qty, status, years_of_usage } = req.body;

        const product = await supabase.from('barang').select('nama_produk').eq('id', id);
        if (product.data[0] == null) {
            return res.status(404).json({ message: "Product with this id does not exist." })
        }

        const updatedProduct = await supabase
            .from('barang')
            .update({ nama_produk: nama_produk, desc: desc, kategori: kategori, qty: qty, status: status, years_of_usage: years_of_usage })
            .eq('id', id)
            .select("*");

        return res.status(200).send(updatedProduct.data);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//UPDATE a product (cloudsql)
route.put('/update/:id', multer.none(), authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_produk, desc, kategori, qty, status, years_of_usage } = req.body;

        const product = await query('SELECT nama_produk FROM barang WHERE id = ?', [id]);
        if (product[0] == null) {
            return res.status(404).json({ message: "Product with this id does not exist." })
        }

        await query('UPDATE barang SET nama_produk = ?, `desc` = ?, kategori = ?, qty = ?, status = ?, years_of_usage = ? WHERE id = ?', [nama_produk, desc, kategori, qty, status, years_of_usage, id]);
        const updatedProduct = await query('SELECT * FROM barang WHERE id = ?', [id]);

        return res.status(200).send(updatedProduct);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//DELETE a product (supabase)
route.delete('/deletesb/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const product = await supabase.from('barang').select('nama_produk').eq('id', id);

        if (product.data[0] == null) {
            return res.status(404).json({ message: "Product with this id does not exist." })
        }

        await supabase.from('barang').delete().eq('id', id);
        return res.status(200).json({ message: "Delete success." });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//DELETE a product (cloudsql)
route.delete('/delete/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const product = await query('SELECT nama_produk FROM barang WHERE id = ?', [id]);

        if (product[0] == null) {
            return res.status(404).json({ message: "Product with this id does not exist." })
        }

        await query('DELETE FROM barang WHERE id = ?', [id]);
        return res.status(200).json({ message: "Delete success." });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

export default route;