/*
* 矩形
*/
var Rectangle = (function () {
    function Rectangle(x,y,w,h) {
        (x===void 0)&& (x=0);
        (y===void 0)&& (y=0);
        (w===void 0)&& (w=0);
        (h===void 0)&& (h=0);

        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.right = x + w;
        this.bottom = y + h;
    }

    var p = Rectangle.prototype;

    /**
     * 将 Rectangle 的属性设置为指定值。
     * @param	x	x 矩形左上角的 X 轴坐标。
     * @param	y	x 矩形左上角的 Y 轴坐标。
     * @param	width	矩形的宽度。
     * @param	height	矩形的高。
     * @return	返回属性值修改后的矩形对象本身。
     */
    p.setTo = function(x,y,w,h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.right = x + w;
        this.bottom = y + h;
        return this;
    }

    /**
     * 复制 source 对象的属性值到此矩形对象中。
     * @param	sourceRect	源 Rectangle 对象。
     * @return	返回属性值修改后的矩形对象本身。
     */
    p.copyFrom = function(source) {
        this.x = source.x;
        this.y = source.y;
        this.width = source.width;
        this.height = source.height;
        this.right = this.x + this.width;
        this.bottom = this.y + this.height;
        return this;
    }

    /**
     * 确定由此 Rectangle 对象定义的矩形区域内是否包含指定的点。
     * @param x	点的 X 轴坐标值（水平位置）。
     * @param y	点的 Y 轴坐标值（垂直位置）。
     * @return	如果 Rectangle 对象包含指定的点，则值为 true；否则为 false。
     */
    p.contains = function(x,y) {
        if(x>=this.x && x <= this.right && y>=this.y && y<=this.bottom)
            return true;
        else 
            return false;
    }

    /**
     * 确定在 rect 参数中指定的对象是否与此 Rectangle 对象相交。此方法检查指定的 Rectangle 对象的 x、y、width 和 height 属性，以查看它是否与此 Rectangle 对象相交。
     * @param	rect Rectangle 对象。
     * @return	如果传入的矩形对象与此对象相交，则返回 true 值，否则返回 false。
     */
    p.intersects = function(rect){
        var maxX,maxY,minX,minY

        maxX = this.right >= rect.right ? this.right : rect.right;
        maxY = this.bottom >= rect.bottom ? this.bottom : rect.bottom;

        minX = this.x <= rect.x ? this.x : rect.x
        minY = this.y <= rect.y ? this.y : rect.y

        if(maxX - minX <= this.width+rect.width && maxY - minY <= this.height+rect.height){
          return true
        }else{
          return false
        }
    }

    /**返回包含 x 和 y 坐标的值的字符串。*/
	p.toString=function(){
		return this.x+","+this.y+","+this.width+","+this.height+","+this.right+","+this.bottom;
	}

    /**
     * 确定此 Rectangle 对象是否为空。
     * @return 如果 Rectangle 对象的宽度或高度小于等于 0，则返回 true 值，否则返回 false。
     */
    p.isEmpty = function(){
        if(this.width <= 0 || this.height <= 0) return true;

        return false;
    }

    return Rectangle;
})();