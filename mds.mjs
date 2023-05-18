import fs from 'fs'
import path from 'path'
import readline from 'readline'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const stickerId = await (async () => {
    return new Promise((resolve) => {
        rl.question('Enter Sticker ID: ', (answer => {
            resolve(answer)
        }))
    })
})()

const url = `http://dl.stickershop.line.naver.jp/products/0/0/1/${stickerId}/android/productInfo.meta`

const resp = await fetch(url)
if (resp.status > 400) {
    console.log('Invalid Sticker ID');
    exit()
}
const result = await resp.json()
// const result = JSON.parse(fs.readFileSync('result.json', 'utf-8'))
const package_name = safeText(result.title.en)
const package_id = result.packageId
const folderPath = path.join(process.cwd(), `msd-${package_name}`)
console.log(result);

const sticker_ids = []

for (const sticker of result.stickers) {
    sticker_ids.push(sticker.id)
}

if (result.hasAnimation) {
    console.log('download as apng');
    const status = await downloadSticker('apng', sticker_ids)
    console.log('Download Completed.', `${status} sticker downloaded`);
    exit()

} else {
    console.log('download static');
    const status = await downloadSticker('png', sticker_ids)
    console.log('Download Completed.', `${status} sticker downloaded`);
    exit()
}

function exit() {
    process.exit()
}


async function downloadSticker(format, sticker_ids) {
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


function safeText(name) {
    const forbiddenChars = /[<>:"/\\|?*\x00-\x1F]/g; // Regex to match forbidden characters
    // Remove forbidden characters and replace them with the replacement character
    let safeText = name.replace(forbiddenChars, "");
    safeText = safeText.replace(/[\.-\s]/g, "_")
    safeText = safeText.toLowerCase()

    return safeText;
}