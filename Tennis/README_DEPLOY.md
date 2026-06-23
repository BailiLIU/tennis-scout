# Tennis Scout 部署说明

## 本地预览

双击 `start-import-server.bat`，或运行：

```powershell
.\start-import-server.ps1
```

打开：

```text
http://127.0.0.1:4174/index.html
```

## 正式外链部署到 Render

1. 把整个 `Tennis` 文件夹上传到 GitHub 仓库。
2. 打开 Render，选择 `New` -> `Web Service`。
3. 连接这个 GitHub 仓库。
4. 配置：
   - Runtime: `Node`
   - Build Command: 留空
   - Start Command: `npm start`
5. 部署完成后，Render 会给一个 `https://...onrender.com` 外链。

## 重要说明

当前版本的数据保存在访问者自己的浏览器本地。也就是说，部署后别人打开外链可以使用导入和保存，但他们看到的是自己浏览器里的数据，不会自动共享你电脑里的数据。

如果要多人共享同一份数据，需要再接一个云端数据库或文件存储。
