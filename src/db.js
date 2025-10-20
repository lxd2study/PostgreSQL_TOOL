/**
 * 数据库连接模块
 * 提供 PostgreSQL 数据库连接和操作的封装
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { t } from './i18n.js';

import { SecurityUtils } from './security.js';

// 加载环境变量配置
dotenv.config();

const { Pool } = pg;

/**
 * 数据库连接类
 * 管理 PostgreSQL 连接池、缓存和所有数据库操作
 */
class DatabaseConnection {
  /**
   * 构造函数 - 初始化数据库连接配置和缓存
   */
  constructor() {
    this.pool = null;  // 连接池实例
    // 数据库连接配置
    this.config = {
      host: process.env.DB_HOST || 'localhost',        // 数据库主机地址
      port: parseInt(process.env.DB_PORT) || 5432,     // 数据库端口
      user: process.env.DB_USER || 'postgres',         // 数据库用户名
      password: process.env.DB_PASSWORD || '',         // 数据库密码
      database: process.env.DB_NAME || 'postgres',     // 默认数据库名
      max: parseInt(process.env.DB_POOL_MAX) || 20,    // 连接池最大连接数
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,  // 空闲连接超时时间
      connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT) || 10000,  // 连接超时时间
      maxUses: parseInt(process.env.DB_POOL_MAX_USES) || 7500,  // 单个连接最大使用次数
    };
    this.cache = new Map();       // 查询结果缓存
    this.cacheTimeout = 30000;    // 缓存过期时间（30秒）
  }

  /**
   * 连接到数据库
   * 创建连接池并测试连接是否成功
   * @returns {Promise<boolean>} 连接成功返回 true
   */
  async connect() {
    try {
      this.pool = new Pool(this.config);
      // 测试连接是否可用
      await this.pool.query('SELECT NOW()');
      return true;
    } catch (error) {
      throw new Error(t('db.connectionFailed', { message: error.message }));
    }
  }

  /**
   * 断开数据库连接
   * 关闭连接池并清理资源
   */
  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  /**
   * 执行 SQL 查询
   * @param {string} sql - SQL 查询语句
   * @param {Array} params - 查询参数（用于参数化查询）
   * @returns {Promise<Object>} 查询结果对象
   */
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
   * 安全的查询方法，使用参数化查询防止 SQL 注入
   * @param {string} sql - SQL 查询语句
   * @param {Array} params - 查询参数
   * @returns {Promise<Object>} 查询结果
   */
  async safeQuery(sql, params = []) {
    return this.query(sql, params);
  }

  /**
   * 安全的标识符查询
   * 对表名、列名等标识符进行验证和清理后执行查询
   * @param {string} sql - 包含 {identifier} 占位符的 SQL 语句
   * @param {string} identifier - 表名或列名
   * @param {Array} params - 查询参数
   * @returns {Promise<Object>} 查询结果
   */
  async safeIdentifierQuery(sql, identifier, params = []) {
    const safeIdentifier = SecurityUtils.sanitizeIdentifier(identifier);
    const safeSql = sql.replace('{identifier}', `"${safeIdentifier}"`);
    return this.query(safeSql, params);
  }

  /**
   * 设置缓存
   * 将查询结果存入缓存以提高性能
   * @param {string} key - 缓存键
   * @param {*} value - 缓存值
   */
  setCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * 获取缓存
   * 从缓存中读取数据，如果超时则删除
   * @param {string} key - 缓存键
   * @returns {*} 缓存值或 null
   */
  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.value;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * 清除所有缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 列出所有数据库
   * 查询非模板数据库列表（带缓存）
   * @returns {Promise<Array>} 数据库列表
   */
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

  /**
   * 创建数据库
   * @param {string} name - 数据库名称
   */
  async createDatabase(name) {
    if (!SecurityUtils.isValidDatabaseName(name)) {
      throw new Error(t('security.invalidIdentifier'));
    }
    await this.query(`CREATE DATABASE "${name}"`);
    this.clearCache(); // 清除缓存
  }

  /**
   * 删除数据库
   * @param {string} name - 数据库名称
   */
  async dropDatabase(name) {
    if (!SecurityUtils.isValidDatabaseName(name)) {
      throw new Error(t('security.invalidIdentifier'));
    }
    await this.query(`DROP DATABASE IF EXISTS "${name}"`);
    this.clearCache(); // 清除缓存
  }

  /**
   * 切换到另一个数据库
   * 断开当前连接，切换数据库后重新连接
   * @param {string} name - 目标数据库名称
   */
  async switchDatabase(name) {
    if (!SecurityUtils.isValidDatabaseName(name)) {
      throw new Error(t('security.invalidIdentifier'));
    }
    await this.disconnect();
    this.config.database = name;
    this.clearCache(); // 清除缓存
    await this.connect();
  }

  /**
   * 列出当前数据库中的所有表
   * 只查询 public schema 中的表（带缓存）
   * @returns {Promise<Array>} 表列表
   */
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

  /**
   * 查看表结构
   * 获取表的所有列信息（列名、类型、长度、是否可空、默认值）
   * @param {string} tableName - 表名
   * @returns {Promise<Array>} 列信息数组
   */
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

  /**
   * 获取表的行数
   * 统计表中的记录总数（带缓存）
   * @param {string} tableName - 表名
   * @returns {Promise<number>} 行数
   */
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

  /**
   * 获取当前连接的数据库名称
   * @returns {string} 数据库名称
   */
  getCurrentDatabase() {
    return this.config.database;
  }
}

export default DatabaseConnection;
