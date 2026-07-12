# 07. `dispatcher`、`RealtimeTimer` 与 `SoloTask`

## 实时任务

```js
dispatcher.addTimer(new RealtimeTimer("AutoPick")); // 清空旧触发器后添加
dispatcher.addTrigger(new RealtimeTimer("AutoPick")); // 保留旧触发器
dispatcher.clearAllTriggers();
```

`RealtimeTimer`：

- `new RealtimeTimer()`
- `new RealtimeTimer(name)`
- `new RealtimeTimer(name, config)`
- 属性：`Name`、`Interval`（默认 50 ms）、`Config`

动态配置当前针对 `AutoPick` 转换；`AutoSkip` 配置必须传 `AutoSkipConfig` 实例。

## 独立任务

```js
await dispatcher.runTask(new SoloTask("AutoFight"));
const rewards = await dispatcher.runTask(new SoloTask("AutoDomain"));
```

当前 `runTask` 识别的名称：

- `AutoGeniusInvokation`
- `AutoWood`
- `AutoFight`
- `AutoDomain`
- `AutoBoss`
- `AutoFishing`
- `AutoCook`
- `AutoEat`
- `CountInventoryItem`

`SoloTask` 构造：

```js
new SoloTask(name)
new SoloTask(name, configObject)
```

未知名称会抛出 `ArgumentException`。

## 强类型任务方法

| 方法 | 参数 | 返回 |
|---|---|---|
| `runAutoDomainTask(param, token?)` | `AutoDomainParam` | `Dictionary<string,int>` |
| `runAutoBossTask(param, token?)` | `AutoBossParam` | `Dictionary<string,int>` |
| `runAutoFightTask(param, token?)` | `AutoFightParam` | `void` |
| `runAutoLeyLineOutcropTask(param, token?)` | `AutoLeyLineOutcropParam` | `void` |
| `runAutoStygianOnslaughtTask(param, token?)` | `AutoStygianOnslaughtParam` | `void` |
| `runCountInventoryItemTask(param, token?)` | `CountInventoryItemParam` | 单项数量或名称到数量对象 |

## 取消

```js
const cts = dispatcher.getLinkedCancellationTokenSource();
try {
    await dispatcher.runTask(new SoloTask("AutoFight"), cts.Token);
} finally {
    cts.dispose();
}
```

也可用 `dispatcher.getLinkedCancellationToken()` 直接获得令牌。需要主动调用 `cancel()` 时，应保留 `CancellationTokenSource`。

## 配置示例

```js
const task = new SoloTask("AutoFishing", {
    fishingTimePolicy: 0
});
await dispatcher.runTask(task);
```

任务参数字段会随 BetterGI 版本演进。关键生产脚本应在 `manifest.json` 中设置合理的 `bgi_version`。
