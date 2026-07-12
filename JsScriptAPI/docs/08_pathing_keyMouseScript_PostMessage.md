# 08. 路径、宏与后台消息模拟

## `pathingScript`

| 方法 | 说明 |
|---|---|
| `run(json)` | 执行路径 JSON |
| `runFile(path)` | 读取脚本目录内路径文件并执行 |
| `runFileFromUser(path)` | 读取 `User\AutoPathing` 下的订阅路径 |
| `isExists(subPath)` | 订阅目录中是否存在 |
| `isFile(subPath)` | 是否文件 |
| `isFolder(subPath)` | 是否目录 |
| `readPathSync(subPath = "./")` | 非递归枚举订阅目录 |

`run` 与 `runFile` 内部会捕获异常并记录日志，调用方不一定能通过异常判断失败。

```js
await pathingScript.runFile("assets/route.json");
await pathingScript.runFileFromUser("采集/路线.json");
```

## `keyMouseScript`

```js
await keyMouseScript.run(jsonText);
await keyMouseScript.runFile("assets/macro.json");
```

用于播放 BetterGI 键鼠录制 JSON。

## `PostMessage`

```js
const pm = new PostMessage();
pm.keyDown("VKW");
pm.keyUp("VKW");
pm.keyPress("VKF");
pm.click();
```

这是后台消息模拟器，不等同于全局 `keyPress` 的前台输入。`click()` 只执行左键点击，不接收坐标；需要先通过其他方式移动鼠标。
