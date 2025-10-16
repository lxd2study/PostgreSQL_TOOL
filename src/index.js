#!/usr/bin/env node

import DatabaseConnection from './db.js';
import { showMainMenu, showDatabaseMenu, showTableMenu, executeCustomQuery, exportData } from './menu.js';
import { displayMessage } from './utils.js';
import { t } from './i18n.js';
import chalk from 'chalk';

async function main() {
  const db = new DatabaseConnection();

  console.log(chalk.bold.green(`\n ${t('app.welcome')} \n`));

  try {
    displayMessage(t('app.connecting'), 'info');
    await db.connect();
    displayMessage(t('app.connected'), 'success');

    let running = true;
    while (running) {
      const action = await showMainMenu(db);

      switch (action) {
        case 'database':
          await showDatabaseMenu(db);
          break;
        case 'table':
          await showTableMenu(db);
          break;
        case 'query':
          try {
            await executeCustomQuery(db);
          } catch (error) {
            displayMessage(error.message, 'error');
          }
          break;
        case 'export':
          try {
            await exportData(db);
          } catch (error) {
            displayMessage(error.message, 'error');
          }
          break;
        case 'exit':
          running = false;
          break;
      }
    }

    displayMessage(`\n${t('app.goodbye')}`, 'success');
    await db.disconnect();
    process.exit(0);

  } catch (error) {
    displayMessage(`\n${t('app.error', { message: error.message })}`, 'error');
    displayMessage(`\n${t('app.checkSettings')}`, 'warning');
    await db.disconnect();
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\n');
  displayMessage(t('app.shuttingDown'), 'info');
  process.exit(0);
});

main();
