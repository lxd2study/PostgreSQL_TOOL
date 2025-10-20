#!/usr/bin/env node

/**
 * PostgreSQL 数据库管理工具 - 主入口文件
 * 提供命令行界面用于管理 PostgreSQL 数据库
 */

import DatabaseConnection from './db.js';
import { showMainMenu, showDatabaseMenu, showTableMenu, executeCustomQuery, exportData } from './menu.js';
import { displayMessage } from './utils.js';
import { t } from './i18n.js';
import chalk from 'chalk';

/**
 * 主函数 - 应用程序入口
 * 负责初始化数据库连接、显示菜单并处理用户操作
 */
async function main() {
  // 创建数据库连接实例
  const db = new DatabaseConnection();

  // 显示欢迎信息
  console.log(chalk.bold.green(`\n ${t('app.welcome')} \n`));

  try {
    // 连接到数据库
    displayMessage(t('app.connecting'), 'info');
    await db.connect();
    displayMessage(t('app.connected'), 'success');

    // 主循环 - 持续显示菜单直到用户选择退出
    let running = true;
    while (running) {
      // 显示主菜单并获取用户选择
      const action = await showMainMenu(db);

      // 根据用户选择执行相应操作
      switch (action) {
        case 'database':
          // 数据库操作菜单
          await showDatabaseMenu(db);
          break;
        case 'table':
          // 数据表操作菜单
          await showTableMenu(db);
          break;
        case 'query':
          // 执行自定义 SQL 查询
          try {
            await executeCustomQuery(db);
          } catch (error) {
            displayMessage(error.message, 'error');
          }
          break;
        case 'export':
          // 数据导出功能
          try {
            await exportData(db);
          } catch (error) {
            displayMessage(error.message, 'error');
          }
          break;
        case 'exit':
          // 退出程序
          running = false;
          break;
      }
    }

    // 断开数据库连接并退出
    displayMessage(`\n${t('app.goodbye')}`, 'success');
    await db.disconnect();
    process.exit(0);

  } catch (error) {
    // 错误处理 - 显示错误信息并退出
    displayMessage(`\n${t('app.error', { message: error.message })}`, 'error');
    displayMessage(`\n${t('app.checkSettings')}`, 'warning');
    await db.disconnect();
    process.exit(1);
  }
}

/**
 * 处理 Ctrl+C 中断信号
 * 优雅地关闭应用程序
 */
process.on('SIGINT', async () => {
  console.log('\n');
  displayMessage(t('app.shuttingDown'), 'info');
  process.exit(0);
});

// 启动应用程序
main();
