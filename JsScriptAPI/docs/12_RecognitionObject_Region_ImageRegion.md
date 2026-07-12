# 12. 图像识别核心类型

## `RecognitionObject`

### 模板匹配

```js
const mat = file.readImageMatSync("assets/button.png");
const ro = RecognitionObject.templateMatch(mat);
ro.Threshold = 0.85;
ro.RegionOfInterest = new OpenCvSharp.OpenCvSharp.Rect(0, 0, 1920, 1080);
```

静态构造：

- `templateMatch(mat)`
- `templateMatch(mat, useMask, maskColor = default)`
- `templateMatch(mat, x, y, w, h)`
- `ocr(x, y, w, h)`
- `ocr(rect)`
- `ocrMatch(x, y, w, h, ...texts)`

重要属性：`RecognitionType`、`RegionOfInterest`、`Name`、`TemplateImageMat`、`Threshold`、`Use3Channels`、`TemplateMatchMode`、`UseMask`、`MaskColor`、`MaxMatchCount`、`UseBinaryMatch`、`BinaryThreshold`、`ReplaceDictionary`、`AllContainMatchText`、`OneContainMatchText`、`RegexMatchText`、`Text`。

修改模板属性后必要时调用 `initTemplate()`；静态 `templateMatch` 已自动初始化。

## `Region`

常用属性：`X`、`Y`、`Width`、`Height`、`Top`、`Bottom`、`Left`、`Right`、`Text`。

常用方法：

```js
region.click();
region.doubleClick();
region.backgroundClick();
region.clickTo(10, 10);
region.move();
region.moveTo(10, 10);
region.drawSelf("target");
region.drawRect(0, 0, 100, 50, "roi");
region.drawLine(0, 0, 100, 100, "line");
region.isEmpty();
region.toRect();
region.toImageRegion();
region.dispose();
```

## `ImageRegion`

`captureGameRegion()` 返回该类型。

| 成员 | 说明 |
|---|---|
| `srcMat` | 原始 OpenCV `Mat` |
| `cacheGreyMat` | 延迟生成的灰度图 |
| `deriveCrop(x, y, w, h)` | 裁剪为新的 `ImageRegion` |
| `deriveCrop(rect)` | `Rect` 重载 |
| `find(ro)` | 返回最优 `Region`；未找到返回空区域 |
| `findMulti(ro)` | 返回全部结果；支持模板匹配和 OCR |
| `dispose()` | 释放图像和缓存 |

### 模板匹配示例

```js
const template = file.readImageMatSync("assets/button.png");
const screen = captureGameRegion();
try {
    const ro = RecognitionObject.templateMatch(template, 0, 0, 1920, 1080);
    ro.Threshold = 0.85;
    const found = screen.find(ro);
    if (!found.isEmpty()) found.click();
} finally {
    screen.dispose();
    template.dispose();
}
```

### OCR 示例

```js
const screen = captureGameRegion();
try {
    const ro = RecognitionObject.ocr(0, 0, 1920, 1080);
    const regions = screen.findMulti(ro);
    for (let i = 0; i < regions.Count; i++) {
        log.info("{0}: {1}", i, regions[i].Text);
    }
} finally {
    screen.dispose();
}
```
