const {getRiseRatio} = require('../utils');
// 主力净流入、净流入率、前n天最大，
const getLargest = ({stockInfos, dayCount: n, date: targetDate}) => {
    const {inflows, tradeAmounts, inflowRatios, dates, code} = stockInfos;
    const index = dates.findIndex(date => date === targetDate);

    const filteredInflows = inflows.slice(index - n + 1, index + 1);
    const filteredTradeAmounts = tradeAmounts.slice(index - n + 1, index + 1);
    const filteredInflowRatios = inflowRatios.slice(index - n + 1, index + 1);

    const inflow = filteredInflows.pop();
    const tradeAmount = filteredTradeAmounts.pop();
    const inflowRatio = filteredInflowRatios.pop();

    let isInflowLargest, isTradeAmountLargest, isInflowRatioLargest;
    if (inflow && tradeAmount && inflow) {
        isInflowLargest = filteredInflows.find(x => Number(x) >= Number(inflow)) === undefined;
        isTradeAmountLargest = filteredTradeAmounts.find(x => Number(x) >= Number(tradeAmount)) === undefined;
        isInflowRatioLargest = filteredInflowRatios.find(x => Number(x) >= Number(inflowRatio)) === undefined
    }

    return {
        result: isInflowLargest && isTradeAmountLargest && isInflowRatioLargest,
        inflow,
        tradeAmount,
        inflowRatio
    };
};

module.exports = ({stockInfos, dayCount = 30, date}) => {
    const {code, name, inflows} = stockInfos;
    try {
        const {result, inflow, tradeAmount, inflowRatio} = getLargest({stockInfos, dayCount, date});
        if (result) {
            console.log(
                `${code}${name}`.padEnd(15, '　'),
                '｜日期:', date,
                '｜净流入:', inflow.toFixed(0).padStart(6, ' '),
                '｜净流入率:', inflowRatio.toFixed(1).padStart(4, ' '),
                '｜交易额:', tradeAmount.toFixed(0).padStart(6, ' '),
                // '｜隔日涨幅:', getRiseRatio(stockInfos, 1, date).toFixed(2).padStart(6, ' '),
                '｜第2日涨幅:', (getRiseRatio(stockInfos, 2, date) - getRiseRatio(stockInfos, 1, date)).toFixed(2).padStart(6, ' '),
                '｜3日涨幅:', getRiseRatio(stockInfos, 3, date).toFixed(2).padStart(6, ' '),
                '｜5日涨幅:', getRiseRatio(stockInfos, 5, date).toFixed(2).padStart(6, ' '),
                '｜10日涨幅:', getRiseRatio(stockInfos, 10, date).toFixed(2).padStart(6, ' '),
                '｜20日涨幅:', getRiseRatio(stockInfos, 20, date).toFixed(2).padStart(6, ' '),
            );
            console.log('-------------------------------------------------------------------------------------------------------------------------------------------------------------------');
            // return {
            //     '1day': getRiseRatio(stockInfos, 1, date).toFixed(2).padStart(6, ' '),
            //     '2day': getRiseRatio(stockInfos, 2, date).toFixed(2).padStart(6, ' '),
            //     '3day': getRiseRatio(stockInfos, 3, date).toFixed(2).padStart(6, ' '),
            //     '5day': getRiseRatio(stockInfos, 5, date).toFixed(2).padStart(6, ' '),
            // };
            return [
                date,
                code,
                name,
                // Number((getRiseRatio(stockInfos, 2, date) - getRiseRatio(stockInfos, 1, date)).toFixed(2).padStart(6, ' ')),
                // Number((getRiseRatio(stockInfos, 3, date) - getRiseRatio(stockInfos, 1, date)).toFixed(2).padStart(6, ' ')),
                // Number((getRiseRatio(stockInfos, 4, date) - getRiseRatio(stockInfos, 1, date)).toFixed(2).padStart(6, ' ')),
                // Number((getRiseRatio(stockInfos, 5, date) - getRiseRatio(stockInfos, 1, date)).toFixed(2).padStart(6, ' ')),
            ]
        }
    } catch (e) {
        console.log(e);
        console.log(`${code}${name}`);
        console.log(`date: ${date}`);
    }
};
