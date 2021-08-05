const {getRiseRatio} = require('../utils');
// 长期流入，获取均价
const getLongInflow = (stockInfos, n, targetDate) => {
    const {inflows, dates, prices} = stockInfos;
    const index = dates.findIndex(date => date === targetDate);
    const filteredInflows = inflows.slice(index - n + 1, index + 1);
    const filterPrices = prices.slice(index - n + 1, index + 1);
    const quants = filteredInflows.map((inflow, idx) => Number(inflow) / Number(filterPrices[idx]));

    const totalInflows = filteredInflows.reduce((a, b) => Number(a) + Number(b), 0);
    const totalQuants = quants.reduce((a, b) => a + b, 0);
    const avgPrice = totalInflows / totalQuants;

    const posCount = filteredInflows.reduce((count, inflow) => (inflow > 0 ? count + 1 : count), 0);

    const isMostPos = (posCount / n) >= 0.8;

    return {avgPrice, isMostPos, posCount, totalInflows, totalQuants, currentPrice: filterPrices[filterPrices.length - 1]};
}

module.exports = ({stockInfos, dayCount, date}) => {
    const {avgPrice, isMostPos, posCount, totalInflows, totalQuants, currentPrice} = getLongInflow(stockInfos, dayCount, date);
    const {code, name} = stockInfos;
    if (isMostPos && totalInflows > 40000) {
        console.log(
            `${code}${name}`.padEnd(15, '　'),
            '｜正次数:', posCount.toFixed(0).padStart(2, ' '),
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
        return true;
    }
};
