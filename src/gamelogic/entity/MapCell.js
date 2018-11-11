/*
* MapCell 地图单元;
*/
var MapCell = (function () {
    var MapCell = Class();
    var p = MapCell.prototype;

    p.ctor = function(row,col,sx,sy,width,height,edge){
        this.m_row = row;
        this.m_col = col;
        this.m_edgecell = edge;
        this.m_startX = sx;
        this.m_startY = sy;
        this.m_width = width;
        this.m_height = height;
        this.m_hasPlayer = false;
        this.m_centerX = sx + width / 2;
        this.m_centerY = sy + height / 2;
        this.m_maxBallCnt = DataMgr.getInstance().getCellMaxBallCnt(row+1,col+1);
        this.m_balls = [];
    }

    p.clear = function(){
        this.m_balls.length = 0;
        this.m_hasPlayer = false;
    }

    p.row = function(){
        return this.m_row;
    }

    p.col = function(){
        return this.m_col;
    }

    p.startX = function(){
        return this.m_startX;
    }

    p.startY = function(){
        return this.m_startY;
    }

    p.width = function(){
        return this.m_width;
    }

    p.height = function(){
        return this.m_height;
    }

    p.hasPlayer = function(){
        return this.m_hasPlayer;
    }

    p.setHasPlayer = function(exist){
        this.m_hasPlayer = exist;
    }

    p.isFull = function(){
        return this.curBallCnt() >= this.m_maxBallCnt;
    }

    p.curBallCnt = function(){
        return this.m_balls.length;
    }

    p.addBall = function(ballId){
        this.m_balls.push(ballId);
    }

    p.removeBall = function(ballId){
        // var len = this.m_balls.length;
        // for(var i = 0; i < len;i++){
        //     if(this.m_balls[i] == ballId)
        //     {
        //         this.m_balls.splice(i,1);
        //         break;
        //     }
        // }
        var index = this.m_balls.indexOf(ballId);
        if(index != -1) {
            this.m_balls.splice(index,1);
        }
    }


    p.isInCell = function(x,y){
        // if(x >= this.m_startX && x<=(this.m_startX+this.m_width) && y>=this.m_startY && y<=(this.m_startY+this.m_height))
        // {
        //     return true;
        // }
        // else
        // {
        //     return false;
        // }
        if(x < this.m_startX || x>(this.m_startX+this.m_width) || y<this.m_startY || y>(this.m_startY+this.m_height))
        {
            return false;
        }
        else
        {
            return true;
        }
    }

    p.getRandomPos = function(r,bounds){
        var x = this.m_startX+this.m_width*Math.random();
        var y = this.m_startY+this.m_height*Math.random();

        if(this.m_edgecell){
            if(x - r < bounds.x)
                x = bounds.x + r;
            else if(x + r > bounds.width)
                x = bounds.width - r;

            if(y - r < bounds.y)
                y = bounds.y + r;
            else if(y + r > bounds.height)
                y = bounds.height - r;
        }
        
        return new Point(x,y);
    }

    p.getCenterPos = function(){
        return new Point(this.m_centerX,this.m_centerY);
    }

    return MapCell;
}());