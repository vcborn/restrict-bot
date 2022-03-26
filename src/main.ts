import { Message, Client } from 'discord.js'
import dotenv from 'dotenv'

dotenv.config()

const forbiddenWords = ["ちんこ" , "せっくす" , "セックス" , "フェラチオ" , "イラマチオ" , "フェラ" , "クンニリングス" , "クンニ" , "ペニバン" , "ペニスバンド" , "ぺにばん" , "ダッチワイフ" , "青姦" , "レイプ" , "逆レイプ" , "兜合わせ" , "パイズリ" , "手コキ" , "オナニー" , "ハメ撮り" , "おっぱい" , "まんこ" , "おなほ" ,  "おまんこ" , "SEX" , "ふぇら" , "ふぇらちお" , "penis", "ペニス" , "オナホール" , "オナホ", "潮吹き", "しおふき", "強姦", "ごうかん", "しおふき", "れいぷ", "ぱいずり", "てこき", "おなにー", "しこしこ", "シコシコ", "自慰", "自慰行為", "じいこうい", "カーせっくす" ,"しゃねこ", ];
// 落ちます　しゃねこ
const client = new Client({
    intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES'],
})

client.once('ready', () => {
    console.log('Ready!')
    console.log(client.user?.tag)
})

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return
    if (forbiddenWords.some(word => message.content.includes(word))) {
        message.delete();
    }
})

client.login(process.env.TOKEN)
