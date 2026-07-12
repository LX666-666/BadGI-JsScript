const ALL_MAP_TYPES = [
  "Teyvat",
  "TheChasm",
  "Enkanomiya",
  "SeaOfBygoneEras",
  "AncientSacredMountain",
  "TempleOfSpace"
];

async function findCorrectMapType() {
    for (const map of ALL_MAP_TYPES) {
        try {
            const pos = await genshin.getPositionFromMap(map);
            log.info('在地图 {map} 上获取坐标: {pos.X}, {pos.Y}',map,pos.X,pos.Y);
            if (pos && pos.X !== 0 && pos.Y !== 0) {
                log.info(`自动检测到当前地图为: ${map}`);
                return map;
            }
        } catch (e) {
            log.warn(`在地图 ${map} 上获取坐标失败: ${e}`);
            // 忽略错误，继续尝试下一个
        }
    }
    log.warn("无法在任何已知地图中获取到有效坐标。");
    return null;
}

export async function getPlayerPosition(lastPosition,cachedMapType) {
    if (lastPosition) {
        //log.info(`使用上次的位置进行局部匹配: ${lastPosition.x}, ${lastPosition.y}`);
        // 优先使用缓存的地图类型进行局部匹配
        if (cachedMapType) {
            try {
                const pos = await genshin.getPositionFromMap(cachedMapType, lastPosition.x, lastPosition.y);
                if (pos && pos.X !== 0 && pos.Y !== 0) {
                    return { position: pos, map: cachedMapType };
                }
            } catch (e) {
                log.warn(`在地图 ${cachedMapType} 上进行局部匹配失败，将重新检测地图。`);
                cachedMapType = null; // 局部匹配失败，清空缓存
            }
        }
    }

    // 如果没有缓存的地图或局部匹配失败，则重新检测
    if (!cachedMapType) {
        cachedMapType = await findCorrectMapType();
    }

    if (cachedMapType) {
        try {
            const pos = await genshin.getPositionFromMap(cachedMapType);
            return { position: pos, map: cachedMapType };
        } catch (e) {
            log.error(`在地图 ${cachedMapType} 上获取坐标失败: ${e}`);
            cachedMapType = null; // 获取失败，清空缓存
            return { position: null, map: null };
        }
    } else {
        // 如果所有地图都失败了，最后尝试一次默认调用
        try {
            const pos = await genshin.getPositionFromMap();
            return { position: pos, map: 'Teyvat' }; // 假设默认是提瓦特
        } catch (e) {
            log.error(`默认获取坐标失败: ${e}`);
            return { position: null, map: null };
        }
    }
}