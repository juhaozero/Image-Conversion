// 全局变量
let uploadedImages = [];
let convertedImages = [];
let nextImageId = 1;

// 生成唯一ID
function generateUniqueId() {
    return `img_${nextImageId++}_${Date.now()}`;
}

// 重置上传区域状态
function resetUploadArea() {
    // 重置文件输入框
    fileInput.value = '';
    
    // 确保上传区域可用
    uploadArea.classList.remove('disabled', 'dragover');
    uploadArea.style.pointerEvents = 'auto';
    uploadArea.style.opacity = '1';
    
    // 重置拖拽状态
    uploadArea.classList.remove('dragover');
    
    console.log('上传区域已重置');
}

// DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const settingsSection = document.getElementById('settingsSection');
const previewSection = document.getElementById('previewSection');
const resultSection = document.getElementById('resultSection');
const imageGrid = document.getElementById('imageGrid');
const resultGrid = document.getElementById('resultGrid');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateQualityDisplay();
    
    // 检查JSZip库是否可用
    if (typeof JSZip !== 'undefined') {
        console.log('✅ JSZip库已加载，支持ZIP打包下载');
        showMessage('ZIP打包下载功能已启用', 'success', 2000); // 只显示2秒
    } else {
        console.warn('⚠️ JSZip库未加载，ZIP功能不可用');
        showMessage('ZIP功能不可用，将使用逐个下载', 'warning', 3000); // 只显示3秒
    }
});

// 初始化事件监听器
function initializeEventListeners() {
    // 文件选择
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖拽上传
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // 质量滑块
    qualitySlider.addEventListener('input', updateQualityDisplay);
}

// 处理文件选择
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    processFiles(files);
}

// 处理拖拽悬停
function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

// 处理拖拽离开
function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

// 处理拖拽放置
function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = Array.from(event.dataTransfer.files);
    processFiles(files);
}

// 处理文件
function processFiles(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        showMessage('请选择图片文件', 'error');
        return;
    }
    
    imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            // 创建图片对象来获取尺寸信息
            const img = new Image();
            img.onload = function() {
                const imageData = {
                    id: generateUniqueId(),
                    file: file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    dataUrl: e.target.result,
                    dimensions: { width: img.width, height: img.height }
                };
                
                uploadedImages.push(imageData);
                updatePreview();
            };
            img.onerror = function() {
                // 如果无法获取尺寸，使用默认值
                const imageData = {
                    id: generateUniqueId(),
                    file: file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    dataUrl: e.target.result,
                    dimensions: { width: 0, height: 0 }
                };
                
                uploadedImages.push(imageData);
                updatePreview();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
    
    showMessage(`成功上传 ${imageFiles.length} 张图片`, 'success');
}

// 更新预览
function updatePreview() {
    if (uploadedImages.length > 0) {
        settingsSection.style.display = 'block';
        previewSection.style.display = 'block';
        renderImageGrid();
    } else {
        settingsSection.style.display = 'none';
        previewSection.style.display = 'none';
        
        // 当没有图片时，确保上传区域处于可用状态
        uploadArea.classList.remove('disabled');
        uploadArea.style.pointerEvents = 'auto';
        uploadArea.style.opacity = '1';
    }
}

// 渲染图片网格
function renderImageGrid() {
    imageGrid.innerHTML = '';
    
    uploadedImages.forEach(image => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        
        // 显示尺寸信息
        let sizeInfo = '';
        if (image.dimensions && image.dimensions.width > 0 && image.dimensions.height > 0) {
            sizeInfo = `<div>尺寸: ${image.dimensions.width}×${image.dimensions.height}</div>`;
        } else {
            sizeInfo = `<div>尺寸: 未知</div>`;
        }
        
        imageItem.innerHTML = `
            <img src="${image.dataUrl}" alt="${image.name}">
            <div class="image-info">
                <div>${image.name}</div>
                <div>${formatFileSize(image.size)}</div>
                <div>${image.type}</div>
                ${sizeInfo}
            </div>
            <div class="image-actions">
                <button class="convert-single-btn" onclick="convertSingleImage('${image.id}')">
                    转换
                </button>
                <button class="remove-btn" onclick="removeImage('${image.id}')" title="删除图片">
                     删除
                </button>
            </div>
        `;
        imageGrid.appendChild(imageItem);
    });
}

// 转换单张图片
async function convertSingleImage(imageId) {
    console.log('开始转换单张图片:', imageId);
    
    const image = uploadedImages.find(img => img.id === imageId);
    if (!image) {
        console.error('找不到图片:', imageId);
        showMessage('找不到要转换的图片', 'error');
        return;
    }
    
    console.log('找到图片:', image);
    
    const settings = getConversionSettings();
    console.log('转换设置:', settings);
    
    try {
        showMessage(`正在转换图片: ${image.name}...`, 'info');
        
        const convertedImage = await convertImage(image, settings);
        console.log('转换结果:', convertedImage);
        
        if (convertedImage) {
            convertedImages.push(convertedImage);
            updateResultSection();
            showMessage(`图片 ${image.name} 转换成功`, 'success');
        } else {
            showMessage(`图片 ${image.name} 转换失败: 未返回结果`, 'error');
        }
    } catch (error) {
        console.error('转换失败:', error);
        showMessage(`转换图片 ${image.name} 失败: ${error.message}`, 'error');
    }
}

// 转换所有图片
async function convertAllImages() {
    if (uploadedImages.length === 0) {
        showMessage('请先上传图片', 'error');
        return;
    }
    
    const settings = getConversionSettings();
    convertedImages = [];
    
    showMessage('开始转换图片...', 'info');
    
    try {
        for (let i = 0; i < uploadedImages.length; i++) {
            const image = uploadedImages[i];
            const convertedImage = await convertImage(image, settings);
            if (convertedImage) {
                convertedImages.push(convertedImage);
                updateResultSection();
            }
            
            // 显示进度
            const progress = Math.round(((i + 1) / uploadedImages.length) * 100);
            showMessage(`转换进度: ${progress}%`, 'info');
        }
        
        showMessage(`所有图片转换完成！共转换 ${convertedImages.length} 张`, 'success');
    } catch (error) {
        showMessage(`批量转换失败: ${error.message}`, 'error');
    }
}

// 获取转换设置
function getConversionSettings() {
    try {
        const format = document.getElementById('outputFormat').value;
        const quality = parseInt(document.getElementById('quality').value) || 90;
        
        // 获取宽度和高度，空字符串或0都视为null（不修改）
        let width = document.getElementById('resizeWidth').value.trim();
        width = width === '' ? null : parseInt(width);
        
        let height = document.getElementById('resizeHeight').value.trim();
        height = height === '' ? null : parseInt(height);
        
        const keepAspect = document.getElementById('keepAspect').checked;
        
        // 验证尺寸值
        if (width !== null && (isNaN(width) || width <= 0)) {
            width = null;
            document.getElementById('resizeWidth').value = '';
        }
        if (height !== null && (isNaN(height) || height <= 0)) {
            height = null;
            document.getElementById('resizeHeight').value = '';
        }
        
        console.log('转换设置:', { format, quality, width, height, keepAspect });
        
        return {
            format: format,
            quality: quality,
            width: width,
            height: height,
            keepAspect: keepAspect
        };
    } catch (error) {
        console.error('获取转换设置失败:', error);
        return {
            format: 'jpg',
            quality: 90,
            width: null,
            height: null,
            keepAspect: true
        };
    }
}

// 转换图片
function convertImage(image, settings) {
    return new Promise((resolve, reject) => {
        try {
            console.log('开始转换图片:', image.name);
            console.log('图片数据:', image.dataUrl.substring(0, 100) + '...');
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                try {
                    console.log('图片加载成功，尺寸:', img.width, 'x', img.height);
                    
                                         // 计算新尺寸
                     let { width, height } = calculateNewDimensions(img.width, img.height, settings);
                     console.log('原始尺寸:', img.width, 'x', img.height);
                     console.log('目标尺寸:', width, 'x', height);
                     
                     // 检查是否需要调整尺寸
                     if (width !== img.width || height !== img.height) {
                         console.log('图片尺寸将被调整');
                     } else {
                         console.log('图片尺寸保持不变');
                     }
                     
                     canvas.width = width;
                     canvas.height = height;
                     
                     // 绘制图片
                     ctx.drawImage(img, 0, 0, width, height);
                     console.log('图片绘制完成');
                    
                    // 转换为指定格式
                    let mimeType, dataUrl;
                    
                    switch (settings.format) {
                        case 'jpg':
                        case 'jpeg':
                            mimeType = 'image/jpeg';
                            dataUrl = canvas.toDataURL(mimeType, settings.quality / 100);
                            break;
                        case 'png':
                            mimeType = 'image/png';
                            dataUrl = canvas.toDataURL(mimeType);
                            break;
                        case 'webp':
                            mimeType = 'image/webp';
                            dataUrl = canvas.toDataURL(mimeType, settings.quality / 100);
                            break;
                        default:
                            mimeType = 'image/jpeg';
                            dataUrl = canvas.toDataURL(mimeType, settings.quality / 100);
                    }
                    
                    console.log('格式转换完成:', mimeType);
                    console.log('数据URL长度:', dataUrl.length);
                    
                                         const convertedImage = {
                         id: generateUniqueId(),
                         originalName: image.name,
                         name: generateOutputFileName(image.name, settings.format),
                         size: estimateFileSize(dataUrl),
                         type: mimeType,
                         dataUrl: dataUrl,
                         settings: settings,
                         originalDimensions: { width: img.width, height: img.height },
                         newDimensions: { width, height }
                     };
                    
                    console.log('转换完成:', convertedImage);
                    resolve(convertedImage);
                } catch (error) {
                    console.error('图片处理失败:', error);
                    reject(new Error(`图片处理失败: ${error.message}`));
                }
            };
            
            img.onerror = function() {
                console.error('图片加载失败');
                reject(new Error('图片加载失败'));
            };
            
            img.src = image.dataUrl;
            console.log('设置图片源');
        } catch (error) {
            console.error('转换初始化失败:', error);
            reject(new Error(`转换初始化失败: ${error.message}`));
        }
    });
}

// 计算新尺寸
function calculateNewDimensions(originalWidth, originalHeight, settings) {
    try {
        let { width, height, keepAspect } = settings;
        
        // 确保原始尺寸有效
        if (!originalWidth || !originalHeight || originalWidth <= 0 || originalHeight <= 0) {
            return { width: 100, height: 100 }; // 默认尺寸
        }
        
        // 如果没有设置宽度和高度，保持原尺寸
        if (!width && !height) {
            return { width: originalWidth, height: originalHeight };
        }
        
        // 如果只设置了宽度或高度中的一个，保持宽高比
        if (keepAspect) {
            if (width && height) {
                // 同时设置了宽度和高度，选择较小的缩放比例以保持宽高比
                const scaleX = width / originalWidth;
                const scaleY = height / originalHeight;
                const scale = Math.min(scaleX, scaleY);
                width = Math.round(originalWidth * scale);
                height = Math.round(originalHeight * scale);
            } else if (width) {
                // 只设置了宽度，按比例计算高度
                const scale = width / originalWidth;
                height = Math.round(originalHeight * scale);
            } else if (height) {
                // 只设置了高度，按比例计算宽度
                const scale = height / originalHeight;
                width = Math.round(originalWidth * scale);
            }
        } else {
            // 不保持宽高比，直接使用设置的尺寸
            if (!width) width = originalWidth;
            if (!height) height = originalHeight;
        }
        
        // 确保尺寸有效（最小1像素）
        if (width <= 0) width = 1;
        if (height <= 0) height = 1;
        
        // 限制最大尺寸（防止过大的图片）
        const maxSize = 4096;
        if (width > maxSize) width = maxSize;
        if (height > maxSize) height = maxSize;
        
        return { width: Math.round(width), height: Math.round(height) };
    } catch (error) {
        console.error('计算尺寸失败:', error);
        return { width: originalWidth || 100, height: originalHeight || 100 };
    }
}

// 生成输出文件名
function generateOutputFileName(originalName, format) {
    try {
        const lastDotIndex = originalName.lastIndexOf('.');
        if (lastDotIndex === -1) {
            // 如果没有扩展名，直接添加格式
            return `${originalName}.${format}`;
        }
        const nameWithoutExt = originalName.substring(0, lastDotIndex);
        return `${nameWithoutExt}.${format}`;
    } catch (error) {
        console.error('生成文件名失败:', error);
        return `converted_image.${format}`;
    }
}

// 估算文件大小
function estimateFileSize(dataUrl) {
    try {
        // 简单的文件大小估算
        const base64Length = dataUrl.length;
        // 根据格式调整估算系数
        let coefficient = 0.75;
        if (dataUrl.includes('image/png')) {
            coefficient = 0.8;
        } else if (dataUrl.includes('image/webp')) {
            coefficient = 0.7;
        }
        return Math.round(base64Length * coefficient);
    } catch (error) {
        console.error('估算文件大小失败:', error);
        return 0;
    }
}

// 更新结果区域
function updateResultSection() {
    if (convertedImages.length > 0) {
        resultSection.style.display = 'block';
        renderResultGrid();
        updateDownloadButton();
    } else {
        resultSection.style.display = 'none';
    }
}

// 更新下载按钮状态
function updateDownloadButton() {
    const downloadBtn = document.querySelector('.download-all-btn');
    const downloadHint = document.querySelector('.download-hint');
    
    if (convertedImages.length > 0) {
        downloadBtn.disabled = false;
        downloadBtn.textContent = `📦 下载所有图片 (ZIP) - ${convertedImages.length}张`;
        downloadHint.textContent = `支持ZIP打包下载，包含所有转换结果`;
    } else {
        downloadBtn.disabled = true;
        downloadBtn.textContent = '📦 下载所有图片 (ZIP)';
        downloadHint.textContent = '没有转换结果可下载';
    }
}

// 渲染结果网格
function renderResultGrid() {
    resultGrid.innerHTML = '';
    
    convertedImages.forEach(image => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        // 显示尺寸信息
        let sizeInfo = '';
        if (image.originalDimensions && image.newDimensions) {
            const original = image.originalDimensions;
            const newSize = image.newDimensions;
            
            if (original.width !== newSize.width || original.height !== newSize.height) {
                sizeInfo = `<div>尺寸: ${original.width}×${original.height} → ${newSize.width}×${newSize.height}</div>`;
            } else {
                sizeInfo = `<div>尺寸: ${original.width}×${original.height} (未调整)</div>`;
            }
        }
        
        resultItem.innerHTML = `
            <img src="${image.dataUrl}" alt="${image.name}">
            <div class="result-info">
                <div>${image.name}</div>
                <div>${formatFileSize(image.size)}</div>
                <div>${image.type}</div>
                ${sizeInfo}
            </div>
            <div class="result-actions">
                <button class="download-btn" onclick="downloadImage('${image.id}')">
                    下载
                </button>
                <button class="remove-result-btn" onclick="removeConvertedImage('${image.id}')" title="删除转换结果">
                    删除
                </button>
            </div>
        `;
        resultGrid.appendChild(resultItem);
    });
}

// 下载单张图片
function downloadImage(imageId) {
    const image = convertedImages.find(img => img.id === imageId);
    if (!image) return;
    
    const link = document.createElement('a');
    link.href = image.dataUrl;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage(`图片 ${image.name} 下载开始`, 'success');
}

// 下载所有图片
function downloadAllImages() {
    if (convertedImages.length === 0) {
        showMessage('没有可下载的图片', 'error');
        return;
    }
    
    // 创建ZIP文件（如果支持）
    if (typeof JSZip !== 'undefined') {
        downloadAsZip();
    } else {
        // 逐个下载
        convertedImages.forEach((image, index) => {
            setTimeout(() => {
                downloadImage(image.id);
            }, index * 500);
        });
        showMessage('开始下载所有图片', 'info');
    }
}

// 下载为ZIP文件
async function downloadAsZip() {
    try {
        showMessage('正在创建ZIP文件...', 'info');
        
        const zip = new JSZip();
        const folder = zip.folder('converted_images');
        
        // 添加所有转换结果到ZIP
        for (let i = 0; i < convertedImages.length; i++) {
            const image = convertedImages[i];
            
            // 将dataURL转换为blob
            const response = await fetch(image.dataUrl);
            const blob = await response.blob();
            
            // 添加到ZIP文件
            folder.file(image.name, blob);
            
            // 显示进度条
            const progress = Math.round(((i + 1) / convertedImages.length) * 100);
            showZipProgress(progress);
        }
        
        // 生成ZIP文件
        showMessage('正在生成ZIP文件...', 'info');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        // 下载ZIP文件
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `converted_images_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理URL对象
        URL.revokeObjectURL(link.href);
        
        showMessage(`ZIP文件下载完成！包含 ${convertedImages.length} 张图片`, 'success');
        
    } catch (error) {
        console.error('ZIP创建失败:', error);
        showMessage(`ZIP创建失败: ${error.message}，将使用逐个下载`, 'error');
        
        // 如果ZIP创建失败，回退到逐个下载
        convertedImages.forEach((image, index) => {
            setTimeout(() => {
                downloadImage(image.id);
            }, index * 500);
        });
        showMessage('开始逐个下载图片', 'info');
    }
}

// 删除图片
function removeImage(imageId) {
    console.log('删除图片:', imageId);
    console.log('当前上传图片列表:', uploadedImages.map(img => ({ id: img.id, name: img.name })));
    
    // 找到要删除的图片
    const imageToDelete = uploadedImages.find(img => img.id === imageId);
    if (!imageToDelete) {
        console.warn('找不到要删除的图片:', imageId);
        console.warn('可能的原因: ID不匹配或图片已被删除');
        showMessage('找不到要删除的图片，请刷新页面重试', 'error');
        return;
    }
    
    console.log('找到要删除的图片:', imageToDelete);
    
    // 确认删除
    if (!confirm(`确定要删除图片 "${imageToDelete.name}" 吗？`)) {
        return;
    }
    
    // 从上传图片列表中移除
    uploadedImages = uploadedImages.filter(img => img.id !== imageId);
    
    // 从转换结果列表中移除相关的转换结果
    convertedImages = convertedImages.filter(img => img.originalName !== imageToDelete.name);
    
    // 立即更新界面
    updatePreview();
    updateResultSection();
    
    // 重置上传区域状态
    resetUploadArea();
    
    // 显示删除成功消息
    showMessage(`图片 "${imageToDelete.name}" 已删除`, 'success');
    
    console.log('删除完成，剩余图片数量:', uploadedImages.length);
    console.log('剩余图片:', uploadedImages.map(img => ({ id: img.id, name: img.name })));
}

// 删除转换结果
function removeConvertedImage(imageId) {
    console.log('删除转换结果:', imageId);
    console.log('当前转换结果列表:', convertedImages.map(img => ({ id: img.id, name: img.name })));
    
    // 找到要删除的转换结果
    const resultToDelete = convertedImages.find(img => img.id === imageId);
    if (!resultToDelete) {
        console.warn('找不到要删除的转换结果:', imageId);
        showMessage('找不到要删除的转换结果，请刷新页面重试', 'error');
        return;
    }
    
    console.log('找到要删除的转换结果:', resultToDelete);
    
    // 确认删除
    if (!confirm(`确定要删除转换结果 "${resultToDelete.name}" 吗？`)) {
        return;
    }
    
    // 从转换结果列表中移除
    convertedImages = convertedImages.filter(img => img.id !== imageId);
    
    // 立即更新界面
    updateResultSection();
    
    // 显示删除成功消息
    showMessage(`转换结果 "${resultToDelete.name}" 已删除`, 'success');
    
    console.log('删除转换结果完成，剩余转换结果数量:', convertedImages.length);
    console.log('剩余转换结果:', convertedImages.map(img => ({ id: img.id, name: img.name })));
}

// 清空所有图片
function clearAllImages() {
    console.log('清空所有图片');
    
    const imageCount = uploadedImages.length;
    const convertedCount = convertedImages.length;
    
    if (imageCount === 0 && convertedCount === 0) {
        showMessage('没有图片需要清空', 'info');
        return;
    }
    
    // 确认清空
    if (!confirm(`确定要清空所有图片吗？\n上传图片: ${imageCount} 张\n转换结果: ${convertedCount} 张`)) {
        return;
    }
    
    // 清空数组
    uploadedImages = [];
    convertedImages = [];
    
    // 立即更新界面
    updatePreview();
    updateResultSection();
    
    // 重置上传区域状态
    resetUploadArea();
    
    // 显示清空成功消息
    showMessage(`已清空 ${imageCount} 张上传图片和 ${convertedCount} 张转换结果`, 'success');
    
    console.log('清空完成');
}

// 更新质量显示
function updateQualityDisplay() {
    qualityValue.textContent = qualitySlider.value;
}

// 快速设置尺寸
function setQuickSize(width, height) {
    document.getElementById('resizeWidth').value = width;
    document.getElementById('resizeHeight').value = height;
    showMessage(`已设置尺寸: ${width}×${height}`, 'info', 2000); // 只显示2秒
}

// 清除尺寸设置
function clearSize() {
    document.getElementById('resizeWidth').value = '';
    document.getElementById('resizeHeight').value = '';
    showMessage('已清除尺寸设置，将保持原尺寸', 'info', 2000); // 只显示2秒
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 显示消息
function showMessage(text, type = 'info', duration = null) {
    // 移除现有消息
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 创建新消息
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    // 插入到主内容区域顶部
    const main = document.querySelector('main');
    main.insertBefore(message, main.firstChild);
    
    // 根据消息类型设置不同的显示时间
    let displayTime = duration;
    if (displayTime === null) {
        switch (type) {
            case 'success':
                displayTime = 3000; // 成功消息显示3秒
                break;
            case 'error':
                displayTime = 5000; // 错误消息显示5秒
                break;
            case 'warning':
                displayTime = 4000; // 警告消息显示4秒
                break;
            case 'info':
            default:
                displayTime = 3500; // 信息消息显示3.5秒
                break;
        }
    }
    
    // 自动移除消息（带淡出动画）
    setTimeout(() => {
        if (message.parentNode) {
            message.style.opacity = '0';
            message.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (message.parentNode) {
                    message.remove();
                }
            }, 300); // 300ms淡出动画
        }
    }, displayTime);
}

// 添加键盘快捷键
document.addEventListener('keydown', function(event) {
    // Ctrl+O 打开文件选择
    if (event.ctrlKey && event.key === 'o') {
        event.preventDefault();
        fileInput.click();
    }
    
    // Ctrl+Enter 转换所有图片
    if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        convertAllImages();
    }
    
    // Delete 删除选中的图片
    if (event.key === 'Delete') {
        // 这里可以添加删除选中图片的逻辑
    }
});

// 添加触摸支持
if ('ontouchstart' in window) {
    uploadArea.addEventListener('touchstart', function() {
        this.style.transform = 'scale(0.98)';
    });
    
    uploadArea.addEventListener('touchend', function() {
        this.style.transform = 'scale(1)';
    });
}

// 添加进度条功能
function showProgress(progress) {
    // 这里可以添加进度条显示逻辑
    console.log(`转换进度: ${progress}%`);
}

// 显示ZIP创建进度条
function showZipProgress(progress) {
    // 移除现有进度条
    const existingProgress = document.querySelector('.zip-progress');
    if (existingProgress) {
        existingProgress.remove();
    }
    
    // 创建进度条
    const progressContainer = document.createElement('div');
    progressContainer.className = 'zip-progress';
    progressContainer.innerHTML = `
        <div class="progress-info">
            <span>正在创建ZIP文件...</span>
            <span class="progress-percentage">${progress}%</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
    `;
    
    // 插入到下载按钮上方
    const downloadAll = document.querySelector('.download-all');
    downloadAll.insertBefore(progressContainer, downloadAll.firstChild);
    
    // 如果进度完成，延迟移除进度条
    if (progress >= 100) {
        setTimeout(() => {
            if (progressContainer.parentNode) {
                progressContainer.remove();
            }
        }, 2000);
    }
}

// 添加错误处理
window.addEventListener('error', function(event) {
    console.error('页面错误:', event.error);
    showMessage('页面发生错误，请刷新重试', 'error');
});

// 添加性能监控
if ('performance' in window) {
    window.addEventListener('load', function() {
        const loadTime = performance.timing.loadEventEnd - performance.timing.loadEventStart;
        console.log(`页面加载时间: ${loadTime}ms`);
    });
}

// 添加测试函数
function testConversion() {
    console.log('开始测试转换功能...');
    
    // 创建一个测试图片
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    // 绘制一个简单的测试图片
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 50, 50);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(50, 50, 50, 50);
    
    const testDataUrl = canvas.toDataURL('image/png');
    
    const testImage = {
        id: generateUniqueId(),
        name: 'test.png',
        size: 1000,
        type: 'image/png',
        dataUrl: testDataUrl
    };
    
    const testSettings = {
        format: 'jpg',
        quality: 90,
        width: 50,
        height: 50,
        keepAspect: true
    };
    
    console.log('测试图片:', testImage);
    console.log('测试设置:', testSettings);
    
    convertImage(testImage, testSettings)
        .then(result => {
            console.log('转换成功:', result);
            showMessage('测试转换成功！', 'success');
        })
        .catch(error => {
            console.error('测试转换失败:', error);
            showMessage('测试转换失败: ' + error.message, 'error');
        });
}

// 测试单张转换功能
function testSingleConversion() {
    console.log('开始测试单张转换功能...');
    
    if (uploadedImages.length === 0) {
        showMessage('请先上传图片', 'error');
        return;
    }
    
    // 选择第一张图片进行测试
    const testImage = uploadedImages[0];
    console.log('测试图片:', testImage);
    
    // 调用单张转换
    convertSingleImage(testImage.id);
}

// 调试函数：显示当前所有图片状态
function debugImages() {
    console.log('=== 图片状态调试信息 ===');
    console.log('上传图片数量:', uploadedImages.length);
    console.log('上传图片列表:', uploadedImages.map(img => ({ 
        id: img.id, 
        name: img.name, 
        dimensions: img.dimensions 
    })));
    console.log('转换结果数量:', convertedImages.length);
    console.log('转换结果列表:', convertedImages.map(img => ({ 
        id: img.id, 
        name: img.name, 
        originalName: img.originalName,
        originalDimensions: img.originalDimensions,
        newDimensions: img.newDimensions
    })));
    console.log('文件输入框值:', fileInput.value);
    console.log('当前尺寸设置:', {
        width: document.getElementById('resizeWidth').value,
        height: document.getElementById('resizeHeight').value,
        keepAspect: document.getElementById('keepAspect').checked
    });
    console.log('上传区域状态:', {
        disabled: uploadArea.classList.contains('disabled'),
        dragover: uploadArea.classList.contains('dragover'),
        pointerEvents: uploadArea.style.pointerEvents,
        opacity: uploadArea.style.opacity
    });
    console.log('=======================');
}

// 在控制台中可以调用以下函数进行测试：
// - testConversion() - 测试转换功能
// - testSingleConversion() - 测试单张转换
// - debugImages() - 显示图片状态调试信息
console.log('图片转换工具已加载，可以调用以下函数进行测试:');
console.log('- testConversion() - 测试转换功能');
console.log('- testSingleConversion() - 测试单张转换');
console.log('- debugImages() - 显示图片状态调试信息');
