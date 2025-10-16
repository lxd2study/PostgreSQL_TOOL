import pg from 'pg';
import dotenv from 'dotenv';
import { t } from './i18n.js';

dotenv.config();

const { Pool } = pg;

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'postgres',
    };
  }

  async connect() {
    try {
      this.pool = new Pool(this.config);
      await this.pool.query('SELECT NOW()');
      return true;
    } catch (error) {
      throw new Error(t('db.connectionFailed', { message: error.message }));
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async query(sql, params = []) {
    if (!this.pool) {
      throw new Error(t('db.notConnected'));
    }
    try {
      const result = await this.pool.query(sql, params);
      return result;
    } catch (error) {
      throw new Error(t('db.queryFailed', { message: error.message }));
    }
  }

  async listDatabases() {
    const result = await this.query(
      "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname"
    );
    return result.rows;
  }

  async createDatabase(name) {
    await this.query(`CREATE DATABASE "${name}"`);
  }

  async dropDatabase(name) {
    await this.query(`DROP DATABASE IF EXISTS "${name}"`);
  }

  async switchDatabase(name) {
    await this.disconnect();
    this.config.database = name;
    await this.connect();
  }

  async listTables() {
    const result = await this.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
       ORDER BY table_name`
    );
    return result.rows;
  }

  async describeTable(tableName) {
    const result = await this.query(
      `SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
       FROM information_schema.columns
       WHERE table_name = $1
       ORDER BY ordinal_position`,
      [tableName]
    );
    return result.rows;
  }

  async getTableRowCount(tableName) {
    const result = await this.query(`SELECT COUNT(*) FROM "${tableName}"`);
    return parseInt(result.rows[0].count);
  }

  getCurrentDatabase() {
    return this.config.database;
  }
}

export default DatabaseConnection;
