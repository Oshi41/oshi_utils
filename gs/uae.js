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

    const arabic = query(html, 'p').find(x => x.startsWith('Last updated:'))
        .replace('Last updated:', '');
    const parts = arabic.split(' ');
    const day = parts[1];
    const month = parts[2]
        .replaceAll("فبراير", "February")
        .replaceAll("مارس", "March")
        .replaceAll("أبريل", "April")
        .replaceAll("مايو", "May")
        .replaceAll("يونيو", "June")
        .replaceAll("يوليو", "July")
        .replaceAll("أغسطس", "August")
        .replaceAll("سبتمبر", "September")
        .replaceAll("أكتوبر", "October")
        .replaceAll("نوفمبر", "November")
        .replaceAll("ديسمبر", "December");
    const year = parts[3];
    let time = parts[4];
    let period = parts[5]
        .replaceAll('ص', 'AM')
        .replaceAll('م', 'PM')

    result._time = new Date(`${month} ${day}, ${year} ${time}`)

    return result;
}