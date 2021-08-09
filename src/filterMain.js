
const fs = require('fs');
const path = require('path');
const {copyFilesToFolder} = require('./utils');

const fileDir = '/Users/lyk/Desktop/stock_data';
const sourceDir = path.join(fileDir, 'processed');
const targetDir = path.join(fileDir, 'filterd');

// 筛除ST、科创、创业版
const filterByFilename = fileName => {
    if (/(300|301|688|689)[0-9]{3}/.test(fileName)) {
        return false;
    }

    if (/ST/.test(fileName)) {
        return false;
    }

    return true;
}

// 得到排好序的文件路径列表
const filePaths = fs.readdirSync(sourceDir)
        .filter(fileName => filterByFilename(fileName)) // 有效文件名
        .map(fileName => path.join(sourceDir, fileName)); // 生成绝对路径

copyFilesToFolder(filePaths, targetDir);
