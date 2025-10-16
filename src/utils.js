import Table from 'cli-table3';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { t } from './i18n.js';

export function displayTable(columns, rows) {
  if (rows.length === 0) {
    console.log(chalk.yellow(t('utils.noData')));
    return;
  }

  const table = new Table({
    head: columns.map(col => chalk.cyan(col)),
    style: {
      head: [],
      border: ['grey']
    }
  });

  rows.forEach(row => {
    table.push(Object.values(row));
  });

  console.log(table.toString());
}

export function displayMessage(message, type = 'info') {
  const colors = {
    success: chalk.green,
    error: chalk.red,
    warning: chalk.yellow,
    info: chalk.blue
  };

  console.log(colors[type](message));
}

export function exportToCSV(data, filename) {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const exportDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null) return '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const filepath = path.join(exportDir, filename);
  fs.writeFileSync(filepath, csv);
  return filepath;
}

export function exportToSQL(tableName, data, filename) {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const exportDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const columns = Object.keys(data[0]);
  const inserts = data.map(row => {
    const values = columns.map(col => {
      const value = row[col];
      if (value === null) return 'NULL';
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      return value;
    }).join(', ');
    return `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values});`;
  });

  const sql = inserts.join('\n');
  const filepath = path.join(exportDir, filename);
  fs.writeFileSync(filepath, sql);
  return filepath;
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
