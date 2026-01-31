# JavaScript脚本开发 - HTTP请求功能

## 概述

BGI为JavaScript脚本提供了安全的HTTP请求功能，允许脚本与外部API进行通信。该功能具有严格的权限控制机制，确保脚本只能访问预先配置的URL。

**相关代码位置**:
- **核心实现**: `BetterGenshinImpact\Core\Script\Dependence\Http.cs` (全文116行)
- **引擎注册**: `BetterGenshinImpact\Core\Script\EngineExtend.cs:37` - http对象注册

---

## 安全机制

### 权限要求

HTTP请求功能需要满足以下条件才能使用：

1. **全局权限开关**: 在BGI设置的"调度器通用设置"中启用"JS HTTP权限"
2. **白名单配置**: 在脚本的`manifest.json`中配置`http_allowed_urls`字段
3. **URL匹配验证**: 请求的URL必须匹配白名单中的任一模式

### manifest.json 配置示例

```json
{
  "name": "我的脚本",
  "version": "1.0.0",
  "http_allowed_urls": [
    "https://api.example.com/*",
    "https://myserver.com/api/*",
    "http://localhost:*"
  ]
}
```

**URL模式说明**:
- 使用 `*` 作为通配符，匹配任意字符
- 示例：`https://api.example.com/*` 可以匹配 `https://api.example.com/users`, `https://api.example.com/data/list` 等
- 支持精确匹配：`https://api.example.com/specific/endpoint`

### URL通配符模式匹配详解

BGI的HTTP白名单支持灵活的通配符模式匹配，基于正则表达式实现。

**代码位置**: `Http.cs:32-39` (CheckHttpPermission方法中的模式匹配逻辑)

#### 通配符规则

通配符 `*` 会被转换为正则表达式的 `.*`，可以匹配任意数量的任意字符。

```json
{
  "http_allowed_urls": [
    "https://api.example.com/*",           // 匹配该域名下的所有路径
    "https://*/api/v1/users",              // 匹配任意域名的特定路径
    "http://localhost:*",                  // 匹配localhost的任意端口
    "https://api.*.com/data"               // 匹配api.xxx.com的特定路径
  ]
}
```

#### 匹配示例

| 白名单模式 | 匹配的URL | 不匹配的URL |
|-----------|----------|------------|
| `https://api.example.com/*` | `https://api.example.com/users`<br>`https://api.example.com/data/list`<br>`https://api.example.com/v1/api/endpoint` | `http://api.example.com/users` (协议不同)<br>`https://api.example.org/users` (域名不同) |
| `https://*/api/users` | `https://api.example.com/api/users`<br>`https://myserver.com/api/users` | `https://api.example.com/api/posts` (路径不同)<br>`https://api.example.com/v1/api/users` (路径不完全匹配) |
| `http://localhost:*` | `http://localhost:3000`<br>`http://localhost:8080/api` | `https://localhost:3000` (协议不同)<br>`http://127.0.0.1:3000` (域名不同) |
| `https://api.example.com/v*/users` | `https://api.example.com/v1/users`<br>`https://api.example.com/v2/users`<br>`https://api.example.com/version1/users` | `https://api.example.com/users` (缺少v部分) |

#### 精确匹配 vs 通配符匹配

```json
{
  "http_allowed_urls": [
    // 精确匹配：只允许访问这个特定的endpoint
    "https://api.example.com/users/list",

    // 通配符匹配：允许访问该路径下的所有endpoint
    "https://api.example.com/data/*",

    // 多级通配符：允许访问整个API
    "https://api.example.com/*"
  ]
}
```

#### 常见配置模式

**1. 允许特定API的所有endpoint**:
```json
{
  "http_allowed_urls": [
    "https://api.github.com/*"
  ]
}
```

**2. 允许多个API服务**:
```json
{
  "http_allowed_urls": [
    "https://api.service1.com/*",
    "https://api.service2.com/*",
    "https://api.service3.com/*"
  ]
}
```

**3. 允许本地开发环境**:
```json
{
  "http_allowed_urls": [
    "http://localhost:*",
    "http://127.0.0.1:*"
  ]
}
```

**4. 允许特定版本的API**:
```json
{
  "http_allowed_urls": [
    "https://api.example.com/v1/*",
    "https://api.example.com/v2/*"
  ]
}
```

**5. 允许子域名通配**:
```json
{
  "http_allowed_urls": [
    "https://*.example.com/api/*"
  ]
}
```

#### 安全建议

```javascript
// ✅ 推荐：使用最小权限原则
{
  "http_allowed_urls": [
    "https://api.example.com/users/*",      // 只允许访问users相关API
    "https://api.example.com/data/read/*"   // 只允许读取数据
  ]
}

// ⚠️ 谨慎使用：过于宽松的权限
{
  "http_allowed_urls": [
    "https://*",                            // 允许所有HTTPS请求（不推荐）
    "http://*"                              // 允许所有HTTP请求（不推荐）
  ]
}

// ❌ 不推荐：混合使用精确和通配符可能导致混淆
{
  "http_allowed_urls": [
    "https://api.example.com/users",        // 精确匹配
    "https://api.example.com/*"             // 通配符已经包含了上面的精确匹配
  ]
}
```

#### 权限检查流程

当脚本发起HTTP请求时，BGI会按以下流程检查权限：

1. **检查全局开关**: 验证"JS HTTP权限"是否启用
2. **检查白名单配置**: 验证manifest.json中是否配置了`http_allowed_urls`
3. **模式匹配**: 遍历白名单，检查请求URL是否匹配任一模式
4. **匹配成功**: 允许请求
5. **匹配失败**: 抛出`UnauthorizedAccessException`异常

```javascript
// 权限检查失败的错误示例
try {
    await http.Request("GET", "https://unauthorized-site.com/api", null, null);
} catch (error) {
    // 错误信息：
    // "当前JS脚本不允许请求此URL: https://unauthorized-site.com/api，
    //  请在脚本的manifest.json中配置http_allowed_urls，
    //  当前允许的URL列表: [https://api.example.com/*]"
    log.error(error.message);
}
```

**代码位置**: `Http.cs:20-44` (CheckHttpPermission方法)

---

## HTTP 对象

### http 全局对象

BGI提供的全局`http`对象，包含HTTP请求方法。

**引擎注册位置**: `EngineExtend.cs:37` - http对象注册

```javascript
// http对象在脚本启动时自动可用
// 无需手动创建或导入
```

---

## Request 方法

### 方法签名

```javascript
/**
 * 执行HTTP请求
 * @param {string} method - HTTP方法 ("GET", "POST", "PUT", "DELETE", 等)
 * @param {string} url - 请求URL
 * @param {string|null} body - 请求体（可选）
 * @param {string|null} headersJson - 请求头JSON字符串（可选）
 * @returns {Promise<HttpResponse>} HTTP响应对象
 */
await http.Request(method, url, body, headersJson);
```

**代码位置**: `Http.cs:62-115`

### 响应对象结构

```javascript
// HttpResponse 结构
{
    status_code: number,              // HTTP状态码 (200, 404, 500等)
    headers: {                        // 响应头对象
        "content-type": "application/json",
        "server": "nginx",
        // ... 其他响应头
    },
    body: string                      // 响应体（字符串）
}
```

**代码位置**: `Http.cs:46-51`

---

## 使用示例

### 基础 GET 请求

```javascript
async function fetchUserData() {
    try {
        // 发送GET请求
        const response = await http.Request("GET", "https://api.example.com/users", null, null);

        // 检查状态码
        if (response.status_code === 200) {
            log.info("请求成功");

            // 解析JSON响应
            const data = JSON.parse(response.body);
            log.info("用户数据:", data);

            return data;
        } else {
            log.error(`请求失败，状态码: ${response.status_code}`);
            return null;
        }
    } catch (error) {
        log.error("HTTP请求出错:", error.message);
        return null;
    }
}
```

### POST 请求（发送 JSON 数据）

```javascript
async function createUser(name, email) {
    try {
        // 准备请求体
        const requestBody = JSON.stringify({
            name: name,
            email: email,
            timestamp: Date.now()
        });

        // 准备请求头
        const headers = JSON.stringify({
            "Content-Type": "application/json",
            "User-Agent": "BGI-Script/1.0"
        });

        // 发送POST请求
        const response = await http.Request(
            "POST",
            "https://api.example.com/users",
            requestBody,
            headers
        );

        if (response.status_code === 201) {
            log.info("用户创建成功");
            const newUser = JSON.parse(response.body);
            return newUser;
        } else {
            log.error(`创建失败: ${response.body}`);
            return null;
        }
    } catch (error) {
        log.error("创建用户出错:", error.message);
        return null;
    }
}

// 使用示例
const user = await createUser("张三", "zhangsan@example.com");
```

### 带认证的请求

```javascript
async function fetchProtectedData(apiToken) {
    try {
        // 设置Authorization头
        const headers = JSON.stringify({
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json"
        });

        const response = await http.Request(
            "GET",
            "https://api.example.com/protected/data",
            null,
            headers
        );

        if (response.status_code === 200) {
            return JSON.parse(response.body);
        } else if (response.status_code === 401) {
            log.error("认证失败，Token可能已过期");
            return null;
        } else {
            log.error(`请求失败: ${response.status_code}`);
            return null;
        }
    } catch (error) {
        log.error("请求出错:", error.message);
        return null;
    }
}
```

### PUT 请求（更新数据）

```javascript
async function updateUser(userId, updates) {
    try {
        const requestBody = JSON.stringify(updates);
        const headers = JSON.stringify({
            "Content-Type": "application/json"
        });

        const response = await http.Request(
            "PUT",
            `https://api.example.com/users/${userId}`,
            requestBody,
            headers
        );

        if (response.status_code === 200) {
            log.info("用户信息更新成功");
            return JSON.parse(response.body);
        } else {
            log.error(`更新失败: ${response.status_code}`);
            return null;
        }
    } catch (error) {
        log.error("更新用户出错:", error.message);
        return null;
    }
}
```

### DELETE 请求

```javascript
async function deleteUser(userId) {
    try {
        const response = await http.Request(
            "DELETE",
            `https://api.example.com/users/${userId}`,
            null,
            null
        );

        if (response.status_code === 204 || response.status_code === 200) {
            log.info("用户删除成功");
            return true;
        } else {
            log.error(`删除失败: ${response.status_code}`);
            return false;
        }
    } catch (error) {
        log.error("删除用户出错:", error.message);
        return false;
    }
}
```

---

## 实用功能示例

### 获取游戏公告

```javascript
async function fetchGameAnnouncements() {
    try {
        const response = await http.Request(
            "GET",
            "https://hk4e-api.mihoyo.com/common/hk4e_cn/announcement/api/getAnnList",
            null,
            JSON.stringify({
                "Content-Type": "application/json"
            })
        );

        if (response.status_code === 200) {
            const data = JSON.parse(response.body);

            if (data.retcode === 0) {
                log.info("获取游戏公告成功");
                return data.data;
            } else {
                log.error("公告API返回错误:", data.message);
                return null;
            }
        }
    } catch (error) {
        log.error("获取公告失败:", error.message);
        return null;
    }
}
```

### Webhook 通知集成

```javascript
async function sendWebhookNotification(message, webhookUrl) {
    try {
        // 适用于Discord、Slack等webhook
        const payload = JSON.stringify({
            content: message,
            username: "BGI脚本通知",
            timestamp: new Date().toISOString()
        });

        const headers = JSON.stringify({
            "Content-Type": "application/json"
        });

        const response = await http.Request(
            "POST",
            webhookUrl,
            payload,
            headers
        );

        if (response.status_code >= 200 && response.status_code < 300) {
            log.info("Webhook通知发送成功");
            return true;
        } else {
            log.error(`Webhook发送失败: ${response.status_code}`);
            return false;
        }
    } catch (error) {
        log.error("发送Webhook通知出错:", error.message);
        return false;
    }
}

// 使用示例
await sendWebhookNotification(
    "每日任务已完成！",
    "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL"
);
```

### API轮询检查

```javascript
async function pollApiUntilReady(url, maxAttempts = 10, interval = 5000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            log.info(`第 ${attempt}/${maxAttempts} 次检查...`);

            const response = await http.Request("GET", url, null, null);

            if (response.status_code === 200) {
                const data = JSON.parse(response.body);

                if (data.status === "ready") {
                    log.info("服务已就绪！");
                    return data;
                }
            }

            if (attempt < maxAttempts) {
                log.info(`服务未就绪，${interval/1000}秒后重试...`);
                await sleep(interval);
            }
        } catch (error) {
            log.error(`检查失败 (${attempt}/${maxAttempts}):`, error.message);
        }
    }

    log.error("达到最大尝试次数，服务仍未就绪");
    return null;
}
```

### 数据上传到自建服务器

```javascript
async function uploadGameData(gameStats) {
    try {
        const data = {
            player_uid: "123456789",
            timestamp: Date.now(),
            stats: gameStats,
            version: "1.0.0"
        };

        const response = await http.Request(
            "POST",
            "https://myserver.com/api/upload",
            JSON.stringify(data),
            JSON.stringify({
                "Content-Type": "application/json",
                "X-API-Key": "your-api-key-here"
            })
        );

        if (response.status_code === 200) {
            log.info("数据上传成功");
            return true;
        } else {
            log.error(`上传失败: ${response.status_code} - ${response.body}`);
            return false;
        }
    } catch (error) {
        log.error("上传数据出错:", error.message);
        return false;
    }
}
```

---

## 错误处理

### 常见错误类型

```javascript
async function robustHttpRequest(url) {
    try {
        const response = await http.Request("GET", url, null, null);

        // 根据状态码进行不同处理
        switch (response.status_code) {
            case 200:
                log.info("请求成功");
                return JSON.parse(response.body);

            case 400:
                log.error("请求参数错误");
                return null;

            case 401:
                log.error("未授权，需要认证");
                return null;

            case 403:
                log.error("禁止访问");
                return null;

            case 404:
                log.error("资源不存在");
                return null;

            case 429:
                log.warn("请求过于频繁，被限流");
                return null;

            case 500:
            case 502:
            case 503:
                log.error("服务器错误");
                return null;

            default:
                log.error(`未处理的状态码: ${response.status_code}`);
                return null;
        }
    } catch (error) {
        // 捕获所有异常
        if (error.message.includes("不允许请求此URL")) {
            log.error("URL不在白名单中，请检查manifest.json配置");
        } else if (error.message.includes("JS HTTP权限")) {
            log.error("HTTP权限未开启，请在设置中启用");
        } else if (error.message.includes("Headers JSON格式错误")) {
            log.error("请求头JSON格式不正确");
        } else {
            log.error("HTTP请求异常:", error.message);
        }
        return null;
    }
}
```

### 重试机制

```javascript
async function requestWithRetry(url, maxRetries = 3, retryDelay = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            log.info(`请求尝试 ${attempt}/${maxRetries}`);

            const response = await http.Request("GET", url, null, null);

            if (response.status_code === 200) {
                log.info("请求成功");
                return JSON.parse(response.body);
            }

            // 如果是客户端错误（4xx），不重试
            if (response.status_code >= 400 && response.status_code < 500) {
                log.error(`客户端错误 ${response.status_code}，停止重试`);
                return null;
            }

            // 服务器错误（5xx）或其他错误，继续重试
            if (attempt < maxRetries) {
                log.warn(`请求失败 (${response.status_code})，${retryDelay/1000}秒后重试...`);
                await sleep(retryDelay);
            }
        } catch (error) {
            log.error(`请求出错 (${attempt}/${maxRetries}):`, error.message);

            if (attempt < maxRetries) {
                await sleep(retryDelay);
            }
        }
    }

    log.error("达到最大重试次数，请求失败");
    return null;
}
```

---

## 最佳实践

### 1. 始终配置白名单

```json
// manifest.json - 推荐做法
{
  "http_allowed_urls": [
    "https://api.myservice.com/*",  // 只允许特定域名
    "http://localhost:3000/*"       // 开发环境
  ]
}
```

### 2. 设置合理的超时和重试

```javascript
// 为长时间运行的请求设置超时处理
async function requestWithTimeout(url, timeoutMs = 30000) {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("请求超时")), timeoutMs);
    });

    const requestPromise = http.Request("GET", url, null, null);

    try {
        const response = await Promise.race([requestPromise, timeoutPromise]);
        return response;
    } catch (error) {
        log.error("请求超时或失败:", error.message);
        return null;
    }
}
```

### 3. 安全地处理敏感信息

```javascript
// ❌ 错误：不要在代码中硬编码敏感信息
const API_KEY = "sk_live_abc123...";  // 不要这样做！

// ✅ 正确：从配置文件读取
async function loadApiKey() {
    try {
        const config = await file.ReadText("config.json");
        const configObj = JSON.parse(config);
        return configObj.api_key;
    } catch (error) {
        log.error("读取API密钥失败");
        return null;
    }
}

async function authenticatedRequest() {
    const apiKey = await loadApiKey();
    if (!apiKey) {
        log.error("无法获取API密钥");
        return null;
    }

    const headers = JSON.stringify({
        "Authorization": `Bearer ${apiKey}`
    });

    return await http.Request("GET", "https://api.example.com/data", null, headers);
}
```

### 4. 响应数据验证

```javascript
async function fetchAndValidate(url) {
    try {
        const response = await http.Request("GET", url, null, null);

        if (response.status_code !== 200) {
            log.error(`请求失败: ${response.status_code}`);
            return null;
        }

        // 验证Content-Type
        const contentType = response.headers["content-type"] || "";
        if (!contentType.includes("application/json")) {
            log.warn("响应不是JSON格式");
        }

        // 解析并验证JSON
        let data;
        try {
            data = JSON.parse(response.body);
        } catch (e) {
            log.error("JSON解析失败:", e.message);
            return null;
        }

        // 验证数据结构
        if (!data || typeof data !== "object") {
            log.error("响应数据格式不正确");
            return null;
        }

        return data;
    } catch (error) {
        log.error("请求失败:", error.message);
        return null;
    }
}
```

---

## 注意事项

### 安全限制

1. **URL白名单强制**: 所有请求的URL必须在`manifest.json`的`http_allowed_urls`中配置
2. **权限开关**: 需要在BGI设置中明确启用"JS HTTP权限"
3. **无默认白名单**: 如果未配置白名单，所有HTTP请求都会被拒绝

**代码位置**: `Http.cs:20-44`

### 性能考虑

1. **避免频繁请求**: HTTP请求相对耗时，避免在循环中频繁调用
2. **合理的重试间隔**: 建议重试间隔不少于2秒
3. **并发控制**: JavaScript是单线程的，大量并发请求可能影响脚本性能

### 错误处理

1. **始终使用 try-catch**: HTTP请求可能因网络、权限等多种原因失败
2. **检查状态码**: 不要假设请求一定成功，始终检查`status_code`
3. **记录详细日志**: 使用log记录请求参数和响应，便于调试

---

## 常见问题

### Q: 为什么提示"不允许使用HTTP请求"？

**A**: 检查以下几点：
1. 是否在BGI设置中启用了"JS HTTP权限"
2. 脚本的`manifest.json`是否配置了`http_allowed_urls`
3. 请求的URL是否匹配白名单模式

### Q: 如何调试HTTP请求？

**A**:
```javascript
// 添加详细的调试日志
log.debug(`[HTTP] 请求方法: ${method}`);
log.debug(`[HTTP] 请求URL: ${url}`);
log.debug(`[HTTP] 请求体: ${body}`);
log.debug(`[HTTP] 请求头: ${headersJson}`);

const response = await http.Request(method, url, body, headersJson);

log.debug(`[HTTP] 响应状态: ${response.status_code}`);
log.debug(`[HTTP] 响应头:`, JSON.stringify(response.headers));
log.debug(`[HTTP] 响应体: ${response.body}`);
```

### Q: 是否支持文件上传？

**A**: 当前版本仅支持文本数据（JSON、字符串等），不直接支持multipart/form-data文件上传。如需上传文件，可以先将文件转换为Base64字符串。

### Q: 请求头为什么要用JSON字符串？

**A**: 这是为了与JavaScript引擎的互操作性。需要先创建对象，然后用`JSON.stringify()`转换：
```javascript
const headers = JSON.stringify({
    "Authorization": "Bearer token",
    "Content-Type": "application/json"
});
```

---

## 相关文档

- **[01-全局方法API](./01-全局方法API.md)** - 基础API方法
- **[05-日志和通知系统](./05-日志和通知系统.md)** - 日志记录功能
- **[06-脚本项目结构和配置](./06-脚本项目结构和配置.md)** - manifest.json配置
- **[00-完整代码位置索引](./00-完整代码位置索引.md)** - 源码位置索引

---

## 版本信息

- **文档版本**: v1.1.0
- **最后更新**: 2026年1月18日
- **适用BGI版本**: >=0.52.0
- **维护状态**: 活跃维护

## 变更记录

- v1.1.0 (2026-01-18): 更新代码位置引用，修正引擎注册位置（EngineExtend.cs:37）
- v1.0.0 (2025-10-19): 初始版本
