async function getCurrenciesFromUAE(date = new Date()) {
    const url = new URL('https://www.centralbank.ae/umbraco/Surface/Exchange/GetExchangeRateAllCurrencyDate');
    url.searchParams.set('dateTime', date.format('dd/MM/yyyy'));

    const resp = await fetch(url.toString());
    if (!resp.ok) {
        return {_time: date, error: new Error(resp.statusText)};
    }

    const html = await resp.text();

    const result = query(html, 'table tbody tr')
        .map(tr => analyzeRow(query(tr, 'td')))
        .filter(x => x.meta.rates.length === 1 && x.meta.codes.length === 1)
        .reduce((prev, cur) => {
            prev[cur.meta.codes.at(0)] = cur.meta.rates.at(0);
            return prev;
        }, {});


    return result;
}