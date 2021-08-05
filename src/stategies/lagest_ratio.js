// 当天的主力进流入 > 过去n天主力净流入最大值的x倍

// 主力流入满足大于前n天最大的ratio倍
const getLargestByRatio = (stockInfos, ratio, n, targetDate) => {
    const {inflows, dates} = stockInfos;
    const index = dates.findIndex(date => date === targetDate);
    const filteredInflows = inflows.slice(index - n + 1, index + 1);

    const targetInflow = inflows[index];
    const sorted = filteredInflows.map(n => Math.abs(n)).sort((a, b) => b - a);

    const exactRatio = sorted[0] / sorted[1];
    const isLargestByRatio = sorted[0] === targetInflow && exactRatio > ratio;

    return {isLargestByRatio, exactRatio, filteredInflows};
};

module.exports = ({stockInfos, ratio = 4, dayCount = 30, date}) => {
    const {isLargestByRatio, exactRatio, filteredInflows} = getLargestByRatio(stockInfos, ratio, dayCount, date);
    const {code, name} = stockInfos;

    if (isLargestByRatio) {
        console.log(`${code}${name}`);
        console.log('ratio：', exactRatio);
        console.log(filteredInflows);
        return true;
    }
};
