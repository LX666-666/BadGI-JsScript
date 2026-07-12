# 05. `http` 请求

## 权限

同时满足：

1. BetterGI 调度器通用设置开启“JS HTTP 权限”；
2. `manifest.json` 配置 `http_allowed_urls`；
3. 请求 URL 匹配白名单，支持 `*` 通配符。

```json
{
  "http_allowed_urls": [
    "https://api.example.com/*"
  ]
}
```

## 签名

```js
await http.request(method, url, body = null, headersJson = null)
```

- `body`：字符串或 `null`。
- `headersJson`：必须是 JSON 字符串，不是 JavaScript 对象。
- 默认 `Content-Type` 为 `application/json`。
- 自定义 `content-type` 会用于请求体，其他请求头加入 `DefaultRequestHeaders`。

## 返回值

```js
{
  status_code: 200,
  headers: { /* 响应头 */ },
  body: "..."
}
```

字段是 `status_code`，不是旧文档中出现过的 `statuscode`。

## 示例

```js
const headers = JSON.stringify({
    "Authorization": "Bearer token",
    "Content-Type": "application/json",
    "X-Client": "BetterGI"
});

const response = await http.request(
    "POST",
    "https://api.example.com/v1/test",
    JSON.stringify({ hello: "world" }),
    headers
);

if (response.status_code < 200 || response.status_code >= 300) {
    throw new Error(`HTTP ${response.status_code}: ${response.body}`);
}

const data = JSON.parse(response.body);
```

## 限制

- 每次调用创建新的 `HttpClient`，不要高频轮询。
- 响应头同名多值只保留第一个。
- 无浏览器 Cookie 容器、自动会话或 `fetch` 兼容层；需要的请求头必须自行传入。
