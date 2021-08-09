const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const _ = require('lodash');
const moment = require('moment');

const {utils: xlsxUtils, read: xlsxRead, writeFile: xlsxWriteFile} = xlsx;

// 获取excel数据
const getExcelData = filePath => {
    // 获取数据
    const excelBuffer = fs.readFileSync(filePath);

    // 解析数据
    const data = xlsxRead(excelBuffer, {
        type: 'buffer',
        cellHTML: false,
    });

    return data;
};

// 获取
const addDataWithHeader = data => {
    const firstHeader = [
        {title: '', start: 0, end: 1},
        {title: '最新', start: 2, end: 5},
        {title: '主力', start: 6, end: 7},
        {title: '超大单', start: 8, end: 14},
        {title: '大单', start: 15, end: 21},
        {title: '中单', start: 22, end: 28},
        {title: '小单', start: 29, end: 35},
    ];
    const secondHeader = ["代码", "名称", "交易日期", "收盘价(元)", "涨跌幅(%)", "成交金额(万元)", "净流入额(万元)", "净流入率(%)", "流入额(万元)", "流入量(万股)", "流出额(万元)", "流出量(万股)", "净流入额(万元)", "净流入量(万股)", "净流入率(%)", "流入额(万元)", "流入量(万股)", "流出额(万元)", "流出量(万股)", "净流入额(万元)", "净流入量(万股)", "净流入率(%)", "流入额(万元)", "流入量(万股)", "流出额(万元)", "流出量(万股)", "净流入额(万元)", "净流入量(万股)", "净流入率(%)", "流入额(万元)", "流入量(万股)", "流出额(万元)", "流出量(万股)", "净流入额(万元)", "净流入量(万股)", "净流入率(%)"];
    const headerData = [
        firstHeader.reduce((prev, cur) => {
            const appendArr = new Array(cur.end - cur.start + 1).fill('');
            appendArr[0] = cur.title;

            return prev.concat(appendArr);
        }, []),
        secondHeader
    ];

    const merge = firstHeader.reduce((prev, cur) => {
        prev.push({
            s: {
                c: cur.start,
                r: 0
            },
            e: {
                c: cur.end,
                r: 0
            }
        });
        return prev;
    }, []);

    const workSheet = xlsxUtils.aoa_to_sheet(headerData.concat(data));
    workSheet['!merges'] = merge;

    return workSheet;
};

// 过滤表中的数据并处理生成最终数据
// 输出：{code: 股票代码, stockName: 股票名, data: 当日数据}
const getProcessedStockData = sheetDatas => {
    // 按表格行分组
    const rawStockDatas = [];
    Object.keys(sheetDatas).forEach(key => {
        const rowNumMatch = /[0-9]+$/.exec(key);
        const rowNum = rowNumMatch && rowNumMatch[0];
        if (rowNum) {
            if (rawStockDatas[rowNum]) {
                rawStockDatas[rowNum].push(sheetDatas[key]);
            }
            else {
                rawStockDatas[rowNum] = [sheetDatas[key]];
            }
        } 
    });
    
    // 过滤掉与股票无关的数据
    const stockDatas = rawStockDatas
        // 第一个值必须股票代码，以SH、SZ结尾
        .filter(item => /(SH|SZ)$/.test(item && item[0] && item[0].v))
        // 提取股票代码和股票名，数据只保留原始值
        .map(item => ({
            code: item[0].v,
            stockName: item[1].v,
            data: item.map(i => i.v),
        }));

    return stockDatas;
};

// 输入：filepath: excel文件路径
// 输出：{code: 股票代码, stockName: 股票名, data: 当日数据}
const getStockData = filePath => {
    const excelData = getExcelData(filePath);
    const {SheetNames, Sheets} = excelData;

    // 只获取第一张表的数据
    const sheetDatas = Sheets[SheetNames[0]];
    
    return getProcessedStockData(sheetDatas);
}

const getStockRawData  = filePath => {
    const excelData = getExcelData(filePath);
    const {SheetNames, Sheets} = excelData;

    // 只获取第一张表的数据
    const sheetDatas = Sheets[SheetNames[0]];
    
    return sheetDatas;
};

// 追加行到文件
const appendStockDataRow = (filePath, sheetName, data) => {
    data = (Array.isArray(data) && Array.isArray(data[0])) ? data : [data];

    if (fs.existsSync(filePath)) {
        const workBook = getExcelData(filePath);
        const workSheet = workBook.Sheets[workBook.SheetNames[0]];

        xlsxUtils.sheet_add_aoa(workSheet, data, {origin: -1});
        xlsxWriteFile(workBook, filePath);
    }
    else {
        const workBook = xlsxUtils.book_new();
        workBook.Props = {
            Title: "个股资金流向",
            Subject: "统计数据",
            Author: "liyunkun",
            CreatedDate: new Date(),
        };

        workBook.SheetNames.push(sheetName);
        workBook.Sheets[sheetName] = addDataWithHeader(data);
        xlsxWriteFile(workBook, filePath);
    }
};

// 获取股票的基本信息
const getInfosFromStockRawData = stockRawData => {
    const startRow = 3;
    // 日期、涨幅、主力净流入额、流入率、超大单净流入量、大单净流入量
    const columnMap = {C: 'dates', D: 'prices', E: 'riseRatios', F: 'tradeAmounts', G: 'inflows', H: 'inflowRatios', N: 'extraLargeQuants', U: 'largeQuants'};
    const keys = Object.keys(stockRawData);

    const datas = keys.reduce((result, key) => {
        const row = /^(C|D|E|F|G|H|N|U)([0-9]+)$/.exec(key);
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

// 未来n个交易日的涨幅
const getRiseRatio = (stockInfos, n, targetDate) => {
    const {dates, riseRatios} = stockInfos;
    const index = dates.findIndex(date => date === targetDate);

    const filteredRatios = riseRatios.slice(index + 1, index + 1 + n);

    return ((filteredRatios.reduce((res, ratio) => res * (1 + ratio/100), 1)) - 1) * 100;
};

// 生成一组日期
const generateDates = (dateStart, dateEnd, interval) => {
    let dates = [];
    let date = dateStart;
    while(moment(date) <= moment(dateEnd)) {
        dates.push(date);
        date = moment(date).add(interval, 'days').format('YYYY-MM-DD');
    }

    return dates;
}

// 获取文件
const copyFilesToFolder = (filePaths, folder) => {
    !fs.existsSync(folder) && fs.mkdirSync(folder);
    filePaths.forEach(filePath => {
        const fileName = filePath.split('/').pop();
        fs.copyFile(filePath, path.join(folder, fileName), error => console.log(error));
    });
};

// 写表格
const exportExcel = (filePath, data) => {
    data = (Array.isArray(data) && Array.isArray(data[0])) ? data : [data];

    if (fs.existsSync(filePath)) {
        throw new Error(`${filePath}已存在！`);
    }
    else {
        const workBook = xlsxUtils.book_new();
        workBook.Props = {
            Title: "结果",
            Subject: "筛出数据",
            Author: "liyunkun",
            CreatedDate: new Date(),
        };

        workBook.SheetNames.push('筛出股票');
        workBook.Sheets['筛出股票'] = xlsxUtils.aoa_to_sheet(data);;
        xlsxWriteFile(workBook, filePath);
    }
};


module.exports = {
    getExcelData,
    getStockData,
    getStockRawData,
    appendStockDataRow,
    getInfosFromStockRawData,
    getRiseRatio,
    generateDates,
    copyFilesToFolder,
    exportExcel,
};
