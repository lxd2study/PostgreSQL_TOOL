/**
 * 工具函数模块
 * 提供数据展示、消息输出和文件导出等工具函数
 */

import Table from 'cli-table3';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { t } from './i18n.js';

/**
 * 在控制台显示格式化的表格
 * @param {Array<string>} columns - 表头列名数组
 * @param {Array<Object>} rows - 数据行数组
 */
export function displayTable(columns, rows) {
  if (rows.length === 0) {
    console.log(chalk.yellow(t('utils.noData')));
    return;
  }

  // 创建表格实例并设置样式
  const table = new Table({
    head: columns.map(col => chalk.cyan(col)),
    style: {
      head: [],
      border: ['grey']
    }
  });

  // 将数据行添加到表格
  rows.forEach(row => {
    table.push(Object.values(row));
  });

  console.log(table.toString());
}

/**
 * 显示带颜色的消息
 * @param {string} message - 要显示的消息
 * @param {string} type - 消息类型：success, error, warning, info
 */
export function displayMessage(message, type = 'info') {
  const colors = {
    success: chalk.green,    // 成功 - 绿色
    error: chalk.red,        // 错误 - 红色
    warning: chalk.yellow,   // 警告 - 黄色
    info: chalk.blue         // 信息 - 蓝色
  };

  console.log(colors[type](message));
}

/**
 * 将数据导出为 CSV 格式文件
 * @param {Array<Object>} data - 要导出的数据数组
 * @param {string} filename - 导出文件名
 * @returns {string} 导出文件的完整路径
 */
export function exportToCSV(data, filename) {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // 创建导出目录（如果不存在）
  const exportDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // 获取表头（数据对象的所有键）
  const headers = Object.keys(data[0]);

  // 创建进度条显示导出进度
  const progress = new ProgressBar(data.length, 30);

  // 生成 CSV 内容
  const csv = [
    headers.join(','),  // CSV 表头
    ...data.map((row, index) => {
      // 处理每一行数据
      const rowCsv = headers.map(header => {
        const value = row[header];
        // NULL 值处理
        if (value === null) return '';
        // 包含逗号或引号的字符串需要转义
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');

      // 每处理 100 行更新一次进度
      if (index % 100 === 0) {
        progress.update(index);
      }

      return rowCsv;
    })
  ].join('\n');

  progress.update(data.length); // 完成进度

  // 写入文件
  const filepath = path.join(exportDir, filename);
  fs.writeFileSync(filepath, csv);
  return filepath;
}

/**
 * 将数据导出为 SQL INSERT 语句文件
 * @param {string} tableName - 表名
 * @param {Array<Object>} data - 要导出的数据数组
 * @param {string} filename - 导出文件名
 * @returns {string} 导出文件的完整路径
 */
export function exportToSQL(tableName, data, filename) {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // 创建导出目录（如果不存在）
  const exportDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // 获取列名
  const columns = Object.keys(data[0]);

  // 为每行数据生成 INSERT 语句
  const inserts = data.map(row => {
    const values = columns.map(col => {
      const value = row[col];
      // NULL 值处理
      if (value === null) return 'NULL';
      // 字符串值需要用单引号包裹，并转义单引号
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      return value;
    }).join(', ');
    // 生成完整的 INSERT 语句
    return `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values});`;
  });

  // 将所有 INSERT 语句合并
  const sql = inserts.join('\n');

  // 写入文件
  const filepath = path.join(exportDir, filename);
  fs.writeFileSync(filepath, sql);
  return filepath;
}

/**
 * 格式化字节大小为人类可读的格式
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小字符串（如 "1.5 MB"）
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 进度条类
 * 用于在控制台显示操作进度
 */
export class ProgressBar {
  /**
   * 构造函数
   * @param {number} total - 总任务数
   * @param {number} width - 进度条宽度（字符数）
   */
  constructor(total, width = 40) {
    this.total = total;      // 总任务数
    this.current = 0;        // 当前完成数
    this.width = width;      // 进度条宽度
  }

  /**
   * 更新进度条显示
   * @param {number} current - 当前完成的任务数
   */
  update(current) {
    this.current = current;
    // 计算完成百分比
    const percentage = Math.min(100, (current / this.total) * 100);
    // 计算进度条中已填充和未填充的字符数
    const filled = Math.round((this.width * percentage) / 100);
    const empty = this.width - filled;

    // 使用 Unicode 字符绘制进度条
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    // 使用 \r 实现原地更新（不换行）
    process.stdout.write(`\r[${bar}] ${percentage.toFixed(1)}% (${current}/${this.total})`);

    // 完成时换行
    if (current >= this.total) {
      process.stdout.write('\n');
    }
  }

  /**
   * 递增进度（加1）
   */
  increment() {
    this.update(this.current + 1);
  }
}
