/**
 * 主应用逻辑
 * 协调各个模块的工作
 */
class App {
    constructor() {
        this.isInitialized = false;
        this.currentProject = null;
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            this.showLoading('正在初始化应用...');
            
            // 初始化各个模块
            await this.initModules();
            
            // 绑定事件
            this.bindEvents();
            
            // 加载初始数据
            await this.loadInitialData();
            
            this.isInitialized = true;
            this.hideLoading();
            
            console.log('应用初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.hideLoading();
            this.showError('应用初始化失败，请刷新页面重试');
        }
    }

    /**
     * 初始化各个模块
     */
    async initModules() {
        // 初始化模板管理器
        if (window.templateManager) {
            window.templateManager.init();
        }

        // 初始化拖拽管理器
        if (window.dragDropManager) {
            window.dragDropManager.init();
        }

        // 初始化预存管理器
        if (window.presetManager) {
            window.presetManager.init();
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 项目选择事件
        const projectSelect = document.getElementById('projectSelect');
        if (projectSelect) {
            projectSelect.addEventListener('change', this.handleProjectChange.bind(this));
        }

        // 下载按钮事件
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', this.handleDownload.bind(this));
        }

        // 缩放滑杆事件
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');
        if (zoomSlider && zoomValue) {
            zoomSlider.addEventListener('input', (e) => {
                const scale = parseFloat(e.target.value);
                this.updateTemplateScale(scale);
                zoomValue.textContent = Math.round(scale * 100) + '%';
            });
        }

        // 格式切换滑块事件
        this.initFormatSlider();

        // 语言切换按钮事件
        const languageToggle = document.getElementById('languageToggle');
        if (languageToggle) {
            languageToggle.addEventListener('click', this.handleLanguageToggle.bind(this));
        }

        // 窗口大小变化事件
        window.addEventListener('resize', this.handleResize.bind(this));

        // 键盘快捷键
        document.addEventListener('keydown', this.handleKeydown.bind(this));

        // 错误处理
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }

    /**
     * 加载初始数据
     */
    async loadInitialData() {
        if (!window.dataLoader) {
            throw new Error('数据加载器未初始化');
        }

        // 加载项目数据（中英文）
        await window.dataLoader.loadAllData();
        
        // 初始化语言切换按钮状态
        this.initLanguageToggle();
        
        // 填充项目选择下拉框
        this.populateProjectSelect();
        
        // 显示数据统计信息
        this.displayDataStats();
    }

    /**
     * 初始化语言切换按钮状态
     */
    initLanguageToggle() {
        const languageToggle = document.getElementById('languageToggle');
        if (languageToggle) {
            const currentLang = window.dataLoader.getLanguage();
            if (currentLang === 'en') {
                languageToggle.textContent = 'English';
                languageToggle.classList.add('en');
            } else {
                languageToggle.textContent = '中文';
                languageToggle.classList.remove('en');
            }
        }
    }

    /**
     * 填充项目选择下拉框
     */
    populateProjectSelect() {
        const projectSelect = document.getElementById('projectSelect');
        const projectList = window.dataLoader.getProjectList();
        
        // 清空现有选项
        projectSelect.innerHTML = '<option value="">请选择</option>';
        
        // 添加项目选项
        projectList.forEach(projectName => {
            const option = document.createElement('option');
            option.value = projectName;
            option.textContent = projectName;
            projectSelect.appendChild(option);
        });

        console.log(`已加载 ${projectList.length} 个项目`);
    }

    /**
     * 处理项目选择变化
     */
    async handleProjectChange(event) {
        const projectName = event.target.value;
        
        if (!projectName) {
            this.clearProjectData();
            return;
        }

        try {
            this.showLoading('正在加载项目数据...');
            
            // 设置当前项目
            this.currentProject = projectName;
            window.dataLoader.setCurrentProject(projectName);
            
            // 加载项目信息
            const projectInfo = window.dataLoader.getProjectInfo(projectName);
            if (projectInfo && window.templateManager) {
                window.templateManager.updateProjectInfo(projectInfo);
            }
            
            // 加载项目图片
            await this.loadProjectImages(projectName);
            
            this.hideLoading();
        } catch (error) {
            console.error('加载项目数据失败:', error);
            this.hideLoading();
            // 重新抛出错误，让调用者处理
            throw error;
        }
    }

    /**
     * 加载项目图片
     */
    async loadProjectImages(projectName) {
        const images = await window.dataLoader.loadProjectImages(projectName);
        const projectImagesContainer = document.getElementById('projectImages');
        
        // 清空现有图片
        projectImagesContainer.innerHTML = '';
        
        if (images.length === 0) {
            projectImagesContainer.innerHTML = `
                <div class="no-images-message">
                    <p>该项目暂无图片</p>
                </div>
            `;
            return;
        }
        
        // 创建图片元素
        if (window.dragDropManager) {
            const imageItems = window.dragDropManager.createImageItems(images);
            projectImagesContainer.appendChild(imageItems);
        }
        
        console.log(`已加载 ${images.length} 张项目图片`);
    }

    /**
     * 清空项目数据
     */
    clearProjectData() {
        this.currentProject = null;
        
        // 清空图片容器
        const projectImagesContainer = document.getElementById('projectImages');
        projectImagesContainer.innerHTML = '';
        
        // 清空模板信息
        if (window.templateManager) {
            window.templateManager.updateProjectInfo(null);
        }
    }

    /**
     * 处理下载
     */
    async handleDownload() {
        if (!window.templateManager) {
            this.showError('模板管理器未初始化');
            return;
        }

        if (!window.templateManager.currentTemplate) {
            this.showError('请先选择一个模板');
            return;
        }

        try {
            await window.templateManager.exportHTML();
        } catch (error) {
            console.error('下载失败:', error);
            this.showError('下载失败，请重试');
        }
    }

    /**
     * 处理语言切换
     */
    handleLanguageToggle() {
        const currentLang = window.dataLoader.getLanguage();
        const newLang = currentLang === 'zh' ? 'en' : 'zh';
        
        // 设置新语言
        window.dataLoader.setLanguage(newLang);
        
        // 更新按钮文本和样式
        const languageToggle = document.getElementById('languageToggle');
        if (languageToggle) {
            if (newLang === 'en') {
                languageToggle.textContent = 'English';
                languageToggle.classList.add('en');
            } else {
                languageToggle.textContent = '中文';
                languageToggle.classList.remove('en');
            }
        }
        
        // 重新填充项目选择下拉框
        this.populateProjectSelect();
        
        // 如果当前有选中的项目，重新加载项目信息
        if (this.currentProject) {
            const projectInfo = window.dataLoader.getProjectInfo(this.currentProject);
            if (projectInfo && window.templateManager) {
                window.templateManager.updateProjectInfo(projectInfo);
            }
        }
        
        // 更新属性标签
        this.updateAttributeLabels();
    }

    /**
     * 更新属性标签
     */
    updateAttributeLabels() {
        const attributeNames = window.dataLoader.getAttributeDisplayNames();
        const checkboxes = document.querySelectorAll('input[type="checkbox"][data-key]');
        
        checkboxes.forEach(checkbox => {
            const key = checkbox.getAttribute('data-key');
            const label = checkbox.nextElementSibling;
            if (label && attributeNames[key]) {
                label.textContent = attributeNames[key];
            }
        });
    }

    /**
     * 初始化格式滑块
     */
    initFormatSlider() {
        const sliderButton = document.getElementById('formatSliderButton');
        const sliderTrack = document.getElementById('formatSliderTrack');
        const sliderText = document.getElementById('formatSliderText');
        
        if (!sliderButton || !sliderTrack || !sliderText) return;

        // 保存 App 实例的引用
        const app = this;

        let isDragging = false;
        let startX = 0;
        let currentX = 0;
        let currentFormat = 'text'; // 默认文本格式

        // 格式配置
        const formats = {
            text: { position: 3, bgColor: '#3498db', text: '文本格式' },
            report: { position: 102, bgColor: '#f39c12', text: '汇报格式' },
            board: { position: 201, bgColor: '#e74c3c', text: '展板格式' }
        };

        // 根据格式获取默认缩放值
        const getDefaultZoomByFormat = (format) => {
            const zoomMap = {
                'text': 0.80,    // 文本格式：80%
                'report': 1.00,  // 汇报格式：100%
                'board': 0.25    // 展板格式：25%
            };
            return zoomMap[format] || 0.80;
        };

        // 更新滑块位置和样式
        const updateSlider = (format) => {
            const config = formats[format];
            if (!config) return;
            
            sliderButton.style.left = config.position + 'px';
            sliderButton.style.background = config.bgColor;
            sliderButton.className = 'format-slider-button format-' + format;
            sliderText.textContent = config.text;
            currentFormat = format;
            
            // 根据格式设置缩放条默认值
            const defaultZoom = getDefaultZoomByFormat(format);
            const zoomSlider = document.getElementById('zoomSlider');
            const zoomValue = document.getElementById('zoomValue');
            
            if (zoomSlider) {
                zoomSlider.value = defaultZoom;
                // 立即更新模板缩放（如果模板已加载）
                app.updateTemplateScale(defaultZoom);
            }
            
            if (zoomValue) {
                zoomValue.textContent = Math.round(defaultZoom * 100) + '%';
            }
            
            // 调用模板管理器切换格式和CSS
            if (window.templateManager) {
                window.templateManager.setFormat(format);
                // 延迟应用缩放值，确保模板加载完成后再应用
                setTimeout(() => {
                    if (window.templateManager) {
                        window.templateManager.applyUserZoomScale();
                    }
                }, 100);
            }
        };

        // 根据位置确定格式
        const getFormatByPosition = (x) => {
            const trackRect = sliderTrack.getBoundingClientRect();
            const relativeX = x - trackRect.left;
            const positions = [
                { format: 'text', position: 3 },
                { format: 'report', position: 102 },
                { format: 'board', position: 201 }
            ];
            
            let closestFormat = 'text';
            let minDistance = Infinity;
            
            positions.forEach(({ format, position }) => {
                const distance = Math.abs(relativeX - position);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestFormat = format;
                }
            });
            
            return closestFormat;
        };

        // 鼠标按下
        sliderButton.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            currentX = parseInt(sliderButton.style.left) || 3;
            sliderButton.style.transition = 'none';
            e.preventDefault();
        });

        // 鼠标移动
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const trackRect = sliderTrack.getBoundingClientRect();
            const deltaX = e.clientX - startX;
            let newX = currentX + deltaX;
            
            // 限制在轨道范围内
            newX = Math.max(3, Math.min(201, newX));
            sliderButton.style.left = newX + 'px';
        });

        // 鼠标释放
        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            sliderButton.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            
            // 根据当前滑块位置确定格式
            const currentLeft = parseInt(sliderButton.style.left) || 3;
            const targetFormat = getFormatByPosition(sliderTrack.getBoundingClientRect().left + currentLeft);
            
            updateSlider(targetFormat);
        });

        // 点击轨道直接跳转
        sliderTrack.addEventListener('click', (e) => {
            if (e.target === sliderButton || sliderButton.contains(e.target)) return;
            
            const targetFormat = getFormatByPosition(e.clientX);
            updateSlider(targetFormat);
        });

        // 触摸支持
        let touchStartX = 0;
        let touchCurrentX = 0;

        sliderButton.addEventListener('touchstart', (e) => {
            isDragging = true;
            touchStartX = e.touches[0].clientX;
            touchCurrentX = parseInt(sliderButton.style.left) || 3;
            sliderButton.style.transition = 'none';
            e.preventDefault();
        });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const trackRect = sliderTrack.getBoundingClientRect();
            const deltaX = e.touches[0].clientX - touchStartX;
            let newX = touchCurrentX + deltaX;
            
            newX = Math.max(3, Math.min(201, newX));
            sliderButton.style.left = newX + 'px';
        });

        document.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;
            sliderButton.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            
            const currentLeft = parseInt(sliderButton.style.left) || 3;
            const targetFormat = getFormatByPosition(sliderTrack.getBoundingClientRect().left + currentLeft);
            
            updateSlider(targetFormat);
        });

        // 初始化
        updateSlider('text');
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        // 重新计算模板缩放比例
        this.adjustTemplateScale();
    }

    /**
     * 调整模板缩放比例 - 横向A3优化
     */
    adjustTemplateScale() {
        const previewPanel = document.querySelector('.preview-panel');
        const templateContent = document.querySelector('.template-content');
        
        if (!previewPanel || !templateContent) return;
        
        const panelRect = previewPanel.getBoundingClientRect();
        const availableWidth = panelRect.width - 40; // 减去padding
        const availableHeight = panelRect.height - 40;
        
        // 横向A3纸张比例 (420mm x 297mm)
        const aspectRatio = 420 / 297;
        const templateWidth = 420;
        const templateHeight = 297;
        
        // 计算合适的缩放比例
        const scaleX = availableWidth / templateWidth;
        const scaleY = availableHeight / templateHeight;
        const autoScale = Math.min(scaleX, scaleY, 0.5); // 最大缩放50%
        
        // 获取用户设置的缩放值
        const zoomSlider = document.getElementById('zoomSlider');
        const userScale = zoomSlider ? parseFloat(zoomSlider.value) : 0.35;
        
        // 使用用户设置的缩放值
        templateContent.style.transform = `scale(${userScale})`;
        templateContent.style.transformOrigin = 'center center';
        
        // 更新滑杆显示
        const zoomValue = document.getElementById('zoomValue');
        if (zoomValue) {
            zoomValue.textContent = Math.round(userScale * 100) + '%';
        }
    }

    /**
     * 更新模板缩放
     */
    updateTemplateScale(scale) {
        const templateContent = document.querySelector('.template-content');
        if (!templateContent) return;
        
        templateContent.style.transform = `scale(${scale})`;
        templateContent.style.transformOrigin = 'center center';
    }

    /**
     * 处理键盘快捷键
     */
    handleKeydown(event) {
        // Ctrl+S 保存/下载
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            this.handleDownload();
        }
        
        // ESC 清空选择
        if (event.key === 'Escape') {
            this.clearSelections();
        }
        
        // Ctrl+R 重新加载数据
        if (event.ctrlKey && event.key === 'r') {
            event.preventDefault();
            this.reloadData();
        }
    }

    /**
     * 清空所有选择
     */
    clearSelections() {
        // 清空项目选择
        const projectSelect = document.getElementById('projectSelect');
        if (projectSelect) {
            projectSelect.value = '';
            this.clearProjectData();
        }
        
        // 清空属性选择
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // 清空模板选择
        document.querySelectorAll('.thumbnail-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 清空模板内容
        if (window.templateManager) {
            window.templateManager.clearAllImages();
        }
    }

    /**
     * 重新加载数据
     */
    async reloadData() {
        try {
            this.showLoading('正在重新加载数据...');
            
            // 清空缓存
            if (window.dataLoader) {
                window.dataLoader.clearImageCache();
            }
            
            // 重新加载数据
            await this.loadInitialData();
            
            // 如果有当前项目，重新加载
            if (this.currentProject) {
                await this.loadProjectImages(this.currentProject);
            }
            
            this.hideLoading();
        } catch (error) {
            console.error('重新加载数据失败:', error);
            this.hideLoading();
            this.showError('重新加载数据失败');
        }
    }

    /**
     * 显示数据统计信息
     */
    displayDataStats() {
        if (window.dataLoader) {
            const stats = window.dataLoader.getDataStats();
            console.log('数据统计:', stats);
        }
    }

    /**
     * 处理全局错误
     */
    handleGlobalError(event) {
        console.error('全局错误:', event.error);
        this.showError('发生了未知错误，请刷新页面重试');
    }

    /**
     * 处理未捕获的Promise拒绝
     */
    handleUnhandledRejection(event) {
        console.error('未处理的Promise拒绝:', event.reason);
        event.preventDefault();
    }

    /**
     * 显示加载状态
     */
    showLoading(message = '正在加载...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = overlay.querySelector('p');
        if (text) text.textContent = message;
        overlay.classList.add('show');
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.remove('show');
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        // 创建错误提示元素
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 10001;
            max-width: 300px;
            font-size: 14px;
            line-height: 1.4;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                document.body.removeChild(errorDiv);
            }
        }, 3000);
    }

    /**
     * 显示成功信息
     */
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 10001;
            max-width: 300px;
            font-size: 14px;
            line-height: 1.4;
        `;
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            if (document.body.contains(successDiv)) {
                document.body.removeChild(successDiv);
            }
        }, 2000);
    }

    /**
     * 获取应用状态
     */
    getAppState() {
        return {
            isInitialized: this.isInitialized,
            currentProject: this.currentProject,
            dragInfo: window.dragDropManager ? window.dragDropManager.getDragInfo() : null,
            templateInfo: window.templateManager ? {
                currentTemplate: window.templateManager.currentTemplate,
                selectedAttributes: Array.from(window.templateManager.selectedAttributes)
            } : null
        };
    }
}

// 创建应用实例并初始化
const app = new App();

// DOM加载完成后初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// 将应用实例暴露到全局作用域（用于调试）
window.app = app;
