const {getRiseRatio} = require('../utils');
// 长期流入，获取均价
const getLongInflow = (stockInfos, n, targetDate) => {
    const {inflows, dates, prices, extraLargeQuants, largeQuants} = stockInfos;
    const index = dates.findIndex(date => date === targetDate);

    const filteredInflows = inflows.slice(index - n + 1, index + 1);
    const filterExtraLargeQuants = extraLargeQuants.slice(index - n + 1, index + 1);
    const filterLargeQuants = largeQuants.slice(index - n + 1, index + 1);
    const filterPrices = prices.slice(index - n + 1, index + 1);

    const quants = filterExtraLargeQuants.map((quant, idx) => Number(quant) + Number(filterLargeQuants[idx]));

    const totalInflows = filteredInflows.reduce((a, b) => Number(a) + Number(b), 0);
    const totalQuants = quants.reduce((a, b) => a + b, 0);
    const avgPrice = totalInflows / totalQuants;

    const posInflowCount = filteredInflows.reduce((count, inflow) => (inflow > 0 ? count + 1 : count), 0);
    const posQuantCount = quants.reduce((count, inflow) => (inflow > 0 ? count + 1 : count), 0);

    const isMostPos = (posInflowCount / n) >= 0.7 && (posQuantCount / n) >= 0.7;
    const posCount  = `${posInflowCount}|${posQuantCount}`;

    return {avgPrice, isMostPos, posCount, totalInflows, totalQuants, currentPrice: filterPrices[filterPrices.length - 1]};
}

module.exports = ({stockInfos, dayCount, date}) => {
    const {avgPrice, isMostPos, posCount, totalInflows, totalQuants, currentPrice} = getLongInflow(stockInfos, dayCount, date);
    const {code, name} = stockInfos;
    if (isMostPos && totalInflows > 40000) {
        console.log(
            `${code}${name}`.padEnd(15, '　'),
            '｜正次数:', posCount.padStart(6, ' '),
            '｜平均价格:', avgPrice.toFixed(2).padStart(6, ' '),
            '｜当前价格:', currentPrice.toFixed(2).padStart(6, ' '),
            '｜总流入:', totalInflows.toFixed(1).padStart(6, ' '),
            '｜总流入数:', totalQuants.toFixed(2).padStart(6, ' '),
            // '｜5日涨幅:', getRiseRatio(stockInfos, 5, date).toFixed(2).padStart(6, ' '),
            // '｜10日涨幅:', getRiseRatio(stockInfos, 10, date).toFixed(2).padStart(6, ' '),
            // '｜20日涨幅:', getRiseRatio(stockInfos, 20, date).toFixed(2).padStart(6, ' '),
            // '｜30日涨幅:', getRiseRatio(stockInfos, 30, date).toFixed(2).padStart(6, ' '),
            '｜日期:', date
        );
        // console.log(filteredInflows);
        console.log('-------------------------------------------------------------------------------------------------------------------------------------------------------------------');
        return [
            date,
            code,
            name,
            posCount,
            avgPrice,
            currentPrice,
            totalInflows,
            totalQuants,
        //     a = Number((getRiseRatio(stockInfos, 2, date) - getRiseRatio(stockInfos, 1, date)).toFixed(2).padStart(6, ' ')),
        //     b = Number((getRiseRatio(stockInfos, 3, date) - getRiseRatio(stockInfos, 1, date)).toFixed(2).padStart(6, ' ')),
        //     c = Number((getRiseRatio(stockInfos, 4, date) - getRiseRatio(stockInfos, 1, date)).toFixed(2).padStart(6, ' ')),
        //     d = Number((getRiseRatio(stockInfos, 5, date) - getRiseRatio(stockInfos, 1, date)).toFixed(2).padStart(6, ' ')),
        //     e = Number((getRiseRatio(stockInfos, 10, date) - getRiseRatio(stockInfos, 1, date)).toFixed(2).padStart(6, ' ')),
        //     f = Number((getRiseRatio(stockInfos, 15, date) - getRiseRatio(stockInfos, 1, date)).toFixed(2).padStart(6, ' ')),
        //     g = Number((getRiseRatio(stockInfos, 20, date) - getRiseRatio(stockInfos, 1, date)).toFixed(2).padStart(6, ' ')),
        //     h = Number((getRiseRatio(stockInfos, 30, date) - getRiseRatio(stockInfos, 1, date)).toFixed(2).padStart(6, ' ')),
        //     i = Number((getRiseRatio(stockInfos, 40, date) - getRiseRatio(stockInfos, 1, date)).toFixed(2).padStart(6, ' ')),
        //     j = Number((getRiseRatio(stockInfos, 60, date) - getRiseRatio(stockInfos, 1, date)).toFixed(2).padStart(6, ' ')),
        //     Math.max(a, b, c, d, e, f, g, h, i, j)
        ]
    }
};
