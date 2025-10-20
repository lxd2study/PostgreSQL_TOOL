/**
 * 国际化（i18n）模块
 * 提供多语言支持功能
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取当前模块的文件路径（ES 模块兼容）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 国际化管理类
 * 负责加载和管理翻译文件，提供文本翻译功能
 */
class I18n {
  /**
   * 构造函数 - 初始化语言设置并加载翻译文件
   */
  constructor() {
    this.locale = process.env.LANGUAGE || 'zh_CN';  // 当前语言（默认简体中文）
    this.translations = {};  // 翻译内容存储
    this.loadTranslations();  // 加载翻译文件
  }

  /**
   * 加载翻译文件
   * 根据当前语言设置加载对应的 JSON 翻译文件
   * 如果加载失败，会回退到英文
   */
  loadTranslations() {
    try {
      // 构建翻译文件路径
      const translationPath = join(__dirname, '..', 'locales', `${this.locale}.json`);
      const data = readFileSync(translationPath, 'utf8');
      this.translations = JSON.parse(data);
    } catch (error) {
      // 加载失败时回退到英文
      try {
        const fallbackPath = join(__dirname, '..', 'locales', 'en.json');
        const data = readFileSync(fallbackPath, 'utf8');
        this.translations = JSON.parse(data);
        console.warn(`Translation file for ${this.locale} not found, using English as fallback.`);
      } catch (fallbackError) {
        console.error('Failed to load translation files:', fallbackError.message);
        this.translations = {};
      }
    }
  }

  /**
   * 翻译函数 - 根据键获取翻译文本
   * @param {string} key - 翻译键（支持点号分隔的嵌套路径，如 'app.welcome'）
   * @param {Object} params - 插值参数对象（用于替换翻译文本中的占位符）
   * @returns {string} 翻译后的文本
   *
   * 示例：
   * t('app.welcome') => '欢迎使用 PostgreSQL 管理系统'
   * t('db.queryFailed', { message: 'timeout' }) => '查询失败: timeout'
   */
  t(key, params = {}) {
    // 使用点号分隔键，逐级查找翻译值
    const keys = key.split('.');
    let value = this.translations;

    // 遍历键路径，逐层获取嵌套对象
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // 如果找不到翻译，返回原键
      }
    }

    // 处理字符串插值（替换 {参数名} 格式的占位符）
    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
      });
    }

    return value;
  }

  /**
   * 设置当前语言
   * @param {string} locale - 语言代码（如 'zh_CN', 'en'）
   */
  setLocale(locale) {
    this.locale = locale;
    this.loadTranslations();  // 重新加载翻译文件
  }

  /**
   * 获取当前语言代码
   * @returns {string} 当前语言代码
   */
  getLocale() {
    return this.locale;
  }
}

// 创建单例实例
const i18n = new I18n();

// 导出便捷方法
export const t = i18n.t.bind(i18n);           // 翻译函数
export const setLocale = i18n.setLocale.bind(i18n);  // 设置语言
export const getLocale = i18n.getLocale.bind(i18n);  // 获取语言
export default i18n;
