/*
* 点
*/

var Point = (function () {
    var Point = Class();
    var p = Point.prototype;

     p.ctor = function(x,y) {
        (x===void 0)&& (x=0);
        (y===void 0)&& (y=0);
        
        this.x = x;
        this.y = y;
    }

    /**
     * 将 <code>Point</code> 的成员设置为指定值。
     * @param	x 水平坐标。
     * @param	y 垂直坐标。
     * @return 当前 Point 对象。
     */
    p.setTo = function(x,y){
        this.x = x;
        this.y = y;
        return this;
    }

    /**返回包含 x 和 y 坐标的值的字符串。*/
	p.toString=function(){
		return this.x+","+this.y;
	}

     /**
     * 计算当前点和目标点(x，y)的距离。
     * @param	x 水平坐标。
     * @param	y 垂直坐标。
     * @return	返回当前点和目标点之间的距离。
     */
    p.distance = function(x,y){
        var deltaX = x - this.x;
        var deltaY = y - this.y;
        var dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        return dist;
    }

    return Point;
})();