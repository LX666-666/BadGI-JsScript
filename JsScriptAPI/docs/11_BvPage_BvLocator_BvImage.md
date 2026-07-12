# 11. `BvPage`、`BvLocator` 与 `BvImage`

## `BvPage`

```js
const page = new BvPage();
await page.wait(500);
page.click(960, 540);
```

| 成员 | 说明 |
|---|---|
| `screenshot()` | 返回 `ImageRegion`，需释放 |
| `wait(milliseconds)` | 延时并返回当前 `BvPage` |
| `locator(recognitionObject)` | 创建定位器 |
| `locator(text, rect = default)` | OCR 文本定位 |
| `locator(bvImage)` | 图片定位 |
| `getByText(text = "", rect = default)` | 文本语义化包装 |
| `getByImage(bvImage)` | 图片语义化包装 |
| `ocr(rect = default)` | 同步返回 `List<Region>` |
| `click(x, y)` | 以 1080P 坐标点击 |
| `keyboard` / `mouse` | 输入模拟器对象 |

## `BvLocator`

```js
const page = new BvPage();
const locator = page.getByText("确认")
    .withTimeout(5000)
    .withRetryInterval(250);

const regions = await locator.tryWaitFor();
if (regions.Count > 0) regions[0].click();
```

| 方法 | 返回/行为 |
|---|---|
| `findAll()` | 同步查找；模板匹配最多一项，OCR 可多项 |
| `isExist()` | 同步布尔值 |
| `waitFor(timeout?)` | 等待出现，超时抛异常 |
| `tryWaitFor(timeout?)` | 超时返回空列表 |
| `waitForDisappear(timeout?)` | 等待消失，超时抛异常 |
| `tryWaitForDisappear(timeout?)` | 吞掉超时 |
| `click(timeout?)` | 等待并点击首项，返回 `Region` |
| `doubleClick(timeout?)` | 等待并双击首项 |
| `clickUntilDisappears(timeout?)` | 点击并持续重试直到消失 |
| `withRoi(rect)` | 设置 ROI，返回自身 |
| `withTimeout(ms)` | 设置实例超时 |
| `withRetryInterval(ms)` | 设置重试间隔 |
| `withRetryAction(callback)` | 未满足条件时执行同步或异步回调 |

静态默认值：`DefaultTimeout = 10000`、`DefaultRetryInterval = 250`。

## `BvImage`

```js
const img = new BvImage("FeatureName:AssetName", rect, 0.8);
const region = await new BvPage().getByImage(img).click(5000);
```

构造参数 `templateAsset` 必须能按 `feature:asset` 拆分，并从 BetterGI 内置资源加载，不是脚本目录图片路径。脚本自带图片请使用 `RecognitionObject.templateMatch(file.readImageMatSync(...))`。
