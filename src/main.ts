import { Message, Client } from 'discord.js'
import dotenv from 'dotenv'
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

dotenv.config()

const kuroshiro = new Kuroshiro();

const forbiddenWords = ["ちんこ" , "せっくす" , "セックス" , "フェラチオ" , "イラマチオ" , "フェラ" , "クンニリングス" , "クンニ" , "ペニバン" , "ペニスバンド" , "ぺにばん" , "ダッチワイフ" , "青姦" , "レイプ" , "逆レイプ" , "兜合わせ" , "パイズリ" , "手コキ" , "オナニー" , "ハメ撮り" , "おっぱい" , "まんこ" , "おなほ" ,  "おまんこ" , "SEX" , "ふぇら" , "ふぇらちお" , "penis", "ペニス" , "オナホール" , "オナホ", "潮吹き", "しおふき", "強姦", "ごうかん", "しおふき", "れいぷ", "ぱいずり", "てこき", "おなにー", "しこしこ", "シコシコ", "自慰", "自慰行為", "じいこうい", "カーせっくす"];
// 落ちます　しゃねこ
const client = new Client({
    intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES'],
})

client.once('ready', async () => {
    await kuroshiro.init(new KuromojiAnalyzer());
    console.log('Ready!')
    console.log(client.user?.tag)
})

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return
    if (forbiddenWords.some(word => message.content.includes(word)) 
    || forbiddenWords.some(async word => {
        const kana = await kuroshiro.convert(message.content, { to: "hiragana" })
        const fbKana = await kuroshiro.convert(word, { to: "hiragana" })
        kana.toLowerCase().includes(fbKana.toLowerCase())
    })) {
        message.delete();
    }
})

client.login(process.env.TOKEN)
