# iQuiz - 你的资料习题

iQuiz 是一款 Web 应用程序，允许用户手动创建各种类型的习题，进行答题练习，并跟踪学习进度。

## 功能特点

- **多题型支持**: 单选题、多选题、判断题、填空题、简答题
- **习题管理**: 创建、编辑、删除习题
- **答题界面**: 交互式答题体验，支持计时和进度跟踪
- **自动评分**: 答题后自动计算分数
- **答题历史**: 查看历史答题记录和成绩统计
- **PDF 导出**: 将习题和答题结果导出为 PDF
- **参考资料**: 上传 PDF/图片作为学习资料
- **跨设备同步**: 通过用户账户实现多设备数据同步

## 技术栈

- **前端**: Astro + React
- **样式**: Tailwind CSS
- **后端**: Astro API Routes
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **文件存储**: Supabase Storage
- **离线支持**: Dexie.js (IndexedDB)

## 项目结构

```
iquiz/
├── public/              # 静态资源
├── src/
│   ├── api/             # API 路由
│   ├── components/
│   │   ├── react/       # React 组件
│   │   └── astro/       # Astro 组件
│   ├── layouts/         # 页面布局
│   ├── pages/           # 页面文件
│   ├── lib/             # 工具函数
│   ├── types/           # TypeScript 类型
│   └── styles/          # 样式文件
├── supabase/
│   └── migrations/      # 数据库迁移
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. 设置 Supabase

1. 创建 Supabase 项目
2. 运行 `supabase/migrations/001_initial.sql` 创建数据库表
3. 在 Supabase Storage 中创建 `reference-materials` bucket

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## API 路由

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 获取当前用户

### 习题
- `GET /api/quizzes` - 获取习题列表
- `POST /api/quizzes` - 创建习题
- `GET /api/quizzes/[id]` - 获取习题详情
- `PUT /api/quizzes/[id]` - 更新习题
- `DELETE /api/quizzes/[id]` - 删除习题

### 题目
- `GET /api/quizzes/[id]/questions` - 获取题目列表
- `POST /api/quizzes/[id]/questions` - 添加题目
- `PUT /api/quizzes/[id]/questions/[qid]` - 更新题目
- `DELETE /api/quizzes/[id]/questions/[qid]` - 删除题目

### 答题
- `POST /api/attempts` - 开始答题
- `GET /api/attempts/[id]` - 获取答题详情
- `PUT /api/attempts/[id]/answer` - 提交答案
- `POST /api/attempts/[id]/complete` - 完成答题
- `GET /api/attempts/history` - 获取答题历史

### 文件
- `POST /api/files/upload` - 上传文件
- `DELETE /api/files/[id]` - 删除文件

### 导出
- `GET /api/export/quiz/[id].pdf` - 导出习题 PDF
- `GET /api/export/attempts/[id].pdf` - 导出答题结果 PDF

## 数据模型

- **User**: 用户信息
- **Quiz**: 习题
- **Question**: 题目
- **QuestionOption**: 选项
- **QuizAttempt**: 答题记录
- **AttemptAnswer**: 答案
- **ReferenceMaterial**: 参考资料

## 开发说明

### 添加新题型

1. 在 `src/types/index.ts` 中添加新的 `QuestionType`
2. 在 `src/components/react/QuestionForm.tsx` 中添加题型编辑器
3. 在 `src/components/react/QuizRunner.tsx` 中添加答题界面
4. 在 `src/lib/scoring.ts` 中添加评分逻辑

### 自定义主题

编辑 `tailwind.config.mjs` 和 `src/styles/global.css` 中的 CSS 变量。

## 许可证

MIT