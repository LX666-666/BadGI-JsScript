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

// 枚举定义（放在合适位置）
const ELEMENT_STATE = {
  MAINUI:   0,
  B:      1,
  C:      2,
  O:      3,
  G:      4,
  F2:     5,
  F3:     6,
  F4:     7,
  J:      8,
  MAP:    9,
  UNKNOWN:-1,
  Story:-2,
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

// 获取设置
const author = settings.author|| "";
const questName = settings.questName;
const questLocation = settings.questLocation;
const runMode = settings.runMode || "录制模式";
const forceTpFrist = settings.forceTpFrist === "自动检测" || false;
const keyStart = settings.keyStart
const keyStartTp = settings.keyStartTp
const keyDialogue = settings.keyDialogue;
const keyFight = settings.keyFight;
const keyPause = settings.keyPause;
const keySave = settings.keySave;
const autoFight = settings.autoFight !== false; // 默认启用自动战斗，除非明确设置为false
const maxRecordingCycles =  72000;
const strategyScript = "w(5)";
const teleportThreshold = 20; // 传送检测阈值，降低以更好地检测传送
const enableTransmissionDetection = true; // 默认启用传送检测
const anomalyDetectionDistance = 1000; // 异常检测阈值，超过此距离需要二次确认

// 初始化追踪数据
let trackData = {
  "info": {
    "name": `${questName}`,
    "type": "collect",
    "author": settings.author,
    "version": settings.version,
    "description": settings.description,
    "map_name": "Teyvat",
    "bgi_version": "0.47.2"
  },
  "positions": []
};

// 初始化process.json数据
let processData = []; // 使用文本格式而非JSON数组

// UI状态监控器类
class UIStateMonitor {
    constructor() {
        this.lastElementState = null;
    }

    async checkStateChange() {
        const currentState = await checkElementState();
        const changed = this.lastElementState !== null && this.lastElementState !== currentState;
        
        if (changed) {
            const stateNames = {
                [ELEMENT_STATE.MAINUI]: "主界面",
                [ELEMENT_STATE.B]: "背包界面",
                [ELEMENT_STATE.C]: "角色界面",
                [ELEMENT_STATE.O]: "好友界面", 
                [ELEMENT_STATE.G]: "教程界面",
                [ELEMENT_STATE.F2]: "联机界面",
                [ELEMENT_STATE.F3]: "祈愿界面",
                [ELEMENT_STATE.F4]: "纪行界面",
                [ELEMENT_STATE.J]: "任务界面",
                [ELEMENT_STATE.Story]: "剧情界面",
                [ELEMENT_STATE.MAP]: "地图界面",
                [ELEMENT_STATE.UNKNOWN]: "未知界面"
            };
            
            const oldStateName = stateNames[this.lastElementState] || `未知(${this.lastElementState})`;
            const newStateName = stateNames[currentState] || `未知(${currentState})`;
            log.info(`UI状态监控: ${oldStateName} → ${newStateName}`);
        }
        
        this.lastElementState = currentState;
        return { currentState, changed };
    }

    isDialogueState(state) {
        return [ELEMENT_STATE.G, ELEMENT_STATE.J, ELEMENT_STATE.F2, ELEMENT_STATE.F3, ELEMENT_STATE.F4, ELEMENT_STATE.C, ELEMENT_STATE.B, ELEMENT_STATE.O].includes(state);
    }
}

// 录制状态
let isRecording = false; // 初始状态改为未录制，等待触发
let isPaused = false;
let currentTrackFile = 1;
let lastPosition = null;
let currentTrackData = null; // 当前追踪数据引用
let lastStoryState = null; // 上次剧情状态
let uiStateMonitor = null; // UI状态监控器，稍后初始化
let lastEndType = null; // 上次录制结束的类型: 'fight', 'dialogue', 'pause', 'save'
let justExitedMap = false; // 新增：是否刚从地图界面退出
let wasInMap = false; // 新增：是否曾进入地图界面
let justLeftMap = false; // 刚刚离开地图界面的标志
let startWithTp = false; // 每次路径录制开始时，是否设为传送点，根据用户录制按键决定


// 保存追踪数据
async function saveTrackData(filename = null) {
  if (!filename) {
    filename = `${questName}-${currentTrackFile}.json`;
  }
  
  const filePath = `process/${questLocation}/${questName}/${filename}`;
  
  try {
    // 确保文件夹存在
    await ensureFolderExists(`process/${questLocation}/${questName}`);
    
    // 保存追踪数据
    const success = file.WriteTextSync(filePath, JSON.stringify(trackData, null, 2));
    if (success) {
      log.info(`追踪数据已保存到: ${filePath}`);
      return filename;
    } else {
      throw new Error("文件写入失败");
    }
  } catch (error) {
    log.error(`保存追踪数据失败: ${error}`);
    return null;
  }
}

// 保存process.json数据
async function saveProcessData() {
  const processPath = `process/${questLocation}/${questName}/process.json`;
  
  try {
    // 确保文件夹存在
    await ensureFolderExists(`process/${questLocation}/${questName}`);
    
    // 将数组转换为文本格式
    const processText = processData.join('\n');
    
    const success = file.WriteTextSync(processPath, processText);
    if (success) {
      log.info(`process.json已保存到: ${processPath}`);
      return true;
    } else {
      throw new Error("文件写入失败");
    }
  } catch (error) {
    log.error(`保存process.json失败: ${error}`);
    return false;
  }
}

// 确保文件夹存在的辅助函数
async function ensureFolderExists(folderPath) {
  // BGI的文件系统会自动创建目录，这里只需要记录日志
  log.info(`确保文件夹存在: ${folderPath}`);
}

async function lastposition() {
  await genshin.returnMainUi();
  const position = genshin.getPositionFromMap();
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
}
// 获取当前位置并添加到追踪数据
async function recordPosition() {
  if (!isRecording || isPaused) {
    log.debug("录制已停止或暂停，跳过位置记录");
    return true;
  }

  try {
    const position = genshin.getPositionFromMap();
    if (position.X === 0 && position.Y === 0) {
      log.warn("获取坐标失败，跳过此次记录");
      return;
    }

    // 检测当前移动状态
    const moveState = await checkAbnormalState();

    let dist = 0;
    if (lastPosition) {
      dist = distance(position, lastPosition);
    }

    if (dist < 1 && lastPosition) {
      log.debug("位置未变化，跳过");
      return;
    }

    let pointType = "path";
    let optimizeFlag = true;

    if (justExitedMap) {
      log.info(`刚从地图返回，检测首个点，距离: ${dist.toFixed(2)}`);
      if (dist > teleportThreshold) {
        log.info("检测为传送点，获取精确坐标...");
        
        // 按M键打开大地图获取精确位置
        keyPress("M");
        await sleep(500);
        
        let bigMapPosition = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        // 重试机制：最多尝试3次获取大地图坐标
        while (retryCount < maxRetries && !bigMapPosition) {
          try {
            bigMapPosition = genshin.getPositionFromBigMap();
            if (bigMapPosition && bigMapPosition.X !== 0 && bigMapPosition.Y !== 0) {
              log.info(`大地图精确坐标获取成功 (第${retryCount + 1}次尝试): X=${bigMapPosition.X.toFixed(3)}, Y=${bigMapPosition.Y.toFixed(3)}`);
              
              // 使用大地图的精确坐标
              position.X = bigMapPosition.X;
              position.Y = bigMapPosition.Y;
              break;
            } else {
              throw new Error("获取到无效坐标 (0,0)");
            }
          } catch (error) {
            retryCount++;
            log.warn(`第${retryCount}次获取大地图坐标失败: ${error.message}`);
            
            if (retryCount < maxRetries) {
              log.info(`等待200ms后进行第${retryCount + 1}次重试...`);
              await sleep(200);
            } else {
              log.warn(`重试${maxRetries}次后仍然失败，使用原坐标`);
            }
          }
        }
        
        // 返回主界面
        genshin.returnMainUi();
        await sleep(100);
        
        pointType = "teleport";
        optimizeFlag = false;
      } else {
        log.info("非传送点，记录为普通路径点");
      }
      // 无论结果如何，都重置标志，确保只对第一个点生效
      justExitedMap = false;
    } else if (dist > anomalyDetectionDistance && lastPosition) {
      log.warn(`检测到异常距离: ${dist.toFixed(2)} > ${anomalyDetectionDistance}，非传送检测模式，忽略该点`);
      return; // 忽略异常点
    }

    log.debug(`记录新位置: (${position.X.toFixed(1)}, ${position.Y.toFixed(1)}) 状态=${moveState}, 距离=${dist.toFixed(2)}`);

    const positionObj = {
      "id": trackData.positions.length + 1,
      "x": position.X,
      "y": position.Y,
      "action": "",
      "move_mode": "dash",
      "action_params": "",
      "type": pointType,
      "state": moveState,
      "timestamp": Date.now()
    };

    if (!optimizeFlag) {
      positionObj.optimize = false;
    }

    trackData.positions.push(positionObj);
    lastPosition = { x: position.X, y: position.Y };

    log.info(`已记录路径点 #${positionObj.id}，总计 ${trackData.positions.length} 个点, 类型=${pointType}, 距离=${dist.toFixed(2)}`);

  } catch (error) {
    log.error(`recordPosition异常: ${error.message}`);
  }
  return true;
}

// 处理收集到的路径数据
async function processTrackData() {
  log.info("开始处理路径数据...");
  
  // 1. 先优化点，保留关键点（飞/游起止点；攀爬仅保留起止点）
  optimizePathPoints();
  
  // 2. 再分配移动模式与动作（飞/攀/游/正常）
  processMoveModes();

  // 3. 清理临时状态属性（保留optimize标记）
  for (const pos of trackData.positions) {
    delete pos.state;
    delete pos.timestamp;
    delete pos.__climb_points_count;
    // 保留optimize标记，不删除
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

    // 攀爬段：从 CLIMB 开始，直到非 CLIMB 结束；<15s 设 jump，否则设 climb，并回溯15单位将 dash 改为 walk
    if (currentState === MOVE_STATE.CLIMB) {
      let end = i;
      while (end + 1 < positions.length && positions[end + 1].state === MOVE_STATE.CLIMB) end++;
      const climbStart = i;
      const climbEnd = end;
      const climbPointsCount = positions[climbStart].__climb_points_count || (climbEnd - climbStart + 1);
      const climbDurationSeconds = climbPointsCount * 0.9;
      const climbMode = climbDurationSeconds < 15 ? MOVE_MODES.JUMP : MOVE_MODES.CLIMB;
      for (let k = climbStart; k <= climbEnd; k++) positions[k].move_mode = climbMode;
      
      // 回溯 15 单位，将 dash 改为 walk（仅当为长攀爬时）
      if (climbMode === MOVE_MODES.CLIMB) {
        let backDistAccum = 0;
        for (let j = climbStart - 1; j >= 0; j--) {
          const segDist = distance(
            { x: positions[j + 1].x, y: positions[j + 1].y },
            { x: positions[j].x, y: positions[j].y }
          );
          backDistAccum += segDist;
          if (backDistAccum >= 15) break;
          if (positions[j].move_mode === MOVE_MODES.DASH) {
            positions[j].move_mode = MOVE_MODES.WALK;
          }
        }
      }

      i = end + 1;
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
    const epsilon = 2.0; // 简化阈值，可以根据需要调整
    
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

    // 强制保留所有传送点（type为teleport或optimize为false的点）
    for (let idx = 0; idx < trackData.positions.length; idx++) {
      const pos = trackData.positions[idx];
      if (pos.type === "teleport" || pos.optimize === false) {
        if (!keptIndices.includes(idx)) {
          keptIndices.push(idx);
          log.debug(`强制保留传送点/不可优化点 #${idx + 1}`);
        }
      }
    }

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

// 处理对话功能
async function handleDialogue() {
  if (!isRecording || isPaused) return;
  
  log.info("开始处理对话功能...");
  
  // 保存当前路径
  const filename = await saveCurrentPath();
  if (filename) {
    processData.push(`地图追踪 ${filename}`);
  }
  
  await genshin.returnMainUi();
  // 从游戏界面OCR提取当前任务描述中的NPC名称
  const npcName = await extractNPCNameFromTask();
  if (npcName) {
    const dialogRegion = { X: 1150, Y: 300, WIDTH: 350, HEIGHT: 400 };
    let dialogResults = await Utils.easyOCR(dialogRegion);

    // 并选择这个NPC
    for (let i = 0; i < dialogResults.count; i++) {
      let text = dialogResults[i].text;
      let res = dialogResults[i];
      if (text.includes(npcName)) {
        log.info(`点击包含提取到任务人名的选项: ${text}`);
        keyDown("VK_MENU");
        await sleep(500);
        click(res.x, res.y);
        leftButtonClick();
        keyUp("VK_MENU");
        break;
      }
    }
    
    // 添加对话指令到process.json
    processData.push(`对话 ${npcName}`);
    log.info(`已添加对话指令: 对话 ${npcName}`);

  } else {
    log.warn("未能提取到NPC名称，添加默认对话指令");
    processData.push("对话");
  }
  
  // 无论是否提取到NPC名称，都尝试按F键触发剧情
  log.info("按下F键触发剧情");
  keyPress("F");
  await sleep(500);
  
  // 保存process.json并停止录制
  await saveProcessData();
  lastEndType = 'dialogue';
  isRecording = false;
  
  await sleep(1000);
  log.info("开始自动剧情");
  await waitForMainUI();
}

// 处理战斗功能
async function handleFight() {
  if (!isRecording || isPaused) return;
  
  log.info("开始处理战斗");
  await genshin.returnMainUi();
  const filename = await saveCurrentPath();
  if (filename) {
    processData.push(`地图追踪 ${filename}`);
  }
  processData.push(`战斗`);
  await saveProcessData();
  lastEndType = 'fight';
  isRecording = false;
  
  if (autoFight) {
    log.info("启动自动战斗");
    await dispatcher.runTask(new SoloTask("AutoFight"));
  } else {
    log.info("自动战斗已关闭，仅记录战斗指令");
    // 等待返回主界面后继续录制
    await waitForMainUI();
  }
}

// 处理暂停/恢复功能
async function handlePause() {
  if (isRecording) {
    // 停止录制当前位置，保存当前地图追踪文件
    const filename = await saveCurrentPath();
    if (filename) {
      // 在process.json中添加指令
      processData.push(`地图追踪 ${filename}`);
      processData.push("暂停");
      await saveProcessData();
    }
    lastEndType = 'pause';
    isRecording = false;
    log.info("录制已暂停");
  } else {
    // 恢复录制
    isRecording = true;
    lastEndType = null;
    log.info("录制已恢复");
    
    // 开始新的录制段
    await startNewRecording();
    
    log.info("新录制段已开始，等待用户操作:");
    log.info(`- 打开${keyDialogue}界面：保存路径+对话`);
    log.info(`- 打开${keyFight}界面：保存路径+战斗`);
    log.info(`- 打开${keyPause}界面：保存路径+暂停`);
    log.info(`- 打开${keySave}界面：只保存路径`);
  }
}

// 处理结束录制功能
async function handleEndRecording() {
  // 保存最后的路径
  const filename = await saveCurrentPath();
  if (filename) {
    processData.push(`地图追踪 ${filename}`);
  }
  await saveProcessData();
  lastEndType = 'save';
  isRecording = false;
  
  log.info("录制已结束，process.json已生成");
}

// 处理剧情界面（情景A：录制中进入剧情）
async function handleStoryInterface() {
  log.info("检测到剧情界面，处理特殊逻辑...");
  
  if (trackData.positions.length > 0) {
    // 立即停止当前路径录制
    // 在当前地图追踪文件的最后一个路径点添加combat_script动作
    const lastPos = trackData.positions[trackData.positions.length - 1];
    trackData.positions[trackData.positions.length - 1].action = "combat_script";
    trackData.positions[trackData.positions.length - 1].action_params = strategyScript;
    trackData.positions[trackData.positions.length - 1].optimize = false; // 标记为不可优化
    
    // 保存当前路径
    const filename = await saveCurrentPath();
    if (filename) {
      // 在process.json添加等待返回主界面指令
      processData.push(`地图追踪 ${filename}`);
      processData.push("等待返回主界面");
      await saveProcessData();
    }
  }
  
  lastEndType = 'story';
  isRecording = false;
  log.info("剧情界面处理完成");
}

// 获取当前任务描述
async function getCurrentTaskDescription() {
  try {
    const taskRegion = { X: 75, Y: 240, WIDTH: 280, HEIGHT: 43 };
    const ocrRo = RecognitionObject.Ocr(taskRegion.X, taskRegion.Y, taskRegion.WIDTH, taskRegion.HEIGHT);
    let captureRegion = captureGameRegion();
    let results = captureRegion.findMulti(ocrRo);
    
    if (results && results.length > 0) {
      return results[0].text.trim();
    }
  } catch (error) {
    log.error(`获取任务描述失败: ${error.message}`);
  }
  
  return "剧情任务";
}

// 从任务描述区域提取NPC名称
async function extractNPCNameFromTask() {
  try {
    const taskRegion = { X: 75, Y: 240, WIDTH: 280, HEIGHT: 43 };
    const ocrRo = RecognitionObject.Ocr(taskRegion.X, taskRegion.Y, taskRegion.WIDTH, taskRegion.HEIGHT);
    let captureRegion = captureGameRegion();
    let results = captureRegion.findMulti(ocrRo);
    
    if (results && results.length > 0) {
      for (let i = 0; i < results.length; i++) {
        const text = results[i].text;
        const npcName = extractNPCName(text);
        if (npcName) {
          log.info(`提取到NPC名称: ${npcName}`);
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

// 从文本中提取NPC名称的模式匹配函数
function extractNPCName(text) {
  if (!text) return null;
  
  const patterns = [
    /与(.+?)对话/,
    /与(.+?)一起/,
    /向(.+?)打听/,
    /向(.+?)回报/,
    /找到(.+?)(?=\s|$)/,
    /询问(.+?)(?=\s|$)/,
    /告诉(.+?)(?=\s|$)/,
    /前往(.+?)处/,
    /寻找(.+?)(?=\s|$)/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

// 保存当前路径数据
async function saveCurrentPath() {
  if (trackData.positions.length > 0) {
    trackData.info.name=`${questName}-${currentTrackFile}`;
    await processTrackData(); // 处理收集到的路径数据
    const filename = await saveTrackData();
    
    // 重置追踪数据
    trackData.positions = [];
    lastPosition = null;
    
    // 保存后递增文件编号，为下一个文件做准备
    currentTrackFile++;
    
    return filename;
  }
  return null;
}

// 开始新的路径追踪文件
async function startNewTrackFile() {
  currentTrackFile++;
  
  // 重置追踪数据结构
  trackData = {
    "info": {
      "name": `${questName}-${currentTrackFile}`,
      "type": "collect",
      "author": settings.author,
      "version": settings.version,
      "description": settings.description,
      "map_name": "Teyvat",
      "bgi_version": "0.45.0"
    },
    "positions": []
  };
  
  log.info(`开始新的路径追踪文件: ${questName}-${currentTrackFile}.json`);
}

// 检查长距离传送（情景B）- 已集成到recordPosition中，保留此函数以防其他地方调用
async function checkTeleportation() {
  // 传送检测逻辑已移至recordPosition函数中
  // 此函数保留为空函数以保持兼容性
  return;
}

// 新增：等待返回主界面
async function waitForMainUI() {
  log.info("等待返回主界面...");
  
  for (let i = 0; i < 1200; i++) { // 最多等待20分钟
    if (isInMainUI()) {
      log.info("已返回主界面");
      
      // 检查是否是从对话、剧情等状态回到主界面，如果是则自动开始新录制
      if (lastEndType === 'dialogue' || lastEndType === 'story') {
        log.info("从对话/剧情返回主界面，自动开始新录制");
        isRecording = true;
        lastEndType = null;
        await startNewRecording();
        
        log.info("新录制段已开始，等待用户操作:");
        log.info(`- 打开${keyDialogue}界面：保存路径+对话`);
        log.info(`- 打开${keyFight}界面：保存路径+战斗`);
        log.info(`- 打开${keyPause}界面：保存路径+暂停`);
        log.info(`- 打开${keySave}界面：只保存路径`);
      }
      
      return;
    }
    await sleep(1000);
  }
  
  log.warn("等待返回主界面超时");
}

// 新增：开始新的录制段
async function startNewRecording() {
  log.info("开始新的录制段...");
  
  // 确保在主界面
  await genshin.returnMainUi();
  
  if (isInMainUI()) {
    const position = genshin.getPositionFromMap();
    
    // 自动判断起始点类型：第一次录制默认为传送点，后续录制段默认为路径点
    // 用户也可以通过传送检测机制来标记传送点
    const isFirstRecording = (currentTrackFile === 1);
    let initialPointType
    if (isFirstRecording && forceTpFrist) {
      initialPointType = "teleport";
    } else {
      initialPointType = startWithTp ? "teleport" : "path"; // 根据用户设置初始点类型
    }

    // 检测初始状态
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
    
    lastPosition = { x: position.X, y: position.Y };
    
    if (isFirstRecording) {
      log.info(`第一次录制开始 (文件段${currentTrackFile})，自动判断起始点类型: ${initialPointType}, 坐标: X=${position.X}, Y=${position.Y}`);
    } else {
      log.info(`新录制段开始 (文件段${currentTrackFile})，自动判断起始点类型: ${initialPointType}, 坐标: X=${position.X}, Y=${position.Y}`);
    }
  } else {
    log.warn("不在主界面，无法开始录制");
  }
}

// 新增：等待暂停/恢复界面触发
async function waitForPauseResumeTrigger() {
  log.info(`等待{keyStart}界面开始录制... 或者手动传送后\n        等待 {keyStartTp} 界面开始录制，并将起点设为需要传送`, keyStart, keyStartTp);
  const startState = getElementStateByKey(keyStart);
  const startTpState = getElementStateByKey(keyStartTp);
  
  while (true) {
    const { currentState } = await uiStateMonitor.checkStateChange();
    
    if (currentState === startState) {
      log.info(`检测到${keyStart}界面，开始录制`);
      startWithTp = false;
      await handlePause();
      break;
    } else if (currentState === startTpState) {
      log.info(`检测到${keyStartTp}界面，开始录制并将起点设为传送`);
      startWithTp = true;
      await handlePause();
      break;
    }
    
    await sleep(500);
  }
}

// 设置界面状态监听器（替代键盘监听）
function setupUIStateListener() {
  log.info("界面状态监听器已设置");
  log.info(`对话界面触发: ${keyDialogue}`);
  log.info(`战斗界面触发: ${keyFight}`);
  log.info(`暂停/恢复界面触发: ${keyPause}`);
  log.info(`保存路径界面触发: ${keySave}`);
}

// 检查界面状态变化
async function checkUIStateChange() {
  const { currentState, changed } = await uiStateMonitor.checkStateChange();
  
  // 状态追踪逻辑
  if (currentState === ELEMENT_STATE.MAP) {
    wasInMap = true;
  } else if (wasInMap && !justExitedMap) { // 如果之前在地图，但现在不在了，且传送标志还未设置
    justExitedMap = true;
    wasInMap = false; // 重置
    log.info("状态追踪: 已离开地图界面，设置传送检测标志");
  }
  
  if (currentState === ELEMENT_STATE.MAINUI && isRecording) {
    await recordPosition();
  }
  if (!changed) return;
  
  // 显示界面状态变化信息
  const stateNames = {
    [ELEMENT_STATE.MAINUI]: "主界面",
    [ELEMENT_STATE.B]: "背包界面 (B键)",
    [ELEMENT_STATE.C]: "角色界面 (C键)", 
    [ELEMENT_STATE.O]: "好友界面 (O键)",
    [ELEMENT_STATE.G]: "教程界面 (G键)",
    [ELEMENT_STATE.F2]: "联机界面 (F2键)",
    [ELEMENT_STATE.F3]: "祈愿界面 (F3键)",
    [ELEMENT_STATE.F4]: "纪行界面 (F4键)",
    [ELEMENT_STATE.J]: "任务界面 (J键)",
    [ELEMENT_STATE.MAP]: "地图界面",
    [ELEMENT_STATE.Story]: "剧情界面",
    [ELEMENT_STATE.UNKNOWN]: "未知界面"
  };
  
  const stateName = stateNames[currentState] || `未知状态(${currentState})`;
  log.info(`界面状态变化 → ${stateName}`);
  
  // 剧情界面无论录制状态都要处理
  if (currentState === ELEMENT_STATE.Story) {
    if (isRecording) {
      log.info("录制中检测到剧情界面，保存路径+等待返回主界面");
      await handleStoryInterface();
    } else {
      log.info("非录制状态检测到剧情界面，等待返回主界面");
      await waitForMainUI();
    }
    return;
  }
  
  if (!isRecording) {
    // 非录制状态下，只处理暂停/恢复键
    if (currentState === getElementStateByKey(keyPause)) {
      log.info(`非录制状态检测到暂停/恢复触发 (配置: ${keyPause})`);
      await handlePause();
      return;
    }
    log.debug("非录制状态，忽略其他界面变化");
    return;
  }
  
  // 根据当前界面状态执行对应操作（仅录制状态）
  switch (currentState) {
    case getElementStateByKey(keyDialogue):
      log.info(`触发保存路径+对话 (配置: ${keyDialogue})`);
      await lastposition();
      await handleDialogue();
      break;

    case getElementStateByKey(keyFight):
      log.info(`触发保存路径+战斗 (配置: ${keyFight})`);
      await lastposition();
      await handleFight();
      break;

    case getElementStateByKey(keyPause):
      log.info(`触发保存路径+暂停 (配置: ${keyPause})`);
      await lastposition();
      await handlePause();
      break;

    case getElementStateByKey(keySave):
      log.info(`触发保存路径 (配置: ${keySave})`);
      await lastposition();
      await handleEndRecording();
      break;
      
    default:
      log.debug(`界面变化为 ${stateName}，无对应功能配置`);
      break;
  }
}

// 根据按键配置获取对应的ELEMENT_STATE
function getElementStateByKey(key) {
  const keyMapping = {
    "角色C": ELEMENT_STATE.C,
    "背包B": ELEMENT_STATE.B,
    "教程G": ELEMENT_STATE.G,
    "好友O": ELEMENT_STATE.O,
    "任务J": ELEMENT_STATE.J,
    "联机F2": ELEMENT_STATE.F2,
    "祈愿F3": ELEMENT_STATE.F3,
    "纪行F4": ELEMENT_STATE.F4
  };
  return keyMapping[key] || ELEMENT_STATE.UNKNOWN;
}

// 主逻辑
async function main() {
  log.info("自动化脚本录制系统开始");

  const enabledFeatures = ["启用自动剧情"];
  dispatcher.AddTrigger(new RealtimeTimer("AutoSkip"));
  if (!settings.noSkip) {
    enabledFeatures.push("启用自动拾取");
    dispatcher.AddTrigger(new RealtimeTimer("AutoPick"));
  }
  if (!settings.noEat) {
    enabledFeatures.push("启用自动吃药");
    dispatcher.AddTrigger(new RealtimeTimer("AutoEat"));
  }

  // 最后输出合并的日志
  log.info(enabledFeatures.join("/ "));
  // 初始化UI状态监控器
  uiStateMonitor = new UIStateMonitor();

  await genshin.returnMainUi();
  
  // 根据上次结束类型和当前文件段数决定启动行为
  if (currentTrackFile === 1 && lastEndType === null) {
    // 全新开始，等待首次暂停/恢复界面触发
    log.info("全新录制，等待首次触发开始录制");
    await waitForPauseResumeTrigger();
  } else if (lastEndType === 'fight') {
    // 上次以战斗结束，需要等待暂停/恢复界面触发
    log.info(`继续录制 (文件段${currentTrackFile})，上次以战斗结束，等待触发开始新录制`);
    await waitForPauseResumeTrigger();
  } else if (lastEndType === 'pause') {
    // 上次是暂停状态，等待恢复触发
    log.info(`继续录制 (文件段${currentTrackFile})，上次为暂停状态，等待恢复触发`);
    await waitForPauseResumeTrigger();
  } else {
    // 其他情况（对话、保存、剧情结束），直接等待触发
    log.info(`继续录制 (文件段${currentTrackFile})，等待触发开始新录制`);
    await waitForPauseResumeTrigger();
  }
  
  // 主录制循环
  let cycleCount = 0;
  while (cycleCount < maxRecordingCycles) {
    cycleCount++;
    
    // 每1000次循环输出一次进度信息
    if (cycleCount % 1000 === 0) {
      log.info(`系统运行进度: ${cycleCount}/${maxRecordingCycles} (${((cycleCount/maxRecordingCycles)*100).toFixed(1)}%)`);
    }
    
    if (isRecording) {
      // 录制状态下的操作
      await checkUIStateChange();
      
      // 检查传送情况
      if (enableTransmissionDetection) {
        await checkTeleportation();
      }
    } else {
      // 非录制状态，等待返回主界面和触发事件
      if (isInMainUI()) {
        // 根据上次结束类型决定是否需要等待触发
        if (lastEndType === 'save') {
          log.info(`录制结束,退出脚本`);
          break; 
        } else if (lastEndType === 'fight') {
          // 战斗结束，需要等待暂停/恢复界面触发
          log.info("上次录制以战斗结束，等待触发后开始新录制");
          await waitForPauseResumeTrigger();
        } else if (lastEndType === 'pause') {
          // 暂停状态，等待恢复触发
          log.info("当前为暂停状态，等待恢复触发");
          await waitForPauseResumeTrigger();
        } else {
          // 其他情况，检查界面状态变化
          const { currentState, changed } = await uiStateMonitor.checkStateChange();
          
          if (changed) {
            const pauseState = getElementStateByKey(keyPause);
            if (currentState === pauseState) {
              // 触发暂停/恢复，开始新录制
              log.info("检测到暂停/恢复触发，切换录制状态");
              await handlePause();
            }
          }
        }
      } else {
        // 不在主界面，等待返回
        // 检查界面状态，如果是剧情界面则等待
        const { currentState } = await uiStateMonitor.checkStateChange();
        if (currentState === ELEMENT_STATE.Story) {
          log.debug("当前在剧情界面，等待返回主界面");
          await waitForMainUI();
        } else {
          await waitForMainUI();
        }
      }
    }
    
    await sleep(900); // 每0.9秒检查一次
  }
  
  // 循环结束处理
  if (cycleCount >= maxRecordingCycles) {
    log.warn(`系统已达到最大运行循环次数限制 (${maxRecordingCycles})，自动结束`);
    log.info("如需继续运行，请重新启动脚本或调整maxRecordingCycles设置");
    
    // 自动保存当前路径（如果有）
    if (isRecording && trackData.positions.length > 0) {
      const filename = await saveCurrentPath();
      if (filename) {
        processData.push(`地图追踪 ${filename}`);
        await saveProcessData();
        log.info("当前路径已自动保存");
      }
    }
  }
}

// 从processData中寻找地图追踪文件的最大数字
function findMaxTrackNumber(processData) {
  let maxNumber = null;
  // 修改正则表达式：匹配格式：地图追踪 任意内容-数字.json
  const trackPattern = /地图追踪\s+([^-]+-)?(\d+)\.json/;
  
  for (const line of processData) {
      const match = line.match(trackPattern);
      if (match && match[2]) { // match[2] 是数字部分
          const currentNumber = parseInt(match[2]);
          
          // 更新最大数字
          if (maxNumber === null || currentNumber > maxNumber) {
              maxNumber = currentNumber;
          }
          log.debug(`找到追踪文件: ${match[0]}, 数字: ${currentNumber}`);
      }
  }
  
  return maxNumber;
}

// 新增：分析process.json中的上次录制结束类型
function analyzeLastEndType(processData) {
  if (!processData || processData.length === 0) {
    return null;
  }
  
  // 从最后一行开始向前查找，寻找最后的操作类型
  for (let i = processData.length - 1; i >= 0; i--) {
    const line = processData[i].trim();
    
    // 跳过空行和作者信息
    if (!line || line.startsWith('作者：')) {
      continue;
    }
    
    // 分析不同的结束类型
    if (line === '战斗') {
      log.info("分析process.json: 上次录制以战斗结束");
      return 'fight';
    } else if (line.startsWith('对话')) {
      log.info("分析process.json: 上次录制以对话结束");
      return 'dialogue';
    } else if (line === '暂停') {
      log.info("分析process.json: 上次录制以暂停结束");
      return 'pause';
    } else if (line === '等待返回主界面') {
      log.info("分析process.json: 上次录制以剧情结束");
      return 'story';
    } else if (line.startsWith('地图追踪')) {
      // 如果最后一行是地图追踪，说明是正常保存结束
      log.info("分析process.json: 上次录制以保存结束");
      return 'save';
    }
  }
  
  log.info("分析process.json: 未找到明确的结束类型，默认为保存结束");
  return 'save';
}

// 修改initProcessData中的currentTrackFile生成逻辑
async function initProcessData() {
  const processPath = `process/${questLocation}/${questName}/process.json`;
  let processData = [];
  
  try {
      const existingContent = file.ReadTextSync(processPath);
      
      if (existingContent) {
          processData = existingContent.split('\n').filter(line => line.trim() !== '');
          log.info(`已读取现有process.json，共${processData.length}行`);
          
          // 确保第一行是作者信息
          const hasAuthor = processData.length > 0 && processData[0].startsWith('作者：');
          if (!hasAuthor) {
            processData.unshift(`作者：${author}`);
          }
          
          // 寻找地图追踪文件中最大的数字
          const maxTrackNumber = findMaxTrackNumber(processData);
          if (maxTrackNumber !== null) {
              // 保持原有的文件命名格式
              currentTrackFile = maxTrackNumber + 1;
              log.info(`找到最大追踪文件数字: ${maxTrackNumber}，下一个文件段为: ${currentTrackFile}`);
          } else {
              log.info("未找到地图追踪文件，从第1段开始");
              currentTrackFile = 1;
          }
          
          // 分析上次录制结束类型
          lastEndType = analyzeLastEndType(processData);
          
      } else {
          processData = [`作者：${author}`];
          currentTrackFile = 1;
          lastEndType = null;
          log.info("创建新的process.json并初始化作者信息，从第1段开始录制");
      }
  } catch (error) {
      processData = [`作者：${author}`];
      currentTrackFile = 1;
      lastEndType = null;
      log.info("文件不存在，创建新的process.json并初始化作者信息，从第1段开始录制");
  }
  
  return processData;
}

// 启动脚本并处理错误
async function startScript() {
  try {
    processData = await initProcessData();
    
    log.info("=== 自动化脚本录制系统 ===");
    
    // 显示当前录制状态信息
    const isFirstRecording = (currentTrackFile === 1);
    if (isFirstRecording) {
      log.info("当前状态: 全新录制，从第1段开始");
    } else {
      log.info(`当前状态: 继续录制，从第${currentTrackFile}段开始`);
    }
    
    if (lastEndType) {
      const endTypeNames = {
        'fight': '战斗',
        'dialogue': '对话',
        'pause': '暂停',
        'save': '保存',
        'story': '剧情'
      };
      log.info(`上次结束类型: ${endTypeNames[lastEndType] || lastEndType}`);
    }
    
    log.info("系统启动完成，等待用户操作:");
    log.info(`- 需要打开{s1}/{s2}界面来开始录制`, keyStart, keyStartTp);
    log.info(`- 录制中可打开${keyDialogue}界面：保存路径+对话`);
    log.info(`- 录制中可打开${keyFight}界面：保存路径+战斗`);
    log.info(`- 录制中可打开${keyPause}界面：保存路径+暂停`);
    log.info(`- 录制中可打开${keySave}界面：只保存路径`);
    log.info("- 系统会自动处理剧情界面并等待返回主界面");
    log.info("=========================");
    
    await main();
  } catch (error) {
    if (error.message === "A task was canceled") {
      log.warn("脚本被用户强制退出");
      log.warn("如需保存路径，请使用结束录制功能而非退出脚本");
    }else{
      log.error(`脚本执行出现错误: ${error.message}`);
      log.error("请检查配置并重新运行脚本");
    }
  }
}

startScript();
//checkElementState();