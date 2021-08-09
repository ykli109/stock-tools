// 这里用到一个很实用的 npm 模块，用以在同一行打印文本
const slog = require('single-line-log').stdout;

function ProgressBar(description, bar_length) {
    this.description = description || 'Progress';
    this.length = bar_length || 100;

    this.render = function(opts) {
        const percent = (opts.completed / opts.total).toFixed(4);  // 计算进度(子任务的 完成数 除以 总数)
        const cell_num = Math.floor(percent * this.length);       // 计算需要多少个 █ 符号来拼凑图案
        
        // 拼接黑色条
        const cell = '█'.repeat(cell_num);
        
        // 拼接灰色条
        const empty = '░'.repeat(this.length - cell_num);
        
        // 拼接最终文本
        const cmdText = this.description + ': ' + (100*percent).toFixed(2) + '% ' + cell + empty + ' ' + opts.completed + '/' + opts.total;
        
        // 在单行输出文本
        slog(cmdText);
    }
}

module.exports = ProgressBar;
