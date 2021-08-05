// 获取股票的基本信息
const getInfosFromStockRawData = stockRawData => {
    const startRow = 3;
    // 日期、涨幅、主力净流入额、流入率
    const columnMap = {C: 'dates', D: 'prices', E: 'riseRatios', G: 'inflows', H: 'inflowRatios'};
    const keys = Object.keys(stockRawData);

    const datas = keys.reduce((result, key) => {
        const row = /^(C|D|E|G|H)([0-9]+)$/.exec(key);
        if (row && row[2] >= startRow) {
            const type = columnMap[row[1]];
            if (!result[type]) {
                result[type] = [];
            }
            result[type].push(stockRawData[key].v);
        }

        return result;
    }, {});

    return {
        code: stockRawData['A' + startRow].v,
        name: stockRawData['B' + startRow].v,
        ...datas,

    }
};

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

// 主力流入满足大于前n天流入正值平均值的ratio倍
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

// 未来n个交易日的涨幅
const getRiseRatio = (stockInfos, n, targetDate) => {
    const {dates, riseRatios} = stockInfos;
    const index = dates.findIndex(date => date === targetDate);

    const filteredRatios = riseRatios.slice(index + 1, index + 1 + n);

    return filteredRatios.reduce((sum, ratio) => sum + ratio, 0);
};