/**
 * 预存管理器
 * 管理模板页面的预存、加载、删除和合并下载功能
 */
class PresetManager {
    constructor() {
        this.presets = new Map(); // 存储预存的页面数据
        this.isDropdownOpen = false;
        this.nextId = 1; // 用于生成唯一ID
    }

    /**
     * 初始化预存管理器
     */
    init() {
        this.bindEvents();
        this.loadPresetsFromStorage();
        console.log('预存管理器初始化完成');
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 预存按钮点击事件
        const presetBtn = document.getElementById('presetBtn');
        if (presetBtn) {
            presetBtn.addEventListener('click', this.handlePresetSave.bind(this));
        }

        // 预存下拉菜单关闭事件
        const presetCloseBtn = document.getElementById('presetCloseBtn');
        if (presetCloseBtn) {
            presetCloseBtn.addEventListener('click', this.closeDropdown.bind(this));
        }

        // 清空全部预存按钮
        const clearAllBtn = document.getElementById('clearAllPresetsBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', this.clearAllPresets.bind(this));
        }

        // 下载合并按钮
        const downloadAllBtn = document.getElementById('downloadAllPresetsBtn');
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', this.handleDownloadAllPresets.bind(this));
        }

        // 预存空间按钮事件
        const presetSpaceBtn = document.getElementById('presetSpaceBtn');
        if (presetSpaceBtn) {
            presetSpaceBtn.addEventListener('click', this.toggleDropdown.bind(this));
        }

        // 点击其他区域关闭下拉菜单
        document.addEventListener('click', (e) => {
            const presetDropdown = document.getElementById('presetDropdown');
            const presetSpaceBtn = document.getElementById('presetSpaceBtn');
            if (presetDropdown && presetSpaceBtn && 
                !presetDropdown.contains(e.target) && 
                e.target !== presetSpaceBtn) {
                this.closeDropdown();
            }
        });

        // ESC键关闭下拉菜单
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDropdownOpen) {
                this.closeDropdown();
            }
        });

        // 使用事件委托绑定预存列表的加载和删除按钮
        const presetList = document.getElementById('presetList');
        if (presetList) {
            presetList.addEventListener('click', (e) => {
                const target = e.target;
                const presetItem = target.closest('.preset-item');
                if (!presetItem) return;

                // 尝试多种方式获取 presetId
                const presetId = presetItem.dataset.presetId || 
                                 presetItem.getAttribute('data-preset-id') ||
                                 presetItem.getAttribute('data-presetId');
                
                if (!presetId) {
                    console.error('无法获取预设ID:', presetItem);
                    return;
                }

                console.log('点击预设按钮，预设ID:', presetId);
                console.log('当前预设列表:', Array.from(this.presets.keys()));

                // 处理加载按钮
                if (target.classList.contains('load-btn')) {
                    e.stopPropagation();
                    e.preventDefault();
                    this.loadPreset(presetId);
                }
                // 处理删除按钮
                else if (target.classList.contains('delete-btn')) {
                    e.stopPropagation();
                    e.preventDefault();
                    this.deletePreset(presetId);
                }
            });
        }
    }

    /**
     * 处理预存保存
     */
    async handlePresetSave() {
        try {
            // 检查是否有选择的项目和模板
            if (!window.templateManager || !window.templateManager.currentTemplate) {
                this.showMessage('请先选择一个模板', 'error');
                return;
            }

            if (!window.app || !window.app.currentProject) {
                this.showMessage('请先选择一个项目', 'error');
                return;
            }

            // 获取当前模板状态
            const templateState = await this.captureTemplateState();
            
            // 生成预存名称
            const presetName = this.generatePresetName(window.app.currentProject);
            
            // 保存预存
            const presetId = this.savePreset(presetName, templateState);
            
            // 更新UI
            this.updatePresetList();
            this.savePresetsToStorage();
            
            this.showMessage(`已预存: ${presetName}`, 'success');
            console.log(`预存成功: ${presetName} (ID: ${presetId})`);
            
        } catch (error) {
            console.error('预存失败:', error);
            this.showMessage('预存失败，请重试', 'error');
        }
    }

    /**
     * 捕获当前模板状态
     */
    async captureTemplateState() {
        const templateManager = window.templateManager;
        const app = window.app;
        
        // 获取当前模板内容的HTML
        const templateContainer = document.getElementById('templateContainer');
        const templateContent = templateContainer.querySelector('.template-content');
        
        if (!templateContent) {
            throw new Error('未找到模板内容');
        }

        // 克隆模板内容
        const clonedContent = templateContent.cloneNode(true);
        
        // 移除控制按钮等不需要的元素
        clonedContent.querySelectorAll('.image-controls, .image-delete-btn').forEach(el => el.remove());

        // 记录模板尺寸（以像素为单位，未经过缩放）
        let templateSize = null;
        try {
            const computedStyle = window.getComputedStyle(templateContent);
            const widthPx = parseFloat(computedStyle.width);
            const heightPx = parseFloat(computedStyle.height);
            if (!isNaN(widthPx) && !isNaN(heightPx)) {
                templateSize = {
                    widthPx,
                    heightPx
                };
            }
        } catch (sizeError) {
            console.warn('无法获取模板尺寸，使用默认值', sizeError);
        }
        
        return {
            id: this.nextId++,
            projectName: app.currentProject,
            templateId: templateManager.currentTemplate,
            format: templateManager.currentFormat || 'text', // 保存当前格式
            templateHTML: clonedContent.outerHTML,
            templateSize,
            projectInfo: templateManager.projectInfo ? {...templateManager.projectInfo} : null,
            selectedAttributes: Array.from(templateManager.selectedAttributes || []),
            images: this.captureImageStates(),
            timestamp: new Date().toISOString(),
            scale: this.getCurrentScale()
        };
    }

    /**
     * 捕获图片状态
     */
    captureImageStates() {
        const images = [];
        const imageFrames = document.querySelectorAll('.image-frame');
        
        imageFrames.forEach((frame) => {
            const img = frame.querySelector('img');
            if (img && img.src && !img.src.includes('data:')) {
                // 使用 data-frame 属性，它从1开始
                const frameIndex = frame.dataset.frame || frame.getAttribute('data-frame');
                if (frameIndex) {
                    images.push({
                        frameIndex: parseInt(frameIndex, 10), // 保存为数字，从1开始
                        src: img.src,
                        transform: img.style.transform || '',
                        objectPosition: img.style.objectPosition || 'center center'
                    });
                }
            }
        });
        
        return images;
    }

    /**
     * 获取当前缩放比例
     */
    getCurrentScale() {
        const zoomSlider = document.getElementById('zoomSlider');
        return zoomSlider ? parseFloat(zoomSlider.value) : 0.35;
    }

    /**
     * 生成预存名称
     */
    generatePresetName(projectName) {
        const baseName = projectName;
        let counter = 0;
        let finalName = baseName;
        
        // 检查是否已存在相同名称
        while (this.isPresetNameExists(finalName)) {
            counter++;
            finalName = `${baseName}_${counter}`;
        }
        
        return finalName;
    }

    /**
     * 检查预存名称是否已存在
     */
    isPresetNameExists(name) {
        for (const preset of this.presets.values()) {
            if (preset.name === name) {
                return true;
            }
        }
        return false;
    }

    /**
     * 保存预存
     */
    savePreset(name, templateState) {
        const presetId = `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const preset = {
            id: presetId, // 确保 id 存在
            name: name,
            ...templateState,
            createdAt: new Date()
        };
        
        // 确保 preset.id 和 Map 的键一致
        preset.id = presetId;
        this.presets.set(presetId, preset);
        
        console.log('保存预设，ID:', presetId);
        console.log('预设对象:', preset);
        
        return presetId;
    }

    /**
     * 加载预存
     */
    async loadPreset(presetId) {
        console.log('loadPreset 被调用，presetId:', presetId);
        console.log('presetId 类型:', typeof presetId);
        console.log('预设 Map 大小:', this.presets.size);
        console.log('预设 Map 的所有键:', Array.from(this.presets.keys()));
        
        // 尝试直接获取
        let preset = this.presets.get(presetId);
        
        // 如果找不到，尝试字符串匹配
        if (!preset) {
            console.log('直接查找失败，尝试字符串匹配...');
            for (const [key, value] of this.presets.entries()) {
                if (String(key) === String(presetId) || String(value.id) === String(presetId)) {
                    preset = value;
                    console.log('找到匹配的预设:', key, value);
                    break;
                }
            }
        }
        
        if (!preset) {
            console.error('预存不存在，presetId:', presetId);
            console.error('可用的预设ID:', Array.from(this.presets.keys()));
            this.showMessage('预存不存在', 'error');
            return;
        }
        
        console.log('找到预设:', preset);

        try {
            this.showLoading('正在加载预存...');
            
            // 先切换到预存时的格式（如果预存中有格式信息）
            if (window.templateManager && preset.format) {
                console.log('切换格式到:', preset.format);
                try {
                    window.templateManager.setFormat(preset.format);
                    // 等待格式切换完成
                    await new Promise(resolve => setTimeout(resolve, 150));
                } catch (formatError) {
                    console.error('格式切换失败:', formatError);
                    throw new Error(`格式切换失败: ${formatError.message}`);
                }
            }
            
            // 设置项目
            if (window.app && preset.projectName) {
                console.log('加载项目:', preset.projectName);
                const projectSelect = document.getElementById('projectSelect');
                if (projectSelect) {
                    projectSelect.value = preset.projectName;
                    try {
                        await window.app.handleProjectChange({target: {value: preset.projectName}});
                        // 等待项目加载完成
                        await new Promise(resolve => setTimeout(resolve, 200));
                    } catch (projectError) {
                        console.error('项目加载失败:', projectError);
                        throw new Error(`项目加载失败: ${projectError.message}`);
                    }
                } else {
                    throw new Error('找不到项目选择下拉框');
                }
            }
            
            // 设置模板
            if (window.templateManager && preset.templateId) {
                console.log('加载模板:', preset.templateId);
                // 标记正在加载预存，避免模板管理器恢复模板图片
                window.templateManager.isLoadingPreset = true;
                
                try {
                    await window.templateManager.loadTemplate(preset.templateId);
                    // 等待模板加载完成，包括DOM更新和模板图片恢复
                    await new Promise(resolve => setTimeout(resolve, 600));
                    
                    // 验证模板是否加载成功
                    const templateContainer = document.getElementById('templateContainer');
                    if (!templateContainer || !templateContainer.querySelector('.template-content')) {
                        throw new Error('模板内容未正确加载');
                    }
                } catch (templateError) {
                    console.error('模板加载失败:', templateError);
                    window.templateManager.isLoadingPreset = false;
                    throw new Error(`模板加载失败: ${templateError.message}`);
                }
            }
            
            // 设置属性选择
            if (preset.selectedAttributes) {
                console.log('设置属性选择:', preset.selectedAttributes);
                document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = preset.selectedAttributes.includes(checkbox.getAttribute('data-key'));
                });
                
                if (window.templateManager) {
                    window.templateManager.selectedAttributes = new Set(preset.selectedAttributes);
                    if (preset.projectInfo) {
                        window.templateManager.updateProjectInfo(preset.projectInfo);
                    }
                }
            }
            
            // 恢复图片 - 在模板加载完成后，清除模板图片，恢复预存图片
            if (preset.images && preset.images.length > 0) {
                console.log('准备恢复图片，图片数量:', preset.images.length);
                // 等待模板加载完成，确保DOM完全更新
                await new Promise(resolve => setTimeout(resolve, 800));
                
                try {
                    // 先清除模板恢复的图片
                    document.querySelectorAll('.image-frame img').forEach(img => {
                        img.remove();
                    });
                    
                    // 显示占位符
                    document.querySelectorAll('.image-frame .image-placeholder').forEach(placeholder => {
                        placeholder.style.display = 'block';
                    });
                    
                    // 恢复预存图片
                    this.restoreImages(preset.images);
                    
                    // 等待图片恢复完成
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (imageError) {
                    console.error('图片恢复失败:', imageError);
                    // 图片恢复失败不应该阻止整个加载流程
                    console.warn('图片恢复失败，但继续加载其他内容');
                }
            }
            
            // 清除加载预存标记
            if (window.templateManager) {
                window.templateManager.isLoadingPreset = false;
            }
            
            // 设置缩放比例
            if (preset.scale) {
                const zoomSlider = document.getElementById('zoomSlider');
                const zoomValue = document.getElementById('zoomValue');
                if (zoomSlider && zoomValue) {
                    zoomSlider.value = preset.scale;
                    zoomValue.textContent = Math.round(preset.scale * 100) + '%';
                    if (window.app) {
                        window.app.updateTemplateScale(preset.scale);
                    }
                }
            }
            
            this.hideLoading();
            this.closeDropdown();
            this.showMessage(`已加载预存: ${preset.name}`, 'success');
            console.log('预存加载成功:', preset.name);
            
        } catch (error) {
            console.error('加载预存失败:', error);
            console.error('错误堆栈:', error.stack);
            
            // 清除加载预存标记
            if (window.templateManager) {
                window.templateManager.isLoadingPreset = false;
            }
            
            this.hideLoading();
            // 显示更详细的错误信息
            const errorMessage = error.message || '加载预存失败';
            this.showMessage(errorMessage, 'error');
        }
    }

    /**
     * 恢复图片状态
     */
    restoreImages(images) {
        console.log('restoreImages 被调用，图片数量:', images.length);
        
        // 先检查所有图片框是否存在
        const allFrames = document.querySelectorAll('.image-frame');
        console.log('当前页面中的图片框数量:', allFrames.length);
        allFrames.forEach((frame, index) => {
            const frameIndex = frame.dataset.frame || frame.getAttribute('data-frame');
            console.log(`图片框 ${index + 1}: data-frame="${frameIndex}"`);
        });
        
        images.forEach((imageData, index) => {
            console.log(`恢复图片 ${index + 1}:`, imageData);
            
            // frameIndex 现在已经是 data-frame 的值（从1开始）
            const frameIndex = imageData.frameIndex;
            const frame = document.querySelector(`[data-frame="${frameIndex}"]`);
            
            if (!frame) {
                console.error(`找不到图片框 data-frame="${frameIndex}"`);
                return;
            }
            
            console.log(`找到图片框 data-frame="${frameIndex}"`);
            
            // 创建图片元素
            const img = document.createElement('img');
            img.src = imageData.src;
            img.style.transform = imageData.transform || 'translate(0, 0) scale(1)';
            img.style.objectPosition = imageData.objectPosition || 'center center';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.display = 'block';
            img.style.cursor = 'move';
            img.style.transition = 'transform 0.3s';
            img.draggable = false;
            img.dataset.originalSrc = imageData.src;
            
            // 添加图片加载错误处理
            img.onerror = function() {
                console.error('图片加载失败:', imageData.src);
            };
            
            // 添加图片加载成功处理
            img.onload = function() {
                console.log('图片加载成功:', imageData.src);
            };
            
            // 清空框架并添加图片
            const placeholder = frame.querySelector('.image-placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
            
            // 移除现有图片
            const existingImg = frame.querySelector('img');
            if (existingImg) {
                existingImg.remove();
            }
            
            frame.appendChild(img);
            console.log(`图片已添加到图片框 data-frame="${frameIndex}"`);
            
            // 添加拖拽事件
            if (window.templateManager) {
                window.templateManager.addImageMoveEvents(img);
            }
        });
        
        // 初始化拖拽功能
        if (window.dragDropManager) {
            window.dragDropManager.initDropZones();
        }
        
        console.log('图片恢复完成');
    }

    /**
     * 删除预存
     */
    deletePreset(presetId) {
        const preset = this.presets.get(presetId);
        if (!preset) return;
        
        if (confirm(`确定要删除预存 "${preset.name}" 吗？`)) {
            this.presets.delete(presetId);
            this.updatePresetList();
            this.savePresetsToStorage();
            this.showMessage(`已删除: ${preset.name}`, 'success');
        }
    }

    /**
     * 清空所有预存
     */
    clearAllPresets() {
        if (this.presets.size === 0) {
            this.showMessage('没有预存需要清空', 'info');
            return;
        }
        
        if (confirm(`确定要清空所有 ${this.presets.size} 个预存吗？此操作不可恢复。`)) {
            this.presets.clear();
            this.updatePresetList();
            this.savePresetsToStorage();
            this.showMessage('已清空所有预存', 'success');
        }
    }

    /**
     * 处理导出格式的选择并执行下载
     */
    async handleDownloadAllPresets() {
        const formatSelect = document.getElementById('downloadFormatSelect');
        const format = formatSelect ? formatSelect.value : 'html';

        if (format === 'ppt') {
            await this.downloadCombinedPPT();
        } else if (format === 'pdf') {
            await this.downloadCombinedPDF();
        } else {
            await this.downloadCombinedHTML();
        }
    }

    /**
     * 获取按创建时间排序的预存数组
     */
    getSortedPresets() {
        return Array.from(this.presets.values()).sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
        );
    }

    /**
     * 下载合并的HTML文件
     */
    async downloadCombinedHTML() {
        const presetArray = this.getSortedPresets();
        if (presetArray.length === 0) {
            this.showMessage('没有预存页面可以下载', 'error');
            return;
        }

        try {
            this.showLoading('正在生成合并文件...');
            
            const combinedHTML = await this.generateCombinedHTML(presetArray);
            this.downloadFile(combinedHTML, 'combined_templates.html', 'text/html');
            
            this.showMessage(`已下载合并文件，包含 ${presetArray.length} 个页面`, 'success');
            
        } catch (error) {
            console.error('下载合并文件失败:', error);
            this.showMessage('下载失败，请重试', 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 下载合并的PPT文件
     */
    async downloadCombinedPPT() {
        const presetArray = this.getSortedPresets();
        if (presetArray.length === 0) {
            this.showMessage('没有预存页面可以下载', 'error');
            return;
        }

        if (!window.PptxGenJS || !window.html2canvas) {
            this.showMessage('PPT 导出依赖未正确加载，请刷新页面后重试', 'error');
            return;
        }

        let renderContainer = null;

        try {
            this.showLoading('正在生成 PPT 文件...');

            renderContainer = this.getExportRenderContainer();
            renderContainer.innerHTML = '';

            // 确保所有预存都已记录准确尺寸
            for (const preset of presetArray) {
                await this.ensurePresetHasDimensions(preset, renderContainer);
            }

            const baseDims = this.getExportBaseDimensions(presetArray);
            const pptx = new window.PptxGenJS();

            const layoutWidth = baseDims.widthInches > 0 ? baseDims.widthInches : 13.33;
            const layoutHeight = baseDims.heightInches > 0 ? baseDims.heightInches : 7.5;
            const customLayoutName = `CUSTOM_${Math.round(layoutWidth * 100)}x${Math.round(layoutHeight * 100)}`;

            let layoutName = 'LAYOUT_WIDE';
            try {
                pptx.defineLayout({
                    name: customLayoutName,
                    width: layoutWidth,
                    height: layoutHeight
                });
                layoutName = customLayoutName;
            } catch (layoutError) {
                console.warn('定义自定义PPT布局失败，使用默认布局', layoutError);
            }

            pptx.layout = layoutName;

            renderContainer.innerHTML = '';

            for (const preset of presetArray) {
                if (!preset.templateHTML) {
                    console.warn('预存缺少模板HTML，跳过：', preset.name);
                    continue;
                }

                const dims = this.getTemplateDimensions(preset);
                const wrapper = this.createExportWrapper(preset.templateHTML, preset.templateSize);

                renderContainer.appendChild(wrapper);

                await this.waitForNextFrame();

                const canvas = await window.html2canvas(wrapper, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    useCORS: true,
                    logging: false
                });

                const dataUrl = canvas.toDataURL('image/png', 1.0);
                const slide = pptx.addSlide();

                const widthInches = this.convertPxToInches(dims.widthPx);
                const heightInches = this.convertPxToInches(dims.heightPx);
                const offsetX = Math.max(0, (baseDims.widthInches - widthInches) / 2);
                const offsetY = Math.max(0, (baseDims.heightInches - heightInches) / 2);

                slide.addImage({
                    data: dataUrl,
                    x: offsetX,
                    y: offsetY,
                    w: widthInches,
                    h: heightInches
                });

                renderContainer.removeChild(wrapper);
            }

            const fileName = `建筑模板合集_${presetArray.length}页.pptx`;
            await pptx.writeFile({ fileName });

            this.showMessage(`已导出 PPT，包含 ${presetArray.length} 个页面`, 'success');
        } catch (error) {
            console.error('PPT 导出失败:', error);
            const message = error && error.message ? error.message : 'PPT 导出失败，请重试';
            this.showMessage(message, 'error');
        } finally {
            this.hideLoading();
            if (renderContainer) {
                renderContainer.innerHTML = '';
            }
        }
    }

    /**
     * 下载合并的PDF文件
     */
    async downloadCombinedPDF() {
        const presetArray = this.getSortedPresets();
        if (presetArray.length === 0) {
            this.showMessage('没有预存页面可以下载', 'error');
            return;
        }

        if (!window.jspdf || !window.html2canvas) {
            this.showMessage('PDF 导出依赖未正确加载，请刷新页面后重试', 'error');
            return;
        }

        let renderContainer = null;

        try {
            this.showLoading('正在生成 PDF 文件...');

            renderContainer = this.getExportRenderContainer();
            renderContainer.innerHTML = '';

            for (const preset of presetArray) {
                await this.ensurePresetHasDimensions(preset, renderContainer);
            }

            const baseDims = this.getExportBaseDimensions(presetArray);
            const orientation = baseDims.widthPx >= baseDims.heightPx ? 'landscape' : 'portrait';
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation, unit: 'pt', format: [baseDims.widthPt, baseDims.heightPt] });

            renderContainer.innerHTML = '';

            for (let index = 0; index < presetArray.length; index++) {
                const preset = presetArray[index];
                if (!preset.templateHTML) {
                    console.warn('预存缺少模板HTML，跳过：', preset.name);
                    continue;
                }

                const dims = this.getTemplateDimensions(preset);
                const widthPt = this.convertPxToPoints(dims.widthPx);
                const heightPt = this.convertPxToPoints(dims.heightPx);

                if (index > 0) {
                    pdf.addPage([widthPt, heightPt]);
                }

                const wrapper = this.createExportWrapper(preset.templateHTML, preset.templateSize);

                renderContainer.appendChild(wrapper);

                await this.waitForNextFrame();

                const canvas = await window.html2canvas(wrapper, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    useCORS: true,
                    logging: false
                });

                const imgData = canvas.toDataURL('image/jpeg', 1.0);

                pdf.addImage(imgData, 'JPEG', 0, 0, widthPt, heightPt);

                renderContainer.removeChild(wrapper);
            }

            const fileName = `建筑模板合集_${presetArray.length}页.pdf`;
            await pdf.save(fileName, { returnPromise: true });

            this.showMessage(`已导出 PDF，包含 ${presetArray.length} 个页面`, 'success');
        } catch (error) {
            console.error('PDF 导出失败:', error);
            const message = error && error.message ? error.message : 'PDF 导出失败，请重试';
            this.showMessage(message, 'error');
        } finally {
            this.hideLoading();
            if (renderContainer) {
                renderContainer.innerHTML = '';
            }
        }
    }

    /**
     * 生成合并的HTML文件
     */
    async generateCombinedHTML(presetArray = this.getSortedPresets()) {
        // 读取模板CSS - 根据当前格式加载对应的CSS
        let templateCSS = '';
        const format = window.templateManager ? window.templateManager.currentFormat : 'text';
        const cssMap = {
            'text': 'css/templates_document.css',
            'report': 'css/templates_presentation.css',
            'board': 'css/templates_display.css'
        };
        const cssPath = cssMap[format] || 'css/templates_document.css';
        
        try {
            const response = await fetch(cssPath);
            templateCSS = await response.text();
        } catch (error) {
            console.warn(`无法加载模板CSS (${cssPath}):`, error);
        }
        
        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>建筑项目展示合集 - ${presetArray.length}个项目</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            background: #f5f5f5;
            overflow-x: hidden;
        }
        
        .navigation {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            padding: 15px;
        }
        
        .nav-info {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
            text-align: center;
        }
        
        .nav-buttons {
            display: flex;
            gap: 8px;
        }
        
        .nav-btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .nav-btn:hover {
            background: #2980b9;
        }
        
        .nav-btn:disabled {
            background: #bdc3c7;
            cursor: not-allowed;
        }
        
        .page-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            page-break-after: always;
        }
        
        .page-container:last-child {
            page-break-after: avoid;
        }
        
        .page-header {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(255, 255, 255, 0.9);
            padding: 10px 15px;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .page-number {
            font-size: 14px;
            color: #666;
            font-weight: bold;
        }
        
        .page-title {
            font-size: 16px;
            color: #2c3e50;
            margin-top: 5px;
        }
        
        ${templateCSS}
        
        /* 打印样式 */
        @media print {
            body {
                background: white;
            }
            
            .navigation {
                display: none;
            }
            
            .page-container {
                page-break-after: always;
                min-height: 100vh;
                padding: 0;
            }
            
            .page-container:last-child {
                page-break-after: avoid;
            }
            
            .page-header {
                position: absolute;
                top: 10px;
                left: 10px;
            }
        }
        
        /* 隐藏除当前页外的所有页面 */
        .page-container.hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="navigation">
        <div class="nav-info">
            第 <span id="currentPage">1</span> / ${presetArray.length} 页
        </div>
        <div class="nav-buttons">
            <button class="nav-btn" id="prevBtn" onclick="previousPage()">上一页</button>
            <button class="nav-btn" id="nextBtn" onclick="nextPage()">下一页</button>
            <button class="nav-btn" onclick="printAll()">打印全部</button>
        </div>
    </div>
    
    ${presetArray.map((preset, index) => `
    <div class="page-container" id="page${index + 1}" ${index > 0 ? 'style="display: none;"' : ''}>
        <div class="page-header">
            <div class="page-number">第 ${index + 1} 页</div>
            <div class="page-title">${preset.name}</div>
        </div>
        ${preset.templateHTML}
    </div>
    `).join('')}
    
    <script>
        let currentPage = 1;
        const totalPages = ${presetArray.length};
        
        function updateNavigation() {
            document.getElementById('currentPage').textContent = currentPage;
            document.getElementById('prevBtn').disabled = currentPage === 1;
            document.getElementById('nextBtn').disabled = currentPage === totalPages;
            
            // 隐藏所有页面
            for (let i = 1; i <= totalPages; i++) {
                const page = document.getElementById('page' + i);
                if (page) {
                    page.style.display = i === currentPage ? 'flex' : 'none';
                }
            }
        }
        
        function previousPage() {
            if (currentPage > 1) {
                currentPage--;
                updateNavigation();
            }
        }
        
        function nextPage() {
            if (currentPage < totalPages) {
                currentPage++;
                updateNavigation();
            }
        }
        
        function printAll() {
            // 显示所有页面用于打印
            for (let i = 1; i <= totalPages; i++) {
                const page = document.getElementById('page' + i);
                if (page) {
                    page.style.display = 'flex';
                    page.classList.remove('hidden');
                }
            }
            
            window.print();
            
            // 打印后恢复单页显示
            setTimeout(() => {
                updateNavigation();
            }, 100);
        }
        
        // 键盘快捷键
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                previousPage();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                nextPage();
            } else if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                printAll();
            }
        });
        
        // 初始化
        updateNavigation();
    </script>
</body>
</html>`;
        
        return html;
    }

    /**
     * 创建用于导出的模板包装元素
     */
    createExportWrapper(templateHTML, templateSize = null) {
        const wrapper = document.createElement('div');
        wrapper.className = 'export-wrapper';
        
        const dimensions = this.getTemplateDimensionsFromSize(templateSize);
        wrapper.style.width = `${dimensions.widthPx}px`;
        wrapper.style.minHeight = `${dimensions.heightPx}px`;
        wrapper.style.background = '#ffffff';
        wrapper.style.boxSizing = 'border-box';
        wrapper.style.margin = '0';
        wrapper.innerHTML = templateHTML;
        wrapper.dataset.exportWidthPx = String(dimensions.widthPx);
        wrapper.dataset.exportHeightPx = String(dimensions.heightPx);
        return wrapper;
    }

    /**
     * 根据模板尺寸对象获取数值（像素）
     */
    getTemplateDimensionsFromSize(templateSize) {
        const fallback = { widthPx: 1280, heightPx: 720 };
        if (!templateSize) {
            return fallback;
        }

        const widthPx = Number(templateSize.widthPx ?? templateSize.width ?? templateSize.w);
        const heightPx = Number(templateSize.heightPx ?? templateSize.height ?? templateSize.h);

        if (Number.isFinite(widthPx) && widthPx > 0 && Number.isFinite(heightPx) && heightPx > 0) {
            return { widthPx, heightPx };
        }

        return fallback;
    }

    /**
     * 获取预存模板的尺寸信息
     */
    getTemplateDimensions(preset) {
        if (!preset) {
            return this.getTemplateDimensionsFromSize(null);
        }
        return this.getTemplateDimensionsFromSize(preset.templateSize);
    }

    /**
     * 将像素转换为英寸
     */
    convertPxToInches(px) {
        return px / 96;
    }

    /**
     * 将像素转换为磅
     */
    convertPxToPoints(px) {
        return (px / 96) * 72;
    }

    /**
     * 获取导出的基准尺寸（基于第一个预存模板）
     */
    getExportBaseDimensions(presetArray) {
        const firstPreset = presetArray[0];
        const dims = this.getTemplateDimensions(firstPreset);
        const widthInches = this.convertPxToInches(dims.widthPx);
        const heightInches = this.convertPxToInches(dims.heightPx);
        const widthPt = this.convertPxToPoints(dims.widthPx);
        const heightPt = this.convertPxToPoints(dims.heightPx);

        return {
            widthPx: dims.widthPx,
            heightPx: dims.heightPx,
            widthInches,
            heightInches,
            widthPt,
            heightPt
        };
    }

    /**
     * 确保预存记录了准确的模板尺寸
     */
    async ensurePresetHasDimensions(preset, renderContainer) {
        if (!preset || !preset.templateHTML) {
            return;
        }

        const defaultDims = this.getTemplateDimensionsFromSize(null);
        const currentDims = this.getTemplateDimensions(preset);
        const hasAccurateSize = preset.templateSize &&
            (currentDims.widthPx !== defaultDims.widthPx || currentDims.heightPx !== defaultDims.heightPx);

        if (hasAccurateSize) {
            return;
        }

        const tempWrapper = this.createExportWrapper(preset.templateHTML, preset.templateSize);
        renderContainer.appendChild(tempWrapper);

        await this.waitForNextFrame();

        const measured = this.measureWrapperDimensions(tempWrapper);
        if (measured) {
            preset.templateSize = measured;
        }

        renderContainer.removeChild(tempWrapper);
    }

    /**
     * 测量包装元素中的模板尺寸
     */
    measureWrapperDimensions(wrapper) {
        if (!wrapper) {
            return null;
        }
        const templateContent = wrapper.querySelector('.template-content');
        if (!templateContent) {
            return null;
        }

        const computedStyle = window.getComputedStyle(templateContent);
        const widthPx = parseFloat(computedStyle.width);
        const heightPx = parseFloat(computedStyle.height);

        if (Number.isFinite(widthPx) && Number.isFinite(heightPx) && widthPx > 0 && heightPx > 0) {
            wrapper.style.width = `${widthPx}px`;
            wrapper.style.minHeight = `${heightPx}px`;
            return { widthPx, heightPx };
        }

        return null;
    }

    /**
     * 获取用于 PPT 导出的隐藏渲染容器
     */
    getExportRenderContainer() {
        let container = document.getElementById('exportRenderContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'exportRenderContainer';
            container.style.position = 'fixed';
            container.style.top = '-10000px';
            container.style.left = '-10000px';
            container.style.width = '1280px';
            container.style.pointerEvents = 'none';
            container.style.opacity = '0';
            container.setAttribute('aria-hidden', 'true');
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * 等待下一帧，以便 DOM 更新完成
     */
    waitForNextFrame() {
        return new Promise((resolve) => {
            requestAnimationFrame(() => resolve());
        });
    }

    /**
     * 下载文件
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 切换下拉菜单显示状态
     */
    toggleDropdown() {
        if (this.isDropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    /**
     * 打开下拉菜单
     */
    openDropdown() {
        const dropdown = document.getElementById('presetDropdown');
        if (dropdown) {
            dropdown.classList.add('show');
            this.isDropdownOpen = true;
            this.updatePresetList();
        }
    }

    /**
     * 关闭下拉菜单
     */
    closeDropdown() {
        const dropdown = document.getElementById('presetDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
            this.isDropdownOpen = false;
        }
    }

    /**
     * 更新预存列表显示
     */
    updatePresetList() {
        const presetList = document.getElementById('presetList');
        if (!presetList) return;

        if (this.presets.size === 0) {
            presetList.innerHTML = '<div class="preset-empty">暂无预存页面</div>';
            return;
        }

        const presetArray = Array.from(this.presets.values()).sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        presetList.innerHTML = presetArray.map(preset => {
            // 格式化格式名称
            const formatNames = {
                'text': '文本格式',
                'report': '汇报格式',
                'board': '展板格式'
            };
            const formatName = formatNames[preset.format] || '文本格式';
            
            // 确保 preset.id 存在且是字符串
            const presetId = preset.id ? String(preset.id) : '';
            if (!presetId) {
                console.error('预设缺少ID:', preset);
                return ''; // 跳过无效的预设
            }
            
            // 处理日期
            let createdAtStr = '';
            try {
                const createdAt = preset.createdAt instanceof Date ? preset.createdAt : new Date(preset.createdAt || Date.now());
                createdAtStr = createdAt.toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                createdAtStr = '未知时间';
            }
            
            return `
            <div class="preset-item" data-preset-id="${presetId}">
                <div class="preset-item-info">
                    <div class="preset-item-name">${preset.name || '未命名'}</div>
                    <div class="preset-item-details">
                        ${formatName} · 模板${preset.templateId || '?'} · ${createdAtStr}
                    </div>
                </div>
                <div class="preset-item-actions">
                    <button class="preset-item-btn load-btn">加载</button>
                    <button class="preset-item-btn delete-btn">删除</button>
                </div>
            </div>
        `;
        }).filter(html => html).join('');
    }

    /**
     * 保存预存到本地存储
     */
    savePresetsToStorage() {
        try {
            const presetsData = Array.from(this.presets.entries());
            localStorage.setItem('buildingTemplatePresets', JSON.stringify(presetsData));
        } catch (error) {
            console.error('保存预存到本地存储失败:', error);
        }
    }

    /**
     * 从本地存储加载预存
     */
    loadPresetsFromStorage() {
        try {
            const stored = localStorage.getItem('buildingTemplatePresets');
            if (stored) {
                const presetsData = JSON.parse(stored);
                
                // 重新构建 Map，确保键和 preset.id 一致
                this.presets = new Map();
                for (const [key, preset] of presetsData) {
                    // 确保使用 preset.id 作为 Map 的键
                    const presetId = preset.id || key;
                    this.presets.set(presetId, preset);
                    // 确保 preset.id 存在
                    if (!preset.id) {
                        preset.id = presetId;
                    }
                    // 确保 createdAt 是 Date 对象
                    if (preset.createdAt && typeof preset.createdAt === 'string') {
                        preset.createdAt = new Date(preset.createdAt);
                    }
                }
                
                console.log(`从本地存储加载了 ${this.presets.size} 个预存`);
                console.log('预存ID列表:', Array.from(this.presets.keys()));
            }
        } catch (error) {
            console.error('从本地存储加载预存失败:', error);
            this.presets = new Map();
        }
    }

    /**
     * 显示消息
     */
    showMessage(message, type = 'info') {
        if (window.app) {
            if (type === 'error') {
                window.app.showError(message);
            } else if (type === 'success') {
                window.app.showSuccess(message);
            }
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * 显示加载状态
     */
    showLoading(message) {
        if (window.app) {
            window.app.showLoading(message);
        }
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        if (window.app) {
            window.app.hideLoading();
        }
    }

    /**
     * 获取预存统计信息
     */
    getStats() {
        const stats = {
            total: this.presets.size,
            byProject: {},
            byTemplate: {}
        };

        for (const preset of this.presets.values()) {
            // 按项目统计
            if (preset.projectName) {
                stats.byProject[preset.projectName] = (stats.byProject[preset.projectName] || 0) + 1;
            }
            
            // 按模板统计
            if (preset.templateId) {
                stats.byTemplate[preset.templateId] = (stats.byTemplate[preset.templateId] || 0) + 1;
            }
        }

        return stats;
    }
}

// 创建预存管理器实例
window.presetManager = new PresetManager();

