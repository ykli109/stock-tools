const {getRiseRatio} = require('../utils');

// 当天的主力进流入率比前三天比值 > 3 4 5
const getRisingInflowRatio = (stockInfos, targetDate) => {
    const {inflowRatios, inflows, dates, name} = stockInfos;
    const index = dates.findIndex(date => date === targetDate);

    const filteredInflowRatios = inflowRatios.slice(index - 3, index + 1);
    const filteredInflows = inflows.slice(index - 3, index + 1).map(i => Number(i));

    // 连续三天净流入才可
    const isAllFlowIn = filteredInflows.find(inflow => inflow < 0) === undefined;

    if (isAllFlowIn && filteredInflows[3] > 1000) {
        try {
            const ratio1 = filteredInflowRatios[3]/filteredInflowRatios[2];
            const ratio2 = filteredInflowRatios[3]/filteredInflowRatios[1];
            const ratio3 = filteredInflowRatios[3]/filteredInflowRatios[0];

            if (ratio1 >= 3 && ratio2 >= 4 && ratio3 >= 5) {
                return {
                    result: true,
                    inflows: filteredInflows.map(inflow => inflow.toFixed(0).padStart(6, ' ')),
                    inflowRatios: filteredInflowRatios.map(inflowRatio => inflowRatio.toFixed(2).padStart(5, ' '))
                }
            }
        }
        catch(e) {}
    }

    return {};
};

module.exports = ({stockInfos, date}) => {
    const {result, inflows, inflowRatios} = getRisingInflowRatio(stockInfos, date);
    const {code, name} = stockInfos;

    if (result) {
        console.log(
            `${code}${name}`.padEnd(15, '　'),
            '｜前三日流入: ', `${inflows.join('、')}`.padStart(30, ' '),
            '｜前三日流入率: ', `${inflowRatios.join('、')}`.padStart(26, ' '),
            '｜当日涨幅:', getRiseRatio(stockInfos, 1, date).toFixed(2).padStart(6, ' '),
            '｜隔日涨幅:', getRiseRatio(stockInfos, 1, date).toFixed(2).padStart(6, ' '),
            '｜三日涨幅:', getRiseRatio(stockInfos, 3, date).toFixed(2).padStart(6, ' '),
            '｜五日涨幅:', getRiseRatio(stockInfos, 5, date).toFixed(2).padStart(6, ' '),
            '｜日期:', date
        );
        // console.log(filteredInflows);
        console.log('-------------------------------------------------------------------------------------------------------------------------------------------------------------------');
        return true;
    }
};
