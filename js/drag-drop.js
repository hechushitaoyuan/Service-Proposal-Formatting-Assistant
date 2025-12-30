/**
 * 拖拽功能模块
 * 负责处理图片的拖拽操作
 */
class DragDropManager {
    constructor() {
        this.draggedElement = null;
        this.draggedImageUrl = null;
        this.dropZones = [];
    }

    /**
     * 初始化拖拽功能
     */
    init() {
        this.bindImageDragEvents();
        this.initDropZones();
    }

    /**
     * 绑定图片拖拽事件
     */
    bindImageDragEvents() {
        // 使用事件委托处理动态添加的图片
        document.getElementById('projectImages').addEventListener('mousedown', (e) => {
            const imageItem = e.target.closest('.image-item');
            if (!imageItem) return;

            this.startDrag(imageItem, e);
        });
    }

    /**
     * 开始拖拽
     */
    startDrag(imageItem, startEvent) {
        const img = imageItem.querySelector('img');
        if (!img) return;

        this.draggedElement = imageItem;
        this.draggedImageUrl = img.src;

        // 创建拖拽预览元素
        const dragPreview = this.createDragPreview(img);
        document.body.appendChild(dragPreview);

        // 添加拖拽样式
        imageItem.classList.add('dragging');

        let isDragging = false;
        const startX = startEvent.clientX;
        const startY = startEvent.clientY;
        const threshold = 5; // 拖拽阈值

        const handleMouseMove = (e) => {
            const deltaX = Math.abs(e.clientX - startX);
            const deltaY = Math.abs(e.clientY - startY);

            if (!isDragging && (deltaX > threshold || deltaY > threshold)) {
                isDragging = true;
                this.showDropZones();
            }

            if (isDragging) {
                // 更新拖拽预览位置
                dragPreview.style.left = (e.clientX - 50) + 'px';
                dragPreview.style.top = (e.clientY - 50) + 'px';

                // 检查悬停的放置区域
                const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
                const dropZone = elementBelow?.closest('.image-frame');
                
                this.updateDropZoneHighlight(dropZone);
            }
        };

        const handleMouseUp = (e) => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            // 清理拖拽状态
            imageItem.classList.remove('dragging');
            document.body.removeChild(dragPreview);
            this.hideDropZones();

            if (isDragging) {
                // 处理放置
                const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
                const dropZone = elementBelow?.closest('.image-frame');
                
                if (dropZone) {
                    this.handleDrop(dropZone);
                }
            }

            this.draggedElement = null;
            this.draggedImageUrl = null;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        startEvent.preventDefault();
    }

    /**
     * 创建拖拽预览元素
     */
    createDragPreview(originalImg) {
        const preview = document.createElement('div');
        preview.className = 'drag-preview';
        preview.style.cssText = `
            position: fixed;
            width: 100px;
            height: 100px;
            pointer-events: none;
            z-index: 10000;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
            transform: rotate(5deg);
            opacity: 0.9;
        `;

        const img = document.createElement('img');
        img.src = originalImg.src;
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
        `;

        preview.appendChild(img);
        return preview;
    }

    /**
     * 初始化放置区域
     */
    initDropZones() {
        // 使用 setTimeout 确保 DOM 已更新
        setTimeout(() => {
            this.dropZones = Array.from(document.querySelectorAll('.image-frame'));
            console.log(`找到 ${this.dropZones.length} 个图片框`);
            
            this.dropZones.forEach((zone, index) => {
                // 确保图片框有 data-frame 属性
                if (!zone.dataset.frame) {
                    zone.dataset.frame = (index + 1).toString();
                    console.log(`为图片框 ${index + 1} 添加 data-frame 属性`);
                }
                
                // 移除旧的事件监听器（使用箭头函数保存引用）
                const oldEnter = zone._dragEnterHandler;
                const oldOver = zone._dragOverHandler;
                const oldLeave = zone._dragLeaveHandler;
                const oldDrop = zone._dropHandler;
                
                if (oldEnter) zone.removeEventListener('dragenter', oldEnter);
                if (oldOver) zone.removeEventListener('dragover', oldOver);
                if (oldLeave) zone.removeEventListener('dragleave', oldLeave);
                if (oldDrop) zone.removeEventListener('drop', oldDrop);

                // 创建新的事件处理函数并保存引用
                zone._dragEnterHandler = (e) => this.handleDragEnter(e);
                zone._dragOverHandler = (e) => this.handleDragOver(e);
                zone._dragLeaveHandler = (e) => this.handleDragLeave(e);
                zone._dropHandler = (e) => this.handleDropEvent(e);

                // 添加新的事件监听器
                zone.addEventListener('dragenter', zone._dragEnterHandler);
                zone.addEventListener('dragover', zone._dragOverHandler);
                zone.addEventListener('dragleave', zone._dragLeaveHandler);
                zone.addEventListener('drop', zone._dropHandler);
                
                // 添加鼠标拖拽支持
                zone.addEventListener('dragover', (e) => {
                    if (this.draggedImageUrl) {
                        e.preventDefault();
                        zone.classList.add('drag-over');
                    }
                });
            });
            
            console.log('拖拽区域初始化完成');
        }, 50);
    }

    /**
     * 显示放置区域
     */
    showDropZones() {
        this.dropZones.forEach(zone => {
            zone.classList.add('drop-zone');
        });
    }

    /**
     * 隐藏放置区域
     */
    hideDropZones() {
        this.dropZones.forEach(zone => {
            zone.classList.remove('drop-zone', 'drag-over');
        });
    }

    /**
     * 更新放置区域高亮
     */
    updateDropZoneHighlight(currentZone) {
        this.dropZones.forEach(zone => {
            if (zone === currentZone) {
                zone.classList.add('drag-over');
            } else {
                zone.classList.remove('drag-over');
            }
        });
    }

    /**
     * 处理拖拽进入
     */
    handleDragEnter(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    /**
     * 处理拖拽悬停
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    /**
     * 处理拖拽离开
     */
    handleDragLeave(e) {
        e.preventDefault();
        if (!e.currentTarget.contains(e.relatedTarget)) {
            e.currentTarget.classList.remove('drag-over');
        }
    }

    /**
     * 处理HTML5拖拽放置事件
     */
    handleDropEvent(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        // 这里处理HTML5拖拽API的放置事件
        // 主要用于兼容性支持
    }

    /**
     * 处理图片放置
     */
    handleDrop(dropZone) {
        if (!this.draggedImageUrl || !dropZone) return;

        const frameIndex = parseInt(dropZone.dataset.frame);
        if (isNaN(frameIndex)) return;

        // 使用模板管理器添加图片
        if (window.templateManager) {
            const success = window.templateManager.addImageToTemplate(this.draggedImageUrl, frameIndex);
            
            if (success) {
                // 添加成功反馈
                this.showDropSuccess(dropZone);
            } else {
                this.showDropError(dropZone);
            }
        }
    }

    /**
     * 显示放置成功反馈
     */
    showDropSuccess(dropZone) {
        dropZone.style.transform = 'scale(1.05)';
        dropZone.style.transition = 'transform 0.2s ease';
        
        setTimeout(() => {
            dropZone.style.transform = 'scale(1)';
            setTimeout(() => {
                dropZone.style.transition = '';
            }, 200);
        }, 200);
    }

    /**
     * 显示放置错误反馈
     */
    showDropError(dropZone) {
        const originalBorder = dropZone.style.border;
        dropZone.style.border = '2px solid #e74c3c';
        
        setTimeout(() => {
            dropZone.style.border = originalBorder;
        }, 1000);
    }

    /**
     * 设置图片可拖拽
     */
    makeImageDraggable(imageElement, imageUrl) {
        imageElement.draggable = true;
        imageElement.style.cursor = 'grab';

        imageElement.addEventListener('dragstart', (e) => {
            this.draggedImageUrl = imageUrl;
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', imageUrl);
            
            // 设置拖拽图像
            const dragImage = new Image();
            dragImage.src = imageUrl;
            dragImage.width = 100;
            dragImage.height = 100;
            e.dataTransfer.setDragImage(dragImage, 50, 50);
            
            imageElement.style.cursor = 'grabbing';
            this.showDropZones();
        });

        imageElement.addEventListener('dragend', (e) => {
            imageElement.style.cursor = 'grab';
            this.hideDropZones();
            this.draggedImageUrl = null;
        });

        imageElement.addEventListener('mousedown', () => {
            imageElement.style.cursor = 'grabbing';
        });

        imageElement.addEventListener('mouseup', () => {
            imageElement.style.cursor = 'grab';
        });
    }

    /**
     * 创建图片项元素
     */
    createImageItem(imageData, index) {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.dataset.imageUrl = imageData.url;
        
        const img = document.createElement('img');
        img.src = imageData.url;
        img.alt = imageData.name;
        img.loading = 'lazy';
        
        const overlay = document.createElement('div');
        overlay.className = 'image-overlay';
        overlay.textContent = `图片 ${imageData.index}`;
        
        imageItem.appendChild(img);
        imageItem.appendChild(overlay);
        
        // 设置拖拽功能
        this.makeImageDraggable(img, imageData.url);
        
        return imageItem;
    }

    /**
     * 批量创建图片项
     */
    createImageItems(imagesData) {
        const fragment = document.createDocumentFragment();
        
        imagesData.forEach((imageData, index) => {
            const imageItem = this.createImageItem(imageData, index);
            fragment.appendChild(imageItem);
        });
        
        return fragment;
    }

    /**
     * 清理拖拽状态
     */
    cleanup() {
        this.hideDropZones();
        this.draggedElement = null;
        this.draggedImageUrl = null;
        
        // 移除所有拖拽预览元素
        document.querySelectorAll('.drag-preview').forEach(el => el.remove());
    }

    /**
     * 重新初始化放置区域（在模板切换时调用）
     */
    reinitialize() {
        this.cleanup();
        this.initDropZones();
    }

    /**
     * 检查是否支持拖拽
     */
    isDragSupported() {
        return 'draggable' in document.createElement('div');
    }

    /**
     * 获取拖拽状态信息
     */
    getDragInfo() {
        return {
            isDragging: !!this.draggedElement,
            draggedImageUrl: this.draggedImageUrl,
            dropZoneCount: this.dropZones.length,
            dragSupported: this.isDragSupported()
        };
    }
}

// 创建全局实例
window.dragDropManager = new DragDropManager();

