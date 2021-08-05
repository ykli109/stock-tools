// 当天的主力进流入 > 过去n天主力净流入最大值的x倍
const getAvgLargerByRatio = (stockInfos, ratio, n, targetDate) => {
    const {inflows, dates} = stockInfos;
    const index = dates.findIndex(date => date === targetDate);
    const filteredInflows = inflows.slice(index - n + 1, index + 1);

    const avg = filteredInflows.reduce((sum, inflow) => Number(sum) + Number(inflow), 0) / n;

    let posCount = 0;
    const avgPos = filteredInflows.reduce((sum, inflow) => {
        if (inflow > 0) {
            posCount++;
            return sum + inflow;
        }
        return sum;
    }, 0) / posCount;

    let negCount = 0;
    const avgNeg = filteredInflows.reduce((sum, inflow) => {
        if (inflow < 0) {
            negCount++;
            return sum + inflow;
        }
        return sum;
    }, 0) / negCount;

    const targetInflow = inflows[index];
    const exactRatio = targetInflow / avgPos;

    const isAvgLarger = exactRatio > ratio;

    return {isAvgLarger, exactRatio, filteredInflows, posCount, avg, targetInflow};
};

module.exports = ({stockInfos, ratio = 6.5, dayCount, date}) => {
    const {isAvgLarger, exactRatio, filteredInflows, posCount, avg, targetInflow} = getAvgLargerByRatio(stockInfos, ratio, dayCount, date);
    const {code, name} = stockInfos;

    if (isAvgLarger && posCount >= 15) {
        console.log(
            `${code}${name}`.padEnd(15, '　'),
            '｜比值:', exactRatio.toFixed(1).padStart(4, ' '),
            '｜正次数:', posCount.toFixed(0).padStart(2, ' '),
            '｜当日流入: ', targetInflow.toFixed(2).padStart(8, ' '),
            '｜平均流入: ', avg.toFixed(2).padStart(6, ' '),
            '｜5日涨幅:', getRiseRatio(stockInfos, 5, date).toFixed(2).padStart(6, ' '),
            '｜10日涨幅:', getRiseRatio(stockInfos, 10, date).toFixed(2).padStart(6, ' '),
            '｜20日涨幅:', getRiseRatio(stockInfos, 20, date).toFixed(2).padStart(6, ' '),
            '｜日期:', date
        );
        // console.log(filteredInflows);
        console.log('-------------------------------------------------------------------------------------------------------------------------------------------------------------------');
        return true;
    }
};
