@echo off
chcp 65001 >nul
echo ================================================
echo 🏗️ 建筑项目展示系统 - 应用启动器
echo ================================================
echo.

:: 获取当前目录和文件路径
set "CURRENT_DIR=%~dp0"
set "INDEX_FILE=%CURRENT_DIR%index.html"
set "TEST_FILE=%CURRENT_DIR%test.html"

echo 📁 项目位置: %CURRENT_DIR%
echo 📄 主文件: index.html
echo.

echo 🔍 正在检测可用的启动方法...
echo.

:: 检查Python
echo [1/4] 检测Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Python 可用
    goto :start_python
) else (
    echo ❌ Python 未安装
)

:: 检查Node.js
echo [2/4] 检测Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js 可用
    goto :start_node
) else (
    echo ❌ Node.js 未安装
)

:: 检查Chrome
echo [3/4] 检测Chrome浏览器...
set "CHROME_PATH="
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

if not "%CHROME_PATH%"=="" (
    echo ✅ Chrome 可用
    goto :start_chrome
) else (
    echo ❌ Chrome 未找到
)

:: 检查Edge
echo [4/4] 检测Microsoft Edge...
set "EDGE_PATH="
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set "EDGE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    set "EDGE_PATH=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

if not "%EDGE_PATH%"=="" (
    echo ✅ Edge 可用
    goto :start_edge
) else (
    echo ❌ Edge 未找到
)

:: 如果都没找到
goto :no_solution

:start_python
echo.
echo 🚀 使用Python启动Web服务器...
echo.
cd /d "%CURRENT_DIR%"
echo 服务器地址: http://localhost:8080
echo 按 Ctrl+C 停止服务器
echo.
start "" http://localhost:8080
python -m http.server 8080
goto :end

:start_node
echo.
echo 🚀 使用Node.js启动Web服务器...
echo.
cd /d "%CURRENT_DIR%"
echo 服务器地址: http://localhost:8080
echo 按 Ctrl+C 停止服务器
echo.
start "" http://localhost:8080
node server.js
goto :end

:start_chrome
echo.
echo 🚀 使用Chrome开发模式启动...
echo.
set "TEMP_USER_DATA=%TEMP%\chrome_dev_%RANDOM%"
echo 创建临时用户数据目录: %TEMP_USER_DATA%
mkdir "%TEMP_USER_DATA%" >nul 2>&1

echo 启动Chrome开发模式...
echo.
echo ⚠️  安全提醒: 此模式会降低浏览器安全性，仅用于开发测试
echo.

start "" "%CHROME_PATH%" --disable-web-security --user-data-dir="%TEMP_USER_DATA%" --allow-file-access-from-files --disable-features=VizDisplayCompositor "%INDEX_FILE%"

echo ✅ Chrome已启动！
echo.
echo 📋 使用说明:
echo 1. 如果看到安全警告，点击继续
echo 2. 先访问测试页面验证功能
echo 3. 使用完毕后请关闭Chrome窗口
echo.
echo 🧪 要先运行测试吗？(y/n)
set /p choice="请选择: "
if /i "%choice%"=="y" (
    start "" "%CHROME_PATH%" --disable-web-security --user-data-dir="%TEMP_USER_DATA%" --allow-file-access-from-files --disable-features=VizDisplayCompositor "%TEST_FILE%"
)
goto :end

:start_edge
echo.
echo 🚀 使用Microsoft Edge开发模式启动...
echo.
set "TEMP_USER_DATA=%TEMP%\edge_dev_%RANDOM%"
echo 创建临时用户数据目录: %TEMP_USER_DATA%
mkdir "%TEMP_USER_DATA%" >nul 2>&1

echo 启动Edge开发模式...
echo.
echo ⚠️  安全提醒: 此模式会降低浏览器安全性，仅用于开发测试
echo.

start "" "%EDGE_PATH%" --disable-web-security --user-data-dir="%TEMP_USER_DATA%" --allow-file-access-from-files --disable-features=VizDisplayCompositor "%INDEX_FILE%"

echo ✅ Edge已启动！
echo.
echo 📋 使用说明:
echo 1. 如果看到安全警告，点击继续
echo 2. 先访问测试页面验证功能
echo 3. 使用完毕后请关闭Edge窗口
echo.
echo 🧪 要先运行测试吗？(y/n)
set /p choice="请选择: "
if /i "%choice%"=="y" (
    start "" "%EDGE_PATH%" --disable-web-security --user-data-dir="%TEMP_USER_DATA%" --allow-file-access-from-files --disable-features=VizDisplayCompositor "%TEST_FILE%"
)
goto :end

:no_solution
echo.
echo ❌ 未找到可用的启动方法！
echo.
echo 💡 解决方案:
echo.
echo 【推荐】安装Python (最简单):
echo 1. 访问: https://www.python.org/downloads/
echo 2. 下载Python 3.x并安装
echo 3. 安装时勾选 "Add Python to PATH"
echo 4. 重启电脑后重新运行此脚本
echo.
echo 【备选】安装Node.js:
echo 1. 访问: https://nodejs.org/
echo 2. 下载LTS版本并安装
echo 3. 重启电脑后重新运行此脚本
echo.
echo 【临时】手动启动Chrome/Edge:
echo 1. 完全关闭浏览器
echo 2. 创建浏览器快捷方式
echo 3. 右键快捷方式 → 属性
echo 4. 在目标后添加: --disable-web-security --user-data-dir="C:\temp\browser_dev"
echo 5. 使用此快捷方式打开 index.html
echo.
goto :end

:end
echo.
echo 按任意键退出...
pause >nul


