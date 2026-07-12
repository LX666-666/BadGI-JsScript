# 03. `genshin` 游戏对象

## 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `width` | `int` | 捕获区宽度 |
| `height` | `int` | 捕获区高度 |
| `scaleTo1080PRatio` | `double` | 相对 1080P 缩放比例 |
| `screenDpiScale` | `double` | 系统 DPI 比例 |

## UID、传送与地图

```js
const uid = await genshin.uid(); // 失败返回 0
await genshin.tp(1000, 2000);
await genshin.tp(1000, 2000, true);
await genshin.tp(1000, 2000, "Teyvat", false);
await genshin.tpToStatueOfTheSeven();
```

| 方法 | 说明 |
|---|---|
| `uid()` | OCR 识别 UID，返回 `int` |
| `tp(x, y)` | 传送到坐标；支持数字或字符串重载 |
| `tp(x, y, force)` | 强制传送重载 |
| `tp(x, y, mapName, force)` | 指定地图 |
| `moveMapTo(x, y, forceCountry = null)` | 移动提瓦特大地图 |
| `moveIndependentMapTo(x, y, mapName, forceCountry = null)` | 移动独立地图 |
| `getBigMapZoomLevel()` | 返回约 1.0–6.0 |
| `setBigMapZoomLevel(level)` | 设置大地图缩放 |
| `getPositionFromBigMap(mapName?)` | 大地图坐标，返回 `Point2f?` |
| `getPositionFromMap(mapName?, cacheTimeMs?)` | 小地图定位 |
| `getPositionFromMap(mapName, x, y)` | 以附近世界坐标做局部匹配 |
| `getPositionFromMapWithMatchingMethod(...)` | 指定匹配方法 |
| `getCameraOrientation()` | 返回相机朝向浮点值 |

## 队伍与界面

| 方法 | 返回/说明 |
|---|---|
| `switchParty(partyName)` | `bool`，按队伍名称切换 |
| `switchCharacter(slot1 = "", slot2 = "", slot3 = "", slot4 = "")` | `bool`，重组四个队伍槽位；空字符串跳过 |
| `clearPartyCache()` | 清除调度器队伍缓存 |
| `returnMainUi()` | 返回主界面 |
| `blessingOfTheWelkinMoon()` | 自动点击空月祝福 |
| `chooseTalkOption(option, skipTimes = 10, isOrange = false)` | 持续对话并选择文本 |
| `claimBattlePassRewards()` | 领取纪行奖励 |
| `claimEncounterPointsRewards()` | 领取长效历练点奖励 |
| `goToAdventurersGuild(country)` | 前往冒险家协会 |
| `goToCraftingBench(country)` | 前往合成台 |
| `craftMaterial(materialName, quantity, materialType = null)` | 在已打开的合成界面执行合成，返回结果对象 |
| `autoFishing(fishingTimePolicy = 0)` | 自动钓鱼 |
| `setTime(hour, minute, skip = false)` | 调整游戏时间；数字和字符串重载 |
| `relogin()` | 退出并重新登录 |
| `wonderlandCycle()` | 进出千星奇域 |

## 示例

```js
(async function () {
    const ok = await genshin.switchParty("采集队");
    if (!ok) throw new Error("切换队伍失败");

    const pos = genshin.getPositionFromMap();
    if (pos != null) {
        log.info("位置: {0}, {1}", pos.X, pos.Y);
    }

    await genshin.returnMainUi();
})();
```
