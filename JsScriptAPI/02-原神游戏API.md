# JavaScript脚本开发 - 原神游戏API

## 概述

BGI为JavaScript脚本开发提供了专门的原神游戏操作API，包括传送、地图操作、队伍管理、自动化功能等。这些方法通过`Genshin`类暴露给JavaScript环境。

**相关代码位置**:
- **核心实现**: `BetterGenshinImpact\Core\Script\Dependence\Genshin.cs` (全文411行)
- **引擎注册位置**: `EngineExtend.cs:34` - genshin对象注册

## 游戏窗口信息

### 基本属性

```javascript
// 获取游戏窗口信息
log.info('游戏宽度:', genshin.Width);
log.info('游戏高度:', genshin.Height);
log.info('缩放比例:', genshin.ScaleTo1080PRatio);
log.info('DPI缩放:', genshin.ScreenDpiScale);
```

**属性说明**:
- `Width`: 游戏窗口宽度
- `Height`: 游戏窗口高度  
- `ScaleTo1080PRatio`: 相对1080P的缩放比例
- `ScreenDpiScale`: 系统DPI缩放比例

**代码位置**: `Genshin.cs:29-44`

---

## 传送功能

### Tp方法 - 完整重载列表

传送到指定坐标。**✅ 经测试验证完全可用**。

BGI提供了5个Tp方法重载，支持不同的参数组合以满足各种传送需求。

**代码位置**: `Genshin.cs:59-93` (所有Tp方法重载)

#### 重载1：基础传送 - Tp(x, y)

最常用的传送方式，传送到提瓦特大陆的指定坐标。

```javascript
// 传送到坐标 (100, 200)
await genshin.tp(100, 200);

// 传送到坐标 (1234.5, 5678.9)
await genshin.tp(1234.5, 5678.9);
```

**参数**:
- `x` (number): 目标X坐标
- `y` (number): 目标Y坐标

**默认行为**:
- 地图：提瓦特大陆（Teyvat）
- 强制传送：否（会检查距离限制）

**代码位置**: `Genshin.cs:59-62`

---

#### 重载2：完整参数传送 - Tp(x, y, mapName, force)

提供最完整的控制，可以指定地图名称和是否强制传送。

```javascript
// 传送到提瓦特大陆，强制传送
await genshin.tp(100, 200, 'Teyvat', true);

// 传送到渊下宫
await genshin.tp(100, 200, 'Enkanomiya', false);

// 传送到层岩巨渊·地下矿区
await genshin.tp(100, 200, 'UndergroundMines', false);
```

**参数**:
- `x` (number): 目标X坐标
- `y` (number): 目标Y坐标
- `mapName` (string): 地图名称
  - `'Teyvat'` - 提瓦特大陆（默认）
  - `'Enkanomiya'` - 渊下宫
  - `'UndergroundMines'` - 层岩巨渊·地下矿区
  - 其他地图名称...
- `force` (boolean): 是否强制传送
  - `true` - 忽略距离限制，强制传送
  - `false` - 检查距离限制（默认）

**代码位置**: `Genshin.cs:64-67`

---

#### 重载3：强制传送 - Tp(x, y, force)

简化版本，只指定是否强制传送，地图默认为提瓦特大陆。

```javascript
// 强制传送到坐标 (100, 200)
await genshin.tp(100, 200, true);

// 普通传送（检查距离）
await genshin.tp(100, 200, false);
```

**参数**:
- `x` (number): 目标X坐标
- `y` (number): 目标Y坐标
- `force` (boolean): 是否强制传送

**默认行为**:
- 地图：提瓦特大陆（Teyvat）

**代码位置**: `Genshin.cs:70-73`

---

#### 重载4：字符串坐标传送 - Tp(x, y)

接受字符串格式的坐标，内部自动转换为数字。

```javascript
// 使用字符串坐标传送
await genshin.tp('100', '200');

// 支持小数字符串
await genshin.tp('1234.56', '5678.90');

// 从配置文件读取坐标
const config = JSON.parse(file.readTextSync('config.json'));
await genshin.tp(config.targetX, config.targetY);
```

**参数**:
- `x` (string): 目标X坐标（字符串格式）
- `y` (string): 目标Y坐标（字符串格式）

**默认行为**:
- 地图：提瓦特大陆（Teyvat）
- 强制传送：否

**注意事项**:
- 如果字符串无法解析为数字，会传送到 (0, 0)
- 建议使用数字类型以避免解析错误

**代码位置**: `Genshin.cs:81-86`

---

#### 重载5：字符串坐标强制传送 - Tp(x, y, force)

字符串坐标 + 强制传送选项的组合。

```javascript
// 使用字符串坐标强制传送
await genshin.tp('100', '200', true);

// 从OCR识别结果传送
const ocrResult = gameImage.ocr();
const coordText = ocrResult.Text;  // 假设识别到 "100,200"
const [x, y] = coordText.split(',');
await genshin.tp(x.trim(), y.trim(), false);
```

**参数**:
- `x` (string): 目标X坐标（字符串格式）
- `y` (string): 目标Y坐标（字符串格式）
- `force` (boolean): 是否强制传送

**默认行为**:
- 地图：提瓦特大陆（Teyvat）

**代码位置**: `Genshin.cs:88-93`

---

### Tp方法重载对比表

| 重载 | 参数签名 | 地图 | 强制传送 | 使用场景 |
|------|---------|------|---------|---------|
| 1 | `Tp(number, number)` | Teyvat | 否 | 最常用，简单传送 |
| 2 | `Tp(number, number, string, boolean)` | 自定义 | 自定义 | 完全控制，多地图传送 |
| 3 | `Tp(number, number, boolean)` | Teyvat | 自定义 | 需要强制传送时 |
| 4 | `Tp(string, string)` | Teyvat | 否 | 配置文件、OCR识别 |
| 5 | `Tp(string, string, boolean)` | Teyvat | 自定义 | 字符串坐标+强制传送 |

### 传送参数详解

#### force参数（强制传送）

**作用**: 控制是否忽略距离限制进行传送。

```javascript
// force = false（默认）
// - 检查目标位置与当前位置的距离
// - 如果距离太远，可能传送失败
// - 更安全，避免异常传送
await genshin.tp(100, 200, false);

// force = true
// - 忽略距离检查
// - 强制执行传送
// - 适用于远距离传送
await genshin.tp(100, 200, true);
```

**使用建议**:
- ✅ 短距离传送：使用 `force=false`（默认）
- ✅ 跨地图传送：使用 `force=true`
- ✅ 不确定距离：使用 `force=true` 确保成功

#### mapName参数（地图名称）

**支持的地图名称**:

```javascript
// 主世界
await genshin.tp(100, 200, 'Teyvat', false);

// 渊下宫
await genshin.tp(100, 200, 'Enkanomiya', false);

// 层岩巨渊·地下矿区
await genshin.tp(100, 200, 'UndergroundMines', false);

// 其他特殊地图...
```

**注意**: 地图名称需要与BGI内部定义的地图类型匹配，错误的地图名称可能导致传送失败。

### 传送使用示例

#### 示例1：基础传送流程

```javascript
async function basicTeleport() {
    try {
        log.info('准备传送到目标位置...');

        // 传送到坐标
        await genshin.tp(1000, 2000);

        log.info('传送成功，等待加载...');
        await sleep(3000);

        // 验证位置
        const currentPos = genshin.getPositionFromMap();
        log.info(`当前位置: (${currentPos.X}, ${currentPos.Y})`);

    } catch (error) {
        log.error('传送失败: ' + error.message);
    }
}
```

#### 示例2：批量传送

```javascript
async function batchTeleport(locations) {
    for (let i = 0; i < locations.length; i++) {
        const loc = locations[i];

        log.info(`传送到位置 ${i + 1}/${locations.length}: (${loc.x}, ${loc.y})`);

        // 使用强制传送确保成功
        await genshin.tp(loc.x, loc.y, true);

        // 等待传送完成
        await sleep(5000);

        // 执行该位置的任务
        await performTaskAtLocation(loc);
    }
}

// 使用示例
const locations = [
    { x: 1000, y: 2000, name: '蒙德城' },
    { x: 3000, y: 4000, name: '璃月港' },
    { x: 5000, y: 6000, name: '稻妻城' }
];

await batchTeleport(locations);
```

#### 示例3：从配置文件读取坐标

```javascript
async function teleportFromConfig() {
    try {
        // 读取配置文件
        const configText = file.readTextSync('teleport_config.json');
        const config = JSON.parse(configText);

        // 遍历配置中的传送点
        for (const point of config.teleportPoints) {
            log.info(`传送到: ${point.name}`);

            // 支持字符串和数字坐标
            if (typeof point.x === 'string') {
                await genshin.tp(point.x, point.y, point.force || false);
            } else {
                await genshin.tp(point.x, point.y, point.force || false);
            }

            await sleep(3000);
        }
    } catch (error) {
        log.error('配置文件读取失败: ' + error.message);
    }
}

// 配置文件示例 (teleport_config.json):
// {
//   "teleportPoints": [
//     { "name": "蒙德城", "x": 1000, "y": 2000, "force": false },
//     { "name": "璃月港", "x": "3000", "y": "4000", "force": true }
//   ]
// }
```

#### 示例4：智能传送（自动选择force参数）

```javascript
async function smartTeleport(targetX, targetY) {
    try {
        // 获取当前位置
        const currentPos = genshin.getPositionFromMap();

        // 计算距离
        const distance = Math.sqrt(
            Math.pow(targetX - currentPos.X, 2) +
            Math.pow(targetY - currentPos.Y, 2)
        );

        log.info(`当前位置: (${currentPos.X}, ${currentPos.Y})`);
        log.info(`目标位置: (${targetX}, ${targetY})`);
        log.info(`距离: ${distance.toFixed(2)}`);

        // 根据距离自动选择是否强制传送
        const needForce = distance > 1000;  // 距离超过1000时强制传送

        if (needForce) {
            log.info('距离较远，使用强制传送');
            await genshin.tp(targetX, targetY, true);
        } else {
            log.info('距离较近，使用普通传送');
            await genshin.tp(targetX, targetY, false);
        }

        await sleep(3000);
        log.info('传送完成');

    } catch (error) {
        log.error('智能传送失败: ' + error.message);
    }
}
```

---

### TpToStatueOfTheSeven()
传送到用户指定的七天神像。

```javascript
// 传送到七天神像（需要用户预先配置）
await genshin.tpToStatueOfTheSeven();
```

**代码位置**: `Genshin.cs:174-178`

---

## 大地图操作

### MoveMapTo(x, y, [forceCountry])
移动大地图到指定坐标（不进行传送）。

```javascript
// 移动大地图查看指定位置
await genshin.moveMapTo(100, 200);

// 强制切换到指定国家后移动
await genshin.moveMapTo(100, 200, 'Liyue');
```

**注意**: 建议先使用`SetBigMapZoomLevel`设置合适的缩放等级

**代码位置**: `Genshin.cs:107-113`

### ✅ 更新：MoveIndependentMapTo(x, y, mapName, [forceCountry])
移动到独立地图的指定坐标。

**⚠️ 参数类型更新**: x, y参数现在需要是int类型，不是double。

```javascript
// 移动到稻妻地区的指定位置
await genshin.moveIndependentMapTo(100, 200, 'Inazuma');

// 移动到深境螺旋
await genshin.moveIndependentMapTo(50, 50, 'SpiralAbyss');

// 强制指定国家
await genshin.moveIndependentMapTo(100, 200, 'Sumeru', 'Sumeru');
```

**参数**:
- `x` (int): 目标X坐标（必须是整数）
- `y` (int): 目标Y坐标（必须是整数）  
- `mapName` (string): 地图名称
- `forceCountry` (string, 可选): 强制指定的国家名称

**代码位置**: `Genshin.cs:125-141`

### GetBigMapZoomLevel() / SetBigMapZoomLevel(level)
获取和设置大地图缩放等级。

```javascript
// 获取当前缩放等级
const currentZoom = genshin.getBigMapZoomLevel();
console.log('当前缩放等级:', currentZoom);

// 设置缩放等级（1.0最大，6.0最小）
await genshin.setBigMapZoomLevel(3.0);

// 建议的缩放范围
await genshin.setBigMapZoomLevel(2.5); // 推荐用于精确操作
```

**缩放等级说明**:
- 范围: 1.0 (最大地图) 到 6.0 (最小地图)
- 推荐: 2.0 到 5.0 之间
- 过大或过小可能影响识别精度

**代码位置**: `Genshin.cs:147-169`

### GetPositionFromBigMap([mapName])
获取在大地图上的当前位置。

```javascript
// 获取在提瓦特大地图上的位置
const position = genshin.getPositionFromBigMap();
console.log(`位置: (${position.X}, ${position.Y})`);

// 获取在指定地图上的位置
const inazumaPos = genshin.getPositionFromBigMap('Inazuma');
```

**返回值**: `Point2f`对象，包含X和Y坐标

**代码位置**: `Genshin.cs:184-199`

---

## 小地图操作

### GetPositionFromMap([mapName], [cacheTimeMs])
获取在小地图上的当前位置，支持缓存时间设置。

```javascript
// 基础用法：获取小地图位置（需要在主界面）
const mapPosition = genshin.getPositionFromMap();
console.log(`小地图位置: (${mapPosition.X}, ${mapPosition.Y})`);

// 指定地图名称和缓存时间
const position = genshin.getPositionFromMap('Teyvat', 500);

// 设置不同的坐标刷新间隔
const quickRefresh = genshin.getPositionFromMap('Teyvat', 300);   // 300ms快速刷新
const slowRefresh = genshin.getPositionFromMap('Teyvat', 2000);   // 2秒慢速刷新
const defaultRefresh = genshin.getPositionFromMap('Teyvat');      // 默认900ms

// 针对特定场景的缓存策略
const battlePosition = genshin.getPositionFromMap('Teyvat', 100); // 战斗中需要频繁更新
const exploringPosition = genshin.getPositionFromMap('Teyvat', 1500); // 探索时可以较慢更新
```

**参数说明**:
- `mapName` (可选): 地图名称，默认为'Teyvat'
- `cacheTimeMs` (可选): 缓存时间（毫秒），默认900ms
  - 较小值(100-500ms): 坐标更新更频繁，适合战斗或快速移动场景
  - 默认值(900ms): 平衡性能和准确性
  - 较大值(1500-3000ms): 减少计算负担，适合缓慢探索场景

**缓存机制**: 如果在缓存时间内有匹配成功的坐标，优先返回缓存坐标；超时后重新识别

**前提条件**: 必须在游戏主界面

**返回值**: `Point2f`对象，包含X和Y坐标

**代码位置**: `Genshin.cs:205-252`

### GetPositionFromMap(mapName, x, y)
局部匹配版本，在指定世界坐标附近进行位置匹配。

```javascript
// 在已知坐标附近进行局部匹配（更精确，不进行全局匹配）
const knownX = 1000.5;
const knownY = 2000.3;
const precisePosition = genshin.getPositionFromMap('Teyvat', knownX, knownY);
console.log(`精确位置: (${precisePosition.X}, ${precisePosition.Y})`);
```

**参数**:
- `mapName`: 地图名称
- `x`: 已知世界坐标X（用于局部匹配）
- `y`: 已知世界坐标Y（用于局部匹配）

**特点**: 
- 仅在提供的坐标附近进行匹配
- 失败时不进行全局匹配
- 精度更高，速度更快

**使用场景**: 当你大概知道当前位置时，可用此方法获得更精确的坐标

### GetCameraOrientation()
获取当前相机朝向。

```javascript
// 获取相机角度
const angle = genshin.getCameraOrientation();
console.log('相机朝向角度:', angle);
```

**返回值**: 浮点数，表示相机朝向角度

**代码位置**: `Genshin.cs:210-214`

---

## 队伍管理

### SwitchParty(partyName)
切换到指定名称的队伍配置。

```javascript
// 切换到名为"探索队"的队伍
const success = await genshin.switchParty('探索队');
if (success) {
    console.log('队伍切换成功');
} else {
    console.log('队伍切换失败');
}

// 切换到战斗队伍
await genshin.switchParty('深渊队伍');
```

**参数**: `partyName` - 在游戏内设置的队伍名称

**返回值**: boolean - 切换是否成功

**代码位置**: `Genshin.cs:261-271`

### ✅ 新增：ClearPartyCache()
清除当前调度器的队伍缓存。

```javascript
// 清除队伍缓存，强制重新识别队伍状态
genshin.clearPartyCache();
log.info('队伍缓存已清除');

// 在队伍切换失败后清除缓存重试
const success = await genshin.switchParty('探索队');
if (!success) {
    log.warn('队伍切换失败，清除缓存后重试');
    genshin.clearPartyCache();
    await genshin.switchParty('探索队');
}
```

**使用场景**:
- 队伍切换失败后重试
- 手动修改队伍配置后强制更新
- 脚本长时间运行时清理缓存

**代码位置**: `Genshin.cs:276-279`

---

## 自动化功能

### AutoFishing([fishingTimePolicy])
自动钓鱼。

```javascript
// 使用默认设置自动钓鱼
await genshin.autoFishing();

// 指定钓鱼时间策略
// 0: 默认, 1: 快速, 2: 完美
await genshin.autoFishing(1);
```

**参数**: `fishingTimePolicy` (可选) - 钓鱼时间策略

**代码位置**: `Genshin.cs:324-335`

---

## UI导航功能

### ReturnMainUi()
返回到游戏主界面。

```javascript
// 从任何界面返回主界面
await genshin.returnMainUi();
```

**代码位置**: `Genshin.cs:315-318`

### ChooseTalkOption(option, [skipTimes], [isOrange])
在对话中选择指定选项。

```javascript
// 选择对话选项
await genshin.chooseTalkOption('是的，我同意');

// 指定跳过次数和选项颜色
await genshin.chooseTalkOption('继续对话', 5, false);

// 选择橙色选项（重要选项）
await genshin.chooseTalkOption('重要选择', 10, true);
```

**参数**:
- `option`: 选项文本
- `skipTimes` (可选): 跳过对话的次数，默认10
- `isOrange` (可选): 是否为橙色重要选项，默认false

**代码位置**: `Genshin.cs:268-271`

---

## 奖励领取功能

### ClaimBattlePassRewards()
一键领取纪行奖励。

```javascript
// 自动领取所有可领取的纪行奖励
await genshin.claimBattlePassRewards();
```

**代码位置**: `Genshin.cs:277-280`

### ClaimEncounterPointsRewards()
领取长效历练点奖励。

```javascript
// 领取历练点奖励
await genshin.claimEncounterPointsRewards();
```

**代码位置**: `Genshin.cs:286-289`

### BlessingOfTheWelkinMoon()
自动点击空月祝福。

```javascript
// 自动领取空月祝福奖励
await genshin.blessingOfTheWelkinMoon();
```

**代码位置**: `Genshin.cs:256-259`

---

## 位置导航功能

### GoToAdventurersGuild(country) / GoToCraftingBench(country)
前往冒险家协会或合成台。

```javascript
// 前往蒙德冒险家协会
await genshin.goToAdventurersGuild('Mondstadt');

// 前往璃月合成台
await genshin.goToCraftingBench('Liyue');

// 前往稻妻相关设施
await genshin.goToAdventurersGuild('Inazuma');
```

**支持的国家名称**:
- `'Mondstadt'` - 蒙德
- `'Liyue'` - 璃月  
- `'Inazuma'` - 稻妻
- `'Sumeru'` - 须弥
- `'Fontaine'` - 枫丹

**代码位置**: `Genshin.cs:296-309`

---

## 系统功能

### Relogin()
重新登录原神。

```javascript
// 退出游戏并重新登录
await genshin.relogin();
```

**代码位置**: `Genshin.cs:376-379`

### SetTime(hour, minute, [skip])
调整游戏内的时间。

```javascript
// 基础用法：设置时间为10:30
await genshin.setTime(10, 30);

// 设置时间为18:00并跳过动画
await genshin.setTime(18, 0, true);

// 使用字符串参数
await genshin.setTime("12", "45");
await genshin.setTime("6", "30", false);

// 实际应用场景
async function setNightTime() {
    // 设置为晚上8点，跳过动画以节省时间
    await genshin.setTime(20, 0, true);
    log.info('已切换到夜晚时间');
}

async function setDayTime() {
    // 设置为中午12点
    await genshin.setTime(12, 0, true);
    log.info('已切换到白天时间');
}

// 根据需求设置特定时间
async function setTimeForTask(taskType) {
    switch(taskType) {
        case 'night_crystal':  // 夜晚水晶采集
            await genshin.setTime(20, 0, true);
            break;
        case 'day_flower':     // 白天采花
            await genshin.setTime(12, 0, true);
            break;
        case 'dawn':           // 黎明
            await genshin.setTime(6, 0, true);
            break;
        default:
            await genshin.setTime(12, 0, true);
    }
}
```

**参数**:
- `hour` (number|string): 目标小时，范围0-24
  - 支持数字类型：`10`, `18`, `0`
  - 支持字符串类型：`"10"`, `"18"`, `"0"`
- `minute` (number|string): 目标分钟，范围0-59
  - 支持数字类型：`30`, `45`, `0`
  - 支持字符串类型：`"30"`, `"45"`, `"0"`
- `skip` (boolean, 可选): 是否跳过时间调整动画，默认为false
  - `true`: 快速切换，跳过动画
  - `false`: 正常播放时间变化动画

**参数验证**:
- 如果小时值不在0-24之间，会抛出异常
- 如果分钟值不在0-59之间，会抛出异常
- 字符串参数会自动转换为整数

**使用场景**:
- 特定时间段的材料采集（如夜晚的夜泊石）
- 需要特定光照条件的任务
- 时间限定的NPC对话
- 测试不同时间段的游戏机制

**注意事项**:
- 调整时间需要打开派蒙菜单
- 建议在主界面调用此方法
- 跳过动画可以节省时间，适合批量操作

**代码位置**: 
- 数字参数版本: `Genshin.cs:388-395`
- 字符串参数版本: `Genshin.cs:404-411`

---

## 图像识别和模板匹配

### 像素访问功能

### SrcMat - 图像矩阵对象

**✅ 支持直接像素访问**：BGI的JavaScript环境中，`ImageRegion`对象通过其`SrcMat`属性提供Mat对象，可以使用`At`方法直接获取像素点的RGB值。

**SrcMat定义**: `SrcMat`是OpenCV的Mat对象在JavaScript中的映射，代表图像的原始像素数据矩阵。它提供了对图像像素的底层访问能力。

**主要属性和方法**:
- **类型**: OpenCV Mat对象
- **数据格式**: BGR颜色空间，每个像素3字节
- **坐标系统**: 左上角为原点(0,0)，向右向下为正方向
- **主要方法**: 
  - `Get(OpenCvSharp.OpenCvSharp.Vec3b, y, x)`: 获取指定位置的像素值（注意参数顺序）
  - 访问方式: `mat.Get(OpenCvSharp.OpenCvSharp.Vec3b, 行, 列)`返回`Vec3b`对象

```javascript
// ✅ 正确：使用SrcMat获取像素值
const gameImage = captureGameRegion();
const mat = gameImage.SrcMat;  // 获取Mat对象

// 获取指定位置的像素值 (注意：参数顺序是 y, x)
const pixelBGR = mat.Get(OpenCvSharp.OpenCvSharp.Vec3b, y, x);  // 返回Vec3b对象，包含BGR值

// Vec3b对象包含三个分量 (B, G, R)
const blue = pixelBGR.Item0;   // B分量 (0-255)
const green = pixelBGR.Item1;  // G分量 (0-255) 
const red = pixelBGR.Item2;    // R分量 (0-255)

log.info(`位置(${x}, ${y})的颜色: R=${red}, G=${green}, B=${blue}`);

// 实用示例：检测特定颜色
function isColorMatch(mat, x, y, targetR, targetG, targetB, tolerance = 10) {
  const pixel = mat.Get(OpenCvSharp.OpenCvSharp.Vec3b, y, x);
  const r = pixel.Item2;
  const g = pixel.Item1; 
  const b = pixel.Item0;
  
  return Math.abs(r - targetR) <= tolerance && 
         Math.abs(g - targetG) <= tolerance && 
         Math.abs(b - targetB) <= tolerance;
}

// 检查按钮是否为高亮状态（示例：检测橙色按钮）
const gameImage = captureGameRegion();
const isHighlighted = isColorMatch(gameImage.SrcMat, 100, 50, 255, 165, 0); // 橙色
```

**⚠️ 重要注意事项**：
- Mat的At方法参数顺序是`(y, x)`，不是`(x, y)`
- 返回的是BGR格式，不是RGB格式
- Vec3b对象通过`Item0`、`Item1`、`Item2`访问B、G、R分量

```javascript
// ❌ 错误：ImageRegion对象中不存在这些方法
const gameImage = captureGameRegion();
const rgb = gameImage.getPixel(x, y);      // 不存在此方法
const color = gameImage.getRGB(x, y);      // 不存在此方法
const pixel = gameImage.at(x, y);          // 不存在此方法
```

**替代方案**：
1. **使用Mat.Get方法**：通过`gameImage.SrcMat.Get(OpenCvSharp.OpenCvSharp.Vec3b, y, x)`直接获取像素值
2. **使用模板匹配**：预先截取小图作为模板进行匹配
3. **使用颜色范围识别**：通过`RecognitionObject.ColorRangeAndOcr`进行颜色判断
4. **使用OCR识别**：识别特定区域的文字内容

### RecognitionObject - 识别对象创建

BGI提供了强大的图像识别功能，通过`RecognitionObject`类可以创建各种识别对象。

#### TemplateMatch - 模板匹配
```javascript
// 创建模板匹配识别对象
const paimonMenuRo = RecognitionObject.TemplateMatch(
  file.ReadImageMatSync("assets/RecognitionObject/paimon_menu.png"), // 模板图片
  0,                    // X坐标
  0,                    // Y坐标
  genshin.width / 3.0,  // 搜索区域宽度
  genshin.width / 5.0   // 搜索区域高度
);

// 创建精确位置的识别对象
const spaceButtonRo = RecognitionObject.TemplateMatch(
  file.ReadImageMatSync("assets/RecognitionObject/Space.png"),
  1683, 1027, 64, 25  // 精确的搜索区域
);

// 在指定区域创建识别对象
const climbIconRo = RecognitionObject.TemplateMatch(
  file.ReadImageMatSync("assets/RecognitionObject/Climb.png"),
  1596, 1027, 29, 24
);
```

**参数说明**:
- `imagePath`: 模板图片路径
- `x, y`: 搜索区域的左上角坐标
- `width, height`: 搜索区域的宽高

#### OCR - 文字识别对象
```javascript
// 创建OCR识别对象用于文字识别
const taskRegionOcr = RecognitionObject.Ocr(
  75,   // X坐标
  240,  // Y坐标  
  280,  // 宽度
  43    // 高度
);

// 任务描述区域OCR
const taskDescriptionOcr = RecognitionObject.Ocr(75, 240, 280, 43);
```

**参数说明**:
- `x, y`: OCR识别区域的左上角坐标
- `width, height`: 识别区域的宽高

### captureGameRegion() - 游戏区域截图

获取游戏窗口的截图，用于后续的图像识别操作。

```javascript
// 获取游戏截图
let gameImage = captureGameRegion();

// 使用截图进行模板匹配
let matchResult = gameImage.Find(recognitionObject);
let multiResults = gameImage.FindMulti(recognitionObject);

// 检查是否找到匹配
if (!matchResult.isEmpty()) {
    console.log(`找到匹配，位置: (${matchResult.x}, ${matchResult.y})`);
}
```

**返回值**: 游戏截图对象，包含以下方法：
- `Find(ro)`: 查找单个匹配结果
- `FindMulti(ro)`: 查找多个匹配结果
- `ocr()`: 对整个截图进行OCR识别

### BGI图像识别使用示例

#### 主界面检测
```javascript
// 判断是否在主界面
const isInMainUI = () => {
  let captureRegion = captureGameRegion();
  let res = captureRegion.Find(paimonMenuRo);
  return !res.isEmpty();
};

// 检查主界面状态
if (isInMainUI()) {
  console.log("当前在主界面");
  // 执行主界面相关操作
} else {
  console.log("不在主界面，需要先返回");
  await genshin.returnMainUi();
}
```

#### 通用图像识别函数
```javascript
// 通用的图像识别函数
async function recognizeImage(recognitionObject) {
  try {
    let imageResult = captureGameRegion().find(recognitionObject);
    if (imageResult && imageResult.x !== 0 && imageResult.y !== 0 && 
        imageResult.width !== 0 && imageResult.height !== 0) {
      return { 
        success: true, 
        x: imageResult.x, 
        y: imageResult.y,
        width: imageResult.width,
        height: imageResult.height
      };
    }
  } catch (error) {
    log.error(`识别图像时发生异常: ${error.message}`);
  }
  return { success: false };
}

// 使用示例
const spaceButtonRo = RecognitionObject.TemplateMatch(
  file.ReadImageMatSync("assets/Space.png"), 1683, 1027, 64, 25
);

const result = await recognizeImage(spaceButtonRo);
if (result.success) {
  console.log(`空格键图标位置: (${result.x}, ${result.y})`);
}
```

### OCR文字识别功能

#### 简化的OCR函数
```javascript
// 简化的OCR识别函数
async function easyOCR(region) {
  try {
    const ocrRo = RecognitionObject.Ocr(region.X, region.Y, region.WIDTH, region.HEIGHT);
    let captureRegion = captureGameRegion();
    let results = await captureRegion.findMulti(ocrRo);
    return results;
  } catch (error) {
    log.error("OCR识别出错:", error.message);
    return { count: 0 };
  }
}

// 使用示例：识别任务描述
async function getTaskDescription() {
  const taskRegion = { X: 75, Y: 240, WIDTH: 280, HEIGHT: 43 };
  const ocrResults = await easyOCR(taskRegion);
  
  if (ocrResults.count > 0) {
    for (let i = 0; i < ocrResults.count; i++) {
      console.log(`识别到文字: ${ocrResults[i].text}`);
      console.log(`置信度: ${ocrResults[i].score}`);
    }
    return ocrResults[0].text;
  }
  
  return null;
}
```

#### NPC名称提取
```javascript
// 从任务描述中提取NPC名称
function extractNPCName(text) {
  if (!text) return null;
  
  const patterns = [
    /与(.+?)对话/,
    /与(.+?)一起/,
    /向(.+?)打听/,
    /向(.+?)回报/,
    /找到(.+?)(?=\s|$)/,
    /询问(.+?)(?=\s|$)/,
    /告诉(.+?)(?=\s|$)/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

// 从任务描述区域提取NPC名称
async function extractNPCNameFromTask() {
  try {
    const taskRegion = { X: 75, Y: 240, WIDTH: 280, HEIGHT: 43 };
    const ocrResults = await easyOCR(taskRegion);
    
    if (ocrResults.count > 0) {
      for (let i = 0; i < ocrResults.count; i++) {
        const text = ocrResults[i].text;
        const npcName = extractNPCName(text);
        if (npcName) {
          console.log(`提取到NPC名称: ${npcName}`);
          return npcName;
        }
      }
    }
    
    return null;
  } catch (error) {
    log.error(`提取NPC名称时出错: ${error.message}`);
    return null;
  }
}
```


### 图像识别最佳实践

#### 1. 坐标系统和DPI适配
```javascript
// BGI自动处理DPI缩放，直接使用像素坐标
const buttonRo = RecognitionObject.TemplateMatch(
  file.ReadImageMatSync("assets/button.png"),
  100, 200, 150, 50  // 这些坐标会自动适配不同DPI
);

// 获取游戏窗口尺寸信息
console.log('游戏窗口宽度:', genshin.Width);
console.log('游戏窗口高度:', genshin.Height);
console.log('缩放比例:', genshin.ScaleTo1080PRatio);
```

#### 2. 性能优化建议
```javascript
// 缓存识别对象，避免重复创建
const recognitionCache = {};

function getRecognitionObject(name, imagePath, x, y, w, h) {
  if (!recognitionCache[name]) {
    recognitionCache[name] = RecognitionObject.TemplateMatch(
      file.ReadImageMatSync(imagePath), x, y, w, h
    );
  }
  return recognitionCache[name];
}

// 限制识别频率，避免过度消耗资源
let lastRecognitionTime = 0;
const RECOGNITION_INTERVAL = 500; // 500ms间隔

async function throttledRecognition(recognitionObject) {
  const now = Date.now();
  if (now - lastRecognitionTime < RECOGNITION_INTERVAL) {
    await sleep(RECOGNITION_INTERVAL - (now - lastRecognitionTime));
  }
  
  lastRecognitionTime = Date.now();
  return await recognizeImage(recognitionObject);
}
```

#### 3. 错误处理和重试机制
```javascript
// 带重试的识别函数
async function recognizeWithRetry(recognitionObject, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await recognizeImage(recognitionObject);
      if (result.success) {
        return result;
      }
    } catch (error) {
      log.warn(`识别尝试 ${i + 1} 失败:`, error.message);
      if (i < maxRetries - 1) {
        await sleep(1000); // 重试前等待
      }
    }
  }
  
  return { success: false };
}
```

---

## 使用示例

### 自动日常任务示例
```javascript
async function dailyRoutine() {
    // 返回主界面
    await genshin.returnMainUi();
    
    // 领取空月祝福
    await genshin.blessingOfTheWelkinMoon();
    
    // 领取纪行奖励
    await genshin.claimBattlePassRewards();
    
    // 前往蒙德冒险家协会
    await genshin.goToAdventurersGuild('Mondstadt');
    
    console.log('日常任务完成');
}
```

### 探索辅助示例
```javascript
async function explorationHelper() {
    // 获取当前位置
    const position = genshin.getPositionFromMap();
    console.log(`当前位置: (${position.X}, ${position.Y})`);
    
    // 设置合适的地图缩放
    await genshin.setBigMapZoomLevel(3.0);
    
    // 传送到目标点
    await genshin.tp(1000, 2000);
    
    // 切换探索队伍
    await genshin.switchParty('探索队');
}
```

### 钓鱼自动化示例
```javascript
async function autoFishingRoutine() {
    // 传送到钓鱼点
    await genshin.tp(1500, 1200);
    await sleep(3000);
    
    // 开始自动钓鱼（快速模式）
    await genshin.autoFishing(1);
    
    console.log('钓鱼完成');
}
```

---

## 版本信息

- **文档版本**: v1.1.0
- **最后更新**: 2026年1月18日
- **适用BGI版本**: >=0.52.0
- **维护状态**: 活跃维护

## 变更记录

- v1.1.0 (2026-01-18):
  - 修正Genshin.cs文件范围（22-345 → 全文411行）
  - 添加引擎注册位置引用（EngineExtend.cs:34）
- v1.0.0 (2025-10-19): 初始版本

