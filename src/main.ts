import { Message, Client } from 'discord.js'
import dotenv from 'dotenv'
import Kuroshiro from "kuroshiro"
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji"
import { toHiragana } from "@koozaki/romaji-conv"
import moji from "moji"
import { GoogleSpreadsheet } from 'google-spreadsheet'
import fs from "fs"
const doc = new GoogleSpreadsheet('1shvO1aDoGm-o7_miuE9L23ulYIDxPN_FF6rjhqC8in4');

dotenv.config()

const cred = JSON.parse(fs.readFileSync('./cred.json', 'utf8'));

const kuroshiro = new Kuroshiro()

const forbiddenWords = ["ちんこ", "セックス", "イラマチオ", "フェラ", "クンニ", "ペニバン", "ペニスバンド", "ダッチワイフ", "青姦", "レイプ", "兜合わせ", "パイズリ", "手コキ", "オナニー", "ハメ撮り", "おっぱい", "まんこ", "おなほ", "SEX", "し↓こ↑し↓こ↑", "ペニス", "オナホ", "潮吹き", "強姦", "シコシコ", "自慰", "自慰行為", "カーせっくす" ,"しこっ", "シコる", "porn", "xvideo", "sharevideo"];
const kbIgnore = ["じい"]

let fbKana: string[] = []

const client = new Client({
    intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES'],
})

client.once('ready', async () => {
    await doc.useServiceAccountAuth(cred);
    await doc.loadInfo();
    await kuroshiro.init(new KuromojiAnalyzer());
    for (const x of forbiddenWords) {
        if( !x.match(/^[a-zA-Z0-9]+$/) ){
            const fbtemp = await kuroshiro.convert(x, { to: "hiragana" })
            fbKana.push(toHiragana(moji(fbtemp).convert("HK", "ZK").toString()).toLowerCase())
        } else {
            fbKana.push(x.toLowerCase())
        }   
    }
    console.log('Ready!')
    console.log(client.user?.tag)
})

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return
    const sheet = doc.sheetsByIndex[0]
    const rows = await sheet.getRows()
    const kana = await kuroshiro.convert(message.content, { to: "hiragana" })
    if (forbiddenWords.some(word => message.content.toLowerCase().includes(word)) || (fbKana.some(word => toHiragana(moji(kana).convert("HK", "ZK").toString()).toLowerCase().replace(/\r\n/g, '').trim().includes(word) && kbIgnore.some(ignore => ignore !== word)))) {
        message.delete();
        let check = false
        rows.map(async row => {
            if (row.id === message.author.id) {
                check = true
                row.count = (Number(row.count) + 1).toString()
                await row.save()
            }
        })
        if (!check) {
            const addrow = await sheet.addRow({ id: message.author.id, name: message.author.username, count: 1 });
        }
    }
})

client.login(process.env.TOKEN)
