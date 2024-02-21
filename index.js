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
    console.log(s)
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
function getColor(option) {
    if (option && option.color &&
        typeof option.color.r === 'number' &&
        typeof option.color.g === 'number' &&
        typeof option.color.b === 'number' &&
        typeof option.color.a === 'number') {
        return Cesium.Color.fromBytes(option.color.r, option.color.g, option.color.b, option.color.a);
    }
    else {
        return Cesium.Color.BLACK;
    }
}
// 点标签的动态展示
let showWhichPointId = ""
const changeShowWhichPointLabel = (newId) => {
    showWhichPointId = newId
}
/*
@params
entityPositionArr：c3ArrLIst
*/
function resolveShape(type, option, entityPositionArr) {
    if (typeof type !== 'string') {
        throw new Error(`Invalid type: type should be a string, but received ${typeof type}`);
    }

    if (Object.prototype.toString.call(option) !== '[object Object]') {
        throw new Error(`Invalid option: option should be an object, but received ${typeof option}`);
    }

    if (!Array.isArray(entityPositionArr)) {
        throw new Error('Invalid entityPositionArr: entityPositionArr should be an array');
    }
    const color = getColor(option);
    switch (type.toLowerCase()) {
        case 'point':
            return {
                name: `point`,
                position: entityPositionArr[0],
                point: {
                    color: color,
                    pixelSize: option.pixelSize ?? 10,
                    outlineColor: option && option.outLineColor ? Cesium.Color.fromBytes(option.outLineColor.r, option.outLineColor.g, option.outLineColor.b, option.outLineColor.a) : Cesium.Color.YELLOW,
                    outlineWidth: option.outLineWidth ?? 5,
                    ...option.pointOption,
                },
                label: {
                    // 是否显示
                    show: new Cesium.CallbackProperty(() => {
                        if (option.isLabelShow) {
                            return true
                        } else if (showWhichPointId === option.entityID) {
                            return true
                        } else {
                            return false
                        }
                    }),
                    ...option.labelOption,
                }
            }
        case 'line':
            return {
                name: "polyline",
                entityType: "polyline",
                polyline: {
                    positions: new Cesium.CallbackProperty(() => entityPositionArr, false),
                    clampToGround: option.ClampToGround ?? false,
                    width: option.width ?? 10,
                    material: color,
                    ...option.polylineOption
                }
            };
        case 'poly':
            return {
                name: "polygon",
                entityType: "polygon",
                polygon: {
                    hierarchy: new Cesium.CallbackProperty(() => new Cesium.PolygonHierarchy(entityPositionArr), false),
                    outline: option.outline ?? false,
                    outlineColor: option && option.outLineColor ? Cesium.Color.fromBytes(option.outLineColor.r, option.outLineColor.g, option.outLineColor.b, option.outLineColor.a) : Cesium.Color.YELLOW,
                    perPositionHeight: option.perPositionHeight ?? false,
                    material: new Cesium.ColorMaterialProperty(
                        option.color ? Cesium.Color.fromBytes(option.color.r, option.color.g, option.color.b, option.color.a) :
                            Cesium.Color.WHITE
                    ),
                    ...option.polyOption
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
                    material: dashLine(option.color),
                    ...option.dashedOption
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
                    material: color,
                    ...option.circleOption
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
                    ),
                    ...option.boxOption
                }
            };
        default:
            throw new Error(`Invalid shape type: ${type}`);
    }
}

const drawShape = (viewer, type, entityPositionArr, option = {}) => {
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
const convertPickToCartesian3 = (viewer, pickPoint) => {
    let item = Cartesian3ToWGS84(pickPoint);
    return WGS84ToCartesian3(viewer, item.lng, item.lat, item.alt);
};
function removeMouseAction(handler) {
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.MIDDLE_CLICK);
    handler = null
}
// dynamicDrawShape
let pointsCollectionList = []
const dynamicDrawShape = (viewer, type, payload, fn) => {
    viewer._container.style.cursor = "crosshair";
    let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    let entityPositionArr = [];
    let shape = drawShape(viewer, type, entityPositionArr, payload);

    handler.setInputAction((event) => {
        let pick = viewer.scene.pickPosition(event.position);
        if (!Cesium.defined(pick)) {
            const ray = viewer.camera.getPickRay(event.position);
            pick = viewer.scene.globe.pick(ray, viewer.scene);
        }
        // if (Cesium.defined(pick)) {
        if (!pointsCollectionList.length) {
            entityPositionArr.push(pick)
            pointsCollectionList.push(Cartesian3ToWGS84(pick))
        } else {
            let nearestDistance, idx
            for (let i in pointsCollectionList) {
                let distance = (getDistance(pointsCollectionList[i][0], pointsCollectionList[i][1],
                    Cartesian3ToWGS84(pick)[0], Cartesian3ToWGS84(pick)[1]
                ))
                if (distance < 0.5) {
                    if (!nearestDistance) {
                        nearestDistance = distance
                        idx = i
                    } else {
                        if (distance < nearestDistance) {
                            nearestDistance = distance
                            idx = i
                        }
                    }
                }
            }
            if (!nearestDistance) {
                entityPositionArr.push(pick)
                pointsCollectionList.push(Cartesian3ToWGS84(pick))
            } else {
                entityPositionArr.pop()
                pick = WGS84ToCartesian3(
                    viewer,
                    pointsCollectionList[idx]
                )
                console.log(pick)
                entityPositionArr.push(pick)
                entityPositionArr.push(pick)
            }

        }

        // }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction((event) => {
        let pick = viewer.scene.pickPosition(event.endPosition);
        if (!Cesium.defined(pick)) {
            const ray = viewer.camera.getPickRay(event.endPosition);
            pick = viewer.scene.globe.pick(ray, viewer.scene);
        }

        if (pick && entityPositionArr.length === 1) {
            entityPositionArr.push(pick);
        }
        entityPositionArr[entityPositionArr.length - 1] = pick;
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction((event) => {
        entityPositionArr.pop();
        removeMouseAction(handler);
        viewer._container.style.cursor = "default";
        if (fn) {
            let locations;
            if (type === 'line') {
                locations = [...shape.polyline.positions.getValue(new Date())];
                shape.locations = locations.map(item => Cartesian3ToWGS84(item));
            } else if (type === 'poly') {
                const hierarchyValue = shape.polygon.hierarchy.getValue(new Date());
                locations = hierarchyValue.positions ? [...hierarchyValue.positions] : [];
                shape.locations = locations.map(item => Cartesian3ToWGS84(item));
            }
            fn(shape);
        }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    return { shape, handler };
};
function drawWall(viewer, wallList, option) {
    if (!option.entityID) {
        option.entityID = option.ID || randomString(6)
    }
    if (option.entityID && viewer.entities.getById(option.entityID)) {
        viewer.entities.removeById(option.entityID)
    }
    const img = new Image().scr = './dynamicWall.png';
    wallList.push(wallList[0]);
    let wallPosList = JSON.parse(JSON.stringify(wallList))
    wallPosList.map(item => {
        item[2] = option.wallHeight || 60
        return item
    })
    //动态墙材质
    function DynamicWallMaterialProperty(options) {
        // 默认参数设置
        this._definitionChanged = new Cesium.Event();
        this._color = undefined;
        this._colorSubscription = undefined;
        this.color = options.color;
        this.duration = options.duration;
        this.trailImage = options.trailImage;
        this._time = new Date().getTime();
    }
    Object.defineProperties(DynamicWallMaterialProperty.prototype, {
        isConstant: {
            get: function () {
                return false;
            },
        },
        definitionChanged: {
            get: function () {
                return this._definitionChanged;
            },
        },
        color: Cesium.createPropertyDescriptor("color"),
    });
    DynamicWallMaterialProperty.prototype.getType = function (time) {
        return "DynamicWall";
    };
    DynamicWallMaterialProperty.prototype.getValue = function (
        time,
        result
    ) {
        if (!Cesium.defined(result)) {
            result = {};
        }
        result.color = Cesium.Property.getValueOrClonedDefault(
            this._color,
            time,
            Cesium.Color.WHITE,
            result.color
        );
        if (this.trailImage) {
            result.image = this.trailImage;
        } else {
            result.image = Cesium.Material.DynamicWallImage;
        }

        if (this.duration) {
            result.time =
                ((new Date().getTime() - this._time) % this.duration) /
                this.duration;
        }
        viewer.scene.requestRender();
        return result;
    };
    DynamicWallMaterialProperty.prototype.equals = function (other) {
        return (
            this === other ||
            (other instanceof DynamicWallMaterialProperty &&
                Cesium.Property.equals(this._color, other._color))
        );
    };
    Cesium.DynamicWallMaterialProperty = DynamicWallMaterialProperty;
    Cesium.Material.DynamicWallType = "DynamicWall";
    Cesium.Material.DynamicWallImage = img;
    Cesium.Material.DynamicWallSource =
        "czm_material czm_getMaterial(czm_materialInput materialInput)\n\
                                                {\n\
                                                czm_material material = czm_getDefaultMaterial(materialInput);\n\
                                                vec2 st = materialInput.st;\n\
                                                vec4 colorImage = texture2D(image, vec2(fract(st.t - time), st.t));\n\
                                                vec4 fragColor;\n\
                                                fragColor.rgb = color.rgb / 1.0;\n\
                                                fragColor = czm_gammaCorrect(fragColor);\n\
                                                material.alpha = colorImage.a * color.a;\n\
                                                material.diffuse = color.rgb;\n\
                                                material.emission = fragColor.rgb;\n\
                                                return material;\n\
                                                }";
    Cesium.Material._materialCache.addMaterial(
        Cesium.Material.DynamicWallType,
        {
            fabric: {
                type: Cesium.Material.DynamicWallType,
                uniforms: {
                    color: new Cesium.Color(1.0, 1.0, 1.0, 1),
                    image: Cesium.Material.DynamicWallImage,
                    time: 0,
                },
                source: Cesium.Material.DynamicWallSource,
            },
            translucent: function (material) {
                return true;
            },
        }
    );
    // 绘制墙体
    let wall = viewer.entities.add({
        id: option.entityID,
        wall: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights(
                wallPosList.flat()
            ),
            // 设置高度
            material: new Cesium.DynamicWallMaterialProperty({
                color: Cesium.Color.fromBytes(10, 186, 181).withAlpha(0.35),
                duration: 1900,
            }),
        },
    });
    return wall
}

