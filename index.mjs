import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { downloadSticker, getInfo } from './scripts/sticker.js';
import { downloadEmoji } from './scripts/emoji.js';

console.log(chalk.yellow('\nmerh sticker downloader'));
console.log(chalk.grey('Download line emoji and sticker'));
console.log(chalk.grey('Find sticker at'), chalk.blue.underline('https://store.line.me/home/en'), "\n");

const { type, stickerID, emojiURL } = await inquirer.prompt([
    {
        type: "list",
        name: "type",
        message: "Select the type sticker:",
        choices: ["Sticker", "Emoji"]
    },
    {
        type: "input",
        name: "stickerID",
        message: "Enter Sticker ID or URL:",
        when: (answer) => answer.type === 'Sticker',
        validate: function (input) {
            input = input.trim()
            if (input === '') {
                return 'Sticker ID/URL cannot be empty'
            }

            return true;
        }
    },
    {
        type: "input",
        name: "emojiURL",
        message: "Enter Emoji URL:",
        when: (answer) => answer.type === 'Emoji',
        validate: function (input) {
            input = input.trim()
            if (input === '') {
                return 'Emoji URL cannot be empty'
            }

            return true;
        }
    }
]);


if (type == 'Sticker') {

    const stickerData = await getInfo(stickerID).then(res => {
        return res
    }).catch(error => {
        console.log(chalk.red(error));
        process.exit()
    })

    const package_name = stickerData.title.en
    console.log('');
    const spinner = ora({
        spinner: {
            "interval": 130,
            "frames": [
                "-",
                "\\",
                "|",
                "/"
            ]
        },
        color: 'gray',
        text: `${chalk.grey('Downloading:', package_name)}`
    }).start();


    downloadSticker(stickerData).then(res => {
        spinner.succeed()
        console.log("");
        console.log(chalk.blue(`🫠 ${res.total} ${res.type} stickers downloaded`));
    }).catch(err => {
        spinner.fail(`${chalk.red(err)}`)
        process.exit()
    })
}


if (type == 'Emoji') {
    console.log('');
    const spinner = ora({
        spinner: {
            "interval": 130,
            "frames": [
                "-",
                "\\",
                "|",
                "/"
            ]
        },
        color: 'gray',
        text: `${chalk.grey('Downloading Emoji')}`
    }).start();

    downloadEmoji(emojiURL).then(res => {
        spinner.succeed()
        console.log(chalk.blue(`🫠 ${res.total} emoji downloaded`));
    }).catch(err => {
        spinner.fail(`${chalk.red(err)}`)
        process.exit()
    })
}