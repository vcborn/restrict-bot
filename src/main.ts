import { Message, Client } from 'discord.js'
import dotenv from 'dotenv'
import Kuroshiro from "kuroshiro"
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji"
import { toHiragana } from "@koozaki/romaji-conv"

dotenv.config()

const kuroshiro = new Kuroshiro()

const forbiddenWords = ["ちんこ" , "せっくす" , "セックス" , "フェラチオ" , "イラマチオ" , "フェラ" , "クンニリングス" , "クンニ" , "ペニバン" , "ペニスバンド" , "ぺにばん" , "ダッチワイフ" , "青姦" , "レイプ" , "逆レイプ" , "兜合わせ" , "パイズリ" , "手コキ" , "オナニー" , "ハメ撮り" , "おっぱい" , "まんこ" , "おなほ" ,  "おまんこ" , "SEX" , "ふぇら" , "ふぇらちお" , "し↓こ↑し↓こ↑", "ペニス" , "オナホール" , "オナホ", "潮吹き", "しおふき", "強姦", "ごうかん", "しおふき", "れいぷ", "ぱいずり", "てこき", "おなにー", "しこしこ", "シコシコ", "自慰", "自慰行為", "じいこうい", "カーせっくす" , "しこしこ" , "しこっ"];

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
    if (forbiddenWords.some(word => message.content.includes(word)) || fbKana.some(word => toHiragana(kana).toLowerCase().includes(word.toLowerCase()))) {
        message.delete();
    }
})

client.login(process.env.TOKEN)
