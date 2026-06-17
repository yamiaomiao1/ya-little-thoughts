# 雅的小巧思

一个原生 HTML + CSS + JavaScript 制作的本地网页应用，用来记录日常小巧思、突然冒出来的句子、文学联想、论文灵感和还没想清楚的问题。

## 如何在电脑上打开

可以直接双击 `index.html` 预览基础功能。记录会保存在当前浏览器的 `localStorage` 中，刷新页面不会消失。

PWA 安装和离线缓存需要通过服务器访问，直接用 `file://` 打开时 service worker 通常不能注册。

## 用本地服务器运行

如果使用 VS Code，可以安装 Live Server，然后右键 `index.html` 选择 Open with Live Server。

也可以在项目目录运行：

```bash
python -m http.server 8000
```

然后打开 `http://localhost:8000/`。

## 部署到 GitHub Pages

1. 新建一个 GitHub 仓库。
2. 上传本项目的所有文件。
3. 在仓库 Settings -> Pages 中选择部署分支。
4. 等待 GitHub Pages 生成访问链接。

部署后，网页本身在线，但记录仍然保存在当前设备、当前浏览器的 `localStorage` 中。

## 手机上使用与添加到桌面

1. 用手机浏览器打开部署后的网页地址。
2. iPhone Safari 可以选择分享按钮，再选择“添加到主屏幕”。
3. Android Chrome 可以打开浏览器菜单，选择“添加到主屏幕”或“安装应用”。

## 备份和恢复

点击“导出备份”会下载 JSON 文件，文件名类似：

```text
ya-little-thoughts-backup-2026-06-17.json
```

点击“导入备份”选择 JSON 文件后，可以选择“合并导入”或“覆盖现有记录”。

## 数据提醒

`localStorage` 数据只保存在当前浏览器当前设备中。手机和电脑之间不会自动同步。换设备前请先导出 JSON 备份，清理浏览器缓存也可能导致记录丢失。
