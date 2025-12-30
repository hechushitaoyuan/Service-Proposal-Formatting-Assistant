@echo off
echo ============================================
echo 建筑项目展示系统 - Chrome无安全模式启动
echo ============================================
echo.
echo 正在启动Chrome无安全模式...
echo 注意: 此模式仅用于开发测试，会降低浏览器安全性
echo.

:: 获取当前目录
set "CURRENT_DIR=%~dp0"
set "INDEX_FILE=%CURRENT_DIR%index.html"

:: 创建临时用户数据目录
set "TEMP_USER_DATA=%TEMP%\chrome_dev_temp"
if not exist "%TEMP_USER_DATA%" mkdir "%TEMP_USER_DATA%"

:: 查找Chrome安装路径
set "CHROME_PATH="

:: 常见Chrome安装路径
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
) else if exist "%PROGRAMFILES%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=%PROGRAMFILES%\Google\Chrome\Application\chrome.exe"
)

if "%CHROME_PATH%"=="" (
    echo 错误: 未找到Chrome浏览器！
    echo.
    echo 请确保已安装Google Chrome浏览器
    echo 下载地址: https://www.google.com/chrome/
    echo.
    echo 或者尝试以下方法:
    echo 1. 安装Python: https://www.python.org/downloads/
    echo 2. 安装Node.js: https://nodejs.org/
    echo 3. 使用其他浏览器的开发者模式
    echo.
    pause
    exit /b 1
)

echo 找到Chrome: %CHROME_PATH%
echo 项目文件: %INDEX_FILE%
echo.
echo 启动参数说明:
echo --disable-web-security : 禁用跨域安全检查
echo --user-data-dir : 使用临时用户数据目录
echo --allow-file-access-from-files : 允许文件访问其他文件
echo.

:: 启动Chrome
echo 正在启动Chrome...
start "" "%CHROME_PATH%" --disable-web-security --user-data-dir="%TEMP_USER_DATA%" --allow-file-access-from-files --disable-features=VizDisplayCompositor "%INDEX_FILE%"

echo.
echo ✅ Chrome已启动！
echo.
echo 📋 使用说明:
echo 1. 如果看到安全警告，点击"仍要继续"
echo 2. 应用应该能正常加载和运行
echo 3. 使用完毕后请关闭此Chrome窗口
echo.
echo ⚠️  安全提醒:
echo - 此模式下的Chrome安全性较低
echo - 仅用于开发测试，不要用于日常浏览
echo - 使用完毕后请关闭此Chrome实例
echo.
echo 按任意键关闭此窗口...
pause >nul


