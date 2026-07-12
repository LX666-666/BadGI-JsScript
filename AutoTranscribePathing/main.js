// 加载依赖模块
import * as Opt from 'optimization.js';
import { getPlayerPosition } from 'getPosition.js';
import { isInMainUI, isInOUI, isInStoryUI, checkAbnormalState, MOVE_STATE } from 'detection.js';

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
  "远古圣山": "AncientSacredMountain",
  "空之神殿": "TempleOfSpace"
};

const questName = settings.questName || "默认";
const questLocation = settings.questLocation || "默认";
const trackNumber = settings.trackNumber || 1;
const runMode = settings.runMode || "录制模式";
const startType = settings.start || "传送点";
const mapType = settings.mapType || "自动检测";
const strategyScript = "w(5)";
const testMode = settings.testMode || false;

let continueRecording = true;
let needStoryTip = false;
let storyTipWinId = null;
let lastposition;
let currentMapType = MAP_TYPES[mapType] || null;

// 初始化追踪数据
var trackData = {
  "info": {
    "name": `${questName}-${trackNumber}`,
    "type": "collect",
    "author": settings.author,
    "version": settings.version,
    "description": settings.description,
    "map_name": "Teyvat", // 初始值，后续会更新
    "bgi_version": "0.47.3"
  },
  "positions": []
};

// 保存追踪数据
async function saveTrackData() {
  const filePath = `Pathing/${questLocation}/${questName}-${trackNumber}.json`;

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
      const { position, map } = await getPlayerPosition(lastposition,currentMapType);

      if (!position || (position.X === 0 && position.Y === 0)){
        log.warn("取到坐标失败");
        return;
      }

      if (map) {
          currentMapType = map;
          trackData.info.map_name = map; // 更新地图名称
      }

      //log.info(`地图类型: ${currentMapType}`);

      if (lastposition && Opt.distance({x: position.X, y: position.Y}, lastposition) < 1) {
        if(testMode) log.debug("位置未变化，跳过");
        return;
      }
      if (lastposition && Opt.distance({x: position.X, y: position.Y}, lastposition) > 100) {
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
      lastposition = { x: position.X, y: position.Y };
    }
    catch (error) {
      log.error(`记录位置时发生错误: ${error}`);
      return;
    }
  } else {
    if(isInOUI()){
      await genshin.returnMainUi();
      const { position } = await getPlayerPosition(lastposition,currentMapType);
      if (position) {
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
      log.info("已生成地图追踪，脚本结束");
      continueRecording = false;
    }
    if(isInStoryUI())
    {
      await handleStoryInterface();
      continueRecording = false;
    }
  }
  return;
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

  needStoryTip = true;
  
}

// 主逻辑
async function main() {

  if (runMode === "运行模式") {
    const filePath = `Pathing/${questLocation}/${questName}-${trackNumber}.json`;
    log.info(`正在运行地图追踪任务文件: ${filePath}`);
    await pathingScript.runFile(filePath);
    return;
  }

  log.info("地图追踪录制开始");

  log.info("启用自动拾取");
  dispatcher.AddTrigger(new RealtimeTimer("AutoPick"));

  await genshin.returnMainUi();
  
  log.info(`起始点类型: ${startType}`);
  log.info(`设置地图类型: ${mapType}`);

  const initialPointType = startType === "传送点" ? "teleport" : "path";
  if (isInMainUI()) {
    const { position, map } = await getPlayerPosition();
    if (position) {
        lastposition = { x: position.X, y: position.Y };
        if (map) {
            currentMapType = map;
            trackData.info.map_name = map;
        }
        if(testMode) log.debug(`从小地图获取坐标: X=${position.X}, Y=${position.Y}`);

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
        log.error("无法获取初始位置，脚本终止。");
        return;
    }
  } else {
    log.info("不在主界面，请返回主界面后重新启动脚本");
    return;
  }
  await sleep(200);
  while (continueRecording) {
    await recordPosition();
    await sleep(200); // 每0.2秒录制一次
  }
  await Opt.processTrackData(trackData, MOVE_STATE, MOVE_MODES); // 处理收集到的路径数据
  await saveTrackData();

  if (needStoryTip) {
    storyTipWinId = htmlMask.show("assets/story-tip.html", "story-tip");
    htmlMask.setClickThrough(storyTipWinId, false);
    log.info("已弹出剧情自动保存提示");

    while (htmlMask.exists(storyTipWinId)) {
      const msg = await htmlMask.receive(storyTipWinId, 1000);
      if (!msg) {
        continue;
      }
      try {
        const data = JSON.parse(msg);
        if (data.url === "/story-tip/close") {
          break;
        }
      } catch (e) {
        log.warn("收到无效消息:" + msg);
      }
    }

    htmlMask.close(storyTipWinId);
  }

  log.info("地图追踪录制结束");

}

main();