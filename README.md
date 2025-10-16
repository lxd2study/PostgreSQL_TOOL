# PostgreSQL Admin System

A powerful command-line interface for managing PostgreSQL databases with an intuitive menu system.

一个功能强大的 PostgreSQL 数据库管理命令行工具，具有直观的菜单系统。

[English](#english) | [中文](#中文)

---

## English

### Features

- Database Management
  - List all databases
  - Create new databases
  - Drop databases
  - Switch between databases

- Table Management
  - List all tables with row counts
  - Describe table structure
  - View table data
  - Create new tables
  - Drop tables

- Query Execution
  - Execute custom SQL queries
  - View query results in formatted tables
  - Performance timing

- Data Export
  - Export table data to CSV format
  - Export table data to SQL format
  - Automatic timestamping of export files

## Installation

1. Clone or download this project

2. Install dependencies:
```bash
cd pg_admin
npm install
```

3. Configure database connection:
```bash
cp .env.example .env
```

4. Edit `.env` file with your database credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=postgres
LANGUAGE=en  # Available: en (English), zh_CN (Simplified Chinese)
```

### Usage

Start the application:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### Language Support

The application supports multiple languages. To change the language, edit the `LANGUAGE` variable in your `.env` file:

```bash
LANGUAGE=zh_CN  # For Simplified Chinese
LANGUAGE=en     # For English
```

Supported languages:
- `en` - English (Default)
- `zh_CN` - Simplified Chinese (简体中文)

### Menu Structure

#### Main Menu
- Database Operations - Manage databases
- Table Operations - Manage tables
- Execute Query - Run custom SQL
- Export Data - Export table data
- Exit - Close application

#### Database Operations
- List Databases - Show all available databases
- Create Database - Create a new database
- Drop Database - Delete a database
- Switch Database - Change to another database

#### Table Operations
- List Tables - Show all tables with row counts
- Describe Table - View table structure
- View Table Data - Browse table records
- Create Table - Create a new table
- Drop Table - Delete a table

#### Query Execution
Execute any SQL query and view results in a formatted table.

#### Export Data
Export table data to CSV or SQL format. Files are saved in the `exports/` directory.

### Project Structure

```
pg_admin/
├── src/
│   ├── index.js      # Main entry point
│   ├── db.js         # Database connection class
│   ├── menu.js       # Menu handlers
│   ├── utils.js      # Utility functions
│   └── i18n.js       # Internationalization module
├── locales/          # Translation files
│   ├── en.json       # English translations
│   └── zh_CN.json    # Simplified Chinese translations
├── exports/          # Export directory
├── .env              # Configuration (not in git)
├── .env.example      # Configuration template
├── package.json      # Dependencies
└── README.md         # Documentation
```

### Requirements

- Node.js 18+
- PostgreSQL 12+
- Network access to PostgreSQL server

### Security Notes

- Never commit `.env` file to version control
- Use strong passwords for database connections
- Limit database user permissions appropriately
- Be careful when dropping databases or tables

### Examples

#### Creating a Table
1. Select "Table Operations" from main menu
2. Select "Create Table"
3. Enter table name: `users`
4. Enter columns: `id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(255) UNIQUE`

#### Executing a Query
1. Select "Execute Query" from main menu
2. Enter SQL: `SELECT * FROM users WHERE name LIKE '%John%'`
3. View formatted results

#### Exporting Data
1. Select "Export Data" from main menu
2. Choose table to export
3. Select format (CSV or SQL)
4. File saved to `exports/` directory

### Error Handling

The application includes comprehensive error handling:
- Connection failures are caught and reported
- Invalid queries show error messages
- Confirmation prompts for destructive operations

### License

MIT

### Contributing

Feel free to submit issues and enhancement requests!

---

## 中文

### 功能特性

- 数据库管理
  - 列出所有数据库
  - 创建新数据库
  - 删除数据库
  - 在数据库之间切换

- 数据表管理
  - 列出所有数据表及其行数
  - 查看表结构
  - 查看表数据
  - 创建新数据表
  - 删除数据表

- 查询执行
  - 执行自定义 SQL 查询
  - 在格式化的表格中查看查询结果
  - 性能计时

- 数据导出
  - 将表数据导出为 CSV 格式
  - 将表数据导出为 SQL 格式
  - 导出文件自动添加时间戳

### 安装

1. 克隆或下载此项目

2. 安装依赖：
```bash
cd pg_admin
npm install
```

3. 配置数据库连接：
```bash
cp .env.example .env
```

4. 编辑 `.env` 文件，填入你的数据库凭据：
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=postgres
LANGUAGE=zh_CN  # 可选：en (英文), zh_CN (简体中文)
```

### 使用方法

启动应用程序：
```bash
npm start
```

或者使用自动重载的开发模式：
```bash
npm run dev
```

### 语言支持

本应用程序支持多语言。要更改语言，请编辑 `.env` 文件中的 `LANGUAGE` 变量：

```bash
LANGUAGE=zh_CN  # 简体中文
LANGUAGE=en     # 英文
```

支持的语言：
- `en` - 英文（默认）
- `zh_CN` - 简体中文

### 菜单结构

#### 主菜单
- 数据库操作 - 管理数据库
- 数据表操作 - 管理数据表
- 执行查询 - 运行自定义 SQL
- 导出数据 - 导出表数据
- 退出 - 关闭应用程序

#### 数据库操作
- 列出数据库 - 显示所有可用数据库
- 创建数据库 - 创建一个新数据库
- 删除数据库 - 删除数据库
- 切换数据库 - 切换到另一个数据库

#### 数据表操作
- 列出数据表 - 显示所有数据表及其行数
- 查看表结构 - 查看表结构
- 查看表数据 - 浏览表记录
- 创建数据表 - 创建新数据表
- 删除数据表 - 删除数据表

#### 查询执行
执行任何 SQL 查询并在格式化的表格中查看结果。

#### 数据导出
将表数据导出为 CSV 或 SQL 格式。文件保存在 `exports/` 目录中。

### 项目结构

```
pg_admin/
├── src/
│   ├── index.js      # 主入口点
│   ├── db.js         # 数据库连接类
│   ├── menu.js       # 菜单处理器
│   ├── utils.js      # 工具函数
│   └── i18n.js       # 国际化模块
├── locales/          # 翻译文件
│   ├── en.json       # 英文翻译
│   └── zh_CN.json    # 简体中文翻译
├── exports/          # 导出目录
├── .env              # 配置文件（不包含在 git 中）
├── .env.example      # 配置模板
├── package.json      # 依赖项
└── README.md         # 文档
```

### 系统要求

- Node.js 18+
- PostgreSQL 12+
- 可以访问 PostgreSQL 服务器的网络连接

### 安全注意事项

- 切勿将 `.env` 文件提交到版本控制系统
- 为数据库连接使用强密码
- 适当限制数据库用户权限
- 删除数据库或表时要小心

### 使用示例

#### 创建表
1. 从主菜单选择"数据表操作"
2. 选择"创建数据表"
3. 输入表名：`users`
4. 输入列定义：`id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(255) UNIQUE`

#### 执行查询
1. 从主菜单选择"执行查询"
2. 输入 SQL：`SELECT * FROM users WHERE name LIKE '%John%'`
3. 查看格式化的结果

#### 导出数据
1. 从主菜单选择"导出数据"
2. 选择要导出的表
3. 选择格式（CSV 或 SQL）
4. 文件保存到 `exports/` 目录

### 错误处理

该应用程序包含全面的错误处理：
- 捕获并报告连接失败
- 显示无效查询的错误消息
- 为破坏性操作提供确认提示

### 许可证

MIT

### 贡献

欢迎提交问题和功能请求！
