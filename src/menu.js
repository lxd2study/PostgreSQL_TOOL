import inquirer from 'inquirer';
import chalk from 'chalk';
import { displayTable, displayMessage, exportToCSV, exportToSQL } from './utils.js';
import { t } from './i18n.js';

export async function showMainMenu(db) {
  console.log('\n' + chalk.bold.blue('='.repeat(50)));
  console.log(chalk.bold.blue(`PostgreSQL Admin - Current DB: ${db.getCurrentDatabase()}`));
  console.log(chalk.bold.blue('='.repeat(50)) + '\n');

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: t('menu.main.question'),
      choices: [
        { name: t('menu.main.database'), value: 'database' },
        { name: t('menu.main.table'), value: 'table' },
        { name: t('menu.main.query'), value: 'query' },
        { name: t('menu.main.export'), value: 'export' },
        new inquirer.Separator(),
        { name: t('menu.main.exit'), value: 'exit' }
      ]
    }
  ]);

  return answer.action;
}

export async function showDatabaseMenu(db) {
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: t('menu.database.title'),
      choices: [
        { name: t('menu.database.list'), value: 'list' },
        { name: t('menu.database.create'), value: 'create' },
        { name: t('menu.database.drop'), value: 'drop' },
        { name: t('menu.database.switch'), value: 'switch' },
        new inquirer.Separator(),
        { name: t('menu.database.back'), value: 'back' }
      ]
    }
  ]);

  if (answer.action === 'back') return;

  try {
    switch (answer.action) {
      case 'list':
        await listDatabases(db);
        break;
      case 'create':
        await createDatabase(db);
        break;
      case 'drop':
        await dropDatabase(db);
        break;
      case 'switch':
        await switchDatabase(db);
        break;
    }
  } catch (error) {
    displayMessage(error.message, 'error');
  }
}

export async function showTableMenu(db) {
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: t('menu.table.title'),
      choices: [
        { name: t('menu.table.list'), value: 'list' },
        { name: t('menu.table.describe'), value: 'describe' },
        { name: t('menu.table.view'), value: 'view' },
        { name: t('menu.table.create'), value: 'create' },
        { name: t('menu.table.drop'), value: 'drop' },
        new inquirer.Separator(),
        { name: t('menu.table.back'), value: 'back' }
      ]
    }
  ]);

  if (answer.action === 'back') return;

  try {
    switch (answer.action) {
      case 'list':
        await listTables(db);
        break;
      case 'describe':
        await describeTable(db);
        break;
      case 'view':
        await viewTableData(db);
        break;
      case 'create':
        await createTable(db);
        break;
      case 'drop':
        await dropTable(db);
        break;
    }
  } catch (error) {
    displayMessage(error.message, 'error');
  }
}

async function listDatabases(db) {
  const databases = await db.listDatabases();
  console.log('\n' + chalk.bold(t('database.available')));
  displayTable([t('database.nameHeader')], databases);
}

async function createDatabase(db) {
  const answer = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: t('database.enterName'),
      validate: input => input.trim() !== '' || t('database.nameEmpty')
    }
  ]);

  await db.createDatabase(answer.name);
  displayMessage(t('database.created', { name: answer.name }), 'success');
}

async function dropDatabase(db) {
  const databases = await db.listDatabases();
  if (databases.length === 0) {
    displayMessage(t('database.noDatabases'), 'warning');
    return;
  }

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'name',
      message: t('database.selectToDrop'),
      choices: databases.map(d => d.datname)
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: t('database.confirmDrop'),
      default: false
    }
  ]);

  if (answer.confirm) {
    await db.dropDatabase(answer.name);
    displayMessage(t('database.dropped', { name: answer.name }), 'success');
  } else {
    displayMessage(t('database.cancelled'), 'info');
  }
}

async function switchDatabase(db) {
  const databases = await db.listDatabases();
  if (databases.length === 0) {
    displayMessage(t('database.noDatabases'), 'warning');
    return;
  }

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'name',
      message: t('database.selectToSwitch'),
      choices: databases.map(d => d.datname)
    }
  ]);

  await db.switchDatabase(answer.name);
  displayMessage(t('database.switched', { name: answer.name }), 'success');
}

async function listTables(db) {
  const tables = await db.listTables();
  if (tables.length === 0) {
    displayMessage(t('table.noTables'), 'warning');
    return;
  }

  console.log('\n' + chalk.bold(t('table.listTitle')));

  const tableData = [];
  for (const table of tables) {
    const count = await db.getTableRowCount(table.table_name);
    tableData.push({
      table_name: table.table_name,
      row_count: count
    });
  }

  displayTable([t('table.nameHeader'), t('table.rowCountHeader')], tableData);
}

async function describeTable(db) {
  const tables = await db.listTables();
  if (tables.length === 0) {
    displayMessage(t('table.noTables'), 'warning');
    return;
  }

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'table',
      message: t('table.selectToDescribe'),
      choices: tables.map(t => t.table_name)
    }
  ]);

  const columns = await db.describeTable(answer.table);
  console.log('\n' + chalk.bold(t('table.describeTitle', { name: answer.table })));
  displayTable(
    [t('table.columnHeader'), t('table.typeHeader'), t('table.maxLengthHeader'), t('table.nullableHeader'), t('table.defaultHeader')],
    columns.map(col => ({
      column_name: col.column_name,
      data_type: col.data_type,
      character_maximum_length: col.character_maximum_length || '-',
      is_nullable: col.is_nullable,
      column_default: col.column_default || '-'
    }))
  );
}

async function viewTableData(db) {
  const tables = await db.listTables();
  if (tables.length === 0) {
    displayMessage(t('table.noTables'), 'warning');
    return;
  }

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'table',
      message: t('table.selectToView'),
      choices: tables.map(t => t.table_name)
    },
    {
      type: 'input',
      name: 'limit',
      message: t('table.rowsPrompt'),
      default: '10',
      validate: input => !isNaN(input) && parseInt(input) > 0 || t('table.invalidNumber')
    }
  ]);

  const result = await db.query(`SELECT * FROM "${answer.table}" LIMIT ${answer.limit}`);

  if (result.rows.length === 0) {
    displayMessage(t('table.empty'), 'warning');
    return;
  }

  console.log('\n' + chalk.bold(t('table.viewTitle', { name: answer.table, count: result.rows.length })));
  displayTable(Object.keys(result.rows[0]), result.rows);
}

async function createTable(db) {
  const answer = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: t('table.enterName'),
      validate: input => input.trim() !== '' || t('table.nameEmpty')
    },
    {
      type: 'input',
      name: 'sql',
      message: t('table.enterSchema'),
      default: t('table.schemaExample')
    }
  ]);

  await db.query(`CREATE TABLE "${answer.name}" (${answer.sql})`);
  displayMessage(t('table.created', { name: answer.name }), 'success');
}

async function dropTable(db) {
  const tables = await db.listTables();
  if (tables.length === 0) {
    displayMessage(t('table.noTables'), 'warning');
    return;
  }

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'table',
      message: t('table.selectToDrop'),
      choices: tables.map(t => t.table_name)
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: t('table.confirmDrop'),
      default: false
    }
  ]);

  if (answer.confirm) {
    await db.query(`DROP TABLE "${answer.table}"`);
    displayMessage(t('table.dropped', { name: answer.table }), 'success');
  } else {
    displayMessage(t('table.cancelled'), 'info');
  }
}

export async function executeCustomQuery(db) {
  const answer = await inquirer.prompt([
    {
      type: 'input',
      name: 'sql',
      message: t('query.enterQuery'),
      validate: input => input.trim() !== '' || t('query.queryEmpty')
    }
  ]);

  const startTime = Date.now();
  const result = await db.query(answer.sql);
  const duration = Date.now() - startTime;

  if (result.command === 'SELECT' && result.rows.length > 0) {
    displayTable(Object.keys(result.rows[0]), result.rows);
    console.log(chalk.gray(`\n${t('query.rowsReturned', { count: result.rowCount, duration })}`));
  } else {
    displayMessage(t('query.executed', { count: result.rowCount || 0, duration }), 'success');
  }
}

export async function exportData(db) {
  const tables = await db.listTables();
  if (tables.length === 0) {
    displayMessage(t('export.noTables'), 'warning');
    return;
  }

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'table',
      message: t('export.selectTable'),
      choices: tables.map(t => t.table_name)
    },
    {
      type: 'list',
      name: 'format',
      message: t('export.selectFormat'),
      choices: [t('export.formatCSV'), t('export.formatSQL')]
    }
  ]);

  const result = await db.query(`SELECT * FROM "${answer.table}"`);

  if (result.rows.length === 0) {
    displayMessage(t('export.tableEmpty'), 'warning');
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const format = answer.format === t('export.formatCSV') ? 'CSV' : 'SQL';
  const filename = `${answer.table}_${timestamp}.${format.toLowerCase()}`;

  let filepath;
  if (format === 'CSV') {
    filepath = exportToCSV(result.rows, filename);
  } else {
    filepath = exportToSQL(answer.table, result.rows, filename);
  }

  displayMessage(t('export.success', { filepath }), 'success');
  displayMessage(t('export.totalRows', { count: result.rows.length }), 'info');
}
