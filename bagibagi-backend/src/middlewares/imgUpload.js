'use strict'
import { Storage } from "@google-cloud/storage";
import dateFormat from "dateformat";
import path from "path";

const pathKey = path.resolve('./src/serviceaccountkey.json')

const gcs = new Storage({
    projectId: 'bagibagiapp',
    keyFilename: pathKey
})

const bucketName = 'users_products'
const bucket = gcs.bucket(bucketName)

function getPublicUrl(filename) {
    return 'https://storage.googleapis.com/' + bucketName + '/' + filename;
}

let ImgUpload = {}

ImgUpload.uploadToGcs = (req, res, next) => {
    if (!req.file) return next()

    const gcsname = dateFormat(new Date(), "yyyymmdd-HHMMss")
    const file = bucket.file(gcsname)

    const stream = file.createWriteStream({
        metadata: {
            contentType: req.file.mimetype
        }
    })

    stream.on('error', (err) => {
        req.file.cloudStorageError = err
        next(err)
    })

    stream.on('finish', () => {
        req.file.cloudStorageObject = gcsname
        req.file.cloudStoragePublicUrl = getPublicUrl(gcsname)
        next()
    })

    stream.end(req.file.buffer)
}

export default ImgUpload;
