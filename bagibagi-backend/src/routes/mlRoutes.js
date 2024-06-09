import express, { Router } from "express";
import supabase from "../supabase.js";
import dotenv from 'dotenv';
import authenticateToken from "../middlewares/authMiddleware.js";
import imgUpload from "../middlewares/imgUpload.js";
import Multer from "multer";
dotenv.config();

const route = express.Router();

//REC SYSTEM
route.get('/recommendations', async(req,res) => {
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
        for(const produk in exchange.data){
            const produk_id = exchange.data[produk].barang_recipient;

            const data_produk = await supabase.from('barang').select('kategori').eq('id', produk_id);
            if(data_produk.data[0].kategori == "fashion"){
                jmlh_fashion += 1;
            } else if(data_produk.data[0].kategori == "auto_accessories"){
                jmlh_autoAccessories += 1;
            } else if(data_produk.data[0].kategori == "electronic") {
                jmlh_electronic += 1;
            } else if(data_produk.data[0].kategori == "home_furniture") {
                jmlh_homeFurniture += 1;
            }
        }
        const userVec = [[jmlh_autoAccessories, jmlh_electronic, jmlh_fashion, jmlh_homeFurniture]];

        let productVec = [];
        const allProducts = await supabase.from('barang').select('kategori, qty');
        for(const produk in allProducts.data){
            const kategori = allProducts.data[produk].kategori;
            const qty = allProducts.data[produk].qty;
            if(kategori == "fashion"){
                productVec.push([0, qty, 0, 1, 0]);
            } else if(kategori == "auto_accessories"){
                productVec.push([1, qty, 0, 0, 0]);
            } else if(kategori == "electronic") {
                productVec.push([0, qty, 1, 0, 0]);
            } else if(kategori == "home_furniture") {
                productVec.push([0, qty, 0, 0, 1]);
            }
        }

        return res.status(200).json({ userVec: userVec, productVec: productVec });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

export default route;