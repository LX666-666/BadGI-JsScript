# 09. `KeyMouseHook` 全局键鼠监听

## 创建与释放

```js
const hook = new KeyMouseHook();
try {
    hook.onKeyDown(key => log.info("down: {0}", key));
    await sleep(10000);
} finally {
    hook.dispose();
}
```

脚本结束前必须释放，否则回调可能在脚本引擎销毁后继续触发并产生异常。

## 方法

| 方法 | 回调参数 |
|---|---|
| `onKeyDown(callback, useCodeOnly = true)` | 键名字符串 |
| `onKeyUp(callback, useCodeOnly = true)` | 键名字符串 |
| `onMouseDown(callback)` | `(button, x, y)` |
| `onMouseUp(callback)` | `(button, x, y)` |
| `onMouseMove(callback, interval = 200)` | `(x, y)` |
| `onMouseWheel(callback)` | `(delta, x, y)` |
| `removeAllListeners()` | 清空所有回调 |
| `dispose()` | 取消后台事件处理并解除钩子 |

鼠标坐标会转换为游戏捕获窗口的局部坐标；转换失败时可能返回 `-1, -1`。

`useCodeOnly = true` 返回 `KeyCode`；设为 `false` 返回包含修饰键信息的 `KeyData` 字符串。
