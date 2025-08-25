# Image-Conversion 多媒体处理工具集

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

一个完全基于前端技术的多媒体处理工具集，包含图片格式转换和视频转GIF功能。无需服务器，完全在浏览器中运行，保护用户隐私和数据安全。

## 🌟 项目特色

- **🔒 隐私安全**：所有处理完全在本地浏览器中进行，文件不会上传到任何服务器
- **⚡ 高性能**：采用Web Workers和Canvas API优化处理速度
- **📱 响应式设计**：完美适配桌面和移动设备
- **🎨 现代UI**：美观的渐变色设计和流畅的动画效果
- **🚀 即开即用**：无需安装，打开浏览器即可使用

## 📁 项目结构

```text
Image-Conversion/
├── image/              # 图片格式转换工具
│   ├── index.html      # 主页面
│   ├── script.js       # 核心逻辑
│   ├── style.css       # 样式文件
│   └── README.md       # 详细说明
├── gif/                # 视频转GIF工具
│   ├── index.html      # 主页面
│   ├── script.js       # 核心逻辑
│   ├── style.css       # 样式文件
│   └── README.md       # 详细说明
├── LICENSE             # 开源协议
└── README.md           # 项目说明（本文件）
```

## 🛠️ 功能模块

### 📸 图片格式转换工具 (`/image/`)

支持主流图片格式之间的相互转换，提供丰富的图片处理选项。

**主要功能：**

- 🔄 **格式转换**：PNG ↔ JPG ↔ WEBP ↔ GIF
- 📏 **尺寸调整**：自定义宽高，保持宽高比
- 🎚️ **质量控制**：JPEG质量调节（1-100）
- 📦 **批量处理**：支持多文件同时转换
- 💾 **批量下载**：ZIP打包下载所有结果
- ⚡ **快速预设**：常用尺寸一键设置

**技术实现：**

- HTML5 Canvas API进行图片处理
- JSZip库实现批量文件打包
- FileReader API处理文件读取
- 响应式CSS Grid布局

### 🎬 视频转GIF工具 (`/gif/`)


将视频文件转换为高质量GIF动画，支持精确的时间段选择和参数调节。

**主要功能：**

- 🎥 **视频支持**：MP4、WebM、AVI、MOV等格式
- ⏱️ **时间选择**：可视化时间轴，精确选择转换片段
- 🎛️ **参数调节**：帧率、尺寸、质量全面控制
- 👀 **实时预览**：视频播放和参数调整预览
- 📊 **进度显示**：实时转换进度和状态反馈
- 🎯 **优化建议**：智能的文件大小和质量平衡

**技术实现：**

- HTML5 Video API进行视频处理
- gif.js库实现高质量GIF编码
- Canvas API进行帧提取和处理
- 自定义时间轴控件实现精确选择

## 🚀 快速开始

### 在线使用

1. **图片转换工具**：直接打开 `image/index.html`
2. **视频转GIF工具**：直接打开 `gif/index.html`



## 🔧 高级功能

### 图片工具高级特性

```javascript
// 批量处理多种格式
const supportedFormats = ['PNG', 'JPEG', 'WEBP', 'GIF'];

// 自定义质量和尺寸
const conversionSettings = {
    format: 'webp',
    quality: 90,
    width: 1920,
    height: 1080,
    keepAspectRatio: true
};

// 一键导出ZIP包
downloadAllAsZip(convertedImages);
```

### 视频工具高级特性

```javascript
// 精确时间控制
const timelineSettings = {
    startTime: 5.5,      // 5.5秒开始
    duration: 3.0,       // 持续3秒
    frameRate: 15,       // 15帧/秒
    quality: 10          // 质量等级
};

// 实时进度回调
gif.on('progress', (progress) => {
    updateProgressBar(progress * 100);
});
```

## ⚙️ 浏览器兼容性

| 浏览器 | 最低版本 | 图片工具 | 视频工具 |
|--------|----------|----------|----------|
| Chrome | 60+ | ✅ | ✅ |
| Firefox | 55+ | ✅ | ✅ |
| Safari | 11+ | ✅ | ✅ |
| Edge | 79+ | ✅ | ✅ |
| 移动端 | 现代浏览器 | ✅ | ⚠️ |

> **注意**：视频转GIF功能在移动设备上可能受到性能限制



## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。



⭐ 如果这个项目对您有帮助，请给它一个Star！
