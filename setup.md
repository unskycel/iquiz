# iQuiz 设置指南

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase

1. 访问 [Supabase](https://supabase.com) 并创建新项目
2. 获取项目 URL 和 API 密钥
3. 创建 `.env.local` 文件:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. 设置数据库

1. 在 Supabase 控制台中，进入 SQL Editor
2. 运行 `supabase/migrations/001_initial.sql` 中的 SQL 语句

### 4. 设置存储

1. 在 Supabase 控制台中，进入 Storage
2. 创建名为 `reference-materials` 的 bucket
3. 设置 bucket 为 public（用于访问上传的文件）

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 功能说明

### 用户功能

1. **注册/登录**: 支持邮箱密码注册和登录
2. **创建习题**: 创建包含多种题型的习题
3. **答题**: 交互式答题界面，支持计时
4. **查看结果**: 答题后查看详细结果和解析
5. **答题历史**: 查看历史答题记录
6. **导出 PDF**: 将习题和结果导出为 PDF

### 题型支持

- 单选题
- 多选题
- 判断题
- 填空题
- 简答题

### 管理功能

- 习题 CRUD 操作
- 题目拖拽排序
- 参考资料上传
- 习题发布/取消发布
- 习题复制

## 技术细节

### 前端

- **Astro**: 静态站点生成，优化性能
- **React**: 交互式组件
- **Tailwind CSS**: 样式框架
- **DndKit**: 拖拽排序

### 后端

- **Supabase**: 
  - PostgreSQL 数据库
  - 用户认证
  - 文件存储
  - 实时订阅（可选）

### 数据安全

- 行级安全策略 (RLS)
- 用户只能访问自己的数据
- 公开发布的习题可被任何人查看

## 部署

### Vercel 部署

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

### 其他平台

项目支持任何支持 Node.js 的平台，包括：
- Netlify
- Railway
- Render
- 自托管服务器

## 常见问题

### Q: 如何重置数据库？

A: 在 Supabase SQL Editor 中重新运行迁移文件。

### Q: 如何添加新的题型？

A: 
1. 在 `src/types/index.ts` 中添加新类型
2. 在 `QuestionForm.tsx` 中添加编辑器
3. 在 `QuizRunner.tsx` 中添加答题界面
4. 在 `scoring.ts` 中添加评分逻辑

### Q: 如何自定义样式？

A: 编辑 `tailwind.config.mjs` 和 `src/styles/global.css`。

## 支持

如有问题，请查看：
- [Supabase 文档](https://supabase.com/docs)
- [Astro 文档](https://docs.astro.build)
- [React 文档](https://react.dev)