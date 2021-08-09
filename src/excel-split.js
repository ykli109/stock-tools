const fs = require('fs');
const path = require('path');
const moment = require('moment');
const {getStockData, appendStockDataRow} = require('./utils');
const startTime = Date.now();

const handleFiles = (filePaths, targetDir) => {
    const datasMap = new Map();

    const startProcessTime = Date.now();
    filePaths.forEach(filePath => {
        const stockDatas = getStockData(filePath);

        stockDatas.forEach(stockData => {
            const {code, stockName, data} = stockData;
            const fileName = `${stockName}${code}.xls`;
            const sheetName = `${stockName}${code}`.replace('*', '');

            if (datasMap.get(sheetName)) {
                datasMap.get(sheetName).data.push(data);
            }
            else {
                datasMap.set(sheetName, {
                    filePath: path.join(targetDir, fileName),
                    sheetName: sheetName,
                    data: [data],
                });
            }
        });
    });

    console.log('读文件+执行耗时：', moment.utc(Date.now() - startProcessTime).format('HH时mm分ss秒'));

    const startWriteTime = Date.now();
    datasMap.forEach(({filePath, sheetName, data}, key) => {
        appendStockDataRow(filePath, sheetName, data);
        // 写完就丢，释放内容
        datasMap.delete(key);
    });
    console.log('写文件耗时：', moment.utc(Date.now() - startWriteTime).format('HH时mm分ss秒'))
};

const getSplitFilePathsArray = (filePaths, splitCount) => {
    return filePaths.reduce((result, filePath) => {
        const currentIdx = result.length - 1;
        if (currentIdx >= 0 && result[currentIdx].length < splitCount) {
            result[currentIdx].push(filePath);
        }
        else {
            result.push([filePath]);
        }
        
        return result;
    }, []);
};

const fileDir = '/Users/lyk/Desktop/stock_data'
const sourceDir = path.join(fileDir, 'original');
const targetDir = path.join(fileDir, 'processed');

// 得到排好序的文件路径列表
const filePaths = fs.readdirSync(sourceDir)
        .filter(fileName => /\(每日统计[0-9]{8}\)\.xls$/.test(fileName)) // 有效文件名
        .sort((name1, name2) => Number(/([0-9]{8})/.exec(name1)[1]) - Number(/([0-9]{8})/.exec(name2)[1]))  // 按日期排序
        .map(fileName => path.join(sourceDir, fileName)); // 生成绝对路径

// const filePathsArray = getSplitFilePathsArray(filePaths, 80);
const filePathsArray = [filePaths];

filePathsArray.forEach(filePaths => handleFiles(filePaths, targetDir));

console.log('总耗时：', moment.utc(Date.now() - startTime).format('HH时mm分ss秒'))