import express from 'express';
import supabase from "../supabase.js";
import dotenv from 'dotenv';
import authenticateToken from "../middlewares/authMiddleware.js";
import imgUpload from "../middlewares/imgUpload.js";
import Multer from "multer";
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from "child_process";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const route = express.Router();

route.get('/recommendations', async (req, res) => {
    try {
        const user_id = 2;
        const exchange = await supabase
            .from('barter')
            .select('id, barang_recipient')
            .eq('requester', user_id);

        let jmlh_autoAccessories = 0;
        let jmlh_fashion = 0;
        let jmlh_electronic = 0;
        let jmlh_homeFurniture = 0;
        for (const produk of exchange.data) {
            const produk_id = produk.barang_recipient;

            const data_produk = await supabase.from('barang').select('kategori').eq('id', produk_id);
            if (data_produk.data[0].kategori == "fashion") {
                jmlh_fashion += 1;
            } else if (data_produk.data[0].kategori == "auto_accessories") {
                jmlh_autoAccessories += 1;
            } else if (data_produk.data[0].kategori == "electronic") {
                jmlh_electronic += 1;
            } else if (data_produk.data[0].kategori == "home_furniture") {
                jmlh_homeFurniture += 1;
            }
        }
        const userVec = [[jmlh_autoAccessories, jmlh_electronic, jmlh_fashion, jmlh_homeFurniture]];

        let productVec = [];
        const allProducts = await supabase.from('barang').select('kategori, qty');
        for (const produk of allProducts.data) {
            const kategori = produk.kategori;
            const qty = produk.qty;
            if (kategori == "fashion") {
                productVec.push([0, qty, 0, 1, 0]);
            } else if (kategori == "auto_accessories") {
                productVec.push([1, qty, 0, 0, 0]);
            } else if (kategori == "electronic") {
                productVec.push([0, qty, 1, 0, 0]);
            } else if (kategori == "home_furniture") {
                productVec.push([0, qty, 0, 0, 1]);
            }
        }


        const pythonProcess = spawn('python3', ['src/scripts/recommend.py', JSON.stringify(userVec), JSON.stringify(productVec)]);

        pythonProcess.stdout.on('data', (data) => {
            // Ambil hasil output dari skrip Python
            const result = JSON.parse(data.toString());
            console.log(result);
   
            return res.json(result);
        });


        // pythonProcess.stderr.on('data', (data) => {
        //     console.error(`Error: ${data.toString()}`);
        // });

        // pythonProcess.on('close', (code) => {
        //     if (code !== 0) {
        //         return res.status(500).json({ message: 'Internal Server Error' });
        //     }

        //     const topProductIndices = JSON.parse(scriptOutput);

        //     // Fetch product details for the recommended products
        //     const recommendedProducts = topProductIndices.map(async (index) => {
        //         const productDetails = await supabase.from('barang').select('*').eq('id', index);
        //         return productDetails.data[0];
        //     });

        //     Promise.all(recommendedProducts)
        //         .then(products => res.status(200).json({ recommendations: products }))
        //         .catch(error => res.status(500).json({ message: error.message }));
        // });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

export default route;
