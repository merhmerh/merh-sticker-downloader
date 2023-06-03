import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer';
import { safeText } from './helper.js';

export async function downloadEmoji(url) {

    return new Promise(async (resolve, reject) => {
        try {
            // const url = `https://store.line.me/emojishop/product/6152b8e2f5e8465bec013476/en`
            const browser = await puppeteer.launch({ headless: 'new' });
            const page = await browser.newPage();

            await page.goto(url);

            const regex = new RegExp(/product\/(.*)\//)
            const package_id = url.match(regex)[1]

            const sel = '.FnEmoji_animation_list_img'
            await page.waitForSelector(sel);

            const data = await page.evaluate(() => {
                const ul = document.querySelector('.FnEmoji_animation_list_img')

                const package_name = document.querySelector('p[data-test="emoji-name-title"]').textContent


                const urls = []
                ul.querySelectorAll('li').forEach(li => {
                    const attribute_raw = li.getAttribute('data-preview')
                    const attribute = JSON.parse(attribute_raw)
                    const emoji_url = attribute.animationUrl ? attribute.animationUrl : attribute.staticUrl
                    urls.push(emoji_url)
                })

                data = {
                    package_name: package_name,
                    downloadURLs: urls,
                }
                return data
            })
            await browser.close();

            data.package_id = package_id
            data.package_name = safeText(data.package_name)


            const totalEmoji = await downloadEmoji()
            return resolve({
                type: "emoji",
                total: totalEmoji
            })


            async function downloadEmoji() {
                return new Promise((resolve, reject) => {
                    const folderPath = path.join(process.cwd(), `msd-${data.package_name}`)

                    try {
                        fs.accessSync(folderPath, fs.constants.F_OK)
                    } catch (error) {
                        fs.mkdirSync(folderPath)
                        if (error.code == 'EEXIST') {
                            return reject(error.message)
                        }
                    }
                    const promises = []

                    for (const [index, url] of data.downloadURLs.entries()) {
                        const sticker_id = index + '_' + data.package_id
                        const task = new Promise(async (resolve) => {
                            const response = await fetch(url);

                            let format = 'png'
                            if (url.includes('animation')) {
                                format = 'apng'
                            }

                            const imageArrayBuffer = await response.arrayBuffer();
                            const imageBuffer = Buffer.from(imageArrayBuffer);
                            const fileName = `${sticker_id}.${format}`
                            try {
                                fs.writeFileSync(path.join(folderPath, fileName), imageBuffer)
                                resolve('ok')
                            } catch (error) {
                                reject({ sticker_id: data.sticker_id })
                            }
                        })

                        promises.push(task)
                    }


                    Promise.all(promises).then(res => {
                        resolve(res.length)
                    }).catch(error => {
                        reject(error)
                    })
                })
            }

        } catch (error) {
            reject(error)
        }
    })
}