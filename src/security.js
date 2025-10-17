import { t } from './i18n.js';

/**
 * 安全工具模块 - 处理输入验证和清理
 */

export class SecurityUtils {
  /**
   * 验证数据库名称是否合法
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
   * 清理和验证SQL标识符（表名、列名等）
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
   * 验证LIMIT参数
   */
  static validateLimit(limit) {
    const num = parseInt(limit);
    if (isNaN(num) || num <= 0 || num > 10000) {
      throw new Error(t('security.invalidLimit'));
    }
    return num;
  }

  /**
   * 验证CREATE TABLE的SQL语法
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
    
    // 基本语法验证
    const basicPattern = /^\s*[a-zA-Z_][a-zA-Z0-9_]*\s+[a-zA-Z]+/;
    if (!basicPattern.test(sql)) {
      throw new Error(t('security.invalidSchemaFormat'));
    }
    
    return sql.trim();
  }

  /**
   * 验证自定义查询的潜在风险
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
   * 验证文件路径安全
   */
  static sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') {
      throw new Error(t('security.invalidFilename'));
    }
    
    // 移除路径遍历字符和危险字符
    const cleanName = filename
      .replace(/[\.\/\\]/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .substring(0, 255);
    
    if (!cleanName) {
      throw new Error(t('security.invalidFilename'));
    }
    
    return cleanName;
  }
}