const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = 8080;

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.csv': 'text/csv'
};

const server = http.createServer((req, res) => {
    // 解析请求URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // 如果是根路径，重定向到index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // 构建文件路径
    const filePath = path.join(__dirname, pathname);
    
    // 获取文件扩展名
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    // 检查文件是否存在
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // 文件不存在，返回404
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <html>
                    <head><title>404 - 文件未找到</title></head>
                    <body>
                        <h1>404 - 文件未找到</h1>
                        <p>请求的文件 <strong>${pathname}</strong> 不存在。</p>
                        <p><a href="/">返回首页</a></p>
                    </body>
                </html>
            `);
            console.log(`404: ${pathname}`);
            return;
        }
        
        // 读取并返回文件
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <html>
                        <head><title>500 - 服务器错误</title></head>
                        <body>
                            <h1>500 - 服务器内部错误</h1>
                            <p>读取文件时发生错误。</p>
                        </body>
                    </html>
                `);
                console.log(`500: ${err.message}`);
                return;
            }
            
            // 设置CORS头部，允许跨域访问
            res.writeHead(200, {
                'Content-Type': `${mimeType}; charset=utf-8`,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
            });
            
            res.end(data);
            console.log(`200: ${pathname}`);
        });
    });
});

server.listen(port, () => {
    console.log('='.repeat(50));
    console.log('🚀 建筑项目展示系统 - 本地服务器');
    console.log('='.repeat(50));
    console.log(`📍 服务器地址: http://localhost:${port}`);
    console.log(`📁 根目录: ${__dirname}`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));
    console.log('📋 可用页面:');
    console.log(`   主应用: http://localhost:${port}/index.html`);
    console.log(`   功能测试: http://localhost:${port}/test.html`);
    console.log('='.repeat(50));
    console.log('💡 提示: 按 Ctrl+C 停止服务器');
    console.log('');
    
    // 自动打开浏览器（Windows）
    if (process.platform === 'win32') {
        const { exec } = require('child_process');
        exec(`start http://localhost:${port}`);
    }
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n\n🛑 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

// 错误处理
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ 错误: 端口 ${port} 已被占用`);
        console.log('💡 解决方案:');
        console.log('   1. 关闭占用端口的程序');
        console.log('   2. 或者修改 server.js 中的端口号');
        console.log('   3. 或者使用命令: netstat -ano | findstr :8080');
    } else {
        console.error('❌ 服务器错误:', err);
    }
    process.exit(1);
});


