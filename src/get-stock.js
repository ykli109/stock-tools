const fs = require('fs');
const path = require('path');
const moment = require('moment');
const ProgressBar = require('./utils/process_bar');
const {getStockRawData, getInfosFromStockRawData, generateDates, exportExcel} = require('./utils');
const {avg_ratio, largest_ratio, long_inflow, rising_inflow_ratio, rising_inflow, largest} = require('./stategies')

const filteredStocks = [];
const riseRatios = []; // 隔日/两日/三日/五日涨幅
const fileDir = '/Users/lyk/Desktop/stock_data/processed'
const filePaths = fs.readdirSync(fileDir).map(fileName => path.join(fileDir, fileName));

const cachedStockInfos = {};
const exectStrategy = ({date, dayCount = 40, stratege, ratio}) => {
    // 周六日
    if (moment(date).day() === 0 || moment(date).day() === 6) {
        return;
    }
    filePaths.slice(0).forEach((filePath, index) => {
        // 不是股票文件，跳过
        if (!(/[0-9]{6}/.test(filePath))) {
            return;
        }
    
        // 科创、创业版、错误数据跳过
        if (/(300|301|688|689)[0-9]{3}/.test(filePath)) {
            return;
        }

        // 过滤ST
        if (/ST/.test(filePath)) {
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

        const filteredStock = stratege({stockInfos, date, dayCount, ratio});

        if (filteredStock) {
            filteredStocks.push(filteredStock);
        }

    });
}

const dates = generateDates('2021-08-06', '2021-08-06', 1);

const startTime = Date.now()
dates.slice(0).forEach(date => {
    exectStrategy({
        date: date,
        dayCount: 20,
        // ratio: 4,
        stratege: long_inflow
    });
});

result = filteredStocks || filteredStocks.reduce((res, stock) => {
    if (!res.find(item => item[1] === stock[1])) {
        res.push(stock);
    }
    return res;
}, [])

exportExcel(path.join('/Users/lyk/Desktop/stock_data/', 'result_long_inflow.xls'), result);
console.log('耗时：', moment.utc(Date.now() - startTime).format('HH时mm分ss秒'))
