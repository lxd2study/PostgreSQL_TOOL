// 全局状态管理
const state = {
    connected: false,
    currentDatabase: null,
    connectionConfig: null
};

// API基础URL
const API_BASE = '';

// ==================== 工具函数 ====================

/**
 * 显示通知消息
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * 发送API请求
 */
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '请求失败');
        }
        
        return data;
    } catch (error) {
        showNotification(error.message, 'error');
        throw error;
    }
}

// ==================== 连接管理 ====================

/**
 * 连接数据库表单提交
 */
document.getElementById('connectionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const config = {
        host: document.getElementById('dbHost').value,
        port: parseInt(document.getElementById('dbPort').value),
        user: document.getElementById('dbUser').value,
        password: document.getElementById('dbPassword').value,
        database: document.getElementById('dbName').value
    };
    
    const rememberMe = document.getElementById('rememberMe').checked;
    
    try {
        const result = await apiRequest('/api/connect', {
            method: 'POST',
            body: JSON.stringify(config)
        });
        
        state.connected = true;
        state.currentDatabase = config.database;
        state.connectionConfig = config;
        
        // 本地存储逻辑
        if (rememberMe) {
            localStorage.setItem('pg_admin_config', JSON.stringify({
                host: config.host,
                port: config.port,
                user: config.user,
                database: config.database
                // 不存储密码，出于安全考虑
            }));
            localStorage.setItem('pg_admin_remember', 'true');
        } else {
            localStorage.removeItem('pg_admin_config');
            localStorage.removeItem('pg_admin_remember');
        }
        
        // 更新UI状态
        document.getElementById('configPanel').style.display = 'none';
        document.getElementById('sidebar').style.display = 'flex';
        document.getElementById('mainContent').style.display = 'flex';
        document.getElementById('connectionStatus').textContent = '已连接';
        document.getElementById('statusIndicator').classList.add('connected');
        document.getElementById('currentDbName').textContent = config.database;
        
        showNotification('数据库连接成功！', 'success');
        
        // 加载初始数据
        loadDatabases();
    } catch (error) {
        showNotification('连接失败: ' + error.message, 'error');
    }
});

// 初始化时检查本地存储
window.addEventListener('DOMContentLoaded', () => {
    const savedConfig = localStorage.getItem('pg_admin_config');
    const remember = localStorage.getItem('pg_admin_remember');
    
    if (remember === 'true' && savedConfig) {
        const config = JSON.parse(savedConfig);
        document.getElementById('dbHost').value = config.host || 'localhost';
        document.getElementById('dbPort').value = config.port || 5432;
        document.getElementById('dbUser').value = config.user || 'postgres';
        document.getElementById('dbName').value = config.database || 'postgres';
        document.getElementById('rememberMe').checked = true;
    }
});

// ==================== 标签页切换 ====================

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const tabName = item.dataset.tab;
        
        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
        
        // 加载对应数据
        switch(tabName) {
            case 'databases':
                loadDatabases();
                break;
            case 'tables':
                loadTables();
                break;
            case 'export':
                loadTablesForExport();
                break;
        }
    });
});

// ==================== 数据库操作 ====================

/**
 * 加载数据库列表
 */
async function loadDatabases() {
    const tbody = document.getElementById('databasesTableBody');
    tbody.innerHTML = '<tr><td colspan="4" class="loading">加载中...</td></tr>';
    
    try {
        const result = await apiRequest('/api/databases');
        
        if (result.databases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading">没有数据库</td></tr>';
            return;
        }
        
        tbody.innerHTML = result.databases.map(db => `
            <tr>
                <td><strong>${db.datname}</strong></td>
                <td>${db.owner}</td>
                <td>${db.encoding}</td>
                <td class="actions">
                    <button class="btn btn-primary" onclick="switchDatabase('${db.datname}')">切换</button>
                    <button class="btn btn-danger" onclick="dropDatabase('${db.datname}')" 
                        ${['postgres', 'template0', 'template1'].includes(db.datname) ? 'disabled' : ''}>
                        删除
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">加载失败</td></tr>';
    }
}

/**
 * 显示创建数据库模态框
 */
function showCreateDatabaseModal() {
    document.getElementById('createDatabaseModal').classList.add('show');
    document.getElementById('newDbName').value = '';
}

/**
 * 创建数据库
 */
async function createDatabase() {
    const dbName = document.getElementById('newDbName').value.trim();
    
    if (!dbName) {
        showNotification('请输入数据库名称', 'warning');
        return;
    }
    
    try {
        await apiRequest('/api/databases', {
            method: 'POST',
            body: JSON.stringify({ name: dbName })
        });
        
        showNotification('数据库创建成功！', 'success');
        closeModal('createDatabaseModal');
        loadDatabases();
    } catch (error) {
        showNotification('创建失败: ' + error.message, 'error');
    }
}

/**
 * 切换数据库
 */
async function switchDatabase(dbName) {
    if (!confirm(`确定要切换到数据库 "${dbName}" 吗？`)) {
        return;
    }
    
    try {
        await apiRequest('/api/switch-database', {
            method: 'POST',
            body: JSON.stringify({ database: dbName })
        });
        
        state.currentDatabase = dbName;
        document.getElementById('currentDbName').textContent = dbName;
        showNotification(`已切换到数据库: ${dbName}`, 'success');
        
        // 如果在表管理页面，重新加载表列表
        if (document.getElementById('tables').classList.contains('active')) {
            loadTables();
        }
    } catch (error) {
        showNotification('切换失败: ' + error.message, 'error');
    }
}

/**
 * 删除数据库
 */
async function dropDatabase(dbName) {
    if (!confirm(`⚠️ 警告：确定要删除数据库 "${dbName}" 吗？此操作不可恢复！`)) {
        return;
    }
    
    try {
        await apiRequest(`/api/databases/${dbName}`, {
            method: 'DELETE'
        });
        
        showNotification('数据库已删除', 'success');
        loadDatabases();
    } catch (error) {
        showNotification('删除失败: ' + error.message, 'error');
    }
}

// ==================== 数据表操作 ====================

/**
 * 加载数据表列表
 */
async function loadTables() {
    const tbody = document.getElementById('tablesTableBody');
    tbody.innerHTML = '<tr><td colspan="3" class="loading">加载中...</td></tr>';
    
    try {
        const result = await apiRequest('/api/tables');
        
        if (result.tables.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="loading">当前数据库没有表</td></tr>';
            return;
        }
        
        tbody.innerHTML = result.tables.map(table => `
            <tr>
                <td><strong>${table.tablename}</strong></td>
                <td>${table.rowcount || 0}</td>
                <td class="actions">
                    <button class="btn btn-primary" onclick="viewTableData('${table.tablename}')">查看数据</button>
                    <button class="btn btn-secondary" onclick="describeTable('${table.tablename}')">查看结构</button>
                    <button class="btn btn-danger" onclick="dropTable('${table.tablename}')">删除</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="3" class="loading">加载失败</td></tr>';
    }
}

/**
 * 显示创建表模态框
 */
function showCreateTableModal() {
    document.getElementById('createTableModal').classList.add('show');
    document.getElementById('newTableName').value = '';
    document.getElementById('tableColumns').value = '';
}

/**
 * 创建数据表
 */
async function createTable() {
    const tableName = document.getElementById('newTableName').value.trim();
    const columns = document.getElementById('tableColumns').value.trim();
    
    if (!tableName || !columns) {
        showNotification('请填写所有字段', 'warning');
        return;
    }
    
    try {
        await apiRequest('/api/tables', {
            method: 'POST',
            body: JSON.stringify({ name: tableName, columns })
        });
        
        showNotification('数据表创建成功！', 'success');
        closeModal('createTableModal');
        loadTables();
    } catch (error) {
        showNotification('创建失败: ' + error.message, 'error');
    }
}

/**
 * 查看表数据
 */
async function viewTableData(tableName) {
    document.getElementById('viewDataTableName').textContent = tableName;
    document.getElementById('viewDataModal').classList.add('show');
    
    const container = document.getElementById('viewDataContainer');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const result = await apiRequest(`/api/tables/${tableName}/data`);
        
        if (result.rows.length === 0) {
            container.innerHTML = '<p class="empty-state">表中没有数据</p>';
            return;
        }
        
        const columns = Object.keys(result.rows[0]);
        const table = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${result.rows.map(row => `
                            <tr>${columns.map(col => `<td>${row[col] !== null ? row[col] : '<em>NULL</em>'}</td>`).join('')}</tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = table;
    } catch (error) {
        container.innerHTML = '<p class="empty-state">加载失败</p>';
    }
}

/**
 * 查看表结构
 */
async function describeTable(tableName) {
    document.getElementById('describeTableName').textContent = tableName;
    document.getElementById('describeTableModal').classList.add('show');
    
    const container = document.getElementById('describeTableContainer');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const result = await apiRequest(`/api/tables/${tableName}/structure`);
        
        const table = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>列名</th>
                            <th>数据类型</th>
                            <th>可空</th>
                            <th>默认值</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${result.columns.map(col => `
                            <tr>
                                <td><strong>${col.column_name}</strong></td>
                                <td>${col.data_type}</td>
                                <td>${col.is_nullable === 'YES' ? '是' : '否'}</td>
                                <td>${col.column_default || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = table;
    } catch (error) {
        container.innerHTML = '<p class="empty-state">加载失败</p>';
    }
}

/**
 * 删除数据表
 */
async function dropTable(tableName) {
    if (!confirm(`⚠️ 警告：确定要删除数据表 "${tableName}" 吗？此操作不可恢复！`)) {
        return;
    }
    
    try {
        await apiRequest(`/api/tables/${tableName}`, {
            method: 'DELETE'
        });
        
        showNotification('数据表已删除', 'success');
        loadTables();
    } catch (error) {
        showNotification('删除失败: ' + error.message, 'error');
    }
}

// ==================== SQL查询 ====================

/**
 * 插入SQL模板
 */
function insertSql(sql) {
    const editor = document.getElementById('sqlEditor');
    editor.value = sql;
    editor.focus();
}

/**
 * 执行SQL查询
 */
async function executeQuery() {
    const sql = document.getElementById('sqlEditor').value.trim();
    
    if (!sql) {
        showNotification('请输入SQL查询语句', 'warning');
        return;
    }
    
    const container = document.getElementById('queryResultsContainer');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const result = await apiRequest('/api/query', {
            method: 'POST',
            body: JSON.stringify({ sql })
        });
        
        if (result.command === 'SELECT' && result.rows.length > 0) {
            const columns = Object.keys(result.rows[0]);
            const table = `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${result.rows.map(row => `
                                <tr>${columns.map(col => `<td>${row[col] !== null ? row[col] : '<em>NULL</em>'}</td>`).join('')}</tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <p style="margin-top: 10px; color: #6c757d;">
                    查询返回 ${result.rows.length} 行数据，耗时 ${result.duration}ms
                </p>
            `;
            container.innerHTML = table;
        } else {
            container.innerHTML = `
                <p class="empty-state">
                    ✅ 查询执行成功<br>
                    命令: ${result.command}<br>
                    影响行数: ${result.rowCount || 0}<br>
                    耗时: ${result.duration}ms
                </p>
            `;
        }
        
        showNotification('查询执行成功', 'success');
    } catch (error) {
        container.innerHTML = `<p class="empty-state" style="color: var(--danger-color);">❌ ${error.message}</p>`;
    }
}

/**
 * 清空查询编辑器
 */
function clearQuery() {
    document.getElementById('sqlEditor').value = '';
    document.getElementById('queryResultsContainer').innerHTML = '<p class="empty-state">执行查询后结果将显示在这里</p>';
}

// ==================== 数据导出 ====================

/**
 * 加载表列表到导出选择器
 */
async function loadTablesForExport() {
    const select = document.getElementById('exportTable');
    select.innerHTML = '<option value="">-- 请选择表 --</option>';
    
    try {
        const result = await apiRequest('/api/tables');
        result.tables.forEach(table => {
            const option = document.createElement('option');
            option.value = table.tablename;
            option.textContent = table.tablename;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('加载表列表失败:', error);
    }
}

/**
 * 导出表数据
 */
async function exportTableData() {
    const tableName = document.getElementById('exportTable').value;
    const format = document.getElementById('exportFormat').value;
    
    if (!tableName) {
        showNotification('请选择要导出的表', 'warning');
        return;
    }
    
    try {
        const result = await apiRequest('/api/export', {
            method: 'POST',
            body: JSON.stringify({ table: tableName, format })
        });
        
        // 触发文件下载
        const blob = new Blob([result.data], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        a.click();
        window.URL.revokeObjectURL(url);
        
        showNotification('数据导出成功！', 'success');
    } catch (error) {
        showNotification('导出失败: ' + error.message, 'error');
    }
}

// ==================== 模态框控制 ====================

/**
 * 关闭模态框
 */
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// 点击模态框背景关闭
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});