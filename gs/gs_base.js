// region Static data

/**
 * Currency Data
 * @type {{keys: string[], find_code: ((function(string): (string))|*)}}
 */
const Currencies = (() => {
    const currencies = {
        "USD": ["دولار امريكي", "US Dollar"],
        "EUR": ["يورو", "Euro"],
        "AED": ["United Arab Emirates dirham"],
        "RSD": ["دينار صربي", "Serbian Dinar"],
        "RUB": ["روبل روسي", "Russia Rouble"],
        "ARS": ["بيسو ارجنتيني", "Argentine Peso"],
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
    const keys = Object.keys(currencies);
    const nameMap = new Map(Object.entries(currencies).flatMap(([code, names]) => {
        return names.map(x => [x, code]);
    }))

    return {
        /**
         * All currency codes with needed order
         */
        keys,
        /**
         * find currency code from provided string
         * @param str {string}
         */
        find_code: function (str) {
            if (currencies.hasOwnProperty(str.toUpperCase())) {
                return str.toUpperCase();
            }

            return nameMap.get(str);
        }
    }
})();

// endregion

// region Date utils

/**
 * @typedef {Object} DatePart
 *
 * @property {number} [mls]
 * @property {number} [sec]
 * @property {number} [min]
 * @property {number} [hour]
 * @property {number} [day]
 * @property {number} [week]
 * @property {number} [month]
 * @property {number} [year]
 */

/**
 * Convert date to parts
 * @returns {DatePart}
 */
Date.prototype.toParts = function () {
    return {
        year: this.getFullYear(),
        month: this.getMonth(),
        day: this.getDate(),
        hour: this.getHours(),
        min: this.getMinutes(),
        sec: this.getSeconds(),
        mls: this.getMilliseconds(),
    }
}

/**
 * Create date from provided parts
 * @param parts {DatePart}
 * @returns {Date}
 */
Date.fromParts = function (parts) {
    return new Date(
        parts.year,
        parts.month,
        parts.day,
        parts.hour,
        parts.min,
        parts.sec,
        parts.mls,
    );
}

/**
 * Absolute intervals in milliseconds. Never changes, always the same
 * @type {{mls: number, sec: number, min: number, hour: number, day: number, week: number}}
 */
Date.MLS = (() => {
    const mls = 1;
    const sec = 1000 * mls;
    const min = 60 * sec;
    const hour = 60 * min;
    const day = 24 * hour;
    const week = 7 * day;
    return {mls, sec, min, hour, day, week};
})();

/**
 * Add timespan to function and return new instance
 *
 * @param timespan {DatePart}
 * @returns {Date}
 */
Date.prototype.add = function (timespan) {
    let date = this.valueOf();

    // validating timespan
    if (Math.abs(timespan.month) >= 12) {
        if (!timespan.year)
            timespan.year = 0;
        timespan.year += Math.floor(timespan.month / 12);
        timespan.month %= 12;
    }

    // increase absolute intervals
    for (let [part, amount] of Object.entries(Date.MLS).filter(x => timespan.hasOwnProperty(x[0]))) {
        date += timespan[part] * amount;
        delete timespan[part];
    }

    const parts = new Date(date).toParts();

    // calculate months offset
    if (timespan.month) {
        parts.month += timespan.month;
        delete timespan.month;

        if (parts.month < 0 || parts.month >= 12) {
            const sign = Math.sign(parts.month);
            const addYears = Math.floor(Math.abs(parts.month) / 12);
            parts.year += addYears * sign;
            parts.month %= 12;
        }
    }
    if (timespan.year) {
        parts.year += timespan.year;
        delete timespan.year;
    }

    return Date.fromParts(parts);
}

/**
 *
 * @param format {string}
 * @param lang {string}
 */
Date.prototype.format = function (format, lang = 'en-US') {
    if (!Date.prototype.format.month) Date.prototype.format.month = {};
    if (!Date.prototype.format.weekday) Date.prototype.format.weekday = {};
    if (!Date.prototype.format.functions) {
        const pad = (d, count = 2) => String(d).padStart(count, '0')
        Date.prototype.format.functions = {
            yyyy: d => d.getFullYear(),
            yyy: d => d.getFullYear() % 100,

            MMMM: d => month[lang].long?.[d.getMonth()],
            MMM: d => month[lang].short?.[d.getMonth()],
            MM: d => pad(d.getMonth() + 1),
            M: d => d.getMonth() + 1,

            dddd: d => weekday[lang].long?.[d.getDay()],
            ddd: d => weekday[lang].short?.[d.getDay()],
            dd: d => pad(d.getDate()),
            d: d => d.getDate(),

            HH: d => pad(d.getHours()),
            H: d => d.getHours(),

            hh: d => pad(d.getHours() % 12),
            h: d => d.getHours() % 12,

            mm: d => pad(d.getMinutes()),
            m: d => d.getMinutes(),

            ss: d => pad(d.getSeconds()),
            s: d => d.getSeconds(),

            fff: d => d.getMilliseconds(),
            ff: d => pad(Math.floor(d.getMilliseconds() / 10), 3),
            f: d => pad(Math.floor(d.getMilliseconds() / 100), 2),
        }
    }

    const {month, weekday, functions} = Date.prototype.format;

    if (!month[lang]) {
        month[lang] = {short: {}, long: {}};
        weekday[lang] = {short: {}, long: {}};

        const opt = {
            short: new Intl.DateTimeFormat(lang, {month: 'short', weekday: 'short'}),
            long: new Intl.DateTimeFormat(lang, {month: 'long', weekday: 'long'}),
        }
        for (let [part, value] of Object.entries(opt)) {
            for (let i = 0; i < 12; i++) {
                month[lang][part][i] = value.formatToParts(new Date(2001, i, 1))
                    .find(x => x.type === 'month').value;
            }

            for (let i = 0; i < 7; i++) {
                weekday[lang][part][i] = value.formatToParts(new Date(2001, 0, 1 + i))
                    .find(x => x.type === 'weekday').value;
            }
        }
    }

    for (let key of Object.keys(functions).sort((a, b) => b.length - a.length)) {
        format = format.replaceAll(new RegExp(`\\b${key}\\b`, 'g'), functions[key](this));
    }

    return format;
}

// endregion

// region Polyfills

/**
 * Fetch polyfill
 * @type {(function(string, any): Promise<{
 *     ok: boolean,
 *     statusText: boolean,
 *     text: () => Promise<string>,
 * }>)}
 */
async function fetch(url, opts) {
    console.info('Requesting ', url.toString());

    const promise = typeof UrlFetchApp != 'undefined' && new Promise((resolve, reject) => {
            const r = UrlFetchApp.fetch(url, opts);
            const result = {
                statusCode: r.getResponseCode(),
                statusText: `HTTP code: ${r.getResponseCode()}`,
                text: () => new Promise(resolve1 => resolve1(r.getContentText())),
            };
            result.ok = 200 >= result.statusCode && result.statusCode < 300;
            resolve(result);
        })
        || typeof globalThis != 'undefined' && typeof globalThis.fetch == 'function' && globalThis.fetch(url, opts);

    if (!promise) {
        console.warn('Fetch is not supported');
        return Promise.reject();
    }

    try {
        const result = await promise;
        if (!result.ok) {
            console.warn('Error during fetch:', url, result.statusCode);
        }
        return result;
    } catch (e) {
        console.error('Error fetching ', url, e);
        return {ok: false, statusText: e.toString()};
    }
}

// URL polyfill
const URL = typeof UrlFetchApp != 'undefined' && function URL(str) {
    const search = new Map();
    return {
        get origin() {
            return str;
        },
        get searchParams() {
            return search;
        },
        get search() {
            let result = Array.from(search.entries()).map(x => `${x[0]}=${x[1]}`).join('&');
            if (!result) return result;
            return '?' + result;
        },

        toString() {
            return this.origin + this.search;
        }
    };
} || typeof globalThis != 'undefined' && typeof globalThis.URL != 'undefined' && globalThis.URL;

// endregion

// region HTML helpers

/**
 * Search element in raw HTML text
 *
 *
 * @param html {string}
 * @param selector {string || string[]} Currently supported only tabs separated by space
 */
function query(html, selector) {
    if (typeof selector == 'string')
        selector = selector.split(' ').filter(Boolean);

    const tag = selector.shift();
    const founded = extractTextBetweenTags(html, tag);
    if (!selector.length) return founded.filter(Boolean);

    return founded.flatMap(x => query(x, [...selector]));


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

}


function analyzeRow(arr) {
    const meta = {
        codes: [],
        rates: [],
    };

    for (let i = 0; i < arr.length; i++) {
        const str = arr[i];

        const n = parseFloat(str?.replaceAll(',', '.'));
        if (!isNaN(n) && n > 0) {
            arr[i] = n;
            meta.rates.push(n)
            continue;
        }

        const code = Currencies.find_code(str);
        if (!!code) {
            arr[i] = code;
            meta.codes.push(code);
            continue;
        }
    }

    if (!meta.rates.length || !meta.codes.length) {
        console.log('Invalid exchange rate row: ', arr.join('\n'));
    }

    return {meta, items: arr};
}

// endregion