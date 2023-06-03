import fs from 'fs'
import path from 'path'
import { safeText } from './helper.js';

export async function getInfo(idurl) {
    return new Promise(async (resolve, reject) => {
        const urlRegex = /((https?:\/\/|www\.)((?!.*\.zip)[^\s\/$.?#]).[^\s]*)/g;
        const isURL = urlRegex.test(idurl)
        let stickerId = idurl
        if (isURL) {
            const r = new RegExp(/product\/(.*?)\//)
            stickerId = idurl.match(r)[1]
        }

        const url = `http://dl.stickershop.line.naver.jp/products/0/0/1/${stickerId}/android/productInfo.meta`

        const resp = await fetch(url)
        if (resp.status > 400) {
            return reject('Invalid sticker ID or URL')
        }

        const result = await resp.json()
        return resolve(result)
    })
}

export async function downloadSticker(result) {
    return new Promise(async (resolve, reject) => {

        const package_name = safeText(result.title.en)
        const package_id = result.packageId

        const folderPath = path.join(process.cwd(), `msd-${package_name}`)

        const sticker_ids = []

        for (const sticker of result.stickers) {
            sticker_ids.push(sticker.id)
        }

        const totalSticker = await download(sticker_ids)

        return resolve({
            type: result.hasAnimation ? "animated" : "static",
            total: totalSticker
        })


        async function download(sticker_ids) {
            const format = result.hasAnimation
            return new Promise((resolve, reject) => {
                //create folder
                try {
                    fs.accessSync(folderPath, fs.constants.F_OK)
                } catch (error) {
                    fs.mkdirSync(folderPath)
                    if (error.code == 'EEXIST') {
                        console.log('code:', error);
                    }
                }
                const promises = []
                for (const [index, sticker_id] of sticker_ids.entries()) {
                    const writeTask = new Promise(async (resolve, reject) => {
                        let url
                        if (format == 'apng') {
                            url = `https://sdl-stickershop.line.naver.jp/products/0/0/1/${package_id}/iphone/animation/${sticker_id}@2x.png`
                        } else {
                            url = `http://dl.stickershop.line.naver.jp/stickershop/v1/sticker/${sticker_id}/iphone/sticker@2x.png`
                        }
                        const response = await fetch(url);

                        const imageArrayBuffer = await response.arrayBuffer();
                        const imageBuffer = Buffer.from(imageArrayBuffer);
                        const fileName = `${package_name}_${sticker_id}.${format}`
                        try {
                            fs.writeFileSync(path.join(folderPath, fileName), imageBuffer)
                            resolve('ok')
                        } catch (error) {
                            console.log('Unable to download', sticker_id);
                            reject({ sticker_id: sticker_id })
                        }
                    })
                    promises.push(writeTask)

                }

                Promise.all(promises).then(res => {
                    resolve(res.length)
                }).catch(error => {
                    reject(error)
                })

            })
        }
    })


}

