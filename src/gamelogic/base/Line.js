/*
* 线;
*/
var Line = (function () {
    var Line = Class();
    var p = Line.prototype;

     p.ctor = function(x1,y1,x2,y2) {
        (x1===void 0)&& (x1=0);
        (y1===void 0)&& (y1=0);

        (x2===void 0)&& (x2=0);
        (y2===void 0)&& (y2=0);
        
        this.sx = x1;
        this.sy = y1;
        this.ex = x2;
        this.ey = y2;
    }

     p.setTo = function(x1,y1,x2,y2){
        this.sx = x1;
        this.sy = y1;
        this.ex = x2;
        this.ey = y2;
        return this;
    }

     /**返回包含 x 和 y 坐标的值的字符串。*/
	p.toString=function(){
		return this.sx+","+this.sy+","+this.ex+","+this.ey;
	}

    return Line;
}());