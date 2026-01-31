# JavaScript脚本开发 - 全局方法API

## 概述

BGI（BetterGenshinImpact）为JavaScript脚本开发提供了丰富的全局方法API，包括键盘鼠标操作、延时控制、识图功能和文本输入等。这些方法通过`GlobalMethod`类暴露给JavaScript运行环境。

**相关代码位置**: `BetterGenshinImpact\Core\Script\Dependence\GlobalMethod.cs:20-295`

## 延时控制

### Sleep(millisecondsTimeout)
暂停脚本执行指定的毫秒数。

```javascript
// 等待1秒
await sleep(1000);

// 等待500毫秒
await sleep(500);
```

**参数**:
- `millisecondsTimeout` (number): 延时毫秒数

**代码位置**: `GlobalMethod.cs:22-25`

---

## 键盘操作

### SetGameMetrics(width, height, [dpi])
设置游戏窗口的分辨率和DPI缩放比例。

```javascript
// 设置1920x1080分辨率
setGameMetrics(1920, 1080);

// 设置带DPI缩放的分辨率
setGameMetrics(1920, 1080, 1.25);
```

**参数**:
- `width` (number): 游戏窗口宽度
- `height` (number): 游戏窗口高度  
- `dpi` (number, 可选): DPI缩放比例，默认为1

**限制**: 必须是16:9的分辨率

**代码位置**: `GlobalMethod.cs:151-162`

### GetGameMetrics()
获取当前设置的游戏分辨率和DPI缩放比例。

```javascript
// 获取当前设置的游戏参数
const metrics = getGameMetrics();
const width = metrics[0];   // 游戏宽度
const height = metrics[1];  // 游戏高度  
const dpi = metrics[2];     // DPI缩放比例

log.info(`当前游戏配置: ${width}x${height}, DPI=${dpi}`);

// 实际应用示例：动态适配不同分辨率
function getScaledCoordinate(baseX, baseY) {
    const metrics = getGameMetrics();
    const scaleX = metrics[0] / 1920;  // 相对于1920基准的缩放
    const scaleY = metrics[1] / 1080;  // 相对于1080基准的缩放
    return {
        x: Math.round(baseX * scaleX),
        y: Math.round(baseY * scaleY)
    };
}
```

**返回值**: 
- `Array[number, number, number]` - 包含三个元素的数组：
  - `[0]`: 游戏窗口宽度 (number)
  - `[1]`: 游戏窗口高度 (number)
  - `[2]`: DPI缩放比例 (number)

**使用场景**:
- 动态获取当前游戏分辨率以适配坐标
- 验证游戏窗口配置是否正确
- 调试脚本时查看当前设置

**代码位置**: `GlobalMethod.cs:164-167`

### KeyDown(key)
按下指定按键（不释放）。

```javascript
// 按下W键
keyDown('VK_W');

// 按下左鼠标按钮
keyDown('VK_LBUTTON');

// 按下Ctrl键
keyDown('VK_CONTROL');
```

**代码位置**: `GlobalMethod.cs:29-61`

### KeyUp(key)
释放指定按键。

```javascript
// 释放W键
keyUp('VK_W');

// 释放左鼠标按钮
keyUp('VK_LBUTTON');
```

**代码位置**: `GlobalMethod.cs:63-95`

### KeyPress(key)
按下并快速释放指定按键。

```javascript
// 按下空格键
keyPress('VK_SPACE');

// 按下回车键
keyPress('VK_RETURN');

// 点击左鼠标按钮
keyPress('VK_LBUTTON');
```

**支持的特殊按键**:
- `VK_LBUTTON` - 左鼠标按钮
- `VK_RBUTTON` - 右鼠标按钮
- `VK_MBUTTON` - 中鼠标按钮
- `VK_XBUTTON1` - 鼠标侧键1
- `VK_XBUTTON2` - 鼠标侧键2
- `VK_ESCAPE` - ESC键（退出菜单界面）
- `VK_RETURN` - 回车键
- `VK_SPACE` - 空格键

**重要说明**:
- BGI支持两种键盘编码格式：
  1. **标准VK格式**：`"VK_ESCAPE"`、`"VK_RETURN"`等（推荐）
  2. **简化格式**：`"Escape"`、`"Return"`等（系统会自动添加VK_前缀）
- ESC键的正确编码是 `"VK_ESCAPE"` 或 `"Escape"`，不能使用 `"ESC"`
- 无效的键盘编码会抛出异常：`"键盘编码必须是VirtualKeyCodes枚举中的值"`

**代码位置**: `GlobalMethod.cs:97-121`

---

## 鼠标操作

### MoveMouseBy(x, y)
相对移动鼠标位置。

```javascript
// 向右移动100像素，向下移动50像素
moveMouseBy(100, 50);

// 向左移动50像素，向上移动30像素
moveMouseBy(-50, -30);
```

**代码位置**: `GlobalMethod.cs:156-162`

### MoveMouseTo(x, y)
移动鼠标到游戏窗口内的绝对坐标。

```javascript
// 移动到屏幕中央（假设1920x1080）
moveMouseTo(960, 540);

// 移动到左上角
moveMouseTo(0, 0);
```

**限制**: 坐标必须在游戏窗口范围内

**代码位置**: `GlobalMethod.cs:164-176`

### Click(x, y)
移动鼠标到指定位置并点击。

```javascript
// 点击屏幕上的某个按钮
click(500, 300);
```

**代码位置**: `GlobalMethod.cs:178-182`

### 鼠标按钮操作

```javascript
// 左键相关操作
leftButtonClick();  // 左键单击
leftButtonDown();   // 按下左键
leftButtonUp();     // 释放左键

// 右键相关操作
rightButtonClick(); // 右键单击
rightButtonDown();  // 按下右键
rightButtonUp();    // 释放右键

// 中键相关操作
middleButtonClick(); // 中键单击
middleButtonDown();  // 按下中键
middleButtonUp();    // 释放中键

// 滚轮操作
verticalScroll(3);   // 向上滚动3个单位
verticalScroll(-2);  // 向下滚动2个单位
```

**代码位置**: `GlobalMethod.cs:184-232`

---

## 识图操作

### CaptureGameRegion()
截取当前游戏窗口的图像。

```javascript
// 获取当前游戏画面
const gameImage = captureGameRegion();

// 可以用于后续的图像识别操作
// gameImage是ImageRegion类型对象
```

**返回值**: `ImageRegion` 对象，包含游戏画面的图像数据

**代码位置**: `GlobalMethod.cs:238-241`

**像素访问方法**: `ImageRegion`对象包含`SrcMat`属性，可以通过Mat的`Get`方法直接获取像素RGB值：

```javascript
const gameImage = captureGameRegion();
const mat = gameImage.SrcMat;  // 获取Mat对象
const pixelBGR = mat.Get(OpenCvSharp.OpenCvSharp.Vec3b, y, x); // 注意参数顺序是(类型, y, x)，返回BGR格式

// 获取RGB分量
const red = pixelBGR.Item2;    // R分量
const green = pixelBGR.Item1;  // G分量  
const blue = pixelBGR.Item0;   // B分量
```

### GetAvatars()
获取当前游戏中可见的角色列表。

```javascript
// 获取当前队伍中的角色
const avatarsResult = getAvatars();

// ⚠️ 重要：getAvatars()返回的是类数组对象，需要转换为真正的数组
const avatars = Array.from(avatarsResult);  // 推荐方法
// 或者使用展开运算符
const avatars2 = [...avatarsResult];

log.info('当前角色:', avatars);

// 输出示例: ['胡桃', '钟离', '行秋', '香菱']
```

**返回值**: 类数组对象（需要转换为数组），包含角色名称

**⚠️ 重要提示**: 
- `getAvatars()`返回的不是标准JavaScript数组，而是.NET集合对象
- 必须使用`Array.from(getAvatars())`或`[...getAvatars()]`转换为数组
- 转换后才能使用数组方法如`forEach`、`map`、`filter`等

**代码位置**: `GlobalMethod.cs:243-250`

---

## 文本输入操作

### InputText(text)
向游戏输入文本内容。

```javascript
// 输入聊天内容
inputText('Hello World!');

// 输入中文
inputText('你好世界');

// 输入多行文本
inputText(`这是第一行
这是第二行`);
```

**实现原理**: 通过剪贴板和Ctrl+V组合键实现文本输入

**注意事项**: 
- 会临时修改系统剪贴板内容
- 输入完成后会有100ms的延时确保操作完成

**代码位置**: `GlobalMethod.cs:255-294`

---

## 键盘鼠标事件监听

✅ **BGI提供完整的键鼠事件监听功能**

BGI通过 `KeyMouseHook` 类提供了全局键盘和鼠标事件监听功能，开发者可以监听用户的键盘按键、鼠标点击、鼠标移动和滚轮操作。

**相关代码位置**: `BetterGenshinImpact\Core\Script\Dependence\KeyMouseHook.cs:12-420`

### 快速示例

```javascript
// 创建键鼠钩子实例
const hook = new KeyMouseHook();

// 监听键盘按下事件
hook.OnKeyDown((keyCode) => {
    log.info(`键盘按下: ${keyCode}`);
    if (keyCode === 'F1') {
        log.info('F1功能键被按下');
    }
});

// 监听鼠标点击事件
hook.OnMouseDown((button, localX, localY) => {
    log.info(`鼠标${button}键点击在游戏坐标(${localX}, ${localY})`);
});

// 监听鼠标移动事件（200ms间隔）
hook.OnMouseMove((localX, localY) => {
    log.info(`鼠标移动到(${localX}, ${localY})`);
}, 200);

// 脚本结束前必须释放资源
hook.Dispose();
```

### 核心方法

- `OnKeyDown(callback, useCodeOnly)` - 注册键盘按下事件
- `OnKeyUp(callback, useCodeOnly)` - 注册键盘释放事件
- `OnMouseDown(callback)` - 注册鼠标按下事件（含游戏坐标）
- `OnMouseUp(callback)` - 注册鼠标释放事件（含游戏坐标）
- `OnMouseMove(callback, interval)` - 注册鼠标移动事件（可设置间隔）
- `OnMouseWheel(callback)` - 注册鼠标滚轮事件
- `RemoveAllListeners()` - 移除所有监听器
- `Dispose()` - 释放钩子资源（必须调用）

### ⚠️ 重要提示

1. **必须释放资源**：脚本结束前必须调用 `hook.Dispose()` 释放全局钩子资源
2. **坐标自动转换**：鼠标事件的坐标已自动转换为游戏窗口局部坐标
3. **性能优化**：鼠标移动事件建议设置合理的间隔时间（默认200ms）

### 📖 详细文档

完整的API说明、使用示例和最佳实践请参考：
- **[22-键鼠钩子事件监听功能](./22-键鼠钩子事件监听功能.md)** - KeyMouseHook类完整功能详解

---

## 文件访问操作

BGI提供了安全的文件访问API，通过`file`对象暴露，具有严格的安全限制。

**相关代码位置**: `BetterGenshinImpact\Core\Script\Dependence\LimitedFile.cs`

### file.readTextSync(path)
同步读取文本文件内容。

```javascript
// 读取配置文件
var config = file.readTextSync("config.json");
var configData = JSON.parse(config);

// 读取模块文件（用于eval加载）
eval(file.readTextSync("lib/utils.js"));
```

**参数**:
- `path` (string): 文件路径，相对于脚本项目根目录

**返回值**: 文件的文本内容（string）

**安全限制**:
- 只能访问脚本项目目录内的文件
- 支持的文件扩展名：`.txt`, `.json`, `.log`, `.csv`, `.xml`, `.html`, `.css`
- 最大文件大小：999MB
- 防止路径遍历攻击（`../`等）

### file.readText(path)
异步读取文本文件内容。

**✅ 已验证可用** - 此方法在最新版本的BGI中完全可用。

```javascript
// 异步读取配置文件
try {
    var content = await file.readText("data.json");
    var data = JSON.parse(content);
    log.info("配置加载成功");
} catch (error) {
    log.error("读取失败: " + error.message);
}

// 使用回调方式（可选）
file.readText("config.json", function(error, content) {
    if (error) {
        log.error("读取失败: " + error);
    } else {
        log.info("读取成功: " + content);
    }
});
```

**代码位置**: `LimitedFile.cs:79-106`

### file.readImageMatSync(path)
同步读取图像文件为OpenCV Mat对象。

```javascript
// 读取图像用于识别
var templateMat = file.readImageMatSync("templates/button.png");
```

**参数**:
- `path` (string): 图像文件路径

**返回值**: OpenCV Mat对象

**代码位置**: `LimitedFile.cs:151-166`

### file.ReadImageMatWithResizeSync(path, width, height, [interpolation])
读取图像文件为Mat对象，并调整到指定尺寸。

```javascript
// 读取图像并调整到指定尺寸
var resizedMat = file.ReadImageMatWithResizeSync("templates/large.png", 100, 100);

// 使用不同的插值算法
var highQualityMat = file.ReadImageMatWithResizeSync("image.png", 200, 150, 2); // 双三次插值
```

**参数**:
- `path` (string): 图像文件路径
- `width` (number): 调整后的宽度（必须为正数）
- `height` (number): 调整后的高度（必须为正数）
- `interpolation` (number, 可选): 插值算法，默认为1（双线性插值）

**支持的插值算法**:
- `0` - 最近邻插值（速度最快，质量最低）
- `1` - 双线性插值（默认，速度和质量平衡）
- `2` - 双三次插值（质量高，速度较慢）
- `3` - 像素区域关系重采样（适合缩小图像）
- `4` - Lanczos插值（质量最高，速度最慢）
- `5` - 精确双线性插值

**返回值**: 调整尺寸后的OpenCV Mat对象

**使用场景**:
- 统一模板图像尺寸以提高识别准确度
- 缩小大图像以提升处理性能
- 放大小图像以便于分析

**代码位置**: `LimitedFile.cs:187-200`

### file.ReadPathSync(folderPath)
读取指定文件夹内的所有文件和文件夹路径（非递归）。

```javascript
// 扫描步骤处理器文件
var allPaths = file.readPathSync("lib/steps");
var jsFiles = [];

for (var i = 0; i < allPaths.length; i++) {
    if (allPaths[i].toLowerCase().endsWith(".js")) {
        jsFiles.push(allPaths[i]);
    }
}
```

**参数**:
- `folderPath` (string): 文件夹路径，相对于脚本项目根目录

**返回值**: 文件和文件夹路径的数组

**注意事项** (基于AutoCommission项目发现):
- 返回的数据可能需要进行Array转换：`Array.from(allPaths || [])`
- 路径格式可能包含平台相关的分隔符

### file.WriteTextSync(path, content, [append])
同步写入文本到文件。

```javascript
// 写入配置文件
var configData = JSON.stringify({setting: "value"}, null, 2);
file.WriteTextSync("output/config.json", configData);

// 追加日志内容
file.WriteTextSync("logs/debug.log", "新的日志信息\n", true);
```

**参数**:
- `path` (string): 文件路径，相对于脚本项目根目录
- `content` (string): 要写入的文本内容
- `append` (boolean, 可选): 是否追加到文件末尾，默认为false（覆盖）

**返回值**: 布尔值，表示是否写入成功

**安全限制**:
- 只能写入脚本项目目录内的文件
- 支持的文件扩展名：`.txt`, `.json`, `.log`, `.csv`, `.xml`, `.html`, `.css`
- 最大文件大小：999MB
- 会自动创建不存在的目录

### file.WriteTextSync(path, content, [append])
同步写入文本到文件。

**⚠️ 方法名已更新**: 新版本BGI中实际方法名是 `writeTextSync`（小写w），但为了兼容性，`WriteTextSync`仍然可用。

```javascript
// 写入配置文件（推荐使用新方法名）
var configData = JSON.stringify({setting: "value"}, null, 2);
var success = file.writeTextSync("output/config.json", configData);

if (success) {
    log.info("配置文件写入成功");
} else {
    log.error("配置文件写入失败");
}

// 追加日志内容
file.writeTextSync("logs/debug.log", "新的日志信息\n", true);
```

**参数**:
- `path` (string): 文件路径，相对于脚本项目根目录
- `content` (string): 要写入的文本内容
- `append` (boolean, 可选): 是否追加到文件末尾，默认为false（覆盖）

**返回值**: 布尔值，表示是否写入成功

**代码位置**: `LimitedFile.cs:173-197`

**安全限制**:
- 支持的文件扩展名：`.txt`, `.json`, `.log`, `.csv`, `.xml`, `.html`, `.css`
- 最大文件大小：999MB
- 会自动创建目录（如果不存在）

### ✅ 新增：异步写入功能

**file.writeText(path, content, [append])** - BGI现在支持异步写入方法！

```javascript
// ✅ 正确：BGI现在支持异步写入
try {
    var success = await file.writeText("output.txt", "内容");
    if (success) {
        log.info("异步文件写入成功");
    } else {
        log.error("异步文件写入失败");
    }
} catch (error) {
    log.error("异步写入异常: " + error.message);
}

// 使用回调方式（可选）
file.writeText("logs/async.log", "异步日志内容", function(error, success) {
    if (error) {
        log.error("写入失败: " + error);
    } else {
        log.info("写入成功");
    }
}, false); // 最后一个参数是append标志
```

**代码位置**: `LimitedFile.cs:206-267`

### ✅ 新增：图像写入功能

**file.writeImageSync(path, mat)** - 支持将OpenCV Mat对象保存为图像文件。

```javascript
// 保存截图
var gameImage = captureGameRegion();
var success = file.writeImageSync("screenshots/game.png", gameImage.SrcMat);

if (success) {
    log.info("截图保存成功");
} else {
    log.error("截图保存失败");
}

// 保存处理后的图像（自动添加.png扩展名）
var processedMat = someImageProcessing(gameImage.SrcMat);
file.writeImageSync("output/processed", processedMat);
```

**参数**:
- `path` (string): 图像文件路径（会自动添加.png扩展名如果没有扩展名）
- `mat` (Mat): OpenCV Mat对象

**返回值**: boolean - 保存是否成功

**支持的图像格式**: `.png`, `.jpg`, `.jpeg`, `.bmp`, `.tiff`, `.webp`

**代码位置**: `LimitedFile.cs:275-302`
### file.isFolder(path)
判断指定路径是否为文件夹。

**⚠️ 方法名修正**: 实际方法名是 `isFolder`（小写i），不是 `IsFolder`。

```javascript
// 检查路径类型
if (file.isFolder("lib")) {
    log.info("lib是一个文件夹");
} else {
    log.info("lib是一个文件");
}

// 扫描目录前检查
var targetPath = "configs";
if (file.isFolder(targetPath)) {
    var files = file.readPathSync(targetPath);
    log.info("目录包含 " + files.length + " 个项目");
}
```

**参数**:
- `path` (string): 要检查的路径

**返回值**: boolean - 是否为文件夹

**代码位置**: `LimitedFile.cs:57-73`

---

## 文件安全验证机制

BGI的文件操作系统内置了完整的安全验证机制，确保脚本只能访问授权的文件类型和位置。

**代码位置**: `LimitedFile.cs:218-270` (IsValid方法和相关常量)

### 1. 文件扩展名白名单

文件操作仅支持以下扩展名的文件：

**文本文件**:
- `.txt` - 纯文本文件
- `.json` - JSON配置文件
- `.log` - 日志文件
- `.csv` - CSV数据文件
- `.xml` - XML配置文件
- `.html` - HTML文件
- `.css` - CSS样式文件

**图像文件**:
- `.png` - PNG图像
- `.jpg` / `.jpeg` - JPEG图像
- `.bmp` - BMP位图
- `.tiff` - TIFF图像
- `.webp` - WebP图像

```javascript
// ✅ 允许的文件操作
file.readTextSync("config.json");        // JSON文件
file.writeTextSync("output.txt", data);  // 文本文件
file.readImageMatSync("template.png");   // PNG图像

// ❌ 被拒绝的文件操作（扩展名不在白名单中）
file.readTextSync("script.js");          // .js不在白名单
file.readTextSync("data.db");            // .db不在白名单
file.writeTextSync("config.ini", data);  // .ini不在白名单
```

**代码位置**: `LimitedFile.cs:220` (_allowedExtensions数组)

### 2. 文件大小限制

为防止内存溢出和性能问题，文件操作有严格的大小限制：

- **最大文件大小**: 999 MB (1,047,527,424 字节)
- **适用范围**: 所有文件读写操作
- **超限行为**: 操作失败，返回false或空值

```javascript
// 文件大小检查示例
function safeWriteFile(path, content) {
    // 检查内容大小（粗略估算）
    var sizeInMB = content.length / (1024 * 1024);

    if (sizeInMB > 900) {  // 留一些安全余量
        log.warn("文件内容过大: " + sizeInMB.toFixed(2) + " MB");
        return false;
    }

    return file.writeTextSync(path, content);
}
```

**代码位置**: `LimitedFile.cs:225` (MaxFileSize常量)

### 3. 路径安全验证

所有文件路径都会经过严格的安全验证，防止路径遍历攻击：

**安全机制**:
- 路径规范化处理（NormalizePath）
- 防止访问项目目录外的文件
- 阻止路径遍历模式（`../`, `..\\`等）
- 自动转换为绝对路径

```javascript
// ✅ 安全的路径访问
file.readTextSync("config.json");           // 项目根目录
file.readTextSync("lib/utils.js");          // 子目录
file.readTextSync("data/output.txt");       // 数据目录

// ❌ 被阻止的路径访问
file.readTextSync("../../../system.txt");   // 路径遍历攻击
file.readTextSync("C:\\Windows\\system32"); // 绝对路径访问系统目录
```

**代码位置**:
- `LimitedFile.cs:78-81` (NormalizePath方法)
- `BetterGenshinImpact\Core\Script\Utils\ScriptUtils.cs:11-25` (路径验证逻辑)

### 4. 自动目录创建

当写入文件时，如果目标目录不存在，系统会自动创建：

```javascript
// 自动创建目录示例
file.writeTextSync("output/logs/debug.log", "日志内容");
// 如果 output/ 和 output/logs/ 不存在，会自动创建
```

**代码位置**: `LimitedFile.cs:244-250` (IsValid方法中的目录创建逻辑)

### 5. 图像文件特殊处理

图像文件有额外的验证和处理逻辑：

**自动扩展名补全**:
```javascript
// 如果没有扩展名，自动添加.png
file.writeImageSync("screenshot", mat);  // 自动保存为 screenshot.png
file.writeImageSync("output.jpg", mat);  // 保存为 output.jpg
```

**支持的图像格式验证**:
```javascript
// ✅ 支持的图像格式
file.writeImageSync("image.png", mat);   // PNG
file.writeImageSync("photo.jpg", mat);   // JPEG
file.writeImageSync("bitmap.bmp", mat);  // BMP

// ❌ 不支持的图像格式
file.writeImageSync("image.gif", mat);   // GIF不支持
file.writeImageSync("image.svg", mat);   // SVG不支持
```

**代码位置**:
- `LimitedFile.cs:417-430` (EnsureImageExtension方法)
- `LimitedFile.cs:437-449` (IsValidImagePath方法)

### 6. 验证失败处理

当文件操作违反安全规则时的行为：

| 验证失败原因 | 返回值 | 日志记录 |
|------------|--------|---------|
| 扩展名不在白名单 | false / 空字符串 / 空Mat | ❌ 不记录（静默失败） |
| 文件大小超限 | false / 空字符串 | ❌ 不记录（静默失败） |
| 路径遍历攻击 | 抛出异常 | ✅ 记录错误日志 |
| 文件不存在（读取） | 空字符串 / 空Mat | ✅ 记录错误日志 |
| 写入失败 | false | ✅ 记录错误日志 |

```javascript
// 推荐的错误处理模式
function safeFileOperation() {
    try {
        var content = file.readTextSync("config.json");

        if (content === "") {
            log.warn("文件读取失败或文件为空");
            return null;
        }

        return JSON.parse(content);
    } catch (error) {
        log.error("文件操作异常: " + error.message);
        return null;
    }
}
```

### 7. 安全限制总结

| 限制类型 | 限制值 | 代码位置 |
|---------|--------|---------|
| 文件扩展名 | 13种白名单扩展名 | LimitedFile.cs:220 |
| 文件大小 | 999 MB | LimitedFile.cs:225 |
| 访问范围 | 仅项目目录内 | ScriptUtils.cs:11-25 |
| 路径遍历 | 完全禁止 | ScriptUtils.cs:11-25 |
| 图像格式 | 6种图像格式 | LimitedFile.cs:420, 441 |

---

## 文件操作最佳实践

**返回值**: 布尔值，true表示是文件夹

### 文件访问最佳实践

基于AutoCommission项目的技术发现，以下是文件访问的最佳实践：

**1. 模块加载**:
```javascript
// ✅ 推荐：使用同步方式加载模块
eval(file.readTextSync("lib/constants.js"));
eval(file.readTextSync("lib/utils.js"));
```

**2. 数据文件读取**:
```javascript
// ✅ 推荐：使用同步方式，包含错误处理
function loadConfigSafely(configPath) {
    try {
        var content = file.readTextSync(configPath);
        return JSON.parse(content);
    } catch (error) {
        log.error("加载配置失败: " + error.message);
        return {};
    }
}
```

**3. 数据文件更新与合并**:
```javascript
// ✅ 推荐：动态更新数据文件的安全模式
function updateDataFile(dataPath, newItems, keyField) {
    try {
        // 读取现有数据
        var existingData;
        try {
            var content = file.readTextSync(dataPath);
            existingData = JSON.parse(content);
        } catch (error) {
            log.warn("无法读取现有数据，创建新结构");
            existingData = { items: [] };
        }
        
        // 合并新数据，避免重复
        var updatedCount = 0;
        for (var i = 0; i < newItems.length; i++) {
            var newItem = newItems[i];
            var exists = existingData.items.some(function(existing) {
                return existing[keyField] === newItem[keyField];
            });
            
            if (!exists) {
                existingData.items.push(newItem);
                updatedCount++;
            }
        }
        
        // 更新时间戳
        existingData.timestamp = new Date().toISOString();
        
        // 保存更新后的数据
        var success = file.WriteTextSync(dataPath, JSON.stringify(existingData, null, 2));
        if (success) {
            log.info("数据文件已更新: 新增 " + updatedCount + " 个项目");
        }
        return success;
    } catch (error) {
        log.error("数据文件更新失败: " + error.message);
        return false;
    }
}
```

**4. 文件扫描与过滤**:
```javascript
// ✅ 推荐：处理ReadPathSync返回的数据
function scanStepFiles() {
    var allPaths = file.readPathSync("lib/steps");
    
    // 确保是数组类型
    if (!Array.isArray(allPaths)) {
        allPaths = Array.from(allPaths || []);
    }
    
    // 过滤JavaScript文件
    return allPaths.filter(function(path) {
        return path.toLowerCase().endsWith(".js");
    });
}
```

---

## 使用示例

### 基础操作组合
```javascript
async function basicExample() {
    // 设置游戏分辨率
    setGameMetrics(1920, 1080);
    
    // 点击某个位置
    click(500, 300);
    await sleep(1000);
    
    // 按下W键移动
    keyDown('VK_W');
    await sleep(2000);
    keyUp('VK_W');
    
    // 输入文本
    inputText('测试文本');
    await sleep(500);
}
```

### 复杂鼠标操作
```javascript
async function mouseExample() {
    // 移动到起始位置
    moveMouseTo(100, 100);
    
    // 按下左键开始拖拽
    leftButtonDown();
    await sleep(100);
    
    // 拖拽到目标位置
    moveMouseTo(500, 300);
    await sleep(100);
    
    // 释放左键完成拖拽
    leftButtonUp();
}
```

---

## 路径追踪脚本（pathingScript）

**相关代码位置**: `BetterGenshinImpact\Core\Script\EngineExtend.cs:29`

BGI提供`pathingScript`对象用于执行路径追踪JSON文件，实现自动寻路功能。

### pathingScript.runFile(filePath)
执行指定的路径追踪JSON文件。

```javascript
// 执行路径追踪文件
await pathingScript.runFile("assets/process/餐品订单/蒙德城/餐品订单-1.json");

// 执行战斗委托路径追踪
await pathingScript.runFile("assets/丘丘人的一小步/坠星山谷-1.json");
```

**参数**:
- `filePath` (string): 路径追踪JSON文件的相对路径（相对于脚本项目根目录）

**返回值**: Promise，完成路径追踪后resolve

**代码位置**: `AutoPathingScript.cs:42-54`

### pathingScript.RunFileFromUser(path)
从用户订阅的内容中获取并执行路径追踪文件。

```javascript
// 执行用户订阅的路径文件
await pathingScript.RunFileFromUser("蒙德/日常委托路线.json");

// 执行共享的采集路线
await pathingScript.RunFileFromUser("采集/晶核采集路线.json");
```

**参数**:
- `path` (string): 路径文件的相对路径（相对于`User\AutoPathing`目录）

**返回值**: Promise，完成路径追踪后resolve

**使用说明**:
- 此方法从`User\AutoPathing`目录读取文件，而不是脚本项目目录
- 适用于执行从BGI路径仓库订阅的共享路径文件
- 用户可以通过BGI界面订阅和管理这些路径文件

**区别说明**:
- `runFile()` - 读取脚本项目内的路径文件
- `RunFileFromUser()` - 读取`User\AutoPathing`目录下的订阅路径文件

**代码位置**: `AutoPathingScript.cs:60-64`

### 路径追踪使用说明

**JSON文件格式**:
- JSON文件应包含路径点位和相关配置
- 自动处理寻路、战斗、拾取等操作
- 支持复杂的多点路径追踪

**常见错误**:
```javascript
// ❌ 错误：BGI中不存在此方法
await genshin.executePathFollowing(positions);

// ✅ 正确：使用pathingScript
await pathingScript.runFile(jsonFilePath);
```

---

## 键盘按键操作增强

### keyPress(key) [增强功能]
除了基本的按键操作外，BGI还支持组合键和特殊按键操作。

```javascript
// 按下Escape键（常用于退出菜单）
await keyPress("VK_ESCAPE");

// 或者使用简化格式
await keyPress("Escape");

// 组合键操作示例
keyDown('VK_CONTROL');
keyPress('VK_C');  // Ctrl+C复制
keyUp('VK_CONTROL');
await sleep(100);

keyDown('VK_CONTROL');
keyPress('VK_V');  // Ctrl+V粘贴
keyUp('VK_CONTROL');
```

**特殊按键支持**:
- `"VK_ESCAPE"` 或 `"Escape"` - ESC键（用于退出菜单、界面）
- `"VK_CONTROL"` 或 `"Control"` - Ctrl键（用于组合键）
- `"VK_SHIFT"` 或 `"Shift"` - Shift键
- `"VK_ALT"` 或 `"Alt"` - Alt键

**⚠️ 常见错误**:
```javascript
// ❌ 错误：使用ESC会导致异常
keyPress("ESC"); // 抛出："键盘编码必须是VirtualKeyCodes枚举中的值，当前传入的 ESC 不合法"

// ✅ 正确：使用VK_ESCAPE或Escape
keyPress("VK_ESCAPE");
keyPress("Escape");
```

---

## 鼠标操作增强

### 自然鼠标移动
BGI支持模拟更自然的鼠标移动轨迹，而不是直线移动：

```javascript
// 自然鼠标移动实现示例（基于自动购买脚本发现）
async function naturalMove(initX, initY, targetX, targetY, duration, wiggle = 30) {
    // 生成控制点（使路径形成曲线）
    const controlX = (initX + targetX) / 2 + (Math.random() * wiggle * 2 - wiggle);
    const controlY = (initY + targetY) / 2 + (Math.random() * wiggle * 2 - wiggle);

    const steps = Math.max(duration / 20, 10); // 计算步数

    for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        const t = progress * progress * (3 - 2 * progress); // 平滑过渡

        // 二次贝塞尔曲线计算
        const x = (1 - t) * (1 - t) * initX + 2 * (1 - t) * t * controlX + t * t * targetX;
        const y = (1 - t) * (1 - t) * initY + 2 * (1 - t) * t * controlY + t * t * targetY;

        moveMouseTo(Math.trunc(x), Math.trunc(y));

        // 随机延迟使移动更自然
        await sleep(Math.trunc(duration / steps * (0.8 + Math.random() * 0.4)));
    }

    // 确保最终位置准确
    moveMouseTo(targetX, targetY);
}

// 使用自然移动
await naturalMove(100, 100, 500, 300, 300); // 300ms内从(100,100)移动到(500,300)
```

**功能特点**:
- 使用二次贝塞尔曲线生成移动轨迹
- 支持随机抖动参数增加自然性
- 可调节移动持续时间
- 避免被游戏检测为脚本操作

---

## 错误处理

大部分全局方法都包含参数验证和错误处理：

- **键盘编码错误**: 传入无效的虚拟键码时会抛出`ArgumentException`
- **坐标范围错误**: 鼠标坐标超出游戏窗口时会抛出`ArgumentException`  
- **分辨率错误**: 设置非16:9分辨率时会抛出`ArgumentException`

```javascript
try {
    // 可能出错的操作
    keyPress('INVALID_KEY');
} catch (error) {
    log.error('操作失败:', error.message);
}
```

---

## 版本信息

- **文档版本**: v1.0.0
- **最后更新**: 2025年10月19日
- **适用BGI版本**: >=0.52.0
- **维护状态**: 活跃维护

