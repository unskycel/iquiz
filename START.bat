@echo off
echo ========================================
echo iQuiz - 你的资料习题
echo ========================================
echo.

echo 1. 检查 Node.js...
node --version
if %errorlevel% neq 0 (
    echo 错误: 请先安装 Node.js
    pause
    exit /b 1
)

echo.
echo 2. 安装依赖...
call npm install
if %errorlevel% neq 0 (
    echo 错误: 依赖安装失败
    pause
    exit /b 1
)

echo.
echo 3. 检查环境变量...
if not exist .env.local (
    echo 警告: 未找到 .env.local 文件
    echo 请复制 .env.example 并配置 Supabase 信息
)

echo.
echo 4. 启动开发服务器...
echo 访问 http://localhost:3000
echo.
call npm run dev

pause