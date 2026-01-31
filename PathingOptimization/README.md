# optimization.js 说明文档

## 概述
`optimization.js` 是原神自动化脚本的路径优化模块，负责处理采集路径数据，通过算法简化路径点并智能分配移动模式。

## 调用
import * as Opt from 'optimization.js';

## 核心功能

### 1. 路径点简化（RDP算法）
使用**Ramer-Douglas-Peucker**算法简化路径点，在保持路径形状的前提下减少点数。

**参数配置：**
- `epsilon: 2.0` - 简化阈值，值越大简化程度越高

**算法特点：**
- 保留起点和终点
- 对飞行、游泳、攀爬状态特殊处理
- 攀爬段仅保留起止点

### 2. 移动模式智能分配
根据检测到的运动状态自动分配移动模式：

| 状态 | 分配模式 | 特殊动作 |
|------|---------|---------|
| 飞行(FLY) | `MOVE_MODES.FLY` | 终点添加`stop_flying` |
| 游泳(SWIM) | `MOVE_MODES.SWIM` | 无特殊动作 |
| 攀爬(CLIMB) | 时长<10秒：`MOVE_MODES.JUMP`<br>时长≥10秒：`MOVE_MODES.CLIMB` | 攀爬前10单位距离内冲刺改为行走 |
| 正常(NORMAL) | 距离>10：`MOVE_MODES.DASH`<br>距离≤10：`MOVE_MODES.WALK` | 无 |

### 3. 数据处理流程
```
原始路径点 → RDP简化 → 状态分段处理 → 移动模式分配 → 清理临时数据
```

## API接口

### `distance(a, b)`
计算两点间欧几里得距离
- **参数**: 
  - `a`: {x: number, y: number}
  - `b`: {x: number, y: number}
- **返回**: `number`

### `processTrackData(trackData, MOVE_STATE, MOVE_MODES)`
主处理函数
- **参数**:
  - `trackData`: 原始追踪数据对象
  - `MOVE_STATE`: 移动状态常量
  - `MOVE_MODES`: 移动模式常量
- **返回**: `Promise<void>`

## 数据结构

### 输入数据格式
```javascript
trackData = {
  info: {...}, // 元信息
  positions: [
    {
      id: number,
      x: number,
      y: number,
      action: string,
      move_mode: string,
      action_params: string,
      type: string,
      state: string,        // 临时状态：normal/fly/climb/swim
      timestamp: number     // 时间戳
    }
  ]
}
```

### 输出数据格式
- 移除`state`、`timestamp`等临时字段
- 优化后的`move_mode`分配
- 简化的路径点数组

---

# 下一步算法优化思路

## 1. 基于速度的自适应RDP阈值
**问题**：固定epsilon值无法适应不同移动速度
**优化方案**：
```javascript
function adaptiveEpsilon(points) {
  const speeds = calculateSegmentSpeeds(points); // 计算每段速度
  return speeds.map(speed => {
    // 速度越快，epsilon越大（容忍更多简化）
    return baseEpsilon * (1 + Math.log(speed / baseSpeed));
  });
}
```

## 2. 曲线拟合优化
**问题**：RDP只保留直线，丢失曲线特征
**优化方案**：
```javascript
// 使用Bézier曲线拟合
function bezierFit(points, tension = 0.5) {
  // 对简化后的点进行曲线拟合
  // 生成更平滑的路径，适合飞行、游泳等连续运动
}
```

## 3. 时间序列分析
**问题**：忽略时间维度信息
**优化方案**：
```javascript
// 分析停留点和快速移动段
function temporalAnalysis(points) {
  const timeThreshold = 2000; // 2秒
  const distanceThreshold = 1;
  
  // 识别采集点（长时间停留+小范围移动）
  const collectionPoints = detectCollectionActivities(points);
  
  // 识别战斗区域（中等时间停留+位置变化）
  const combatZones = detectCombatZones(points);
}
```

这些优化可以显著提升路径录制质量，减少手动调整时间，提高自动化脚本的鲁棒性和效率。