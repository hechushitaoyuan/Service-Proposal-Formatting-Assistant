/**
 * 数据加载模块
 * 负责加载和管理CSV数据以及项目图片
 */
class DataLoader {
    constructor() {
        this.projectData = [];
        this.projectDataEn = [];
        this.currentLanguage = 'zh'; // 'zh' 中文, 'en' 英文
        this.currentProject = null;
        this.imageCache = new Map();
    }

    /**
     * 加载CSV数据
     */
    async loadProjectData() {
        try {
            const response = await fetch('building_data.csv');
            const csvText = await response.text();
            this.projectData = this.parseCSV(csvText);
            return this.projectData;
        } catch (error) {
            console.error('加载项目数据失败:', error);
            throw new Error('无法加载项目数据文件');
        }
    }

    /**
     * 加载英文CSV数据
     */
    async loadProjectDataEn() {
        try {
            const response = await fetch('building_data_en.csv');
            const csvText = await response.text();
            this.projectDataEn = this.parseCSV(csvText);
            return this.projectDataEn;
        } catch (error) {
            console.error('加载英文项目数据失败:', error);
            throw new Error('无法加载英文项目数据文件');
        }
    }

    /**
     * 加载所有语言数据
     */
    async loadAllData() {
        await Promise.all([
            this.loadProjectData(),
            this.loadProjectDataEn()
        ]);
    }

    /**
     * 设置当前语言
     */
    setLanguage(lang) {
        if (lang === 'zh' || lang === 'en') {
            this.currentLanguage = lang;
        }
    }

    /**
     * 获取当前语言
     */
    getLanguage() {
        return this.currentLanguage;
    }

    /**
     * 解析CSV文本
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length >= headers.length && values[0].trim()) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header.trim()] = values[index] ? values[index].trim() : '';
                });
                data.push(row);
            }
        }

        return data;
    }

    /**
     * 解析CSV行，处理逗号分隔
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    /**
     * 获取项目列表
     */
    getProjectList() {
        const data = this.currentLanguage === 'en' ? this.projectDataEn : this.projectData;
        const key = this.currentLanguage === 'en' ? 'Project' : '项目工程';
        return data.map(item => item[key]).filter(name => name);
    }

    /**
     * 获取特定项目信息
     */
    getProjectInfo(projectName) {
        const data = this.currentLanguage === 'en' ? this.projectDataEn : this.projectData;
        const keyMap = this.currentLanguage === 'en' ? {
            name: 'Project',
            type: 'Type',
            area: 'Area',
            height: 'Height',
            cost: 'Cost',
            location: 'Location',
            partner: 'Partner',
            time: 'Time',
            award: 'Award'
        } : {
            name: '项目工程',
            type: '项目类型',
            area: '建筑面积',
            height: '建筑高度',
            cost: '工程造价',
            location: '建设地点',
            partner: '合作单位',
            time: '设计时间',
            award: '获奖名称'
        };
        
        const project = data.find(item => item[keyMap.name] === projectName);
        if (project) {
            return {
                AA: project[keyMap.name] || '',
                BB: project[keyMap.type] || '',
                CC: project[keyMap.area] || '',
                DD: project[keyMap.height] || '',
                EE: project[keyMap.cost] || '',
                FF: project[keyMap.location] || '',
                GG: project[keyMap.partner] || '',
                HH: project[keyMap.time] || '',
                II: project[keyMap.award] || ''
            };
        }
        return null;
    }

    /**
     * 获取属性显示名称
     */
    getAttributeDisplayNames() {
        if (this.currentLanguage === 'en') {
            return {
                BB: 'Type',
                CC: 'Area',
                DD: 'Height',
                EE: 'Cost',
                FF: 'Location',
                GG: 'Partner',
                HH: 'Time',
                II: 'Award'
            };
        } else {
            return {
                BB: '项目类型',
                CC: '建筑面积',
                DD: '建筑高度',
                EE: '工程造价',
                FF: '建设地点',
                GG: '合作单位',
                HH: '设计时间',
                II: '获奖名称'
            };
        }
    }

    /**
     * 加载项目图片
     */
    async loadProjectImages(projectName) {
        if (!projectName) return [];

        // 检查缓存
        if (this.imageCache.has(projectName)) {
            return this.imageCache.get(projectName);
        }

        try {
            const images = [];
            const imagePath = `img/${projectName}/`;
            
            // 尝试加载常见的图片文件
            for (let i = 1; i <= 20; i++) {
                const imageName = `${projectName} (${i}).jpg`;
                const imageUrl = imagePath + imageName;
                
                try {
                    const exists = await this.checkImageExists(imageUrl);
                    if (exists) {
                        images.push({
                            name: imageName,
                            url: imageUrl,
                            index: i
                        });
                    }
                } catch (error) {
                    // 图片不存在，继续下一个
                    continue;
                }
            }

            // 缓存结果
            this.imageCache.set(projectName, images);
            return images;
        } catch (error) {
            console.error('加载项目图片失败:', error);
            return [];
        }
    }

    /**
     * 检查图片是否存在
     */
    async checkImageExists(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
            
            // 设置超时
            setTimeout(() => resolve(false), 3000);
        });
    }

    /**
     * 预加载图片
     */
    async preloadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    /**
     * 获取当前选中的项目
     */
    getCurrentProject() {
        return this.currentProject;
    }

    /**
     * 设置当前选中的项目
     */
    setCurrentProject(projectName) {
        this.currentProject = projectName;
    }

    /**
     * 清除图片缓存
     */
    clearImageCache() {
        this.imageCache.clear();
    }

    /**
     * 获取属性显示名称映射
     */
    getAttributeDisplayNames() {
        return {
            BB: '项目类型',
            CC: '建筑面积',
            DD: '建筑高度',
            EE: '工程造价',
            FF: '建设地点',
            GG: '合作单位',
            HH: '设计时间',
            II: '获奖名称'
        };
    }

    /**
     * 获取数据统计信息
     */
    getDataStats() {
        return {
            totalProjects: this.projectData.length,
            projectTypes: [...new Set(this.projectData.map(item => item['项目类型']).filter(type => type))],
            locations: [...new Set(this.projectData.map(item => item['建设地点']).filter(loc => loc))],
            cacheSize: this.imageCache.size
        };
    }
}

// 创建全局实例
window.dataLoader = new DataLoader();

