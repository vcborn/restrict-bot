# restrict-bot
Discord bot to censor bad words.

## Setup
1. Clone the repository
2. Install dependencies
3. Copy `config/default.sample.json5` and rename it to `config/default.json5`
4. Fill the blank of config
5. Compile the code with `npm run compile`
6. `npm run start`

### Setup metrics (optional)
1. Enable "Google Drive API" and "Google Sheets API" from Google Cloud Console
2. Create service account and download credentials in json format
3. Save the file as `config/cred.json`
4. Be sure to fill `sheet_id`

## License
[WTFPL](https://choosealicense.com/licenses/wtfpl/)