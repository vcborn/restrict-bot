import { Message, Client } from 'discord.js'
import Kuroshiro from "kuroshiro"
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji"
import moji from "moji"
import { GoogleSpreadsheet } from 'google-spreadsheet'
import fs from "fs"
import config from 'config'
const doc = new GoogleSpreadsheet(config.get('sheet_id'))

// Kuroshiroを定義
const kuroshiro = new Kuroshiro()

// 検閲リスト
const forbiddenWords: Array<string> = config.get('words.target')
// 変換後に含まれていた場合無視する単語
const kbIgnore: Array<string> = config.get('words.ignore')
// 検閲リスト（ひらがな）を定義
let fbKana: string[] = []

const client = new Client({
    intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES'],
})

// ready状態
client.once('ready', async () => {
    if (config.get('sheet_id')) {
        // Google Drive APIの資格情報を読み込み
        const cred = JSON.parse(fs.readFileSync('./config/cred.json', 'utf8'))
        // API認証
        await doc.useServiceAccountAuth(cred);
        // ドキュメントを読み込み
        await doc.loadInfo();
    }
    // Kuroshiroを初期化
    await kuroshiro.init(new KuromojiAnalyzer());
    // 検閲リストをひらがなに変換
    for (const x of forbiddenWords) {
        // もし日本語が含まれていたら
        if( !x.match(/^[a-zA-Z0-9]+$/) ){
            // 漢字をひらがなに変換
            const fbtemp = await kuroshiro.convert(x, { to: "hiragana" })
            // 半角カナを全角カナに変換、カタカナをひらがなに変換、大文字を小文字にしてリストに追加
            fbKana.push(moji(fbtemp).convert("HK", "ZK").toString().toLowerCase())
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
    // メッセージの漢字をひらがなに変換
    const kana = await kuroshiro.convert(message.content, { to: "hiragana" })
    // kanaの半角カナを全角カナに変換、カタカナをひらがなに変換、大文字を小文字に変換、改行コードを削除、全角空白を削除、空白を削除
    const converted =  moji(kana).convert("HK", "ZK").toString().toLowerCase().replace(/\r\n/g, '').replace(/\s+/g,'').trim();
    // もしforbiddenWordsの適当な文字がメッセージに含まれていたら
    // または convertedがメッセージに含まれているまたは各文字の間にa-zの記号が入っている、なおかつkbIgnoreに含まれていなかったら
    const judge = forbiddenWords.some(word => message.content.toLowerCase().includes(word)) || (fbKana.some((word) => {
        if (converted.includes(word) && kbIgnore.some(igword => igword !== word)) {
            console.log(message.content, converted, word, 0);
            return true;
        }
        if ((new RegExp(word.slice(0, -1).replace(/([a-zぁ-んァ-ヶｱ-ﾝﾞﾟ一-龠])/g, "$1[^a-zぁ-んァ-ヶｱ-ﾝﾞﾟ一-龠]*") + word.slice(-1)).test(converted)) && kbIgnore.some(igword => igword !== word)) {
            console.log(message.content, converted, word, 1);
            return true;
        }
    }));
    if (judge) {
        // メッセージを削除
        message.delete();
        if (config.get("sheet_id") && (message.guild?.id === config.get('count_guild') || !config.get('count_guild'))) {
            // チェックをfalseに
            let check = false
            // 使用するシートを定義
            const sheet = doc.sheetsByIndex[0]
            // シートの行を取得
            const rows = await sheet.getRows()
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
    }
})

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (newMessage.content && newMessage.author) {
        const message = newMessage.content;
        const author_id = newMessage.author.id;
        // botの場合は無視
        if (newMessage.author.bot) return
        
        // メッセージの漢字をひらがなに変換
        const kana = await kuroshiro.convert(newMessage.content, { to: "hiragana" })
        // kanaの半角カナを全角カナに変換、カタカナをひらがなに変換、大文字を小文字に変換、改行コードを削除、全角空白を削除、空白を削除
        const converted = moji(kana).convert("HK", "ZK").toString().toLowerCase().replace(/\r\n/g, '').replace(/\s+/g,'').trim();
        // もしforbiddenWordsの適当な文字がメッセージに含まれていたら
        // または convertedがメッセージに含まれているまたは各文字の間にa-zの記号が入っている、なおかつkbIgnoreに含まれていなかったら
        const judge = forbiddenWords.some(word => message.toLowerCase().includes(word)) || (fbKana.some((word) => {
            if (converted.includes(word)) {
                console.log(message, converted, word, 0);
                return true;
            }
            if ((new RegExp(word.slice(0, -1).replace(/([a-zぁ-んァ-ヶｱ-ﾝﾞﾟ一-龠])/g, "$1[^a-zぁ-んァ-ヶｱ-ﾝﾞﾟ一-龠]*") + word.slice(-1)).test(converted)) && kbIgnore.some(ignore => ignore !== word)) {
                console.log(message, converted, word, 1);
                return true;
            }
        }));
        if (judge) {
            // メッセージを削除
            newMessage.delete();
            if (config.get("sheet_id") && (newMessage.guild?.id === config.get('count_guild') || !config.get('count_guild'))) {
                // チェックをfalseに
                let check = false
                // 使用するシートを定義
                const sheet = doc.sheetsByIndex[0]
                // シートの行を取得
                const rows = await sheet.getRows()
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
    }
})

client.login(config.get('token'))
