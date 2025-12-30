/**
 * 模板管理模块
 * 负责模板的加载、切换和内容更新
 */
class TemplateManager {
    constructor() {
        this.currentTemplate = null;
        this.currentProjectInfo = null;
        this.selectedAttributes = new Set();
        this.templateImages = new Map(); // 存储每个模板的图片
        this.currentFormat = 'text'; // 默认文本格式
        this.isLoadingPreset = false; // 标记是否正在加载预存
    }

    /**
     * 获取格式配置
     */
    getFormatConfig() {
        const configs = {
            text: {
                thumbnailPath: 'thumbnail/01 document',
                templatePath: 'templates/01 document',
                templatePrefix: 'document_',
                thumbnailPrefix: 'document_',
                maxCount: 5,
                formatName: 'document',
                useFileLoading: false // 文本格式使用动态生成
            },
            report: {
                thumbnailPath: 'thumbnail/02 presentation',
                templatePath: 'templates/02 presentation',
                templatePrefix: 'presentation_',
                thumbnailPrefix: 'presentation_',
                maxCount: 8,
                formatName: 'presentation',
                useFileLoading: true // 汇报格式从文件加载
            },
            board: {
                thumbnailPath: 'thumbnail/03 display',
                templatePath: 'templates/03 display',
                templatePrefix: 'display_',
                thumbnailPrefix: 'display_',
                maxCount: 3,
                formatName: 'display',
                useFileLoading: true // 展板格式从文件加载
            }
        };
        return configs[this.currentFormat] || configs.text;
    }

    /**
     * 切换格式并更新CSS
     */
    setFormat(format) {
        if (format !== 'text' && format !== 'report' && format !== 'board') return;
        
        this.currentFormat = format;
        this.loadFormatCSS(format);
        this.updateTemplateSelector(); // 更新缩略图
        this.clearCurrentTemplate(); // 清空当前模板
    }

    /**
     * 清空当前模板
     */
    clearCurrentTemplate() {
        // 保存当前模板的图片
        if (this.currentTemplate) {
            this.saveCurrentTemplateImages();
        }
        
        // 清空模板选择
        document.querySelectorAll('.thumbnail-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 清空模板内容
        const templateContainer = document.getElementById('templateContainer');
        if (templateContainer) {
            templateContainer.innerHTML = `
                <div class="template-placeholder">
                    <p>请选择项目和模板开始预览</p>
                </div>
            `;
        }
        
        this.currentTemplate = null;
    }

    /**
     * 根据格式加载对应的CSS文件
     */
    loadFormatCSS(format) {
        const cssMap = {
            'text': 'css/templates_document.css',
            'report': 'css/templates_presentation.css',
            'board': 'css/templates_display.css'
        };

        const cssPath = cssMap[format];
        if (!cssPath) return;

        // 查找或创建CSS链接元素
        let cssLink = document.getElementById('templateCSS');
        if (cssLink) {
            // 更新现有链接
            cssLink.href = cssPath;
            cssLink.setAttribute('data-format', format);
        } else {
            // 创建新链接
            cssLink = document.createElement('link');
            cssLink.id = 'templateCSS';
            cssLink.rel = 'stylesheet';
            cssLink.href = cssPath;
            cssLink.setAttribute('data-format', format);
            document.head.appendChild(cssLink);
        }

        console.log(`已切换到 ${format} 格式，加载 CSS: ${cssPath}`);
    }

    /**
     * 初始化模板管理器
     */
    init() {
        this.bindEvents();
        this.initTemplateSelector();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 使用事件委托绑定模板缩略图点击事件
        const thumbnailContainer = document.querySelector('.template-thumbnails');
        if (thumbnailContainer) {
            thumbnailContainer.addEventListener('click', (e) => {
                const thumbnailItem = e.target.closest('.thumbnail-item');
                if (thumbnailItem) {
                    const templateId = thumbnailItem.dataset.template;
                    if (templateId) {
                        this.loadTemplate(templateId);
                    }
                }
            });
        }

        // 属性选择变化事件
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const attribute = e.target.dataset.key;
                if (e.target.checked) {
                    this.selectedAttributes.add(attribute);
                } else {
                    this.selectedAttributes.delete(attribute);
                }
                this.updateAttributeDisplay();
            });
        });
    }

    /**
     * 初始化模板选择器
     */
    initTemplateSelector() {
        this.updateTemplateSelector();
    }

    /**
     * 更新模板选择器（根据格式动态生成缩略图）
     */
    updateTemplateSelector() {
        const config = this.getFormatConfig();
        const thumbnailContainer = document.querySelector('.template-thumbnails');
        if (!thumbnailContainer) return;

        // 清空现有缩略图
        thumbnailContainer.innerHTML = '';

        // 根据格式配置动态创建缩略图
        for (let i = 1; i <= config.maxCount; i++) {
            const thumbnailItem = document.createElement('div');
            thumbnailItem.className = 'thumbnail-item';
            thumbnailItem.dataset.template = i.toString();

            const img = document.createElement('img');
            img.src = `${config.thumbnailPath}/${config.thumbnailPrefix}${i}.jpg`;
            img.alt = `模板${i}`;
            img.onerror = function() {
                // 如果图片加载失败，显示占位符
                this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="80"%3E%3Crect fill="%23ddd" width="120" height="80"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="12"%3E模板%3C/text%3E%3C/svg%3E';
            };

            const span = document.createElement('span');
            span.textContent = `模板${i}`;

            thumbnailItem.appendChild(img);
            thumbnailItem.appendChild(span);

            // 绑定悬停事件
            thumbnailItem.addEventListener('mouseenter', () => {
                thumbnailItem.style.transform = 'scale(1.05)';
            });
            thumbnailItem.addEventListener('mouseleave', () => {
                thumbnailItem.style.transform = 'scale(1)';
            });

            thumbnailContainer.appendChild(thumbnailItem);
        }
    }

    /**
     * 加载指定模板
     */
    async loadTemplate(templateId) {
        try {
            this.showLoading();
            
            // 更新选中状态
            document.querySelectorAll('.thumbnail-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-template="${templateId}"]`).classList.add('active');

            // 保存当前模板的图片
            if (this.currentTemplate) {
                this.saveCurrentTemplateImages();
            }

            this.currentTemplate = templateId;
            
            // 根据格式决定加载方式
            const config = this.getFormatConfig();
            let templateHTML = '';
            
            if (config.useFileLoading) {
                // 从文件加载模板（汇报格式和展板格式）
                const templatePath = `${config.templatePath}/${config.templatePrefix}${templateId}.html`;
                try {
                    const response = await fetch(templatePath);
                    if (response.ok) {
                        const htmlContent = await response.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(htmlContent, 'text/html');
                        const templateBody = doc.querySelector('.template-content');
                        
                        if (templateBody) {
                            const templateClass = this.getTemplateClass(templateId);
                            if (templateClass && !templateBody.classList.contains(templateClass)) {
                                templateBody.classList.add(templateClass);
                            }

                            // 确保项目标题和表格有正确的ID
                            const titleElement = templateBody.querySelector('.project-title');
                            if (titleElement && !titleElement.id) {
                                titleElement.id = 'projectTitle';
                            }
                            
                            const infoTable = templateBody.querySelector('.info-table');
                            if (infoTable && !infoTable.id) {
                                infoTable.id = 'infoTable';
                            }
                            
                            // 确保图片框有data-frame属性
                            const imageFrames = templateBody.querySelectorAll('.image-frame');
                            imageFrames.forEach((frame, index) => {
                                if (!frame.dataset.frame) {
                                    frame.dataset.frame = (index + 1).toString();
                                }
                            });

                            // 为图片框补齐占位符和操作按钮
                            this.upgradeImageFrames(templateBody);
                            
                            templateHTML = templateBody.outerHTML;
                            console.log(`成功加载模板: ${templatePath}`);
                        } else {
                            throw new Error('模板文件中未找到 .template-content 元素');
                        }
                    } else {
                        throw new Error(`模板文件不存在: ${templatePath}`);
                    }
                } catch (fetchError) {
                    console.error('无法加载模板文件:', fetchError);
                    this.hideLoading();
                    this.showError(`加载模板失败: ${fetchError.message}`);
                    return;
                }
            } else {
                // 动态生成模板（文本格式）
                templateHTML = this.generateTemplateHTML(templateId);
            }
            
            // 更新预览面板
            const templateContainer = document.getElementById('templateContainer');
            templateContainer.innerHTML = templateHTML;

            // 等待DOM更新完成后再初始化拖拽区域和其他功能
            // 如果是从文件加载，需要更长的延迟确保DOM完全渲染
            const delay = config.useFileLoading ? 200 : 100;
            setTimeout(() => {
                // 只有在不是加载预存时才恢复模板图片
                // 如果正在加载预存，预存管理器会自己恢复图片
                if (!this.isLoadingPreset) {
                    this.restoreTemplateImages(templateId);
                }

                // 更新项目信息显示
                if (this.currentProjectInfo) {
                    this.updateProjectInfo(this.currentProjectInfo);
                    this.updateAttributeDisplay();
                }

                // 应用用户设置的缩放值
                this.applyUserZoomScale();

                // 初始化拖拽功能
                if (window.dragDropManager) {
                    window.dragDropManager.initDropZones();
                }
            }, delay);

            this.hideLoading();
        } catch (error) {
            console.error('加载模板失败:', error);
            this.hideLoading();
            // 重新抛出错误，让调用者处理
            throw error;
        }
    }

    /**
     * 生成模板HTML
     */
    generateTemplateHTML(templateId) {
        const frameCount = this.getTemplateFrameCount(templateId);
        let framesHTML = '';

        for (let i = 1; i <= frameCount; i++) {
            framesHTML += `
                <div class="image-frame" data-frame="${i}">
                    <div class="image-placeholder">图片${i}</div>
                    <button class="image-delete-btn" onclick="templateManager.removeImage(${i})">&times;</button>
                    <div class="image-controls">
                        <button class="control-btn" onclick="templateManager.moveImage(${i}, 'up')" title="上移">↑</button>
                        <button class="control-btn" onclick="templateManager.moveImage(${i}, 'down')" title="下移">↓</button>
                        <button class="control-btn" onclick="templateManager.moveImage(${i}, 'left')" title="左移">←</button>
                        <button class="control-btn" onclick="templateManager.moveImage(${i}, 'right')" title="右移">→</button>
                        <button class="control-btn" onclick="templateManager.scaleImage(${i}, 'up')" title="放大">+</button>
                        <button class="control-btn" onclick="templateManager.scaleImage(${i}, 'down')" title="缩小">-</button>
                    </div>
                </div>
            `;
        }

        const templateClass = this.getTemplateClass(templateId);

        return `
            <div class="template-content ${templateClass}">
                <div class="project-title" id="projectTitle">项目名称</div>
                <table class="info-table" id="infoTable">
                    <!-- 动态生成信息表格 -->
                </table>
                <div class="image-board">
                    ${framesHTML}
                </div>
            </div>
        `;
    }

    /**
     * 获取模板的图片框数量
     */
    getTemplateFrameCount(templateId) {
        const frameCounts = {
            '1': 4, // 不对称四图布局
            '2': 4, // 左大右小布局
            '3': 3, // 上大下双布局
            '4': 3, // 左大右双布局
            '5': 4  // 2x2网格布局
        };
        return frameCounts[templateId] || 4;
    }

    /**
     * 为图片框补齐占位符与控制按钮
     */
    upgradeImageFrames(container) {
        const frames = container.querySelectorAll('.image-frame');
        frames.forEach((frame, index) => {
            const frameIndex = (index + 1).toString();
            if (!frame.dataset.frame) {
                frame.dataset.frame = frameIndex;
            }

            if (!frame.querySelector('.image-placeholder')) {
                const placeholder = document.createElement('div');
                placeholder.className = 'image-placeholder';
                placeholder.textContent = `图片${frameIndex}`;
                frame.appendChild(placeholder);
            }

            if (!frame.querySelector('.image-delete-btn')) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'image-delete-btn';
                deleteBtn.type = 'button';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.setAttribute('onclick', `templateManager.removeImage(${frameIndex})`);
                frame.appendChild(deleteBtn);
            }

            if (!frame.querySelector('.image-controls')) {
                frame.appendChild(this.createImageControls(Number(frameIndex)));
            }
        });
    }

    /**
     * 创建图片操作按钮
     */
    createImageControls(frameIndex) {
        const controls = document.createElement('div');
        controls.className = 'image-controls';
        controls.innerHTML = `
            <button class="control-btn" onclick="templateManager.moveImage(${frameIndex}, 'up')" title="上移">↑</button>
            <button class="control-btn" onclick="templateManager.moveImage(${frameIndex}, 'down')" title="下移">↓</button>
            <button class="control-btn" onclick="templateManager.moveImage(${frameIndex}, 'left')" title="左移">←</button>
            <button class="control-btn" onclick="templateManager.moveImage(${frameIndex}, 'right')" title="右移">→</button>
            <button class="control-btn" onclick="templateManager.scaleImage(${frameIndex}, 'up')" title="放大">+</button>
            <button class="control-btn" onclick="templateManager.scaleImage(${frameIndex}, 'down')" title="缩小">-</button>
        `;

        return controls;
    }

    /**
     * 根据当前格式获取模板类名
     */
    getTemplateClass(templateId) {
        if (this.currentFormat === 'report') {
            return `presentation-${templateId}`;
        }
        if (this.currentFormat === 'board') {
            return `display-${templateId}`;
        }
        return `template-${templateId}`;
    }

    /**
     * 更新项目信息
     */
    updateProjectInfo(projectInfo) {
        this.currentProjectInfo = projectInfo;
        
        // 更新项目标题
        const titleElement = document.getElementById('projectTitle');
        if (titleElement && projectInfo.AA) {
            titleElement.textContent = projectInfo.AA;
        }

        // 更新信息表格
        this.updateAttributeDisplay();
    }

    /**
     * 更新属性显示
     */
    updateAttributeDisplay() {
        const infoTable = document.getElementById('infoTable');
        if (!infoTable || !this.currentProjectInfo) return;

        const attributeNames = window.dataLoader.getAttributeDisplayNames();
        let tableHTML = '';

        this.selectedAttributes.forEach(key => {
            const displayName = attributeNames[key];
            const value = this.currentProjectInfo[key];
            if (displayName && value) {
                tableHTML += `
                    <tr>
                        <td>${displayName}</td>
                        <td>${value}</td>
                    </tr>
                `;
            }
        });

        infoTable.innerHTML = tableHTML;
    }

    /**
     * 添加图片到模板
     */
    addImageToTemplate(imageUrl, frameIndex) {
        const frame = document.querySelector(`[data-frame="${frameIndex}"]`);
        if (!frame) return false;

        // 移除占位符
        const placeholder = frame.querySelector('.image-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }

        // 移除现有图片
        const existingImg = frame.querySelector('img');
        if (existingImg) {
            existingImg.remove();
        }

        // 创建新图片
        const img = document.createElement('img');
        img.src = imageUrl;
        img.draggable = false;
        img.style.transform = 'translate(0, 0) scale(1)';
        img.style.objectFit = 'cover';
        img.style.objectPosition = 'center center';
        img.style.width = '100%';
        img.style.height = '100%';
        img.dataset.originalSrc = imageUrl;

        // 添加图片移动事件
        this.addImageMoveEvents(img);

        frame.appendChild(img);

        // 添加图片加载完成事件，用于智能定位
        img.addEventListener('load', () => {
            this.optimizeImagePosition(img, frame);
        });

        // 保存图片信息
        if (!this.templateImages.has(this.currentTemplate)) {
            this.templateImages.set(this.currentTemplate, new Map());
        }
        this.templateImages.get(this.currentTemplate).set(frameIndex, {
            url: imageUrl,
            transform: 'translate(0, 0) scale(1)',
            objectPosition: 'center center'
        });

        return true;
    }

    /**
     * 添加图片移动事件
     */
    addImageMoveEvents(img) {
        let isDragging = false;
        let startX, startY, startTransformX = 0, startTransformY = 0;

        // 解析当前transform值
        const parseTransform = (transformStr) => {
            const translateMatch = transformStr.match(/translate\(([^,]+),\s*([^)]+)\)/);
            const scaleMatch = transformStr.match(/scale\(([^)]+)\)/);
            
            return {
                x: translateMatch ? parseFloat(translateMatch[1]) || 0 : 0,
                y: translateMatch ? parseFloat(translateMatch[2]) || 0 : 0,
                scale: scaleMatch ? parseFloat(scaleMatch[1]) || 1 : 1
            };
        };

        img.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // 只处理左键
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const currentTransform = parseTransform(img.style.transform);
            startTransformX = currentTransform.x;
            startTransformY = currentTransform.y;
            
            img.style.cursor = 'grabbing';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newX = startTransformX + deltaX;
            const newY = startTransformY + deltaY;
            const currentScale = parseTransform(img.style.transform).scale;
            
            img.style.transform = `translate(${newX}px, ${newY}px) scale(${currentScale})`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                img.style.cursor = 'move';
                
                // 保存变换状态
                const frame = img.closest('.image-frame');
                const frameIndex = parseInt(frame.dataset.frame);
                if (this.templateImages.has(this.currentTemplate)) {
                    const templateImages = this.templateImages.get(this.currentTemplate);
                    if (templateImages.has(frameIndex)) {
                        templateImages.get(frameIndex).transform = img.style.transform;
                    }
                }
            }
        });
    }

    /**
     * 移动图片位置 - 支持object-position调整
     */
    moveImage(frameIndex, direction) {
        const frame = document.querySelector(`[data-frame="${frameIndex}"]`);
        const img = frame?.querySelector('img');
        if (!img) return;

        // 获取当前的object-position值
        const currentObjectPosition = img.style.objectPosition || 'center center';
        const positionMatch = currentObjectPosition.match(/(\d+(?:\.\d+)?)%?\s+(\d+(?:\.\d+)?)%?/);
        
        let posX = 50; // 默认居中
        let posY = 50; // 默认居中
        
        if (positionMatch) {
            posX = parseFloat(positionMatch[1]);
            posY = parseFloat(positionMatch[2]);
        }

        const step = 5; // 移动步长（百分比）

        switch (direction) {
            case 'up':
                posY = Math.max(0, posY - step);
                break;
            case 'down':
                posY = Math.min(100, posY + step);
                break;
            case 'left':
                posX = Math.max(0, posX - step);
                break;
            case 'right':
                posX = Math.min(100, posX + step);
                break;
        }

        img.style.objectPosition = `${posX}% ${posY}%`;

        // 保存状态
        if (this.templateImages.has(this.currentTemplate)) {
            const templateImages = this.templateImages.get(this.currentTemplate);
            if (templateImages.has(frameIndex)) {
                templateImages.get(frameIndex).objectPosition = img.style.objectPosition;
            }
        }
    }

    /**
     * 优化图片位置 - 智能居中显示
     */
    optimizeImagePosition(img, frame) {
        // 获取图片和框架的尺寸
        const frameRect = frame.getBoundingClientRect();
        const imgNaturalWidth = img.naturalWidth;
        const imgNaturalHeight = img.naturalHeight;
        
        if (imgNaturalWidth === 0 || imgNaturalHeight === 0) return;
        
        // 计算图片和框架的宽高比
        const imgRatio = imgNaturalWidth / imgNaturalHeight;
        const frameRatio = frameRect.width / frameRect.height;
        
        // 如果图片比例和框架比例差异很大，提供更好的初始定位
        if (Math.abs(imgRatio - frameRatio) > 0.3) {
            // 图片比框架更宽或更高时，可以稍微调整位置以显示更重要的部分
            if (imgRatio > frameRatio) {
                // 图片更宽，可能需要左右调整
                img.style.objectPosition = 'center center';
            } else {
                // 图片更高，可能需要上下调整
                img.style.objectPosition = 'center center';
            }
        }
    }

    /**
     * 缩放图片
     */
    scaleImage(frameIndex, direction) {
        const frame = document.querySelector(`[data-frame="${frameIndex}"]`);
        const img = frame?.querySelector('img');
        if (!img) return;

        const currentTransform = img.style.transform;
        const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
        
        let x = translateMatch ? parseFloat(translateMatch[1]) || 0 : 0;
        let y = translateMatch ? parseFloat(translateMatch[2]) || 0 : 0;
        let scale = scaleMatch ? parseFloat(scaleMatch[1]) || 1 : 1;

        const scaleStep = 0.05; // 缩放步长5%

        switch (direction) {
            case 'up': // 放大
                scale = Math.min(scale + scaleStep, 3); // 最大放大到300%
                break;
            case 'down': // 缩小
                scale = Math.max(scale - scaleStep, 0.1); // 最小缩小到10%
                break;
        }

        img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;

        // 保存状态
        if (this.templateImages.has(this.currentTemplate)) {
            const templateImages = this.templateImages.get(this.currentTemplate);
            if (templateImages.has(frameIndex)) {
                templateImages.get(frameIndex).transform = img.style.transform;
            }
        }
    }

    /**
     * 移除图片
     */
    removeImage(frameIndex) {
        const frame = document.querySelector(`[data-frame="${frameIndex}"]`);
        const img = frame?.querySelector('img');
        const placeholder = frame?.querySelector('.image-placeholder');
        
        if (img) {
            img.remove();
        }
        
        if (placeholder) {
            placeholder.style.display = 'block';
        }

        // 清除保存的图片信息
        if (this.templateImages.has(this.currentTemplate)) {
            this.templateImages.get(this.currentTemplate).delete(frameIndex);
        }
    }

    /**
     * 保存当前模板的图片
     */
    saveCurrentTemplateImages() {
        if (!this.currentTemplate) return;

        const templateImages = new Map();
        const frames = document.querySelectorAll('.image-frame');
        
        frames.forEach(frame => {
            const frameIndex = parseInt(frame.dataset.frame);
            const img = frame.querySelector('img');
            
            if (img) {
                templateImages.set(frameIndex, {
                    url: img.dataset.originalSrc || img.src,
                    transform: img.style.transform || 'translate(0, 0)'
                });
            }
        });

        this.templateImages.set(this.currentTemplate, templateImages);
    }

    /**
     * 恢复模板的图片
     */
    restoreTemplateImages(templateId) {
        if (!this.templateImages.has(templateId)) return;

        const templateImages = this.templateImages.get(templateId);
        
        templateImages.forEach((imageData, frameIndex) => {
            setTimeout(() => {
                this.addImageToTemplate(imageData.url, frameIndex);
                const frame = document.querySelector(`[data-frame="${frameIndex}"]`);
                const img = frame?.querySelector('img');
                if (img) {
                    if (imageData.transform) {
                        img.style.transform = imageData.transform;
                    }
                    if (imageData.objectPosition) {
                        img.style.objectPosition = imageData.objectPosition;
                    }
                }
            }, 100);
        });
    }

    /**
     * 清空所有图片
     */
    clearAllImages() {
        if (this.currentTemplate) {
            this.templateImages.delete(this.currentTemplate);
        }
        
        document.querySelectorAll('.image-frame img').forEach(img => img.remove());
        document.querySelectorAll('.image-placeholder').forEach(placeholder => {
            placeholder.style.display = 'block';
        });
    }

    /**
     * 导出HTML
     */
    async exportHTML() {
        try {
            this.showLoading('正在生成HTML文件...');

            const templateContainer = document.getElementById('templateContainer');
            if (!templateContainer) {
                throw new Error('模板容器不存在');
            }

            // 克隆模板内容
            const clonedContent = templateContainer.cloneNode(true);
            
            // 移除控制元素
            clonedContent.querySelectorAll('.image-delete-btn, .image-controls').forEach(el => el.remove());
            
            // 转换图片为base64
            await this.convertImagesToBase64(clonedContent);

            // 生成完整的HTML文档
            const fullHTML = this.generateFullHTML(clonedContent.innerHTML);

            // 下载文件
            this.downloadHTML(fullHTML);

            this.hideLoading();
        } catch (error) {
            console.error('导出HTML失败:', error);
            this.hideLoading();
            this.showError('导出失败，请重试');
        }
    }

    /**
     * 转换图片为base64
     */
    async convertImagesToBase64(container) {
        const images = container.querySelectorAll('img');
        const promises = Array.from(images).map(img => {
            return new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const tempImg = new Image();
                
                tempImg.crossOrigin = 'anonymous';
                tempImg.onload = () => {
                    canvas.width = tempImg.width;
                    canvas.height = tempImg.height;
                    ctx.drawImage(tempImg, 0, 0);
                    
                    try {
                        const base64 = canvas.toDataURL('image/jpeg', 0.8);
                        img.src = base64;
                    } catch (error) {
                        console.warn('图片转换失败，保持原始路径:', error);
                    }
                    resolve();
                };
                tempImg.onerror = () => resolve(); // 转换失败时继续
                tempImg.src = img.src;
            });
        });

        await Promise.all(promises);
    }

    /**
     * 生成完整HTML文档
     */
    generateFullHTML(templateContent) {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.currentProjectInfo?.AA || '建筑项目展示'}</title>
    <style>
        ${this.getExportCSS()}
    </style>
</head>
<body>
    <div class="export-container">
        ${templateContent}
    </div>
</body>
</html>`;
    }

    /**
     * 获取导出用的CSS
     */
    getExportCSS() {
        return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            background: #f0f0f0;
            padding: 20px;
        }
        
        .export-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        
        .template-content {
            width: 420mm;
            height: 297mm;
            background: white;
            position: relative;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .project-title {
            position: absolute;
            top: 30px;
            left: 30px;
            font-family: 'Microsoft YaHei', sans-serif;
            font-weight: bold;
            font-size: 24px;
            color: #000;
            z-index: 10;
        }
        
        .info-table {
            position: absolute;
            bottom: 30px;
            left: 30px;
            width: 200px;
            border-collapse: collapse;
            font-family: 'Microsoft YaHei', sans-serif;
            font-size: 12px;
            z-index: 10;
        }
        
        .info-table tr {
            border: none;
        }
        
        .info-table td {
            padding: 6px 0;
            border: none;
            vertical-align: top;
        }
        
        .info-table td:first-child {
            font-weight: bold;
            color: #333;
            width: 80px;
        }
        
        .info-table td:last-child {
            color: #666;
            word-wrap: break-word;
        }
        
        .image-board {
            position: absolute;
            top: 30px;
            right: 30px;
            bottom: 30px;
            width: calc(100% - 280px);
            z-index: 5;
        }
        
        .image-frame {
            position: absolute;
            overflow: hidden;
            background: #f8f8f8;
        }
        
        .image-frame img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        ${this.getTemplateSpecificCSS()}
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .export-container {
                min-height: auto;
            }
            
            .template-content {
                box-shadow: none;
                width: 297mm;
                height: 210mm;
            }
        }
        `;
    }

    /**
     * 获取特定模板的CSS
     */
    getTemplateSpecificCSS() {
        return `
        /* 模板1：不对称四图布局 */
        .template-1 .image-frame:nth-child(1) { top: 0; left: 0; width: calc(35% - 7.5px); height: calc(50% - 7.5px); }
        .template-1 .image-frame:nth-child(2) { top: 0; right: 0; width: calc(65% - 7.5px); height: calc(50% - 7.5px); }
        .template-1 .image-frame:nth-child(3) { bottom: 0; left: 0; width: calc(65% - 7.5px); height: calc(50% - 7.5px); }
        .template-1 .image-frame:nth-child(4) { bottom: 0; right: 0; width: calc(35% - 7.5px); height: calc(50% - 7.5px); }
        
        /* 模板2：左大右小布局 */
        .template-2 .image-frame:nth-child(1) { top: 0; left: 0; width: calc(70% - 7.5px); height: calc(60% - 7.5px); }
        .template-2 .image-frame:nth-child(2) { bottom: 0; left: 0; width: calc(35% - 7.5px); height: calc(40% - 7.5px); }
        .template-2 .image-frame:nth-child(3) { bottom: 0; left: calc(35% + 7.5px); width: calc(35% - 15px); height: calc(40% - 7.5px); }
        .template-2 .image-frame:nth-child(4) { bottom: 0; right: 0; width: calc(30% - 7.5px); height: 100%; }
        
        /* 模板3：上大下双布局 */
        .template-3 .image-frame:nth-child(1) { top: 0; left: 0; width: 100%; height: calc(65% - 7.5px); }
        .template-3 .image-frame:nth-child(2) { bottom: 0; left: 0; width: calc(50% - 7.5px); height: calc(35% - 7.5px); }
        .template-3 .image-frame:nth-child(3) { bottom: 0; right: 0; width: calc(50% - 7.5px); height: calc(35% - 7.5px); }
        .template-3 .image-frame:nth-child(4) { display: none; }
        
        /* 模板4：左大右双布局 */
        .template-4 .image-frame:nth-child(1) { top: 0; left: 0; width: calc(50% - 7.5px); height: 100%; }
        .template-4 .image-frame:nth-child(2) { top: 0; right: 0; width: calc(50% - 7.5px); height: calc(50% - 7.5px); }
        .template-4 .image-frame:nth-child(3) { bottom: 0; right: 0; width: calc(50% - 7.5px); height: calc(50% - 7.5px); }
        .template-4 .image-frame:nth-child(4) { display: none; }
        
        /* 模板5：2x2网格布局 */
        .template-5 .image-frame:nth-child(1) { top: 0; left: 0; width: calc(50% - 7.5px); height: calc(50% - 7.5px); }
        .template-5 .image-frame:nth-child(2) { top: 0; right: 0; width: calc(50% - 7.5px); height: calc(50% - 7.5px); }
        .template-5 .image-frame:nth-child(3) { bottom: 0; left: 0; width: calc(50% - 7.5px); height: calc(50% - 7.5px); }
        .template-5 .image-frame:nth-child(4) { bottom: 0; right: 0; width: calc(50% - 7.5px); height: calc(50% - 7.5px); }
        `;
    }

    /**
     * 下载HTML文件
     */
    downloadHTML(htmlContent) {
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentProjectInfo?.AA || '建筑项目展示'}_${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    /**
     * 应用用户设置的缩放值
     */
    applyUserZoomScale() {
        const zoomSlider = document.getElementById('zoomSlider');
        const templateContent = document.querySelector('.template-content');
        
        if (zoomSlider && templateContent) {
            const scale = parseFloat(zoomSlider.value);
            templateContent.style.transform = `scale(${scale})`;
            templateContent.style.transformOrigin = 'center center';
        }
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
        alert(message); // 简单的错误提示，可以后续优化为更好的UI
    }
}

// 创建全局实例
window.templateManager = new TemplateManager();
