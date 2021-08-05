const fs = require('fs');
const path = require('path');
const moment = require('moment');
const {getStockRawData, getInfosFromStockRawData, generateDates} = require('./utils');
const {avg_ratio, largest_ratio, long_inflow, rising_inflow_ratio, rising_inflow} = require('./stategies')

const filteredStocks = [];
const fileDir = '/Users/lyk/Desktop/stock_data/processed'
const filePaths = fs.readdirSync(fileDir).map(fileName => path.join(fileDir, fileName));

const cachedStockInfos = {};
const exectStrategy = ({date, dayCount = 40, stratege, ratio}) => {
    // 周六日
    if (moment(date).day() === 0 || moment(date).day() === 6) {
        return;
    }
    filePaths.slice(0).forEach(filePath => {
        // 科创、创业版、错误数据跳过
        if (/(300|301|688|689)[0-9]{3}/.test(filePath)) {
            return;
        }

        let stockInfos;
        if (cachedStockInfos[filePath]) {
            stockInfos = cachedStockInfos[filePath];
        }
        else {
            const stockRawData = getStockRawData(filePath);
            stockInfos = getInfosFromStockRawData(stockRawData);
            cachedStockInfos[filePath] = stockInfos;
        }

        const {dates, name} = stockInfos;
        
        // 非法日期
        if (dates.indexOf(date) === -1) {
            return;
        }

        stratege({stockInfos, date, dayCount, ratio});
    });
}

const dates = generateDates('2021-07-05', '2021-08-05', 1);

const startTime = Date.now()
dates.forEach(date => {
    exectStrategy({
        date: date,
        dayCount: 20,
        // ratio: 4,
        stratege: long_inflow
    });
});
console.log('耗时：', moment.utc(Date.now() - startTime).format('HH时mm分ss秒'))
