import { Message, Client } from 'discord.js'
import dotenv from 'dotenv'
import Kuroshiro from "kuroshiro"
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji"
import { toHiragana } from "@koozaki/romaji-conv"
import moji from "moji"
import { GoogleSpreadsheet } from 'google-spreadsheet'
import fs from "fs"
const doc = new GoogleSpreadsheet('1shvO1aDoGm-o7_miuE9L23ulYIDxPN_FF6rjhqC8in4');

// .envを読み込み
dotenv.config()

// Google Drive APIの資格情報を読み込み
const cred = JSON.parse(fs.readFileSync('./cred.json', 'utf8'));

// Kuroshiroを定義
const kuroshiro = new Kuroshiro()

// 検閲リスト
const forbiddenWords = ["ちんこ", "セックス", "イラマチオ", "フェラ", "クンニ", "ペニバン", "ペニスバンド", "ダッチワイフ", "青姦", "レイプ", "兜合わせ", "パイズリ", "手コキ", "オナニー", "ハメ撮り", "おっぱい", "まんこ", "おなほ", "SEX", "し↓こ↑し↓こ↑", "ペニス", "オナホ", "潮吹き", "強姦", "シコシコ", "自慰", "自慰行為", "カーせっくす" ,"しこっ", "シコる", "porn", "xvideo", "sharevideo"];
// 変換後に含まれていた場合無視する単語
const kbIgnore = ["じい"]
// 検閲リスト（ひらがな）を定義
let fbKana: string[] = []

const client = new Client({
    intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES'],
})

// ready状態
client.once('ready', async () => {
    // API認証
    await doc.useServiceAccountAuth(cred);
    // ドキュメントを読み込み
    await doc.loadInfo();
    // Kuroshiroを初期化
    await kuroshiro.init(new KuromojiAnalyzer());
    // 検閲リストをひらがなに変換
    for (const x of forbiddenWords) {
        // もし日本語が含まれていたら
        if( !x.match(/^[a-zA-Z0-9]+$/) ){
            // 漢字をひらがなに変換
            const fbtemp = await kuroshiro.convert(x, { to: "hiragana" })
            // 半角カナを全角カナに変換、カタカナをひらがなに変換、大文字を小文字にしてリストに追加
            fbKana.push(toHiragana(moji(fbtemp).convert("HK", "ZK").toString()).toLowerCase())
        } else {
            // 大文字を小文字にしてリストに追加
            fbKana.push(x.toLowerCase())
        }   
    }
    // 確認用
    console.log('Ready!')
    console.log(client.user?.tag)
})

// メッセージが作成されたら
client.on('messageCreate', async (message: Message) => {
    // botの場合は無視
    if (message.author.bot) return
    // 使用するシートを定義
    const sheet = doc.sheetsByIndex[0]
    // シートの行を取得
    const rows = await sheet.getRows()
    // メッセージの漢字をひらがなに変換
    const kana = await kuroshiro.convert(message.content, { to: "hiragana" })
    // kanaの半角カナを全角カナに変換、カタカナをひらがなに変換、大文字を小文字に変換、改行コードを削除、全角空白を削除、空白を削除
    const converted =  toHiragana(moji(kana).convert("HK", "ZK").toString()).toLowerCase().replace(/\r\n/g, '').replace(/\s+/g,'').trim();
    // もしforbiddenWordsの適当な文字がメッセージに含まれていたら
    // または convertedがメッセージに含まれているまたは各文字の間にa-zの記号が入っている、なおかつkbIgnoreに含まれていなかったら
    if (forbiddenWords.some(word => message.content.toLowerCase().includes(word)) || (fbKana.some(word => (converted.includes(word) || new RegExp(word.slice(0, -1).replace(/([a-zぁ-んァ-ヶｱ-ﾝﾞﾟ一-龠])/g, "$1[^a-z]*") + word.slice(-1)).test(converted)) && kbIgnore.some(ignore => ignore !== word)))) {
        console.log(message.content);
        // メッセージを削除
        message.delete();
        // チェックをfalseに
        let check = false
        // 行を探索
        rows.map(async row => {
            // 行のidがメッセージ送信者のidと一致したら
            if (row.id === message.author.id) {
                // チェックをtrueに
                check = true
                // 検閲回数を現在から1増やす
                row.count = (Number(row.count) + 1).toString()
                // 変更を保存
                await row.save()
            }
        })
        // もしチェックがfalseだったら
        if (!check) {
            // メッセージ送信者のid、名前、カウント回数の行を追加して保存
            const addrow = await sheet.addRow({ id: message.author.id, name: message.author.username, count: 1 });
        }
    }
})

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (newMessage.content && newMessage.author) {
        const message = newMessage.content;
        const author_id = newMessage.author.id;
        // botの場合は無視
        if (newMessage.author.bot) return
        // 使用するシートを定義
        const sheet = doc.sheetsByIndex[0]
        // シートの行を取得
        const rows = await sheet.getRows()
        // メッセージの漢字をひらがなに変換
        const kana = await kuroshiro.convert(newMessage.content, { to: "hiragana" })
        // kanaの半角カナを全角カナに変換、カタカナをひらがなに変換、大文字を小文字に変換、改行コードを削除、全角空白を削除、空白を削除
        const converted =  toHiragana(moji(kana).convert("HK", "ZK").toString()).toLowerCase().replace(/\r\n/g, '').replace(/\s+/g,'').trim();
        // もしforbiddenWordsの適当な文字がメッセージに含まれていたら
        // または convertedがメッセージに含まれているまたは各文字の間にa-zの記号が入っている、なおかつkbIgnoreに含まれていなかったら
        if (forbiddenWords.some(word => message.toLowerCase().includes(word)) || (fbKana.some(word => (converted.includes(word) || new RegExp(word.slice(0, -1).replace(/([a-zぁ-んァ-ヶｱ-ﾝﾞﾟ一-龠])/g, "$1[^a-z]*") + word.slice(-1)).test(converted)) && kbIgnore.some(ignore => ignore !== word)))) {
            console.log(message);
            // メッセージを削除
            newMessage.delete();
            // チェックをfalseに
            let check = false
            // 行を探索
            rows.map(async row => {
                // 行のidがメッセージ送信者のidと一致したら
                if (row.id === author_id) {
                    // チェックをtrueに
                    check = true
                    // 検閲回数を現在から1増やす
                    row.count = (Number(row.count) + 1).toString()
                    // 変更を保存
                    await row.save()
                }
            })
            // もしチェックがfalseだったら
            if (!check) {
                // メッセージ送信者のid、名前、カウント回数の行を追加して保存
                const addrow = await sheet.addRow({ id: author_id, name: newMessage.author.username, count: 1 });
            }
        }
    }
})

client.login(process.env.TOKEN)
