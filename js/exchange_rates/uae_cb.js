const url = 'https://www.centralbank.ae/umbraco/Surface/Exchange/GetExchangeRateAllCurrencyDate?dateTime=';
/**
 * @type {{USD: string[], ARS: string[], AUD: string[], BDT: string[], BHD: string[], BND: string[], BRL: string[], BWP: string[], BYN: string[], CAD: string[], CHF: string[], CLP: string[], CNY: string[], COP: string[], CZK: string[], DKK: string[], DZD: string[], EGP: string[], EUR: string[], GBP: string[], HKD: string[], HUF: string[], IDR: string[], INR: string[], ISK: string[], JOD: string[], JPY: string[], KES: string[], KRW: string[], KWD: string[], KZT: string[], LBP: string[], LKR: string[], MAD: string[], MKD: string[], MXN: string[], MYR: string[], NGN: string[], NOK: string[], NZD: string[], OMR: string[], PEN: string[], PHP: string[], PKR: string[], PLN: string[], QAR: string[], RSD: string[], RUB: string[], SAR: string[], SDG: string[], SEK: string[], SGD: string[], THB: string[], TND: string[], TRY: string[], TTD: string[], TWD: string[], TZS: string[], UGX: string[], VND: string[], YER: string[], ZAR: string[], ZMW: string[]}}
 */
const currencies = {
    "USD": ["دولار امريكي", "US Dollar"],
    "ARS": ["بيسو ارجنتيني", "Argentine Peso"],
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
    "ZMW": ["كواشا زامبي", "Zambian Kwacha"]
};
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
const currenciesMap = new Map(Object.entries(currencies).flatMap(([code, names]) => names.map(n => [n, code])));
const dateReplaceStr = 'Last updated:';

/**
 * Log function for different environment
 * @type {false|(function(...[*]): void)|*}
 */
const log = typeof Logger != 'undefined' &&
    function _googleAppsScriptLog(...args) {
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
    }
    ?? function _defaultLogging(...args) {
        console.log(...args);
    };

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
 * Retrieves currency rates from Dubai Central Bank
 *
 * @example {
 *     const dollars = 400;
 *     const ratesToday = await getCurrenciesFromUAE();
 *     const dirhams = dollars * ratesToday.USD;
 *    --------------------------------------------
 *    const retrospective = await getCurrenciesFromUAE(new Date('02 January 2020'));
 *    console.log('USD / UAE at 02.01.2020: ' + retrospective.USD);
 *
 * }
 * @param [date] {Date}
 * @returns {Promise<Object<keyof currencies, number> & {_time: Date}>}
 */
async function getCurrenciesFromUAE(date = new Date()) {
    const result = {};
    let html;

    try {
        const r = await fetch(url + date.toDateString(), {
            method: 'GET',
        });
        if (!r.ok) {
            throw new Error(`HTTP error! Status: ${r.status}`);
        }
        html = await r.text();
        if (!html) {
            log('Empty HTML arrived: ', r.headers);
            return result;
        }
    } catch (e) {
        log('Cannot get exchange rate :(', e);
        return result;
    }

    // searching for <tbody> tag
    const body = extractTextBetweenTags(html, 'tbody')?.[0];
    if (!body) {
        log('HTML does not contain <tbody> tag: ', html);
        return result;
    }
    // searching for table rows and parse 2 cell values
    const cells = extractTextBetweenTags(body, 'tr')
        .map(innerHTML =>
            extractTextBetweenTags(innerHTML, 'td').map(x => x.trim()).filter(x => !!x)
        ).filter(x => x.length === 2);
    if (!cells.length) {
        log('Table body does not contain valid rows: ', body);
        return result;
    } else {
        log(`${cells.length} currencies received`);
    }

    for (let arr of cells) {
        for (let str of arr) {
            const f = parseFloat(str);
            const code = currenciesMap.get(arr.find(item => item !== str));
            if (!isNaN(f) && f > 0 && !!code) {
                result[code] = f;
                break;
            }
        }
    }

    log(`${Object.keys(result).length} currencies saved`);

    // parse date
    const dateStr = extractTextBetweenTags(html, 'p').find(x => x.includes(dateReplaceStr));
    if (!!dateStr) {
        result._time = parseArabicDate(dateStr.replace(dateReplaceStr, '').trim());
    }

    // in case of errors, use current script executing time
    if (isNaN(result._time?.getTime())) {
        log('Cannot get exchange rate date :', dateStr);
        result._time = new Date();
    }

    return result;
}