# BetterGI JavaScript API 合并校正版

- 核对仓库：`babalae/better-genshin-impact`
- 核对分支：`main`
- 核对提交：`beb0a70f5bf145d593230cdf58b32babcd8dd792`
- 整理日期：`2026-07-12`
- 文档语言：简体中文

## 使用顺序

1. 先读 `docs/00_调用约定.md`。
2. 新建脚本先读 `docs/01_项目结构与模块化.md`。
3. 按对象查阅 `docs/02` 至 `docs/13`。
4. `examples/` 中提供了低风险能力探测和常用调用范例。

## 重要结论

- 引擎启用了**不区分大小写的成员绑定**，因此 `file.readTextSync()` 与 `file.ReadTextSync()` 通常都能调用；本文统一使用 JavaScript 风格的 `lowerCamelCase`。
- 全局函数名是源码显式注入的标识符，例如 `sleep`、`captureGameRegion`，应使用文档中的名称。
- 不提供浏览器或 Node.js 运行时：不要使用 `fetch`、`XMLHttpRequest`、`require`、`setTimeout`、`setInterval`。
- HTTP 自定义请求头已支持，第四个参数必须是 **JSON 字符串**。
- `.NET List<T>` 在 JavaScript 中优先使用 `list.Count` 和 `list[0]`。

## 目录

- `docs/`：总结的精简文档
- `examples/`：可复制示例
- `api_index.json`：机器可读 API 索引
- `js/`：官方文档
- 剩下存在目录的文件为旧文档推荐优先参考`docs/`和`js/`

