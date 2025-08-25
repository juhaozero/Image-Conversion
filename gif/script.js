// 全局变量
let currentVideo = null;
let videoDuration = 0;
let startTime = 0;
let endTime = 3;
let timelineWidth = 0;
let isDragging = false;
let dragType = '';
let gifWorker = null;
let isConverting = false;

// DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const settingsSection = document.getElementById('settingsSection');
const previewSection = document.getElementById('previewSection');
const progressSection = document.getElementById('progressSection');
const resultSection = document.getElementById('resultSection');
const videoPlayer = document.getElementById('videoPlayer');
const videoInfo = document.getElementById('videoInfo');
const timeline = document.getElementById('timeline');
const timelineSelection = document.getElementById('timelineSelection');
const startHandle = document.getElementById('startHandle');
const endHandle = document.getElementById('endHandle');
const currentStart = document.getElementById('currentStart');
const currentEnd = document.getElementById('currentEnd');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const gifPreview = document.getElementById('gifPreview');
const gifInfo = document.getElementById('gifInfo');
const downloadBtn = document.getElementById('downloadBtn');

// 滑块值显示
const frameRateSlider = document.getElementById('frameRate');
const frameRateValue = document.getElementById('frameRateValue');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateSliderDisplays();
    
    // 检查gif.js库是否可用
    if (typeof GIF !== 'undefined') {
        console.log('✅ gif.js库已加载，支持GIF生成');
        showMessage('GIF转换功能已启用', 'success', 2000);
    } else {
        console.warn('⚠️ gif.js库未加载，GIF功能不可用');
        showMessage('GIF库加载失败，请刷新页面重试', 'error');
    }
});

// 初始化事件监听器
function initializeEventListeners() {
    // 文件上传相关
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // 滑块事件
    frameRateSlider.addEventListener('input', updateSliderDisplays);
    qualitySlider.addEventListener('input', updateSliderDisplays);
    
    // 视频播放事件
    videoPlayer.addEventListener('loadedmetadata', handleVideoLoaded);
    videoPlayer.addEventListener('timeupdate', handleTimeUpdate);
    
    // 时间轴拖拽事件
    startHandle.addEventListener('mousedown', (e) => startDrag(e, 'start'));
    endHandle.addEventListener('mousedown', (e) => startDrag(e, 'end'));
    timeline.addEventListener('click', handleTimelineClick);
    
    // 全局拖拽事件
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
    
    // 设置输入框事件
    document.getElementById('startTime').addEventListener('change', updateTimeFromInput);
    document.getElementById('duration').addEventListener('change', updateTimeFromInput);
    document.getElementById('gifWidth').addEventListener('change', handleSizeChange);
    document.getElementById('gifHeight').addEventListener('change', handleSizeChange);
}

// 处理文件选择
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processVideoFile(file);
    }
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
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
        processVideoFile(videoFile);
    } else {
        showMessage('请选择视频文件', 'error');
    }
}

// 处理视频文件
function processVideoFile(file) {
    console.log('Processing video file:', file.name);
    
    // 检查文件类型
    if (!file.type.startsWith('video/')) {
        showMessage('请选择有效的视频文件', 'error');
        return;
    }
    
    // 检查文件大小（限制100MB）
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
        showMessage('视频文件过大，请选择小于100MB的文件', 'error');
        return;
    }
    
    currentVideo = file;
    
    // 创建视频URL
    const videoUrl = URL.createObjectURL(file);
    videoPlayer.src = videoUrl;
    
    // 显示文件信息
    showVideoInfo(file);
    
    // 显示界面
    settingsSection.style.display = 'block';
    previewSection.style.display = 'block';
    
    showMessage(`视频文件 "${file.name}" 加载成功`, 'success');
}

// 显示视频信息
function showVideoInfo(file) {
    const fileSize = formatFileSize(file.size);
    const fileType = file.type;
    
    videoInfo.innerHTML = `
        <div><strong>文件名:</strong> ${file.name}</div>
        <div><strong>大小:</strong> ${fileSize}</div>
        <div><strong>类型:</strong> ${fileType}</div>
        <div><strong>时长:</strong> <span id="videoDurationText">加载中...</span></div>
    `;
}

// 处理视频加载完成
function handleVideoLoaded() {
    videoDuration = videoPlayer.duration;
    endTime = Math.min(3, videoDuration);
    
    // 更新时长显示
    const durationText = document.getElementById('videoDurationText');
    if (durationText) {
        durationText.textContent = formatTime(videoDuration);
    }
    
    // 初始化时间轴
    initializeTimeline();
    
    // 更新输入框
    document.getElementById('startTime').max = videoDuration;
    document.getElementById('duration').max = videoDuration;
    document.getElementById('duration').value = Math.min(3, videoDuration);
    
    // 设置默认尺寸
    setDefaultSize();
    
    console.log('Video loaded, duration:', videoDuration);
}

// 设置默认尺寸
function setDefaultSize() {
    const video = videoPlayer;
    const aspectRatio = video.videoWidth / video.videoHeight;
    
    let width = 320;
    let height = Math.round(width / aspectRatio);
    
    // 确保高度不超过240
    if (height > 240) {
        height = 240;
        width = Math.round(height * aspectRatio);
    }
    
    document.getElementById('gifWidth').value = width;
    document.getElementById('gifHeight').value = height;
}

// 处理尺寸变化
function handleSizeChange() {
    const keepAspect = document.getElementById('keepAspect').checked;
    if (!keepAspect || !videoPlayer.videoWidth) return;
    
    const aspectRatio = videoPlayer.videoWidth / videoPlayer.videoHeight;
    const widthInput = document.getElementById('gifWidth');
    const heightInput = document.getElementById('gifHeight');
    
    if (event.target === widthInput) {
        const width = parseInt(widthInput.value) || 320;
        const height = Math.round(width / aspectRatio);
        heightInput.value = height;
    } else if (event.target === heightInput) {
        const height = parseInt(heightInput.value) || 240;
        const width = Math.round(height * aspectRatio);
        widthInput.value = width;
    }
}

// 初始化时间轴
function initializeTimeline() {
    timelineWidth = timeline.offsetWidth;
    updateTimelineDisplay();
}

// 更新时间轴显示
function updateTimelineDisplay() {
    const startPercent = (startTime / videoDuration) * 100;
    const endPercent = (endTime / videoDuration) * 100;
    const selectionWidth = endPercent - startPercent;
    
    timelineSelection.style.left = startPercent + '%';
    timelineSelection.style.width = selectionWidth + '%';
    
    startHandle.style.left = `calc(${startPercent}% - 10px)`;
    endHandle.style.left = `calc(${endPercent}% - 10px)`;
    
    currentStart.textContent = formatTime(startTime);
    currentEnd.textContent = formatTime(endTime);
    
    // 更新输入框
    document.getElementById('startTime').value = startTime.toFixed(1);
    document.getElementById('duration').value = (endTime - startTime).toFixed(1);
}

// 开始拖拽
function startDrag(event, type) {
    event.preventDefault();
    isDragging = true;
    dragType = type;
    timelineWidth = timeline.offsetWidth;
    
    document.body.style.userSelect = 'none';
}

// 处理拖拽
function handleDrag(event) {
    if (!isDragging) return;
    
    const rect = timeline.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const time = percent * videoDuration;
    
    if (dragType === 'start') {
        startTime = Math.max(0, Math.min(time, endTime - 0.1));
    } else if (dragType === 'end') {
        endTime = Math.max(startTime + 0.1, Math.min(time, videoDuration));
    }
    
    updateTimelineDisplay();
}

// 停止拖拽
function stopDrag() {
    if (isDragging) {
        isDragging = false;
        dragType = '';
        document.body.style.userSelect = '';
    }
}

// 处理时间轴点击
function handleTimelineClick(event) {
    if (isDragging) return;
    
    const rect = timeline.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percent = x / rect.width;
    const time = percent * videoDuration;
    
    // 判断点击的是开始还是结束更近
    const startDistance = Math.abs(time - startTime);
    const endDistance = Math.abs(time - endTime);
    
    if (startDistance < endDistance) {
        startTime = Math.max(0, Math.min(time, endTime - 0.1));
    } else {
        endTime = Math.max(startTime + 0.1, Math.min(time, videoDuration));
    }
    
    updateTimelineDisplay();
}

// 从输入框更新时间
function updateTimeFromInput() {
    const startInput = parseFloat(document.getElementById('startTime').value) || 0;
    const durationInput = parseFloat(document.getElementById('duration').value) || 1;
    
    startTime = Math.max(0, Math.min(startInput, videoDuration - 0.1));
    endTime = Math.max(startTime + 0.1, Math.min(startTime + durationInput, videoDuration));
    
    updateTimelineDisplay();
}

// 处理视频时间更新
function handleTimeUpdate() {
    // 可以在这里添加播放进度指示器
}

// 更新滑块显示
function updateSliderDisplays() {
    frameRateValue.textContent = frameRateSlider.value;
    qualityValue.textContent = qualitySlider.value;
}

// 快速设置尺寸
function setQuickSize(width, height) {
    document.getElementById('gifWidth').value = width;
    document.getElementById('gifHeight').value = height;
    showMessage(`已设置尺寸: ${width}×${height}`, 'info', 2000);
}

// 清除尺寸设置
function clearSize() {
    setDefaultSize();
    showMessage('已重置为默认尺寸', 'info', 2000);
}

// 转换视频为GIF
async function convertToGif() {
    if (isConverting) {
        showMessage('转换正在进行中，请稍候...', 'warning');
        return;
    }
    
    // 检查是否在file://协议下运行
    if (window.location.protocol === 'file:') {
        showMessage('检测到本地文件访问，建议使用HTTP服务器运行以获得最佳体验', 'warning', 5000);
    }
    
    if (!currentVideo) {
        showMessage('请先上传视频文件', 'error');
        return;
    }
    
    if (startTime >= endTime) {
        showMessage('开始时间必须小于结束时间', 'error');
        return;
    }
    
    isConverting = true;
    progressSection.style.display = 'block';
    resultSection.style.display = 'none';
    
    try {
        updateProgress(0, '准备转换...');
        
        const settings = getConversionSettings();
        console.log('转换设置:', settings);
        
        updateProgress(10, '开始转换...');
        
        const gifBlob = await generateGif(settings);
        
        if (gifBlob && gifBlob.size > 0) {
            displayResult(gifBlob, settings);
            showMessage('GIF转换完成！', 'success');
        } else {
            throw new Error('转换失败，未生成有效的GIF文件');
        }
        
    } catch (error) {
        console.error('Conversion failed:', error);
        
        // 提供更友好的错误信息
        let errorMessage = error.message;
        if (error.name === 'SecurityError' && error.message.includes('Worker')) {
            errorMessage = '由于浏览器安全限制，无法创建Web Worker。请使用HTTP服务器运行此应用，或刷新页面重试。';
        }
        
        showMessage(`转换失败: ${errorMessage}`, 'error');
        progressSection.style.display = 'none';
    } finally {
        isConverting = false;
    }
}

// 获取转换设置
function getConversionSettings() {
    return {
        width: parseInt(document.getElementById('gifWidth').value) || 320,
        height: parseInt(document.getElementById('gifHeight').value) || 240,
        frameRate: parseInt(frameRateSlider.value) || 10,
        quality: parseInt(qualitySlider.value) || 10,
        startTime: startTime,
        endTime: endTime,
        duration: endTime - startTime
    };
}

// 生成GIF
async function generateGif(settings) {
    return new Promise((resolve, reject) => {
        try {
            let workerScript = 'gif.worker.js';
            
            // 创建GIF实例
            const gif = new GIF({
                workers: 2,
                quality: settings.quality,
                width: settings.width,
                height: settings.height,
                workerScript: workerScript,
                // 设置全局延迟，确保GIF能正常播放
                globalDelay: Math.round(1000 / settings.frameRate)
            });
            
            // 进度回调
            gif.on('progress', function(p) {
                updateProgress(p * 100, `生成GIF中... ${Math.round(p * 100)}%`);
            });
            
            // 完成回调
            gif.on('finished', function(blob) {
                console.log('GIF生成完成，文件大小:', blob.size, '字节');
                console.log('GIF设置:', {
                    width: settings.width,
                    height: settings.height,
                    frameRate: settings.frameRate,
                    quality: settings.quality,
                    duration: settings.duration,
                    totalFrames: Math.ceil(settings.duration * settings.frameRate)
                });
                updateProgress(100, '转换完成！');
                resolve(blob);
            });
            
            // 错误回调
            gif.on('error', function(error) {
                console.error('GIF生成错误:', error);
                reject(error);
            });
            
            // 提取帧并添加到GIF
            extractFrames(settings, gif).then(() => {
                updateProgress(50, '开始生成GIF...');
                gif.render();
            }).catch(reject);
            
        } catch (error) {
            reject(error);
        }
    });
}

// 提取帧
async function extractFrames(settings, gif) {
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = settings.width;
            canvas.height = settings.height;
            
            const frameInterval = 1 / settings.frameRate;
            const totalFrames = Math.ceil(settings.duration * settings.frameRate);
            let frameCount = 0;
            
            // 创建临时视频元素
            const tempVideo = document.createElement('video');
            tempVideo.src = videoPlayer.src;
            tempVideo.muted = true;
            tempVideo.crossOrigin = 'anonymous';
            
            const extractFrame = () => {
                if (frameCount >= totalFrames) {
                    resolve();
                    return;
                }
                
                const currentTime = settings.startTime + (frameCount * frameInterval);
                
                if (currentTime >= settings.endTime) {
                    resolve();
                    return;
                }
                
                tempVideo.currentTime = currentTime;
                
                const onSeeked = () => {
                    try {
                        // 绘制帧到canvas
                        ctx.drawImage(tempVideo, 0, 0, settings.width, settings.height);
                        
                        // 添加帧到GIF，使用正确的延迟值
                        // 延迟应该是每帧之间的时间间隔，单位为毫秒
                        const delay = Math.round(1000 / settings.frameRate);
                        gif.addFrame(canvas, { delay: delay });
                        
                        console.log(`添加第${frameCount + 1}帧，延迟: ${delay}ms，时间: ${currentTime.toFixed(2)}s`);
                        
                        frameCount++;
                        
                        // 更新进度
                        const progress = (frameCount / totalFrames) * 50; // 前50%用于提取帧
                        updateProgress(progress, `提取帧 ${frameCount}/${totalFrames}`);
                        
                        // 移除事件监听器
                        tempVideo.removeEventListener('seeked', onSeeked);
                        
                        // 延迟处理下一帧，避免阻塞UI
                        setTimeout(extractFrame, 10);
                        
                    } catch (error) {
                        tempVideo.removeEventListener('seeked', onSeeked);
                        reject(error);
                    }
                };
                
                tempVideo.addEventListener('seeked', onSeeked);
            };
            
            // 开始提取
            tempVideo.addEventListener('loadeddata', () => {
                extractFrame();
            });
            
            tempVideo.addEventListener('error', (error) => {
                reject(new Error('视频加载失败'));
            });
            
        } catch (error) {
            reject(error);
        }
    });
}

// 更新进度
function updateProgress(percent, text) {
    progressFill.style.width = percent + '%';
    progressText.textContent = text;
}

// 显示结果
function displayResult(blob, settings) {
    const url = URL.createObjectURL(blob);
    
    // 确保预览图片正确显示
    gifPreview.onload = function() {
        console.log('GIF预览加载成功');
        showMessage('GIF预览已生成，请检查动画效果', 'success', 3000);
        
        // 验证GIF是否为动画
        validateGifAnimation(blob);
    };
    
    gifPreview.onerror = function() {
        console.error('GIF预览加载失败');
        showMessage('GIF预览加载失败，但文件已生成', 'warning');
    };
    
    gifPreview.src = url;
    gifPreview.style.display = 'block';
    
    // 显示GIF信息
    const fileSize = formatFileSize(blob.size);
    const frameCount = Math.ceil(settings.duration * settings.frameRate);
    
    gifInfo.innerHTML = `
        <div><strong>尺寸:</strong> ${settings.width} × ${settings.height}</div>
        <div><strong>帧率:</strong> ${settings.frameRate} FPS</div>
        <div><strong>时长:</strong> ${formatTime(settings.duration)}</div>
        <div><strong>总帧数:</strong> ${frameCount} 帧</div>
        <div><strong>文件大小:</strong> ${fileSize}</div>
        <div><strong>帧延迟:</strong> ${Math.round(1000 / settings.frameRate)}ms</div>
    `;
    
    // 设置下载
    downloadBtn.onclick = () => downloadGif(blob);
    downloadBtn.disabled = false;
    
    // 显示结果区域
    progressSection.style.display = 'none';
    resultSection.style.display = 'block';
}

// 验证GIF动画
function validateGifAnimation(blob) {
    // 读取GIF文件头，检查是否为有效的GIF文件
    const reader = new FileReader();
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // 检查GIF文件头 (GIF87a 或 GIF89a)
        const header = String.fromCharCode(...uint8Array.slice(0, 6));
        if (header === 'GIF87a' || header === 'GIF89a') {
            console.log('✅ GIF文件头验证通过:', header);
            
            // 检查是否包含多个图像块（表示有动画）
            let imageCount = 0;
            for (let i = 0; i < uint8Array.length - 1; i++) {
                if (uint8Array[i] === 0x2C) { // 图像描述符
                    imageCount++;
                }
            }
            
            if (imageCount > 1) {
                console.log(`✅ GIF包含 ${imageCount} 个图像块，应该是动画`);
                showMessage(`GIF验证通过：包含 ${imageCount} 帧，应该能正常播放`, 'success', 4000);
            } else {
                console.warn(`⚠️ GIF只包含 ${imageCount} 个图像块，可能不是动画`);
                showMessage('GIF验证警告：可能不是动画文件，请检查设置', 'warning', 4000);
            }
        } else {
            console.error('❌ 无效的GIF文件头:', header);
            showMessage('GIF文件头验证失败，文件可能损坏', 'error', 4000);
        }
    };
    reader.readAsArrayBuffer(blob);
}

// 下载GIF
function downloadGif(blob) {
    if (!blob && gifPreview.src) {
        // 如果没有传入blob，从预览图片获取
        fetch(gifPreview.src)
            .then(response => response.blob())
            .then(downloadBlob => {
                performDownload(downloadBlob);
            })
            .catch(error => {
                showMessage('下载失败: ' + error.message, 'error');
            });
    } else if (blob) {
        performDownload(blob);
    } else {
        showMessage('没有可下载的GIF文件', 'error');
    }
}

// 执行下载
function performDownload(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const originalName = currentVideo ? currentVideo.name.split('.')[0] : 'video';
    link.download = `${originalName}_${timestamp}.gif`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理URL
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    showMessage('GIF下载开始', 'success');
}

// 重置转换器
function resetConverter() {
    // 重置结果显示
    resultSection.style.display = 'none';
    progressSection.style.display = 'none';
    
    // 清理GIF预览
    if (gifPreview.src) {
        URL.revokeObjectURL(gifPreview.src);
        gifPreview.src = '';
        gifPreview.style.display = 'none';
    }
    
    // 重置为默认设置
    if (videoDuration > 0) {
        startTime = 0;
        endTime = Math.min(3, videoDuration);
        updateTimelineDisplay();
        setDefaultSize();
    }
    
    showMessage('已重置转换设置', 'info');
}

// 清空视频
function clearVideo() {
    if (!confirm('确定要清空当前视频吗？')) {
        return;
    }
    
    // 清理视频
    if (videoPlayer.src) {
        URL.revokeObjectURL(videoPlayer.src);
        videoPlayer.src = '';
    }
    
    // 清理GIF预览
    if (gifPreview.src) {
        URL.revokeObjectURL(gifPreview.src);
        gifPreview.src = '';
        gifPreview.style.display = 'none';
    }
    
    // 重置变量
    currentVideo = null;
    videoDuration = 0;
    startTime = 0;
    endTime = 3;
    isConverting = false;
    
    // 隐藏界面
    settingsSection.style.display = 'none';
    previewSection.style.display = 'none';
    progressSection.style.display = 'none';
    resultSection.style.display = 'none';
    
    // 重置文件输入
    fileInput.value = '';
    
    showMessage('已清空视频', 'success');
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化时间
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
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
    
    // 设置显示时间
    let displayTime = duration;
    if (displayTime === null) {
        switch (type) {
            case 'success':
                displayTime = 3000;
                break;
            case 'error':
                displayTime = 5000;
                break;
            case 'warning':
                displayTime = 4000;
                break;
            case 'info':
            default:
                displayTime = 3500;
                break;
        }
    }
    
    // 自动移除消息
    setTimeout(() => {
        if (message.parentNode) {
            message.style.opacity = '0';
            message.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (message.parentNode) {
                    message.remove();
                }
            }, 300);
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
    
    // 空格键播放/暂停视频
    if (event.code === 'Space' && videoPlayer.src) {
        event.preventDefault();
        if (videoPlayer.paused) {
            videoPlayer.play();
        } else {
            videoPlayer.pause();
        }
    }
    
    // Ctrl+Enter 开始转换
    if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        convertToGif();
    }
});

// 添加窗口调整大小事件
window.addEventListener('resize', function() {
    if (timeline && videoDuration > 0) {
        timelineWidth = timeline.offsetWidth;
        updateTimelineDisplay();
    }
});

// 添加错误处理
window.addEventListener('error', function(event) {
    console.error('页面错误:', event.error);
    showMessage('页面发生错误，请刷新重试', 'error');
});

// 在控制台中可以调用的调试函数
window.debugGifConverter = function() {
    console.log('=== GIF转换器调试信息 ===');
    console.log('当前视频:', currentVideo?.name);
    console.log('视频时长:', videoDuration);
    console.log('选择时间段:', `${startTime}s - ${endTime}s`);
    console.log('是否正在转换:', isConverting);
    console.log('GIF库状态:', typeof GIF !== 'undefined' ? '已加载' : '未加载');
    console.log('=======================');
};

// 测试GIF转换功能
window.testGifConversion = function() {
    if (!currentVideo) {
        console.log('❌ 请先上传视频文件');
        return;
    }
    
    console.log('🧪 开始测试GIF转换...');
    console.log('测试设置:', {
        width: 160,
        height: 120,
        frameRate: 5,
        quality: 10,
        startTime: 0,
        endTime: 1,
        duration: 1
    });
    
    // 创建测试用的GIF实例
    const testGif = new GIF({
        workers: 1,
        quality: 10,
        width: 160,
        height: 120,
        workerScript: 'gif.worker.js'
    });
    
    // 创建测试canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 120;
    
    // 绘制测试帧
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 80, 120);
    ctx.fillStyle = 'blue';
    ctx.fillRect(80, 0, 80, 120);
    
    testGif.addFrame(canvas, { delay: 200 });
    
    // 绘制第二帧
    ctx.fillStyle = 'green';
    ctx.fillRect(0, 0, 80, 120);
    ctx.fillStyle = 'yellow';
    ctx.fillRect(80, 0, 80, 120);
    
    testGif.addFrame(canvas, { delay: 200 });
    
    testGif.on('finished', function(blob) {
        console.log('✅ 测试GIF生成成功，大小:', blob.size, '字节');
        
        // 验证测试GIF
        validateGifAnimation(blob);
        
        // 创建测试下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'test_animation.gif';
        link.textContent = '下载测试GIF';
        link.style.display = 'block';
        link.style.margin = '10px';
        link.style.padding = '10px';
        link.style.backgroundColor = '#007bff';
        link.style.color = 'white';
        link.style.textDecoration = 'none';
        link.style.borderRadius = '5px';
        
        document.body.appendChild(link);
        
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 10000);
    });
    
    testGif.on('error', function(error) {
        console.error('❌ 测试GIF生成失败:', error);
    });
    
    testGif.render();
};

console.log('视频转GIF工具已加载');
console.log('可以调用 debugGifConverter() 查看调试信息');
console.log('快捷键: Ctrl+O (选择文件), 空格 (播放/暂停), Ctrl+Enter (开始转换)');
