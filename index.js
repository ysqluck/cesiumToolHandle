// 初始化鼠标默认操作 左键拖动相机 滚轮缩放 右键控制视角
function initMouse(viewer) {
    if (viewer) {
        //设置中键放大缩小
        viewer.scene.screenSpaceCameraController.zoomEventTypes = [
            Cesium.CameraEventType.WHEEL,
            Cesium.CameraEventType.MIDDLE_DRAG,
            Cesium.CameraEventType.PINCH,
        ];
        //设置右键旋转
        viewer.scene.screenSpaceCameraController.tiltEventTypes = [
            Cesium.CameraEventType.RIGHT_DRAG,
            Cesium.CameraEventType.PINCH,

            {
                eventType: Cesium.CameraEventType.RIGHT_DRAG,
                modifier: Cesium.KeyboardEventModifier.CTRL,
            },

            {
                eventType: Cesium.CameraEventType.MIDDLE_DRAG,
                modifier: Cesium.KeyboardEventModifier.CTRL,
            },
        ];
    } else {
        console.error("该函数需要传入viewer对象")
    }
}

/*
@params
viewer:cesium初始化类
lng:wgs84lng,
lat:wgs84lat
*/
// 根据经纬度获取模型高程
function getModelHeight(viewer, lng, lat) {
    let location = []
    let positionCartesian = Cesium.Cartesian3.fromDegrees(lng, lat);
    let ray = new Cesium.Ray(positionCartesian, Cesium.Cartesian3.negate(Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3()));
    let intersection = viewer.scene.pickFromRay(ray);
    if (Cesium.defined(intersection)) {
        location = [lng, lat, intersection.position.height]
    } else {
        location = [lng, lat, -1]
    }
    return location
}
// 计算两地经纬度的差
/*参数：两地的经纬度数值*/
function getRad(d) {
    return d * Math.PI / 180.0;
}
function getDistance(lng1, lat1, lng2, lat2) {
    const EARTH_RADIUS = 6378137.0;    //单位M
    let radLat1 = getRad(lat1);
    let radLat2 = getRad(lat2);
    let a = radLat1 - radLat2;
    let b = getRad(lng1) - getRad(lng2);
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
        Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * EARTH_RADIUS;// EARTH_RADIUS;
    s = Math.round(s * 10000) / 10000; //输出为米
    s = s.toFixed(0);
    return s;
}

// 屏幕坐标转换WGS84坐标
function windowPositionToWGS84(viewer, windowPosition) {
    viewer.scene.pickTranslucentDepth = true
    let cartesian = viewer.scene.pickPosition(windowPosition);
    if (Cesium.defined(cartesian)) {
        let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        let lng = Cesium.Math.toDegrees(cartographic.longitude);
        let lat = Cesium.Math.toDegrees(cartographic.latitude);
        let alt = cartographic.height;
        return [lng, lat, alt]
    }
}

// C3坐标转换为经纬度
function Cartesian3ToWGS84(Cartesian3Point) {
    let cartesian3 = new Cesium.Cartesian3(Cartesian3Point.x, Cartesian3Point.y, Cartesian3Point.z);
    let cartographic = Cesium.Cartographic.fromCartesian(cartesian3);
    let lat = Cesium.Math.toDegrees(cartographic.latitude);
    let lng = Cesium.Math.toDegrees(cartographic.longitude);
    let alt = cartographic.height;
    return [lng, lat, alt]
}

// 将WGS84坐标转换为C3坐标
function WGS84ToCartesian3(viewer, WGS84Pos) {
    let WGS84PosObj = WGS84Pos
    let ellipsoid = viewer.scene.globe.ellipsoid;
    if (Object.prototype.toString.call(WGS84Pos) === "[object Array]") {
        WGS84PosObj = { lng: WGS84Pos[0], lat: WGS84Pos[1], alt: WGS84Pos[2] }
    }
    let cartographic = Cesium.Cartographic.fromDegrees(WGS84PosObj.lng, WGS84PosObj.lat, WGS84PosObj.alt);
    let cartesian3 = ellipsoid.cartographicToCartesian(cartographic);
    return cartesian3;
}
// 虚线材质
function dashLine(color) {
    console.log(color, '=====')
    return new Cesium.PolylineDashMaterialProperty({
        color: color ?
            Cesium.Color.fromBytes(color.r, color.g, color.b, color.a) :
            Cesium.Color.WHITE,
        dashLength: 10 //短划线长度
    })
}
// 绘制图元
/*
@params
entityPositionArr：c3ArrLIst
*/
function resolveShape(type, option, entityPositionArr) {
    switch (type.toLowerCase()) {
        case 'line':
            return {
                name: "polyline",
                entityType: "polyline",
                polyline: {
                    positions: new Cesium.CallbackProperty(() => entityPositionArr, false),
                    clampToGround: option.ClampToGround ?? true,
                    width: option.width ?? 10,
                    material: option.color ? Cesium.Color.fromBytes(color.r, color.g, color.b, color.a) : Cesium.Color.YELLOW,
                }
            };
        case 'poly':
            return {
                name: "polygon",
                entityType: "polygon",
                polygon: {
                    hierarchy: new Cesium.CallbackProperty(() => new Cesium.PolygonHierarchy(entityPositionArr), false),
                    outline: option.outline ?? true,
                    outlineColor: Cesium.Color.GRAY,
                    perPositionHeight: option.perPositionHeight ?? true,
                    material: new Cesium.ColorMaterialProperty(
                        option.color ? Cesium.Color.fromBytes(option.color.r, option.color.g, option.color.b, option.color.a) :
                            Cesium.Color.WHITE
                    ),
                }
            };
        case 'dashed':
            return {
                name: "polyline",
                entityType: "polyline",
                polyline: {
                    positions: new Cesium.CallbackProperty(() => entityPositionArr, false),
                    clampToGround: option.isClampToGround ?? true,
                    width: option.width ?? 10,
                    material: dashLine(option.color)
                }
            };
        case 'circle':
            return {
                name: "circle",
                entityType: "circle",
                position: entityPositionArr[0],
                ellipse: {
                    semiMinorAxis: option.r ?? 1,
                    semiMajorAxis: option.r ?? 1,
                    material: option.color ?
                        Cesium.Color.fromBytes(option.color.r, option.color.g, option.color.b, option.color.a) :
                        Cesium.Color.WHITE,
                }
            };
        case 'box':
            return {
                name: `box`,
                position: entityPositionArr[0],
                box: {
                    dimensions: new Cesium.Cartesian3(option.scale ?? 1, option.scale ?? 1, option.scale ?? 1),
                    material: new Cesium.ColorMaterialProperty(
                        option.color ?
                            Cesium.Color.fromBytes(option.color.r, option.color.g, option.color.b, option.color.a) :
                            Cesium.Color.WHITE
                    )
                }
            };
        default:
            throw new Error(`Invalid shape type: ${type}`);
    }
}

const drawShape = (viewer, type, entityPositionArr, option = {}) => {
    option.entityID = option.entityID || option.ID;
    if (viewer.entities.getById(option.entityID)) {
        viewer.entities.removeById(option.entityID);
    }

    const entityData = resolveShape(type, option, entityPositionArr);
    const shape = viewer.entities.add({
        ...entityData,
        id: option.entityID
    });

    // If there are extra options, add them to the shape.
    Object.entries(option)
        .filter(([key]) => key !== 'id')
        .forEach(([key, value]) => shape[key] = value);

    return shape;
}