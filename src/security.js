/**
 * 安全工具模块
 * 提供输入验证和清理功能，防止 SQL 注入和其他安全问题
 */

import { t } from './i18n.js';

/**
 * 安全工具类
 * 包含各种验证和清理方法，确保用户输入的安全性
 */
export class SecurityUtils {
  /**
   * 验证数据库名称是否合法
   * @param {string} name - 待验证的数据库名称
   * @returns {boolean} 是否合法
   *
   * 规则：
   * - 只允许字母、数字、下划线
   * - 不能以数字开头
   * - 长度不超过 63 个字符（PostgreSQL 限制）
   */
  static isValidDatabaseName(name) {
    if (!name || typeof name !== 'string') {
      return false;
    }

    // 数据库名称规则：字母、数字、下划线，不能以数字开头
    const regex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    return regex.test(name) && name.length <= 63;
  }

  /**
   * 验证表名称是否合法
   * @param {string} name - 待验证的表名称
   * @returns {boolean} 是否合法
   *
   * 规则与数据库名称相同
   */
  static isValidTableName(name) {
    if (!name || typeof name !== 'string') {
      return false;
    }

    // 表名称规则：字母、数字、下划线，不能以数字开头
    const regex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    return regex.test(name) && name.length <= 63;
  }

  /**
   * 清理和验证 SQL 标识符（表名、列名、数据库名等）
   * @param {string} identifier - 待清理的标识符
   * @returns {string} 清理后的标识符
   * @throws {Error} 如果标识符无效
   *
   * 功能：
   * - 移除所有非法字符（只保留字母、数字、下划线）
   * - 限制长度不超过 63 个字符
   */
  static sanitizeIdentifier(identifier) {
    if (!identifier || typeof identifier !== 'string') {
      throw new Error(t('security.invalidIdentifier'));
    }

    // 只允许字母、数字、下划线，并限制长度
    const cleanIdentifier = identifier.replace(/[^a-zA-Z0-9_]/g, '');

    if (!cleanIdentifier || cleanIdentifier.length > 63) {
      throw new Error(t('security.invalidIdentifier'));
    }

    return cleanIdentifier;
  }

  /**
   * 验证 LIMIT 参数
   * @param {string|number} limit - 待验证的 LIMIT 值
   * @returns {number} 验证后的数字
   * @throws {Error} 如果值无效
   *
   * 规则：
   * - 必须是正整数
   * - 范围：1-10000
   */
  static validateLimit(limit) {
    const num = parseInt(limit);
    if (isNaN(num) || num <= 0 || num > 10000) {
      throw new Error(t('security.invalidLimit'));
    }
    return num;
  }

  /**
   * 验证 CREATE TABLE 的 SQL 语法
   * @param {string} sql - 表定义的 SQL（不包括 CREATE TABLE 部分）
   * @returns {string} 清理后的 SQL
   * @throws {Error} 如果语法包含危险关键词或格式无效
   *
   * 安全检查：
   * - 禁止包含危险的 SQL 关键词（DROP, DELETE 等）
   * - 验证基本的列定义格式
   */
  static validateTableSchema(sql) {
    if (!sql || typeof sql !== 'string') {
      throw new Error(t('security.invalidSchema'));
    }

    // 检查是否包含危险关键词
    const dangerousKeywords = [
      'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE DATABASE',
      'DROP DATABASE', 'GRANT', 'REVOKE'
    ];

    const upperSql = sql.toUpperCase();
    for (const keyword of dangerousKeywords) {
      if (upperSql.includes(keyword)) {
        throw new Error(t('security.dangerousKeyword', { keyword }));
      }
    }

    // 基本语法验证：至少包含"列名 类型"的格式
    const basicPattern = /^\s*[a-zA-Z_][a-zA-Z0-9_]*\s+[a-zA-Z]+/;
    if (!basicPattern.test(sql)) {
      throw new Error(t('security.invalidSchemaFormat'));
    }

    return sql.trim();
  }

  /**
   * 验证自定义查询的安全性
   * @param {string} sql - 待执行的 SQL 查询
   * @returns {string} 清理后的 SQL
   * @throws {Error} 如果查询包含写操作
   *
   * 安全策略：
   * - 仅允许只读查询（SELECT, WITH, SHOW, DESCRIBE, EXPLAIN）
   * - 禁止所有写操作（INSERT, UPDATE, DELETE, CREATE, DROP 等）
   */
  static validateCustomQuery(sql) {
    if (!sql || typeof sql !== 'string') {
      throw new Error(t('security.invalidQuery'));
    }

    const upperSql = sql.toUpperCase().trim();

    // 检查是否为只读查询（允许SELECT和WITH查询）
    const readOnlyKeywords = ['SELECT', 'WITH', 'SHOW', 'DESCRIBE', 'EXPLAIN'];
    const isReadOnly = readOnlyKeywords.some(keyword =>
      upperSql.startsWith(keyword)
    );

    if (!isReadOnly) {
      throw new Error(t('security.readOnlyAllowed'));
    }

    return sql.trim();
  }

  /**
   * 清理文件名，防止路径遍历攻击
   * @param {string} filename - 原始文件名
   * @returns {string} 安全的文件名
   * @throws {Error} 如果文件名无效
   *
   * 安全措施：
   * - 移除路径遍历字符（. / \）
   * - 移除危险字符
   * - 限制长度不超过 255 个字符
   */
  static sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') {
      throw new Error(t('security.invalidFilename'));
    }

    // 移除路径遍历字符和危险字符
    const cleanName = filename
      .replace(/[\.\/\\]/g, '_')           // 替换路径分隔符
      .replace(/[^a-zA-Z0-9_-]/g, '')      // 只保留安全字符
      .substring(0, 255);                   // 限制长度

    if (!cleanName) {
      throw new Error(t('security.invalidFilename'));
    }

    return cleanName;
  }
}