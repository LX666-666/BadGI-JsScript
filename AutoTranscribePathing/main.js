// 加载依赖模块
eval(file.readTextSync("detection.js"));
eval(file.readTextSync("calculate.js"));

// 定义移动状态常量 - 必须先定义
const MOVE_STATE = {
    NORMAL: "normal",
    FLY: "fly",
    CLIMB: "climb",
    SWIM: "swim",
    UNKNOWN: "unknown"
};

// 定义移动模式常量
const MOVE_MODES = {
    WALK: "walk",
    DASH: "dash",
    FLY: "fly",
    CLIMB: "climb",
    SWIM: "swim",
    JUMP: "jump"
};

// 地图类别
const MAP_TYPES = {
  "自动检测": null,
  "提瓦特大陆": "Teyvat",
  "层岩巨渊": "TheChasm",
  "渊下宫": "Enkanomiya",
  "旧日之海": "SeaOfBygoneEras",
  "远古圣山": "AncientSacredMountain"
};

const questName = settings.questName;
const questLocation = settings.questLocation;
const trackNumber = settings.trackNumber;
const runMode = settings.runMode;
const startType = settings.start || "传送点";
const mapType = MAP_TYPES[settings.mapType || "自动检测"];

let continueRecording = true;
let lastposition;

// 初始化追踪数据
let trackData = {
  "info": {
    "name": `${settings.questName}-${settings.trackNumber}`,
    "type": "collect",
    "author": settings.author,
    "version": settings.version,
    "description": settings.description,
    "map_name": "Teyvat",
    "bgi_version": "0.47.2"
  },
  "positions": []
};

// 记录状态历史
let stateHistory = [];

function getPlayerPositionFromMap() {
  if (mapType !== null && mapType !== undefined) {
    return genshin.getPositionFromMap(mapType);
  }
  return genshin.getPositionFromMap();
}

// 保存追踪数据
async function saveTrackData() {
  const filePath = `Pathing/${settings.questLocation}/${settings.questName}-${settings.trackNumber}.json`;

  try {
    await file.writeTextSync(filePath, JSON.stringify(trackData, null, 2));
    log.info(`追踪数据已保存到: ${filePath}`);
  } catch (error) {
    log.error(`保存追踪数据失败: ${error}`);
  }
}

// 获取当前位置并添加到追踪数据
async function recordPosition() {
  // 检测当前移动状态
  if (isInMainUI()) {
    try {
      const currentState = await checkAbnormalState();
      const position = getPlayerPositionFromMap();
      log.debug(`从小地图获取坐标: X=${position.X}, Y=${position.Y}, 状态=${currentState}`);
      if(position.X === 0 && position.Y === 0){
        log.warn("取到坐标失败");
        return;
      }
      if (distance(position, lastposition) < 1) {
        log.debug("位置未变化，跳过");
        return;
      }
      if (distance(position, lastposition) > 100) {
        log.warn("位置变化过大");
        return;
      }
      // 创建位置对象并直接记录状态
      const positionObj = {
        "id": trackData.positions.length + 1,
        "x": position.X,
        "y": position.Y,
        "action": "",
        "move_mode": "dash", // 默认值，后续会根据状态调整
        "action_params": "",
        "type": "path",
        "state": currentState,
        "timestamp": Date.now()
      };
      
      trackData.positions.push(positionObj);
      lastposition=position;
    }
    catch (error) {
      return;
    }
  } else {
    if(isInOUI()){
      await genshin.returnMainUi();
      const position = getPlayerPositionFromMap();
      trackData.positions.push({
        "id": trackData.positions.length + 1,
        "x": position.X,
        "y": position.Y,
        "action": "",
        "move_mode": "walk",
        "action_params": "",
        "type": "target",
        "state": "walk",
        "timestamp": Date.now()
      });
      log.info("已生成地图追踪，脚本结束");
      continueRecording = false;
    }
    if(isInStoryUI())
    {
      handleStoryInterface();
      continueRecording = false;
    }
  }
  return;
}

// 处理收集到的路径数据
async function processTrackData() {
  log.info("开始处理路径数据...");
  
  // 1. 先优化点，保留关键点（飞/游起止点；攀爬仅保留起止点）
  optimizePathPoints();
  
  // 2. 再分配移动模式与动作（飞/攀/游/正常）
  processMoveModes();

  // 3. 清理临时状态属性
  for (const pos of trackData.positions) {
    delete pos.state;
    delete pos.timestamp;
    delete pos.__climb_points_count;
  }
  
  log.info("路径数据处理完成");
}

// 处理移动模式
function processMoveModes() {
  log.info("处理移动模式和动作...");
  
  const positions = trackData.positions;
  if (!positions || positions.length === 0) return;

  // 重置动作，保留将要重新计算的移动模式
  for (const pos of positions) {
    if(pos.optimize === false){
    }
    else{
    pos.action = "";
    }
    // 不强制清空 move_mode，稍后仅为未设置的点赋值
  }

  // 先处理飞行/游泳/攀爬分段
  let i = 0;
  while (i < positions.length) {
    const currentState = positions[i].state;

    // 飞行段：从 FLY 开始，直到非 FLY 结束；终点添加 stop_flying
    if (currentState === MOVE_STATE.FLY) {
      let end = i;
      while (end + 1 < positions.length && positions[end + 1].state === MOVE_STATE.FLY) end++;
      for (let k = i; k <= end; k++) positions[k].move_mode = MOVE_MODES.FLY;
      positions[end].action = "stop_flying";
      i = end + 1;
      continue;
    }

    // 游泳段：从 SWIM 开始，直到非 SWIM 结束；整段设为 swim
    if (currentState === MOVE_STATE.SWIM) {
      let end = i;
      while (end + 1 < positions.length && positions[end + 1].state === MOVE_STATE.SWIM) end++;
      for (let k = i; k <= end; k++) positions[k].move_mode = MOVE_MODES.SWIM;
      i = end + 1;
      continue;
    }

    // 攀爬段：从 CLIMB 开始，直到非 CLIMB 结束；<10s 设 jump，否则设 climb，并回溯10单位将 dash 改为 walk
    if (currentState === MOVE_STATE.CLIMB) {
      let end = i;
      while (end + 1 < positions.length && positions[end + 1].state === MOVE_STATE.CLIMB) end++;
      const climbStart = i;
      const originalEndPos = positions[end];

      // CLIMB 副作用小，可以弥补精度问题
      let climbEnd = end;
      let extensionIndex = climbEnd + 1;
      // 将最后一个 CLIMB 点之后1 0 单位距离内的连续点都标记为 CLIMB
      while (extensionIndex < positions.length) {
        const dist = distance(originalEndPos, positions[extensionIndex]);
        if (dist <= 10) {
          positions[extensionIndex].state = MOVE_STATE.CLIMB;
          climbEnd = extensionIndex;
          extensionIndex++;
        } else {
          break;
        }
      }

      /*
      const climbPointsCount = positions[climbStart].__climb_points_count || (climbEnd - climbStart + 1);
      const climbDurationSeconds = climbPointsCount * 0.9;
      */
      // 通过时间戳判断攀爬时间
      const climbDurationSeconds = (positions[climbEnd].timestamp - positions[climbStart].timestamp) / 1000;
      // 小于10秒可以用跳跃
      const climbMode = climbDurationSeconds < 10 ? MOVE_MODES.JUMP : MOVE_MODES.CLIMB;
      for (let k = climbStart; k <= climbEnd; k++) positions[k].move_mode = climbMode;

      // 回溯 10 单位，将 dash 改为 walk（仅当为长攀爬时）
      if (climbMode === MOVE_MODES.CLIMB) {
        let backDistAccum = 0;
        for (let j = climbStart - 1; j >= 0; j--) {
          const segDist = distance(
            { x: positions[j + 1].x, y: positions[j + 1].y },
            { x: positions[j].x, y: positions[j].y }
          );
          backDistAccum += segDist;
          if (backDistAccum >= 10) break;
          if (positions[j].move_mode === MOVE_MODES.DASH) {
            positions[j].move_mode = MOVE_MODES.WALK;
          }
        }
      }

      i = climbEnd + 1;
      continue;
    }

    i++;
  }

  // 正常移动逻辑（优化后再判断）：未设置 move_mode 的点按邻近距离决定 dash/walk
  for (let idx = 0; idx < positions.length; idx++) {
    if (!positions[idx].move_mode || positions[idx].move_mode === "") {
      if (idx === 0) {
        positions[idx].move_mode = MOVE_MODES.WALK;
        continue;
      }
      const prev = positions[idx - 1];
      const dist = distance({ x: positions[idx].x, y: positions[idx].y }, { x: prev.x, y: prev.y });
      positions[idx].move_mode = dist > 10 ? MOVE_MODES.DASH : MOVE_MODES.WALK;
    }
  }
}

// 优化路径点
function optimizePathPoints() {
  log.info("优化路径点...");
  
  if (trackData.positions.length > 2) {
    const originalPoints = trackData.positions.map((p, index) => ({
      index: index,
      x: p.x,
      y: p.y,
      state: p.state
    }));
    const epsilon = 1.0; // 简化阈值，可以根据需要调整
    
    // 转换为 RDP 算法需要的格式
    const pointsForRdp = originalPoints.map(p => ({ x: p.x, y: p.y }));
    const simplifiedPoints = rdp(pointsForRdp, epsilon);
    
    log.info(`路径点优化: 从${originalPoints.length}个点简化为${simplifiedPoints.length}个点`);
    
    // 先按 RDP 找出保留的点索引
    let keptIndices = simplifiedPoints.map(sp => {
      return originalPoints.findIndex(op => op.x === sp.x && op.y === sp.y);
    }).filter(idx => idx !== -1);

    // 分段扫描原始状态，确保保留关键点
    const segments = [];
    let segStart = 0;
    for (let i = 1; i < originalPoints.length; i++) {
      if (originalPoints[i].state !== originalPoints[i - 1].state) {
        segments.push({ state: originalPoints[segStart].state, start: segStart, end: i - 1 });
        segStart = i;
      }
    }
    segments.push({ state: originalPoints[segStart].state, start: segStart, end: originalPoints.length - 1 });

    // 强制保留首尾
    if (!keptIndices.includes(0)) keptIndices.push(0);
    if (!keptIndices.includes(originalPoints.length - 1)) keptIndices.push(originalPoints.length - 1);

    // 依据规则保留关键点；攀爬中间点删除，并记录攀爬段点数
    for (const seg of segments) {
      if (seg.state === MOVE_STATE.FLY || seg.state === MOVE_STATE.SWIM) {
        if (!keptIndices.includes(seg.start)) keptIndices.push(seg.start);
        if (!keptIndices.includes(seg.end)) keptIndices.push(seg.end);
      } else if (seg.state === MOVE_STATE.CLIMB) {
        // 仅保留起止点
        if (!keptIndices.includes(seg.start)) keptIndices.push(seg.start);
        if (!keptIndices.includes(seg.end)) keptIndices.push(seg.end);
        // 移除攀爬段中间点（如果 RDP 曾保留）
        keptIndices = keptIndices.filter(idx => !(idx > seg.start && idx < seg.end));
        // 记录攀爬点数用于时长估算
        trackData.positions[seg.start].__climb_points_count = seg.end - seg.start + 1;
      }
    }

    // 去重并排序
    keptIndices = Array.from(new Set(keptIndices)).sort((a, b) => a - b);
    
    // 创建新的 positions 数组（复制以保留状态等属性）
    const newPositions = keptIndices.map(idx => {
      return { ...trackData.positions[idx] };
    });
    
    // 更新 ID
    newPositions.forEach((pos, idx) => {
      pos.id = idx + 1;
    });
    
    trackData.positions = newPositions;
  }
}

// 处理剧情界面（录制中进入剧情）
async function handleStoryInterface() {
  log.info("检测到剧情界面，处理特殊逻辑...");
  
  if (trackData.positions.length > 0) {
    // 立即停止当前路径录制
    // 在当前地图追踪文件的最后一个路径点添加combat_script动作
    const lastPos = trackData.positions[trackData.positions.length - 1];
    trackData.positions[trackData.positions.length - 1].action = "combat_script";
    trackData.positions[trackData.positions.length - 1].action_params = strategyScript;
    trackData.positions[trackData.positions.length - 1].optimize = false; // 标记为不可优化
  }
  
  log.info("剧情界面处理完成");
}

// 主逻辑
async function main() {
  if (settings.runMode === "运行模式") {
    const filePath = `Pathing/${settings.questLocation}/${settings.questName}-${settings.trackNumber}.json`;
    log.info(`正在运行地图追踪任务文件: ${filePath}`);
    await pathingScript.runFile(filePath);
    return;
  }

  log.info("地图追踪录制开始");

  log.info("启用自动拾取");
  dispatcher.AddTrigger(new RealtimeTimer("AutoPick"));

  await genshin.returnMainUi();
  
  log.info(`起始点类型: ${startType}`);
  const initialPointType = startType === "传送点" ? "teleport" : "path";
  if (isInMainUI()) {
    const position = getPlayerPositionFromMap();
    lastposition = position;
    log.debug(`从小地图获取坐标: X=${position.X}, Y=${position.Y}`);

    // 记录初始状态
    const initialState = await checkAbnormalState();
    trackData.positions.push({
      "id": trackData.positions.length + 1,
      "x": position.X,
      "y": position.Y,
      "action": "",
      "move_mode": "walk",
      "action_params": "",
      "type": initialPointType,
      "state": initialState,
      "timestamp": Date.now()
    });
  } else {
    log.info("不在主界面，请返回主界面后重新启动脚本");
    return;
  }
  await sleep(900);
  while (continueRecording) {
    await recordPosition();
    await sleep(900); // 每0.9秒录制一次
  }
  await processTrackData(); // 处理收集到的路径数据
  await saveTrackData();
  
  log.info("地图追踪录制结束");
}

main();