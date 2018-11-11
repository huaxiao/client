var Circle = (function(){
	var Circle = Class();
	var p=Circle.prototype;

	p.ctor = function(cx,cy,radius){
		(radius===void 0)&& (radius=0);
		this.x = cx;
		this.y = cy;
		this.radius=radius;
	}

	

	/**
	*将 <code>Circle</code> 的成员设置为指定值。
	*@param x 水平坐标。
	*@param y 垂直坐标。
	*@return 当前 Circle 对象。
	*/
	p.setTo=function(x,y){
		this.x=x;
		this.y=y;
		return this;
	}

    /**
     * 设置半径
     */
    p.setRadius=function(radius){
        this.radius=radius;
    }

	p.getRadius=function(){
		return this.radius;
	}

	/**
	*计算两个圆是否碰撞。
	*@param circle 圆
	*@return 返回是否碰撞。
	*/
	p.intersetCircle=function(circle){
		var dx = this.x - circle.x;
		var dy = this.y - circle.y;
		var dr = this.radius + circle.radius;
        
		return (dx*dx + dy*dy) <= dr*dr;
	}

	/**返回包含 x 和 y 坐标的值的字符串。*/
	p.toString=function(){
		return this.x+","+this.y+","+this.radius;
	}

	//圆和旋转矩形碰撞检测
	p.intersetRect=function(rect){
		var cx, cy;
		var angleOfRad = Utils.degToRad(-rect.angleOfDeg);
		var rectCenterX = rect.x + rect.width / 2;
		var rectCenterY = rect.y + rect.height / 2;

		var cosVal = Math.cos(angleOfRad);
		var sinVal = Math.sin(angleOfRad);

		var rotateCircleX = cosVal * (this.x - rectCenterX) - sinVal * (this.y - rectCenterY) + rectCenterX;
		var rotateCircleY = sinVal * (this.x - rectCenterX) + cosVal * (this.y - rectCenterY) + rectCenterY;

		if (rotateCircleX < rect.x) {
			cx = rect.x;
		} else if (rotateCircleX > rect.x + rect.width) {
			cx = rect.x + rect.width;
		} else {
			cx = rotateCircleX;
		}

		if (rotateCircleY < rect.y) {
			cy = rect.y;
		} else if (rotateCircleY > rect.y + rect.height) {
			cy = rect.y + rect.height;
		} else {
			cy = rotateCircleY;
		}

		if (distancePow2(rotateCircleX, rotateCircleY, cx, cy) < this.radius * this.radius) {
			console.log("collision");
			return true
		}

		return false
	}

	p.intersetWithLine = function(x1,y1,x2,y2){
		return this.isCircleIntersectLineSeg(this.x,this.y,this.radius,x1,y1,x2,y2)
	}

	function distancePow2(x1,y1,x2,y2) {
		var dx = x2 - x1;
		var dy = y2 - y1;
		return dx * dx + dy * dy;
	}

	// 判断圆与扇形是否相交  
	// 圆心p(x, y), 半径r, 扇形圆心p1(x1, y1), 扇形正前方最远点p2(x2, y2), 扇形夹角弧度值theta(0,pi)  
	p.isCircleIntersectFan = function(x, y, r, x1, y1, x2, y2, theta)  
	{  
		// 计算扇形正前方向量 v = p1p2  
		var vx = x2 - x1;  
		var vy = y2 - y1;  
	
		// 计算扇形半径 R = v.length()  
		var R = Math.sqrt(vx * vx + vy * vy);  
	
		// 圆不与扇形圆相交，则圆与扇形必不相交  
		if ((x - x1) * (x - x1) + (y - y1) * (y - y1) > (R + r) * (R + r))  
			return false;  
	
		// 根据夹角 theta/2 计算出旋转矩阵，并将向量v乘该旋转矩阵得出扇形两边的端点p3,p4  
		var h = theta * 0.5;  
		var c = Math.cos(h);  
		var s = Math.sin(h);  
		var x3 = x1 + (vx * c - vy * s);  
		var y3 = y1 + (vx * s + vy * c);  
		var x4 = x1 + (vx * c + vy * s);  
		var y4 = y1 + (-vx * s + vy * c);  
	
		// 如果圆心在扇形两边夹角内，则必相交  
		var d1 = this.evaluatePointToLine(x, y, x1, y1, x3, y3);  
		var d2 = this.evaluatePointToLine(x, y, x4, y4, x1, y1);  
		if (d1 >= 0 && d2 >= 0)  
			return true;  
	
		// 如果圆与任一边相交，则必相交  
		if (this.isCircleIntersectLineSeg(x, y, r, x1, y1, x3, y3))  
			return true;  
		if (this.isCircleIntersectLineSeg(x, y, r, x1, y1, x4, y4))  
			return true;  
	
		return false;  
	}

	// 圆与线段碰撞检测  
	// 圆心p(x, y), 半径r, 线段两端点p1(x1, y1)和p2(x2, y2)  
	p.isCircleIntersectLineSeg = function(x, y, r, x1, y1, x2, y2)  
	{  
		var vx1 = x - x1;  
		var vy1 = y - y1;  
		var vx2 = x2 - x1;  
		var vy2 = y2 - y1;
	
		// len = v2.length()  
		var len = Math.sqrt(vx2 * vx2 + vy2 * vy2);  
	
		// v2.normalize()  
		vx2 /= len;  
		vy2 /= len;  
	
		// u = v1.dot(v2)  
		// u is the vector projection length of vector v1 onto vector v2.  
		var u = vx1 * vx2 + vy1 * vy2;  
	
		// determine the nearest point on the lineseg  
		var x0 = 0;  
		var y0 = 0;  
		if (u <= 0)  
		{  
			// p is on the left of p1, so p1 is the nearest point on lineseg  
			x0 = x1;  
			y0 = y1;  
		}  
		else if (u >= len)  
		{  
			// p is on the right of p2, so p2 is the nearest point on lineseg  
			x0 = x2;  
			y0 = y2;  
		}  
		else  
		{  
			// p0 = p1 + v2 * u  
			// note that v2 is already normalized.  
			x0 = x1 + vx2 * u;  
			y0 = y1 + vy2 * u;  
		}  
	
		return (x - x0) * (x - x0) + (y - y0) * (y - y0) <= r * r;  
	}

	// 判断点P(x, y)与有向直线P1P2的关系. 小于0表示点在直线左侧，等于0表示点在直线上，大于0表示点在直线右侧  
	p.evaluatePointToLine = function(x, y, x1, y1, x2, y2)	{  
		var a = y2 - y1;  
		var b = x1 - x2;  
		var c = x2 * y1 - x1 * y2;
	
		return a * x + b * y + c;  
	}

	return Circle;
})();