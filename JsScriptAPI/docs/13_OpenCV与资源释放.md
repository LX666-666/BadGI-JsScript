# 13. OpenCV、像素与资源释放

BetterGI 注入 `Mat`、`Point2f` 以及 `OpenCvSharp` 类型集合。常见枚举路径示例：

```js
OpenCvSharp.OpenCvSharp.ColorConversionCodes.BGR2GRAY
OpenCvSharp.OpenCvSharp.ThresholdTypes.Binary
OpenCvSharp.OpenCvSharp.TemplateMatchModes.CCoeffNormed
OpenCvSharp.OpenCvSharp.Rect
OpenCvSharp.OpenCvSharp.Vec3b
```

## 图像处理

```js
const screen = captureGameRegion();
let gray = null;
let binary = null;
try {
    gray = screen.srcMat.cvtColor(
        OpenCvSharp.OpenCvSharp.ColorConversionCodes.BGR2GRAY
    );
    binary = gray.threshold(
        127,
        255,
        OpenCvSharp.OpenCvSharp.ThresholdTypes.Binary
    );
    file.writeImageSync("data/binary.png", binary);
} finally {
    if (binary) binary.dispose();
    if (gray) gray.dispose();
    screen.dispose();
}
```

## 像素读取

```js
const pixel = screen.srcMat.get(
    OpenCvSharp.OpenCvSharp.Vec3b,
    y,
    x
);
const blue = pixel.Item0;
const green = pixel.Item1;
const red = pixel.Item2;
```

OpenCV 彩色 `Mat` 默认按 BGR 顺序，不是 RGB。

## 释放规则

需要主动释放：

- `captureGameRegion()` 返回的 `ImageRegion`
- `deriveCrop()` 返回的新 `ImageRegion`
- `file.readImageMatSync()` 返回的 `Mat`
- `cvtColor`、`threshold` 等创建的新 `Mat`

`Region` 通常不持有独立图像，但实现了 `IDisposable`，当它由 `toImageRegion()` 等路径产生资源时仍应谨慎释放。
