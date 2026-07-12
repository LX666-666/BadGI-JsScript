# 06. 日志、通知与服务器时间

## `log`

```js
log.debug("调试: {0}", value);
log.info("信息: {0}", value);
log.warn("警告: {0}", value);
log.error("错误: {0}", value);
```

日志格式基于 .NET 结构化占位符 `{0}`、`{1}`。模板字符串也可以直接拼接，但失去结构化参数优势。

## `notification`

```js
notification.send("任务完成");
notification.error("任务失败");
```

源码限制：

- 需要全局 JS 通知开关和当前项目权限允许；
- 单实例 1 分钟最多 5 次；
- 最长 500 字符；
- 内容含 `<script>`、`http://`、`https://` 会被拦截；
- 被拦截时只记录警告，不抛出异常。

## `ServerTime`

```js
const offset = ServerTime.getServerTimeZoneOffset();
const serverTime = new Date(Date.now() + offset);
```

返回值是**毫秒偏移量**。`ServerTime` 是注入的静态类型，成员大小写不敏感，但本文使用 `getServerTimeZoneOffset()`。
