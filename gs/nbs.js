/**
 * Returns exchange rate from National Bank of Serbia
 *
 * @param date {Date} provided date to retrieve data
 * @returns {Promise<Object<keyof currencyNames, number>>}
 * @throws {Error} parsing\HTTP errors
 */
async function getCurrenciesFromNBS(date = new Date()) {
    const url = new URL("https://webappcenter.nbs.rs/WebApp/ExchangeRate/ExchangeRate");
    url.searchParams.set('Date', date.format('dd/MM/yyyy'));
    url.searchParams.set('ExchangeRateListTypeID', '1');

    const dateRegex = /([0-9]{1,2})\.([0-9]{1,2}).([0-9]{4})/;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(resp.statusText);

    const html = await resp.text();

    const rows = query('table tbody tr').map(tr => analyzeRow(query(tr, 'td')));

    const result = {};

    for (let {tr, code, cells} of find_table(html)) {
        const num = cells.at(-1);
        if (!isNaN(num) && num > 0) {
            result[code] = num;
        } else {
            console.log(`Invalid exchange rate row:`, {tr});
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

    result._base = 'RSD';
    return result;
}