// 定义识别对象
const paimonMenuRo = RecognitionObject.TemplateMatch(
  file.ReadImageMatSync("assets/RecognitionObject/paimon_menu.png"),
  0,
  0,
  genshin.width / 3.0,
  genshin.width / 5.0
);

export function Add(a, b) {  
    log.info(`Add函数被调用`)
    return a + b;  
}  

const StoryRo = RecognitionObject.TemplateMatch(
  file.ReadImageMatSync("assets/RecognitionObject/disabled_ui.png"),
  265, 37, 60, 22
);

const ORo = RecognitionObject.TemplateMatch(
  file.ReadImageMatSync("assets/RecognitionObject/O.png"),
  57, 30, 41, 33
);

// 判断是否在主界面的函数
export function isInMainUI(){
  let captureRegion = captureGameRegion();
  let res = captureRegion.Find(paimonMenuRo);
  return !res.isEmpty();
};

// 判断是否在O界面的函数
export function isInOUI(){
  let captureRegion = captureGameRegion();
  let res = captureRegion.Find(ORo);
  return !res.isEmpty();
};

// 判断是否在Story界面的函数
export function isInStoryUI(){
  let captureRegion = captureGameRegion();
  let res = captureRegion.Find(StoryRo);
  return !res.isEmpty();
};

// 识别图像函数
async function recognizeImage(recognitionObject) {
  try {
    // 尝试识别图像
    let imageResult = captureGameRegion().find(recognitionObject);
    if (imageResult && imageResult.x !== 0 && imageResult.y !== 0 && imageResult.width !== 0 && imageResult.height !== 0) {
      return { success: true, x: imageResult.x, y: imageResult.y };
    }
  } catch (error) {
    log.error(`识别图像时发生异常: ${error.message}`);
  }
  return { success: false };
}

// 定义移动状态常量
export const MOVE_STATE = {
  NORMAL: "normal",
  FLY: "fly",
  CLIMB: "climb",
  SWIM: "swim",
  UNKNOWN: "unknown"
};

// 定义识别对象 - 用于检测运动状态
const SpaceRo = RecognitionObject.TemplateMatch(file.ReadImageMatSync("assets/RecognitionObject/Space.png"), 1683, 1027, 64, 25);
const SwimRo = RecognitionObject.TemplateMatch(file.ReadImageMatSync("assets/RecognitionObject/Swim.png"), 1811, 1027, 17, 23);
const ClimbRo = RecognitionObject.TemplateMatch(file.ReadImageMatSync("assets/RecognitionObject/Climb.png"), 1596, 1027, 29, 24);

// 检测运动状态
export async function checkAbnormalState() {
  const spaceResult = await recognizeImage(SpaceRo);
  const swimResult = await recognizeImage(SwimRo);
  const climbResult = await recognizeImage(ClimbRo);

  if (isInMainUI()) {
    if (swimResult.success) {
      //log.info("检测到游泳状态");
      return MOVE_STATE.SWIM;
    } else if (climbResult.success) {
      //log.info("检测到攀爬状态");
      return MOVE_STATE.CLIMB;
    } else if (spaceResult.success) {
      //log.info("检测到飞行状态");
      return MOVE_STATE.FLY;
    } else {
      //log.info("检测到正常状态");
      return MOVE_STATE.NORMAL;
    }
  }
  log.debug("检测状态失败");
  return MOVE_STATE.UNKNOWN;
}