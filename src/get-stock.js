const fs = require('fs');
const path = require('path');
const moment = require('moment');
const {getStockRawData} = require('./utils');

const filteredStocks = [];
const fileDir = '/Users/lyk/Desktop/stock_data/processed'
const filePaths = fs.readdirSync(fileDir).map(fileName => path.join(fileDir, fileName));

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

// 未来n天的涨幅
const getRiseRatio = (stockInfos, n, targetDate) => {
    const {dates, riseRatios} = stockInfos;
    const index = dates.findIndex(date => date === targetDate);

    const filteredRatios = riseRatios.slice(index + 1, index + 1 + n);

    return filteredRatios.reduce((sum, ratio) => sum + ratio, 0);
};

const exectStrategy = (date, dayCount = 40) => {
    // console.log('-------------------------------------------------------------------------------------------------------------------------------------------------------------------');
    // console.log(`                                                                     日期：${date}                                                                                   `);
    // console.log('-------------------------------------------------------------------------------------------------------------------------------------------------------------------');
    filePaths.slice(0).forEach(filePath => {
        const stockRawData = getStockRawData(filePath);
        const stockInfos = getInfosFromStockRawData(stockRawData);
        const {code, name, dates} = stockInfos;
        
        // 科创、创业版、错误数据跳过；非法日期
        const invalidCode = !(/^[0-9]{6}/.test(code));
        const invalidDate = dates.indexOf(date) === -1;
        if (/^(300|301|688|689)/.test(code) || invalidCode || invalidDate) {
            return;
        }
    
        // 判断 最大策略
        // const {isLargestByRatio, exactRatio, filteredInflows} = getLargestByRatio(stockInfos, 4, 30, '2021-04-30');
    
        // if (isLargestByRatio) {
        //     console.log(`${code}${name}`);
        //     console.log('ratio：', exactRatio);
        //     console.log(filteredInflows);
        // }
    
        // 判断 平均策略
        // const {isAvgLarger, exactRatio, filteredInflows, posCount, avg, targetInflow} = getAvgLargerByRatio(stockInfos, 6.5, dayCount, date);
    
        // if (isAvgLarger && posCount >= 15) {
        //     console.log(
        //         `${code}${name}`.padEnd(15, '　'),
        //         '｜比值:', exactRatio.toFixed(1).padStart(4, ' '),
        //         '｜正次数:', posCount.toFixed(0).padStart(2, ' '),
        //         '｜当日流入: ', targetInflow.toFixed(2).padStart(8, ' '),
        //         '｜平均流入: ', avg.toFixed(2).padStart(6, ' '),
        //         '｜5日涨幅:', getRiseRatio(stockInfos, 5, date).toFixed(2).padStart(6, ' '),
        //         '｜10日涨幅:', getRiseRatio(stockInfos, 10, date).toFixed(2).padStart(6, ' '),
        //         '｜20日涨幅:', getRiseRatio(stockInfos, 20, date).toFixed(2).padStart(6, ' '),
        //         '｜日期:', date
        //     );
        //     // console.log(filteredInflows);
        //     console.log('-------------------------------------------------------------------------------------------------------------------------------------------------------------------');
        // }

        // 判断 长期流入
        const {avgPrice, isMostPos, posCount, totalInflows, totalQuants, currentPrice} = getLongInflow(stockInfos, dayCount, date);
        if (isMostPos) {
            console.log(
                `${code}${name}`.padEnd(15, '　'),
                '｜正次数:', posCount.toFixed(0).padStart(2, ' '),
                '｜平均价格:', avgPrice.toFixed(2).padStart(6, ' '),
                '｜当前价格:', currentPrice.toFixed(2).padStart(6, ' '),
                '｜总流入:', totalInflows.toFixed(1).padStart(6, ' '),
                '｜总流入数:', totalQuants.toFixed(2).padStart(6, ' '),
                '｜5日涨幅:', getRiseRatio(stockInfos, 5, date).toFixed(2).padStart(6, ' '),
                '｜10日涨幅:', getRiseRatio(stockInfos, 10, date).toFixed(2).padStart(6, ' '),
                '｜20日涨幅:', getRiseRatio(stockInfos, 20, date).toFixed(2).padStart(6, ' '),
                '｜日期:', date
            );
            // console.log(filteredInflows);
            console.log('-------------------------------------------------------------------------------------------------------------------------------------------------------------------');
        }
        
    });
}

const dates = [];

let date = '2021-03-10';
while(moment(date) < moment('2021-08-03')) {
    dates.push(date);
    date = moment(date).add(1, 'days').format('YYYY-MM-DD');
}

console.log('-------------------------------------------------------------------------------------------------------------------------------------------------------------------');
dates.forEach(date => exectStrategy(date));

// exectStrategy('2021-08-03', 40);
