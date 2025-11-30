# PostgreSQL Web管理工具

一个现代化的Web端PostgreSQL数据库管理系统，提供直观的可视化界面。

## 功能特性

### 🗄️ 数据库管理

- 查看所有数据库列表
- 创建新数据库
- 删除数据库
- 在数据库之间快速切换

### 📋 数据表管理

- 查看所有数据表及行数统计
- 查看表结构详情
- 浏览表数据
- 创建新数据表
- 删除数据表

### ⚡ SQL查询执行

- 在线SQL编辑器
- 实时执行查询
- 格式化结果展示
- 性能计时显示

### 📤 数据导出

- 支持导出为CSV格式
- 支持导出为SQL格式
- 支持导出为JSON格式
- 自动添加时间戳

## 安装步骤

1. 确保已安装依赖：

```bash
npm install
```

2. 安装Web服务器所需的额外依赖：

```bash
npm install express cors
```

## 使用方法

### 启动Web服务器

```bash
npm run web
```

或使用开发模式（自动重载）：

```bash
npm run web:dev
```

### 访问Web界面

启动服务器后，在浏览器中访问：

```
http://localhost:3000
```

### 连接数据库

1. 在Web界面的连接配置面板中填写数据库信息：
   - 主机地址（默认：localhost）
   - 端口（默认：5432）
   - 用户名（默认：postgres）
   - 密码
   - 数据库名（默认：postgres）

2. 点击"连接数据库"按钮

3. 连接成功后即可使用所有管理功能

## 界面预览

### 主要功能区域

- **顶部导航栏**：显示连接状态
- **左侧菜单**：功能导航和当前数据库显示
- **主内容区**：
  - 数据库管理
  - 数据表管理
  - SQL查询编辑器
  - 数据导出工具

## API接口说明

Web服务器提供以下REST API接口：

### 连接管理

- `POST /api/connect` - 连接数据库
- `POST /api/switch-database` - 切换数据库

### 数据库操作

- `GET /api/databases` - 获取数据库列表
- `POST /api/databases` - 创建数据库
- `DELETE /api/databases/:name` - 删除数据库

### 数据表操作

- `GET /api/tables` - 获取表列表
- `POST /api/tables` - 创建表
- `DELETE /api/tables/:name` - 删除表
- `GET /api/tables/:name/data` - 获取表数据
- `GET /api/tables/:name/structure` - 获取表结构

### 查询和导出

- `POST /api/query` - 执行SQL查询
- `POST /api/export` - 导出表数据

## 技术栈

### 前端

- 原生HTML5
- CSS3（响应式设计）
- 原生JavaScript（ES6+）

### 后端

- Node.js
- Express.js
- PostgreSQL (pg)

## 项目结构

```
PostgreSQL_TOOL - web/
├── public/              # Web前端文件
│   ├── index.html      # 主页面
│   ├── styles.css      # 样式文件
│   └── app.js          # 前端JavaScript
├── src/
│   ├── server.js       # Web服务器
│   ├── db.js           # 数据库连接类
│   ├── index.js        # CLI入口（原有）
│   ├── menu.js         # CLI菜单（原有）
│   ├── utils.js        # 工具函数
│   └── i18n.js         # 国际化
├── package.json
└── README_WEB.md       # Web版说明文档
```

## 安全注意事项

⚠️ **重要提醒**：

1. **本地使用**：此工具建议仅在本地开发环境使用
2. **生产环境**：不建议直接暴露到公网，需要添加身份验证
3. **数据库权限**：使用具有适当权限的数据库账户
4. **SQL注入**：虽然使用了参数化查询，但在执行自定义SQL时仍需谨慎

## 命令对比

### CLI模式（原有功能）

```bash
npm start      # 命令行交互模式
npm run dev    # 开发模式（自动重载）
```

### Web模式（新增功能）

```bash
npm run web       # Web服务器模式
npm run web:dev   # Web开发模式（自动重载）
```

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 常见问题

### Q: 如何更改Web服务器端口？

A: 在启动命令前设置环境变量：

```bash
PORT=8080 npm run web
```

### Q: 连接失败怎么办？

A: 请检查：

1. PostgreSQL服务是否运行
2. 连接信息是否正确
3. 网络是否可达
4. 防火墙设置

### Q: 可以同时运行CLI和Web版本吗？

A: 可以，它们使用不同的入口文件，互不干扰

## 开发计划

- [ ] 添加用户认证
- [ ] 支持多数据库连接
- [ ] SQL语法高亮
- [ ] 查询历史记录
- [ ] 数据可视化图表
- [ ] 批量操作功能

## 许可证

MIT

## 贡献

欢迎提交问题和功能请求！
