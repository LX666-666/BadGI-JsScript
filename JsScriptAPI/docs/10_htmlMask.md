# 10. `htmlMask` HTML 遮罩

## 窗口管理

| 方法 | 返回/说明 |
|---|---|
| `show(url, id = null)` | 返回窗口 ID；相对路径限制在脚本目录，HTTP(S) URL 直接打开 |
| `close(id)` | `bool` |
| `closeAll()` | 关闭本实例打开的全部窗口 |
| `getWindowIds()` | `string[]` |
| `exists(id)` | `bool` |
| `setClickThrough(id, enabled)` | 设置点击穿透 |
| `getClickThrough(id)` | `bool` |
| `toggleClickThrough(id)` | 切换穿透 |

## JS 脚本侧消息

| 方法 | 说明 |
|---|---|
| `send(windowId, url, jsonData)` | 单向推送；`jsonData` 为字符串 |
| `respond(windowId, requestId, jsonData)` | 响应 HTML 发起的请求；`requestId` 必须来自收到的消息 |
| `request(windowId, url, jsonData, timeoutMs = 0)` | 请求 HTML，返回响应 JSON 字符串或 `null` |
| `receive(windowId, timeoutMs = 0)` | 阻塞等待一条消息，返回 JSON 字符串或 `null` |
| `poll(windowId)` | 非阻塞取一条 |
| `pollAll(windowId)` | 返回消息数组 JSON 字符串 |

## 示例

```js
const id = htmlMask.show("assets/index.html", "status-overlay");
try {
    htmlMask.send(id, "/status", JSON.stringify({ text: "running" }));

    const raw = await htmlMask.receive(id, 3000);
    if (raw) {
        const msg = JSON.parse(raw);
        log.info("收到 {0}", msg.url);
        if (msg.requestId) {
            htmlMask.respond(id, msg.requestId, JSON.stringify({ ok: true }));
        }
    }
} finally {
    htmlMask.close(id);
}
```

脚本不再使用窗口时应关闭。`htmlMask` 在对象释放时也会清理窗口，但显式生命周期更可靠。
