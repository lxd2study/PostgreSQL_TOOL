import pg from 'pg';
import dotenv from 'dotenv';
import { t } from './i18n.js';

import { SecurityUtils } from './security.js';

dotenv.config();

const { Pool } = pg;

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'postgres',
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT) || 10000,
      maxUses: parseInt(process.env.DB_POOL_MAX_USES) || 7500,
    };
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30秒缓存
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

  /**
   * 安全的查询方法，使用参数化查询
   */
  async safeQuery(sql, params = []) {
    return this.query(sql, params);
  }

  /**
   * 安全的标识符查询
   */
  async safeIdentifierQuery(sql, identifier, params = []) {
    const safeIdentifier = SecurityUtils.sanitizeIdentifier(identifier);
    const safeSql = sql.replace('{identifier}', `"${safeIdentifier}"`);
    return this.query(safeSql, params);
  }

  /**
   * 缓存管理
   */
  setCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.value;
    }
    this.cache.delete(key);
    return null;
  }

  clearCache() {
    this.cache.clear();
  }

  async listDatabases() {
    const cacheKey = 'databases';
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.query(
      "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname"
    );
    this.setCache(cacheKey, result.rows);
    return result.rows;
  }

  async createDatabase(name) {
    if (!SecurityUtils.isValidDatabaseName(name)) {
      throw new Error(t('security.invalidIdentifier'));
    }
    await this.query(`CREATE DATABASE "${name}"`);
    this.clearCache(); // 清除缓存
  }

  async dropDatabase(name) {
    if (!SecurityUtils.isValidDatabaseName(name)) {
      throw new Error(t('security.invalidIdentifier'));
    }
    await this.query(`DROP DATABASE IF EXISTS "${name}"`);
    this.clearCache(); // 清除缓存
  }

  async switchDatabase(name) {
    if (!SecurityUtils.isValidDatabaseName(name)) {
      throw new Error(t('security.invalidIdentifier'));
    }
    await this.disconnect();
    this.config.database = name;
    this.clearCache(); // 清除缓存
    await this.connect();
  }

  async listTables() {
    const cacheKey = `tables_${this.config.database}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
       ORDER BY table_name`
    );
    this.setCache(cacheKey, result.rows);
    return result.rows;
  }

  async describeTable(tableName) {
    if (!SecurityUtils.isValidTableName(tableName)) {
      throw new Error(t('security.invalidIdentifier'));
    }
    
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
    if (!SecurityUtils.isValidTableName(tableName)) {
      throw new Error(t('security.invalidIdentifier'));
    }
    
    const cacheKey = `rowcount_${tableName}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.safeIdentifierQuery(
      'SELECT COUNT(*) FROM {identifier}',
      tableName
    );
    const count = parseInt(result.rows[0].count);
    this.setCache(cacheKey, count);
    return count;
  }

  getCurrentDatabase() {
    return this.config.database;
  }
}

export default DatabaseConnection;
