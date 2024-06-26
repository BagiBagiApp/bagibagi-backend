import express, { Router } from "express";
import supabase from "../supabase.js";
import dotenv from 'dotenv';
import authenticateToken from "../middlewares/authMiddleware.js";
import axios from 'axios';
import mysql from "mysql";
import util from 'util';

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

//REC SYSTEM (supabase)
route.get('/recommendationssb', authenticateToken, async (req, res) => {
    try {
        // const user_id = 2;
        const user_id = req.user.id;
        const exchange = await supabase
            .from('barter')
            .select('id, barang_recipient')
            .eq('requester', user_id);

        let jmlh_autoAccessories = 0;
        let jmlh_fashion = 0;
        let jmlh_electronic = 0;
        let jmlh_homeFurniture = 0;
        for (const produk in exchange.data) {
            const produk_id = exchange.data[produk].barang_recipient;

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
        const allProducts = await supabase
            .from('barang')
            .select('id, kategori, qty, pemilik')
            .neq('pemilik', user_id);
        for (const produk in allProducts.data) {
            const kategori = allProducts.data[produk].kategori;
            const qty = allProducts.data[produk].qty;
            const id_barang = allProducts.data[produk].id;
            if (kategori == "fashion") {
                productVec.push([id_barang, 0, qty, 0, 1, 0]);
            } else if (kategori == "auto_accessories") {
                productVec.push([id_barang, 1, qty, 0, 0, 0]);
            } else if (kategori == "electronic") {
                productVec.push([id_barang, 0, qty, 1, 0, 0]);
            } else if (kategori == "home_furniture") {
                productVec.push([id_barang, 0, qty, 0, 0, 1]);
            }
        }

        // call recommendation system's API
        const response = await axios.post('https://recsys-api-ba767z7a3q-et.a.run.app/predict', {
            userVec: userVec,
            productVec: productVec
        });

        // recommended id as recsys' response
        const recommendedIdBarang = response.data.recommended_id;

        // todo: get only the top 10 array item
        let top10RecomIdBarang = recommendedIdBarang.slice(0, 10);

        const recommendedProducts = await supabase
            .from('barang')
            .select('id, link_foto, nama_produk, qty, desc, kategori, status, years_of_usage, pemilik')
            .in('id', top10RecomIdBarang);

        const productMap = {};
        recommendedProducts.data.forEach(product => {
            productMap[product.id] = {
                id: product.id,
                nama_produk: product.nama_produk,
                desc: product.desc,
                kategori: product.kategori,
                qty: product.qty,
                status: product.status,
                years_of_usage: product.years_of_usage,
                pemilik: product.pemilik,
                link_foto: product.link_foto
            };
        });

        const recommendations = top10RecomIdBarang.map(id => productMap[id]);

        return res.status(200).json({
            recommendations: recommendations
        });

        // return res.status(200).json({ userVec: userVec, productVec: productVec });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

//REC SYSTEM (cloudsql)
route.get('/recommendations', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        const exchange = await query('SELECT id, barang_recipient FROM barter WHERE requester = ?', [user_id]);

        let jmlh_autoAccessories = 0;
        let jmlh_fashion = 0;
        let jmlh_electronic = 0;
        let jmlh_homeFurniture = 0;
        for (const produk in exchange) {
            const produk_id = exchange[produk].barang_recipient;

            const data_produk = await query('SELECT kategori FROM barang WHERE id = ?', [produk_id]);
            if (data_produk[0].kategori == "fashion") {
                jmlh_fashion += 1;
            } else if (data_produk[0].kategori == "auto_accessories") {
                jmlh_autoAccessories += 1;
            } else if (data_produk[0].kategori == "electronic") {
                jmlh_electronic += 1;
            } else if (data_produk[0].kategori == "home_furniture") {
                jmlh_homeFurniture += 1;
            }
        }
        const userVec = [[jmlh_autoAccessories, jmlh_electronic, jmlh_fashion, jmlh_homeFurniture]];

        let productVec = [];
        const allProducts = await query('SELECT id, kategori, qty, pemilik FROM barang WHERE pemilik != ?', [user_id]);
        for (const produk in allProducts) {
            const kategori = allProducts[produk].kategori;
            const qty = allProducts[produk].qty;
            const id_barang = allProducts[produk].id;
            if (kategori == "fashion") {
                productVec.push([id_barang, 0, qty, 0, 1, 0]);
            } else if (kategori == "auto_accessories") {
                productVec.push([id_barang, 1, qty, 0, 0, 0]);
            } else if (kategori == "electronic") {
                productVec.push([id_barang, 0, qty, 1, 0, 0]);
            } else if (kategori == "home_furniture") {
                productVec.push([id_barang, 0, qty, 0, 0, 1]);
            }
        }

        // call recommendation system's API
        const response = await axios.post('https://recsys-api-ba767z7a3q-et.a.run.app/predict', {
            userVec: userVec,
            productVec: productVec
        });

        // recommended id as recsys' response
        const recommendedIdBarang = response.data.recommended_id;

        // todo: get only the top 10 array item
        let top10RecomIdBarang = recommendedIdBarang.slice(0, 10);

        const recommendedProducts = await query('SELECT * FROM barang WHERE id IN (?)', [top10RecomIdBarang]);

        const productMap = {};
        recommendedProducts.forEach(product => {
            productMap[product.id] = {
                id: product.id,
                nama_produk: product.nama_produk,
                desc: product.desc,
                kategori: product.kategori,
                qty: product.qty,
                status: product.status,
                years_of_usage: product.years_of_usage,
                pemilik: product.pemilik,
                link_foto: product.link_foto
            };
        });

        const recommendations = top10RecomIdBarang.map(id => productMap[id]);

        return res.status(200).json({
            recommendations: recommendations
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

export default route;