/**
 * PostgreSQL Web管理工具 - Web服务器
 * 提供REST API接口用于Web端管理PostgreSQL数据库
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import DatabaseConnection from './db.js';
import { t } from './i18n.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 全局数据库连接实例
let db = null;
let currentConfig = null;

// ==================== API路由 ====================

/**
 * 连接数据库
 */
app.post('/api/connect', async (req, res) => {
    try {
        const { host, port, user, password, database } = req.body;
        
        // 如果已有连接，先断开
        if (db) {
            await db.disconnect();
        }
        
        // 创建新连接
        db = new DatabaseConnection();
        db.config = { host, port, user, password, database };
        
        await db.connect();
        currentConfig = { host, port, user, database };
        
        res.json({ 
            success: true, 
            message: t('app.connected'),
            database
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * 获取数据库列表
 */
app.get('/api/databases', async (req, res) => {
    try {
        if (!db) {
            throw new Error('未连接到数据库');
        }
        
        const result = await db.query(`
            SELECT 
                datname,
                pg_catalog.pg_get_userbyid(datdba) as owner,
                pg_encoding_to_char(encoding) as encoding
            FROM pg_database
            WHERE datistemplate = false
            ORDER BY datname
        `);
        
        res.json({ 
            success: true, 
            databases: result.rows 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * 创建数据库
 */
app.post('/api/databases', async (req, res) => {
    try {
        if (!db) {
            throw new Error('未连接到数据库');
        }
        
        const { name } = req.body;
        
        if (!name) {
            throw new Error('数据库名称不能为空');
        }
        
        await db.query(`CREATE DATABASE "${name}"`);
        
        res.json({ 
            success: true, 
            message: `数据库 "${name}" 创建成功` 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * 删除数据库
 */
app.delete('/api/databases/:name', async (req, res) => {
    try {
        if (!db) {
            throw new Error('未连接到数据库');
        }
        
        const { name } = req.params;
        
        // 防止删除系统数据库
        if (['postgres', 'template0', 'template1'].includes(name)) {
            throw new Error('不能删除系统数据库');
        }
        
        await db.query(`DROP DATABASE "${name}"`);
        
        res.json({ 
            success: true, 
            message: `数据库 "${name}" 已删除` 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * 切换数据库
 */
app.post('/api/switch-database', async (req, res) => {
    try {
        if (!db || !currentConfig) {
            throw new Error('未连接到数据库');
        }
        
        const { database } = req.body;
        
        // 断开当前连接
        await db.disconnect();
        
        // 使用新数据库重新连接
        db = new DatabaseConnection();
        db.config = { ...currentConfig, database };
        await db.connect();
        
        currentConfig.database = database;
        
        res.json({ 
            success: true, 
            message: `已切换到数据库: ${database}`,
            database
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * 获取数据表列表
 */
app.get('/api/tables', async (req, res) => {
    try {
        if (!db) {
            throw new Error('未连接到数据库');
        }
        
        const result = await db.query(`
            SELECT 
                tablename,
                schemaname,
                (SELECT COUNT(*) FROM information_schema.columns 
                 WHERE table_name = tablename AND table_schema = schemaname) as column_count
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
        `);
        
        // 获取每个表的行数
        const tables = await Promise.all(
            result.rows.map(async (table) => {
                try {
                    const countResult = await db.query(
                        `SELECT COUNT(*) as rowcount FROM "${table.tablename}"`
                    );
                    return {
                        ...table,
                        rowcount: parseInt(countResult.rows[0].rowcount)
                    };
                } catch (error) {
                    return { ...table, rowcount: 0 };
                }
            })
        );
        
        res.json({ 
            success: true, 
            tables 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * 创建数据表
 */
app.post('/api/tables', async (req, res) => {
    try {
        if (!db) {
            throw new Error('未连接到数据库');
        }
        
        const { name, columns } = req.body;
        
        if (!name || !columns) {
            throw new Error('表名称和列定义不能为空');
        }
        
        await db.query(`CREATE TABLE "${name}" (${columns})`);
        
        res.json({ 
            success: true, 
            message: `数据表 "${name}" 创建成功` 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * 删除数据表
 */
app.delete('/api/tables/:name', async (req, res) => {
    try {
        if (!db) {
            throw new Error('未连接到数据库');
        }
        
        const { name } = req.params;
        
        await db.query(`DROP TABLE "${name}"`);
        
        res.json({ 
            success: true, 
            message: `数据表 "${name}" 已删除` 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * 获取表数据
 */
app.get('/api/tables/:name/data', async (req, res) => {
    try {
        if (!db) {
            throw new Error('未连接到数据库');
        }
        
        const { name } = req.params;
        const limit = req.query.limit || 100;
        
        const result = await db.query(`SELECT * FROM "${name}" LIMIT ${limit}`);
        
        res.json({ 
            success: true, 
            rows: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * 获取表结构
 */
app.get('/api/tables/:name/structure', async (req, res) => {
    try {
        if (!db) {
            throw new Error('未连接到数据库');
        }
        
        const { name } = req.params;
        
        const result = await db.query(`
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default,
                character_maximum_length
            FROM information_schema.columns
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
        `, [name]);
        
        res.json({ 
            success: true, 
            columns: result.rows 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * 执行SQL查询
 */
app.post('/api/query', async (req, res) => {
    try {
        if (!db) {
            throw new Error('未连接到数据库');
        }
        
        const { sql } = req.body;
        
        if (!sql) {
            throw new Error('SQL语句不能为空');
        }
        
        const startTime = Date.now();
        const result = await db.query(sql);
        const duration = Date.now() - startTime;
        
        res.json({ 
            success: true, 
            rows: result.rows || [],
            rowCount: result.rowCount,
            command: result.command,
            duration
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * 导出表数据
 */
app.post('/api/export', async (req, res) => {
    try {
        if (!db) {
            throw new Error('未连接到数据库');
        }
        
        const { table, format } = req.body;
        
        if (!table) {
            throw new Error('请选择要导出的表');
        }
        
        const result = await db.query(`SELECT * FROM "${table}"`);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        
        let data = '';
        let filename = '';
        
        switch (format) {
            case 'csv':
                // CSV格式
                if (result.rows.length > 0) {
                    const columns = Object.keys(result.rows[0]);
                    data = columns.join(',') + '\n';
                    data += result.rows.map(row => 
                        columns.map(col => {
                            const value = row[col];
                            if (value === null) return '';
                            if (typeof value === 'string' && value.includes(',')) {
                                return `"${value.replace(/"/g, '""')}"`;
                            }
                            return value;
                        }).join(',')
                    ).join('\n');
                }
                filename = `${table}_${timestamp}.csv`;
                break;
                
            case 'sql':
                // SQL格式
                if (result.rows.length > 0) {
                    const columns = Object.keys(result.rows[0]);
                    data = `-- Export of table: ${table}\n`;
                    data += `-- Timestamp: ${new Date().toISOString()}\n\n`;
                    data += result.rows.map(row => {
                        const values = columns.map(col => {
                            const value = row[col];
                            if (value === null) return 'NULL';
                            if (typeof value === 'string') {
                                return `'${value.replace(/'/g, "''")}'`;
                            }
                            return value;
                        }).join(', ');
                        return `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values});`;
                    }).join('\n');
                }
                filename = `${table}_${timestamp}.sql`;
                break;
                
            case 'json':
                // JSON格式
                data = JSON.stringify(result.rows, null, 2);
                filename = `${table}_${timestamp}.json`;
                break;
                
            default:
                throw new Error('不支持的导出格式');
        }
        
        res.json({ 
            success: true, 
            data,
            filename,
            rowCount: result.rows.length
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ==================== 服务器启动 ====================

app.listen(PORT, () => {
    console.log(`\n🚀 PostgreSQL Web管理工具已启动`);
    console.log(`📡 服务器地址: http://localhost:${PORT}`);
    console.log(`🌐 请在浏览器中打开上述地址\n`);
});

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n\n正在关闭服务器...');
    if (db) {
        await db.disconnect();
    }
    process.exit(0);
});