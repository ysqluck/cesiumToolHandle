这个是一些CesiumJS库相关的函数集合，它主要用于处理地理信息可视化操作，如捕获输入，转换坐标系，及创建和绘制图形等。下面将会为每个函数提供一个简单的描述:

1. `initMouse(viewer)`: 初始化鼠标动作，在 viewer （Cesium 视图容器）中设定鼠标左键、中键、右键和滚轮的功能。

2. `getModelHeight(viewer, lng, lat)`: 根据经纬度信息获取模型地理高度。

3. `getRad(d)`: 一个辅助函数，用于将度数转换为弧度。

4. `getDistance(lng1, lat1, lng2, lat2)`: 计算两个地点之间的距离（根据经纬度计算）。

5. `windowPositionToWGS84(viewer, windowPosition)`: 将屏幕坐标转换为 WGS84地理坐标。

6. `Cartesian3ToWGS84(Cartesian3Point)`: 将Cesium库中的Cartesian3坐标转换为WGS84地理坐标。

7. `WGS84ToCartesian3(viewer, WGS84Pos)`: 将WGS84地理坐标转换为Cesium库中的Cartesian3坐标。

8. `dashLine(color)`: 创建一个虚线材质。

9. `getColor(option)`:根据提供的选项参数获取颜色。

10. `changeShowWhichPointLabel(newId)`: 动态展示特定点的标签。

11. `resolveShape(type, option, entityPositionArr)`: 根据给定的参数，生成不同类型的geometries。

12. `drawShape(viewer, type, entityPositionArr, option = {})`: 根据提供的选项在viewer上绘图。

13. `convertPickToCartesian3(viewer, pickPoint)`: 将屏幕坐标点转换为 Cartesian3 坐标。

14. `removeMouseAction(handler)`: 移除鼠标事件处理程序中的所有输入动作。

15. `dynamicDrawShape(viewer, type, payload, fn)`: 在 viewer 中根据鼠标动作动态绘制形状。

16. `drawWall(viewer, wallList, option)`: 根据提供的wallList和其他选项在viewer中绘制一个墙壁。
