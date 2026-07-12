# 04. `file` 与 `strategyFile`

所有 `file` 路径受脚本根目录限制，不能借助 `..` 越权访问。

## `file` 方法

| 方法 | 返回 | 失败行为 |
|---|---|---|
| `readTextSync(path)` | `string` | 记录日志并返回空字符串 |
| `readText(path)` | `Task<string>` | 记录日志并返回空字符串 |
| `readText(path, callback)` | `Task<string>` | 回调 `(error, result)` |
| `readImageMatSync(path)` | `Mat` | 返回空 `Mat` |
| `readImageMatWithResizeSync(path, width, height, interpolation = 1)` | `Mat` | 返回空 `Mat` |
| `writeTextSync(path, content, append = false)` | `bool` | 返回 `false` |
| `writeText(path, content, append = false)` | `Task<bool>` | 返回 `false` |
| `writeText(path, content, callback, append = false)` | `Task<bool>` | 回调错误 |
| `writeImageSync(path, mat)` | `bool` | 无扩展名时自动加 `.png` |
| `readPathSync(folderPath)` | `string[]` | 非递归；不存在返回空数组 |
| `createDirectory(folderPath)` | `bool` | 创建或已存在均为 `true` |
| `isFolder(path)` | `bool` | 是否目录 |
| `isFile(path)` | `bool` | 是否文件 |
| `isExists(path)` | `bool` | 文件或目录是否存在 |
| `renamePathSync(oldPath, newPath)` | `bool` | 见下方限制 |

## 写入白名单

文本写入仅允许：`.txt`、`.json`、`.log`、`.csv`、`.xml`、`.html`、`.css`、常见图片扩展名；源码限制约 999 MB。

## 重命名限制

源码注释写“文件或文件夹”，但当前实现最终调用 `Directory.Move`。因此本文只把它视为**目录重命名可靠、文件重命名存在实现缺陷**的接口。文件重命名不要作为关键流程依赖。

## 示例

```js
const cfgPath = "data/state.json";
file.createDirectory("data");

const state = { lastRun: new Date().toISOString() };
if (!file.writeTextSync(cfgPath, JSON.stringify(state, null, 2))) {
    throw new Error("写入失败");
}

const parsed = JSON.parse(file.readTextSync(cfgPath));
log.info("lastRun={0}", parsed.lastRun);
```

## `strategyFile`

`strategyFile` 专门查看 `User\AutoFight`：

```js
const paths = Array.from(strategyFile.readPathSync("./"));
const exists = strategyFile.isExists("strategy.txt");
const isFile = strategyFile.isFile("strategy.txt");
const isFolder = strategyFile.isFolder("folder");
```

它只提供目录枚举与存在性检查，不提供读取策略正文的方法。
