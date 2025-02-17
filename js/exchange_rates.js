// region Static data

const arabicData = {
    days: {
        'الأحد': 'Sunday',
        'الاثنين': 'Monday',
        'الثلاثاء': 'Tuesday',
        'الأربعاء': 'Wednesday',
        'الخميس': 'Thursday',
        'الجمعة': 'Friday',
        'السبت': 'Saturday',
    },
    months: {
        'يناير': 'January',
        'فبراير': 'February',
        'مارس': 'March',
        'أبريل': 'April',
        'مايو': 'May',
        'يونيو': 'June',
        'يوليو': 'July',
        'أغسطس': 'August',
        'سبتمبر': 'September',
        'أكتوبر': 'October',
        'نوفمبر': 'November',
        'ديسمبر': 'December',
    },
    numerals: {
        '٠': '0',
        '١': '1',
        '٢': '2',
        '٣': '3',
        '٤': '4',
        '٥': '5',
        '٦': '6',
        '٧': '7',
        '٨': '8',
        '٩': '9',
    },
    periods: {
        'م': 'PM',
        'ص': 'AM',
    }
};
const currencyNames = {
    "USD": ["دولار امريكي", "US Dollar"],
    "ARS": ["بيسو ارجنتيني", "Argentine Peso"],
    "AED": ["United Arab Emirates dirham"],
    "BAM": ["Bosnia and Herzegovina convertible mark"],
    "AUD": ["دولار استرالي", "Australian Dollar"],
    "BDT": ["تاكا بنغلاديشية", "Bangladesh Taka"],
    "BHD": ["دينار بحريني", "Bahrani Dinar"],
    "BND": ["دولار بروناي", "Brunei Dollar"],
    "BRL": ["ريال برازيلي", "Brazilian Real"],
    "BWP": ["بولا بوتسواني", "Botswana Pula"],
    "BYN": ["روبل بلاروسي", "Belarus Rouble"],
    "CAD": ["دولار كندي", "Canadian Dollar"],
    "CHF": ["فرنك سويسري", "Swiss Franc"],
    "CLP": ["بيزو تشيلي", "Chilean Peso"],
    "CNY": ["يوان صيني", "Chinese Yuan"],
    "COP": ["بيزو كولومبي", "Colombian Peso"],
    "CZK": ["كرونة تشيكية", "Czech Koruna"],
    "DKK": ["كرون دانماركي", "Danish Krone"],
    "DZD": ["دينار جزائري", "Algerian Dinar"],
    "EGP": ["جينيه مصري", "Egypt Pound"],
    "EUR": ["يورو", "Euro"],
    "GBP": ["جنيه استرليني", "GB Pound"],
    "HKD": ["دولار هونج كونج", "Hongkong Dollar"],
    "HUF": ["فورنت هنغاري", "Hungarian Forint"],
    "IDR": ["روبية اندونيسية", "Indonesia Rupiah"],
    "INR": ["روبية هندية", "Indian Rupee"],
    "ISK": ["كرونة آيسلندية", "Iceland Krona"],
    "JOD": ["دينار أردني", "Jordan Dinar"],
    "JPY": ["ين ياباني", "Japanese Yen"],
    "KES": ["شلن كيني", "Kenya Shilling"],
    "KRW": ["ون كوري", "Korean Won"],
    "KWD": ["دينار كويتي", "Kuwaiti Dinar"],
    "KZT": ["تينغ كازاخستاني", "Kazakhstan Tenge"],
    "LBP": ["ليرة لبنانية", "Lebanon Pound"],
    "LKR": ["روبية سريلانكي", "Sri Lanka Rupee"],
    "MAD": ["درهم مغربي", "Moroccan Dirham"],
    "MKD": ["دينار مقدوني", "Macedonia Denar"],
    "MXN": ["بيسو مكسيكي", "Mexican Peso"],
    "MYR": ["رينغيت ماليزي", "Malaysia Ringgit"],
    "NGN": ["نيرا نيجيري", "Nigerian Naira"],
    "NOK": ["كرون نرويجي", "Norwegian Krone"],
    "NZD": ["دولار نيوزيلندي", "NewZealand Dollar"],
    "OMR": ["ريال عماني", "Omani Rial"],
    "PEN": ["سول بيروفي", "Peru Sol"],
    "PHP": ["بيسو فلبيني", "Philippine Piso"],
    "PKR": ["روبية باكستانية", "Pakistan Rupee"],
    "PLN": ["زلوتي بولندي", "Polish Zloty"],
    "QAR": ["ريال قطري", "Qatari Riyal"],
    "RSD": ["دينار صربي", "Serbian Dinar"],
    "RUB": ["روبل روسي", "Russia Rouble"],
    "SAR": ["ريال سعودي", "Saudi Riyal"],
    "SDG": ["دينار سوداني", "Sudanese Pound"],
    "SEK": ["كرونة سويدية", "Swedish Krona"],
    "SGD": ["دولار سنغافوري", "Singapore Dollar"],
    "THB": ["بات تايلندي", "Thai Baht"],
    "TND": ["دينار تونسي", "Tunisian Dinar"],
    "TRY": ["ليرة تركية", "Turkish Lira"],
    "TTD": ["دولار تريندادي", "Trin Tob Dollar"],
    "TWD": ["دولار تايواني", "Taiwan Dollar"],
    "TZS": ["شلن تنزاني", "Tanzania Shilling"],
    "UGX": ["شلن اوغندي", "Uganda Shilling"],
    "VND": ["دونغ فيتنامي", "Vietnam Dong"],
    "YER": ["ريال يمني", "Yemen Rial"],
    "ZAR": ["راند جنوب أفريقي", "South Africa Rand"],
    "ZMW": ["كواشا زامبي", "Zambian Kwacha"],
    "CNH": ["يوان صيني - الخارج", "Chinese Yuan - Offshore"],
    "AZN": ["مانات أذربيجاني", "Azerbaijani Manat"],
    "BGN": ["ليف بلغاري", "Bulgarian Lev"],
    "HRK": ["كونا كرواتية", "Croatian Kuna"],
    "ETB": ["بر إثيوبي", "Ethiopian Birr"],
    "IQD": ["دينار عراقي", "Iraqi Dinar"],
    "ILS": ["شيكل اسرائيلي", "Israeli Shekel"],
    "LYD": ["دينار ليبي", "Libyan Dinar"],
    "MUR": ["روبي موريشي", "Mauritian Rupee"],
    "RON": ["ليو روماني", "Romanian Leu"],
    "SYP": ["ليرة سورية", "Syrian Pound"],
    "TMT": ["منات تركمانستاني", "Turkmenistan Manat"],
    "UZS": ["سوم أوزبكستاني", "Uzbekistani Som"],
};
const currenciesMap = new Map(Object.entries(currencyNames).flatMap(([code, names]) => names.map(n => [n, code])));

// endregion

// region Helping methods

/**
 * Retrieves innerHTML for provided node name from provided HTML string (can be partial)
 * @param html {string}
 * @param tagName {string}
 * @returns {*[]}
 */
function extractTextBetweenTags(html, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
    // Create a regular expression to match the specified tag and capture its content
    const matches = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
        matches.push(match[1].trim());
    }

    return matches;
}

/**
 * Log function for different environment
 * @type {false|(function(...[*]): void)|*}
 */
const log = typeof Logger != 'undefined' &&
    (function _googleAppsScriptLog(...args) {
        if (!args.length) return;

        if (args.length === 1) return

        args = args.length === 1
            // single parameter
            ? args[0]
            // compress all values into one data object
            : args.reduce((result, value, i) => {
                result[i] = value;
                return result;
            }, {});

        Logger.log(args);
    })
    || (function _defaultLogging(...args) {
        console.log(...args);
    });


/**
 * Trying to parse arabic date
 * @param arabicDateStr
 * @returns {Date}
 */
function parseArabicDate(arabicDateStr) {
    for (let obj of [arabicData.months, arabicData.days, arabicData.periods]) {
        for (let arr of Object.entries(obj)) {
            const find = arr.find(x => arabicDateStr.includes(x));
            if (!find) continue;

            arabicDateStr = arabicDateStr.replace(find, arr[1]);
            break;
        }
    }

    return new Date(arabicDateStr);
}

/**
 * Search for table by provided index and iterate over cells
 *
 * @param html {string}
 * @param table_index {number}
 * @returns {Generator<{tr: *, cells: (string | number)[], code: string}, void, *>}
 */
function* find_table(html, table_index = 0) {
    const table = extractTextBetweenTags(html, 'tbody')?.[table_index];
    if (!table) throw new Error('Exchange rate table cannot be found');

    const numReg = /^[0-9,.]+$/;

    const rows = extractTextBetweenTags(table, 'tr');
    if (!rows?.length) throw new Error('Empty exchange rate table founded');

    for (let tr of rows) {
        const cells = extractTextBetweenTags(tr, 'td').map(x => x?.trim()).filter(x => !!x?.length);
        if (!cells.length) {
            log('Invalid exchange row founded:', {tr});
            continue;
        }

        let code;

        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];

            // code was not filled yet
            if (!code?.length) {
                // find currency code match (USD, RSD)
                if (currencyNames.hasOwnProperty(cell.toUpperCase())) {
                    code = cell.toUpperCase();
                // find by currency name (US Dollar)
                } else if (currenciesMap.has(cell)) {
                    code = currenciesMap.get(cell);
                }
            // find number
            } else if (numReg.test(cell)){
                cells[i] = parseFloat(cell.replaceAll(',', '.'));
            }
        }

        if (!code?.length) {
            log('Unknown currency founded:', {tr});
            continue;
        }

        yield ({tr, cells, code});
    }
}

// endregion

// region National Bank of Serbia

/**
 * Returns exchange rate from National Bank of Serbia
 *
 * @param date {Date} provided date to retrieve data
 * @returns {Promise<Object<keyof currencyNames, number>>}
 * @throws {Error} parsing\HTTP errors
 */
async function getCurrenciesFromNBS(date = new Date()) {
    const url = new URL("https://webappcenter.nbs.rs/WebApp/ExchangeRate/ExchangeRate");
    url.searchParams.set("Date", `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`);
    url.searchParams.set("ExchangeRateListTypeID", `1`);

    log('Retrieving NBS exchange rates from:', url.toString());

    const dateRegex = /([0-9]{1,2})\.([0-9]{1,2}).([0-9]{4})/;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(resp.statusText);

    const html = await resp.text();

    const result = {};

    for (let {tr, code, cells} of find_table(html)) {
        const num = cells.at(-1);
        if (!isNaN(num) && num > 0) {
            result[code] = num;
        } else {
            log(`Invalid exchange rate row:`, {tr});
            continue;
        }
    }

    const matches = extractTextBetweenTags(html, 'h6')
        .map(x => dateRegex.exec(x))
        .find(x => x?.length === 4);
    if (!!matches) {
        const time = new Date(matches[3], matches[2], matches[1]);
        if (!isNaN(time.valueOf()))
            result._time = time;
    }

    log(`${Object.keys(result).length} currencies founded`);

    return result;
}

// endregion

// region Dubai Central Bank

/**
 * Returns exchange rate from Central bank of United Arab Emirates
 *
 * @param date {Date} provided date to retrieve data
 * @returns {Promise<Object<keyof currencyNames, number>>}
 */
async function getCurrenciesFromUAE(date = new Date()) {
    const url = new URL('https://www.centralbank.ae/umbraco/Surface/Exchange/GetExchangeRateAllCurrencyDate');
    url.searchParams.set('dateTime', date.toDateString());

    log('Retrieving UAE rates from: ' + url.toString());
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(resp.statusText);

    const html = await resp.text();

    const result = {};

    for (let {tr, code, cells} of find_table(html)) {
        const num = cells.find(x => !isNaN(x) && x > 0);
        if (!isNaN(num) && num > 0) {
            result[code] = num;
        } else {
            log(`Invalid exchange rate row:`, {tr});
            continue;
        }
    }

    const dateReplaceStr = 'Last updated:';
    const dateStr = extractTextBetweenTags(html, 'p').find(x => x.includes(dateReplaceStr));
    if (!!dateStr) {
        result._time = parseArabicDate(dateStr.replace(dateReplaceStr, '').trim());
    }

    return result;
}

getCurrenciesFromNBS().then(x => log('serbia', x));
getCurrenciesFromUAE().then(x => log('uae', x));

// endregion