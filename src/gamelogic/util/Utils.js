var _Math = Math;

var Utils = (function() {
    function Utils() {

    }

    Utils.BKLog = function(str){
        if(GameConst.QQplay)
            BK.Script.log(0,0,str);
    }

    Utils.onMobile = function(){
        // return true;
        return Laya.Browser.onIOS || Laya.Browser.onAndriod || Laya.Browser.onMobile;
    }

    Utils.parseParams = function(params){
        var paramStr = "";
        if(params!=null){
            for(var key in params){
                paramStr += key + "="+params[key] + "&";
            }
            paramStr = paramStr.substring(0, paramStr.length - 1);
        }
        return paramStr;
    }    

    /**
     * 获取指定的两个点组成的线段的弧度值。
     * @param	x0 点一的 X 轴坐标值。
     * @param	y0 点一的 Y 轴坐标值。
     * @param	x1 点二的 X 轴坐标值。
     * @param	y1 点二的 Y 轴坐标值。
     * @return 角度值。
     */
    Utils.getAngle = function(x0,y0,x1,y1){
        var dx = x1 - x0;
        var dy = y1 - y0;
        if(dy == 0) {
            return dx > 0 ? 0 : 180;
        }

        var angle = _Math.atan(dx/dy)*180/_Math.PI;
        if (dy < 0) {
            if (dx < 0)
                angle = 180 + _Math.abs(angle);
            else
                angle = 180 - _Math.abs(angle);
        }
        angle = 90 - angle; //物体初始是水平摆放

        return angle;
    }

    /**
     * 取两点距离
     */
    Utils.getDistance = function(mx,my,px,py) {
        var x = px - mx;
        var y = py - my;
        var distance = _Math.sqrt(x * x + y * y);
        return distance;
    }

    /**
     * 取两点距离平方 优化计算性能
     */
    Utils.getDistanceSqr = function(mx,my,px,py) {
        var x = px - mx;
        var y = py - my;
        var distanceSqr = x * x + y * y;
        return distanceSqr;
    }

    // /**
    //  * 获取动画最小半径
    //  */
    // Utils.getAniMinRadius = function(ani) {
    //     var w = ani._graphics._one[3];
    //     var h = ani._graphics._one[4];
    //     return _Math.min(w,h) / 2;
    // }

    /**
     * 角度转换成弧度
     */
    Utils.degToRad = function(deg) {
		return deg * _Math.PI / 180;
	}

    /**
     * 获取边界内随机一点
     */
    Utils.getRandomPosInBounds = function(rect) {
        var x = rect.x+rect.width*_Math.random();
        var y = rect.y+rect.height*_Math.random();
        return new Point(x,y);
    }

    /**
     * 弧度转换为角度
     */
    Utils.radToDeg = function(rad){
        return rad * 180 / _Math.PI;
    }

    /**
     * 两圆是否碰撞
     */
    Utils.isCircleCollision = function(px1,py1,r1,px2,py2,r2){
        var offX = px1 -px2;
        var offY = py1 - py2;
        var sumR = r1 + r2;
        return (offX*offX+offY*offY) < sumR*sumR;
    }

    /**
     * 取两值范围内的值
     */
    Utils.clamp = function(value,minValue,maxValue){
        if(value < minValue)
            return minValue;
        if(value > maxValue)
            return maxValue;
        return value;
    }

    Utils.validPos = function(sx,sy,ex,ey,thresholdX,thresholdY) {
        var offX = sx - ex;
        if(offX < -thresholdX || offX > thresholdX) return false;

        var offY = sy - ey;
        if(offY < -thresholdY || offY > thresholdY) return false;

        return true;
    }

    Utils.getInt = function(val){
        return _Math.floor(val);
    }

    Utils.clearDictionary = function(dic) {
        for(var index in dic) {
            delete dic[index];
        }
    }

    Utils.getCos = function(angle){
         if(angle < 0)
            angle = angle+360;
        
        angle = _Math.floor(angle%360);
        return DataMgr.getInstance().getCos(angle);
    }

    Utils.getSin = function(angle){
         if(angle < 0)
            angle = angle+360;
        
        angle = _Math.floor(angle%360);
        return DataMgr.getInstance().getSin(angle);
    }

    Utils.getTitleImg = function(score,scale){
        (scale===void 0)&& (scale=1);

        if(score < 1000 * scale){
			return "title1";
		}else if(score < 2000 * scale){
			return "title2";
		}else if(score < 3000 * scale){
			return "title3";
		}else if(score < 4000 * scale){
			return "title4";
		}else if(score < 5000 * scale){
			return "title5";
		}else if(score < 6000 * scale){
			return "title6";
		}else if(score < 7000 * scale){
			return "title7";
		}else if(score < 8000 * scale){
			return "title8";
		}else if(score < 9000 * scale){
			return "title9";
		}else if(score < 10000 * scale){
			return "title10";
		}else{
			return "title11";
		}
    }

    Utils.checkVideoBtn = function(btn){
        // if(btn == null) return;
        
        // var temp = CheckIPMgr.getInstance().canShowVideo();
        // btn.disabled = !temp;
        // btn.gray = !temp;
    }

    Utils.finishVideo = function(pos){
        EventMgr.getInstance().event(EEvent.ShowAdCompleted,pos);
        EventMgr.getInstance().event(EEvent.CloseShowAd);
    }

    Utils.localStorageAddVal = function(itemName,addVal) {
        var val = parseInt(Laya.LocalStorage.getItem(itemName)) || 0
        val += addVal;
        Laya.LocalStorage.setItem(itemName,val);
    }
    
    Utils.getBuffDesc = function(buffType){
        switch(buffType){
            case BuffType.IncKillScore:
                return "击杀分数";
            case BuffType.IncKillBall:
                return "击杀爆豆";
            case BuffType.Invincible:
                return "无敌";
            case BuffType.IncMoveSpeed:
                return "移动速度";
            case BuffType.IncAtkSpeed:
                return "攻击速度";
            case BuffType.IncSettleGold:
                return "金币加成";
        }
        return "";
    }
    return Utils;
})();