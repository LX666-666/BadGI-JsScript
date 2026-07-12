//版本：1.1
//编译日期：2026-07-12

// 计算两点之间的距离
export function distance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

// 计算点到线段的距离
function pointLineDistance(point, start, end) {
    if (start.x === end.x && start.y === end.y) {
        return distance(point, start);
    } else {
        const n = Math.abs(
            (end.x - start.x) * (start.y - point.y) -
            (start.x - point.x) * (end.y - start.y)
        );
        const d = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );
        return n / d;
    }
}

// RDP算法实现 - 简化路径点
function rdp(points, epsilon) {
    if (points.length <= 2) {
        return points;
    }

    let dmax = 0;
    let index = 0;

    for (let i = 1; i < points.length - 1; i++) {
        const d = pointLineDistance(points[i], points[0], points[points.length - 1]);
        if (d > dmax) {
            index = i;
            dmax = d;
        }
    }

    if (dmax >= epsilon) {
        const firstPart = rdp(points.slice(0, index + 1), epsilon);
        const secondPart = rdp(points.slice(index), epsilon);
        return [...firstPart.slice(0, -1), ...secondPart];
    } else {
        return [points[0], points[points.length - 1]];
    }
}

// 处理收集到的路径数据
export async function processTrackData(trackData, MOVE_STATE, MOVE_MODES) {
    log.info("开始处理路径数据...");
    
    // 0. 先扩展攀爬段前后缓冲，避免提前结束攀爬导致卡死
    extendClimbSegments(trackData, MOVE_STATE, MOVE_MODES);
    
    // 1. 优化点，保留关键点（飞/游起止点；攀爬仅保留起止点，强制保留 optimize=false 的点）
    optimizePathPoints(trackData, MOVE_STATE);
    
    // 2. 再分配移动模式与动作（飞/攀/游/正常）
    processMoveModes(trackData, MOVE_STATE, MOVE_MODES);
  
    // 3. 清理临时状态属性
    for (const pos of trackData.positions) {
      delete pos.state;
      delete pos.timestamp;
      delete pos.__climb_points_count;
    }
    
    log.info("路径数据处理完成");
}

// 扩展攀爬段前后缓冲距离，并把扩展点标记为不可优化
function extendClimbSegments(trackData, MOVE_STATE, MOVE_MODES) {
    const positions = trackData.positions;
    if (!positions || positions.length === 0) return;

    const CLIMB_EXTENSION = 20; // 前后各扩展20单位

    let i = 0;
    while (i < positions.length) {
        if (positions[i].state !== MOVE_STATE.CLIMB) {
            i++;
            continue;
        }

        // 找到连续攀爬段
        let climbStart = i;
        let climbEnd = i;
        while (climbEnd + 1 < positions.length && positions[climbEnd + 1].state === MOVE_STATE.CLIMB) {
            climbEnd++;
        }

        // 向后扩展：把攀爬结束后20单位内的连续点标记为CLIMB并不可优化
        let extensionIndex = climbEnd + 1;
        let extensionDist = 0;
        while (extensionIndex < positions.length) {
            extensionDist += distance(positions[extensionIndex - 1], positions[extensionIndex]);
            if (extensionDist <= CLIMB_EXTENSION) {
                positions[extensionIndex].state = MOVE_STATE.CLIMB;
                positions[extensionIndex].optimize = false;
                extensionIndex++;
            } else {
                break;
            }
        }

        // 向前扩展：把攀爬起点前20单位内的连续点改为walk并不可优化
        let backIndex = climbStart - 1;
        let backDist = 0;
        while (backIndex >= 0) {
            backDist += distance(positions[backIndex], positions[backIndex + 1]);
            if (backDist <= CLIMB_EXTENSION) {
                positions[backIndex].move_mode = MOVE_MODES.WALK;
                positions[backIndex].optimize = false;
                backIndex--;
            } else {
                break;
            }
        }

        i = climbEnd + 1;
    }
}
  
// 处理移动模式
function processMoveModes(trackData, MOVE_STATE, MOVE_MODES) {
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
  
      // 攀爬段：从 CLIMB 开始，直到非 CLIMB 结束；<10s 设 jump，否则设 climb，并回溯20单位将 dash 改为 walk
      if (currentState === MOVE_STATE.CLIMB) {
        let end = i;
        while (end + 1 < positions.length && positions[end + 1].state === MOVE_STATE.CLIMB) end++;
        const climbStart = i;
        const climbEnd = end;
  
        const climbDurationSeconds = (positions[climbEnd].timestamp - positions[climbStart].timestamp) / 1000;
        const climbMode = climbDurationSeconds < 10 ? MOVE_MODES.JUMP : MOVE_MODES.CLIMB;
        for (let k = climbStart; k <= climbEnd; k++) positions[k].move_mode = climbMode;
  
        // 回溯 20 单位，将 dash 改为 swim（仅当为长攀爬时,因为游泳全程不冲刺）
        if (climbMode === MOVE_MODES.CLIMB) {
          let backDistAccum = 0;
          for (let j = climbStart - 1; j >= 0; j--) {
            const segDist = distance(
              { x: positions[j + 1].x, y: positions[j + 1].y },
              { x: positions[j].x, y: positions[j].y }
            );
            backDistAccum += segDist;
            if (backDistAccum >= 20) break;
            if (positions[j].move_mode === MOVE_MODES.DASH) {
              positions[j].move_mode = MOVE_MODES.SWIM;
            }
          }
        }
  
        i = climbEnd + 1;
        continue;
      }
  
      i++;
    }
  
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
function optimizePathPoints(trackData, MOVE_STATE) {
    log.info("优化路径点...");
    
    if (trackData.positions.length > 2) {
      const originalPoints = trackData.positions.map((p, index) => ({
        index: index,
        x: p.x,
        y: p.y,
        state: p.state
      }));
      const epsilon = 1.0; 
      
      const pointsForRdp = originalPoints.map(p => ({ x: p.x, y: p.y }));
      const simplifiedPoints = rdp(pointsForRdp, epsilon);
      
      log.info(`路径点优化: 从${originalPoints.length}个点简化为${simplifiedPoints.length}个点`);
      
      let keptIndices = simplifiedPoints.map(sp => {
        return originalPoints.findIndex(op => op.x === sp.x && op.y === sp.y);
      }).filter(idx => idx !== -1);
  
      const segments = [];
      let segStart = 0;
      for (let i = 1; i < originalPoints.length; i++) {
        if (originalPoints[i].state !== originalPoints[i - 1].state) {
          segments.push({ state: originalPoints[segStart].state, start: segStart, end: i - 1 });
          segStart = i;
        }
      }
      segments.push({ state: originalPoints[segStart].state, start: segStart, end: originalPoints.length - 1 });
  
      if (!keptIndices.includes(0)) keptIndices.push(0);
      if (!keptIndices.includes(originalPoints.length - 1)) keptIndices.push(originalPoints.length - 1);
  
      for (const seg of segments) {
        if (seg.state === MOVE_STATE.FLY || seg.state === MOVE_STATE.SWIM) {
          if (!keptIndices.includes(seg.start)) keptIndices.push(seg.start);
          if (!keptIndices.includes(seg.end)) keptIndices.push(seg.end);
        } else if (seg.state === MOVE_STATE.CLIMB) {
          if (!keptIndices.includes(seg.start)) keptIndices.push(seg.start);
          if (!keptIndices.includes(seg.end)) keptIndices.push(seg.end);
          keptIndices = keptIndices.filter(idx => !(idx > seg.start && idx < seg.end));
          trackData.positions[seg.start].__climb_points_count = seg.end - seg.start + 1;
        }
      }
  
      // 强制保留被标记为不可优化的点（剧情点、攀爬扩展缓冲点）
      for (let idx = 0; idx < trackData.positions.length; idx++) {
        if (trackData.positions[idx].optimize === false && !keptIndices.includes(idx)) {
          keptIndices.push(idx);
        }
      }

      keptIndices = Array.from(new Set(keptIndices)).sort((a, b) => a - b);
      
      const newPositions = keptIndices.map(idx => {
        return { ...trackData.positions[idx] };
      });
      
      newPositions.forEach((pos, idx) => {
        pos.id = idx + 1;
      });
      
      trackData.positions = newPositions;
    }
}