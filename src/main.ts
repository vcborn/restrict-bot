import { Message, Client } from 'discord.js'
import dotenv from 'dotenv'
import Kuroshiro from "kuroshiro"
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji"
import { toHiragana } from "@koozaki/romaji-conv"
import moji from "moji"

dotenv.config()

const kuroshiro = new Kuroshiro()

const forbiddenWords = ["ちんこ" , "セックス" , "イラマチオ" , "フェラ" , "クンニ" , "ペニバン" , "ペニスバンド" , "ダッチワイフ" , "青姦" , "レイプ" , "兜合わせ" , "パイズリ" , "手コキ" , "オナニー" , "ハメ撮り" , "おっぱい" , "まんこ" , "おなほ" , "SEX" ,"し↓こ↑し↓こ↑", "ペニス" , "オナホ", "潮吹き", "強姦","シコシコ", "自慰", "自慰行為", "カーせっくす" ,"しこっ", "porn", "xvideo", "sharevideo"];
const kbIgnore = ["自慰"]

let fbKana: string[] = []

const client = new Client({
    intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES'],
})

client.once('ready', async () => {
    await kuroshiro.init(new KuromojiAnalyzer());
    for (const x of forbiddenWords) {
        const fbtemp = await kuroshiro.convert(x, { to: "hiragana" })
        fbKana.push(toHiragana(fbtemp))
    }
    console.log('Ready!')
    console.log(client.user?.tag)
})

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return
    const kana = await kuroshiro.convert(message.content, { to: "hiragana" })
    if (forbiddenWords.some(word => message.content.includes(word)) || (kbIgnore.some !== fbKana.some && fbKana.some(word => toHiragana(moji(kana).convert("HK", "ZK").toString()).toLowerCase().includes(word.toLowerCase())))) {
        message.delete();
    }
})

client.login(process.env.TOKEN)
