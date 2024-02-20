## cesium常用方法封装
### 方法 initMouse：该方法修改了cesium的控制方式将左键设置为拖动相机，滚轮控制相机的前进后退，邮件控制相机的视角
### 方法 getModelHeight 根据经纬度获取高程 （如果坐标点位置无3dTileset则有可能获取失败，获取失败返回结果为[lng,lat,-1]）
### 方法 getDistance 获取两组经纬度的距离 单位：米
### 方法 windowPositionToWGS84 将屏幕坐标转换为WGS84坐标
### 方法 Cartesian3ToWGS84 将笛卡尔3坐标转换为WGS84坐标
### 方法 WGS84ToCartesian3 将WGS84坐标转换为笛卡尔3坐标
### 方法 drawShape
    1. 支持的图源有：line(线)，poly(多边形)，dashed(虚线)，circle(园)
    2. 颜色控制：color:{r:0~255,g:0~255,b:0~255,a:0~255}