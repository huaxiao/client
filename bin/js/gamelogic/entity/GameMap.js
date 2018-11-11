/**
 * GameMap 地图
 */
var GameMap =(function() {
    var GameMap = Class();
    var p = GameMap.prototype;

    GameMap.xCnt = 12;
    GameMap.yCnt = 12;
    GameMap.cellRows = 6;
    GameMap.cellCols = 6;
    GameMap.cellW = 396;
    GameMap.cellH = 342;
    GameMap.borderW = 20;
    GameMap.aiborder = 40;

    p.ctor = function(){
        this.m_temp = [];
        this.width = GameMap.cellW * GameMap.xCnt;;
        this.height = GameMap.cellH * GameMap.yCnt;
        var halfBorderW = GameMap.borderW / 2;
        this.m_cellRowCnt = GameMap.xCnt / 2;
        this.m_cellColCnt = GameMap.yCnt / 2;
        this.m_bounds = new Rectangle(halfBorderW,halfBorderW,this.width-2*halfBorderW,this.height-2*halfBorderW);

        var aihalfBorderW = halfBorderW+GameMap.aiborder;
        this.m_aibounds = new Rectangle(aihalfBorderW,aihalfBorderW,this.width-2*aihalfBorderW,this.height-2*aihalfBorderW);
        this.m_cells = [];
        this.generateCells();
    }

    p.clear = function(){
        var len = this.m_cells.length;
        for(var i =0; i < len;i++){
            var cell = this.m_cells[i];
            cell.clear();
        }
    }

    p.isEdge = function(x,y,r){
        if((x - r) <= this.m_bounds.x || (y - r) <= this.m_bounds.y || (x + r) >= this.m_bounds.width || (y + r) >= this.m_bounds.height)
            return true;
        return false;
    }

    p.isAIEdge = function(x,y,r){
        if((x - r*2) <= this.m_aibounds.x || (y - r*2) <= this.m_aibounds.y || (x + r*2) >= this.m_aibounds.width || (y + r*2) >= this.m_aibounds.height)
            return true;
        return false;
    }

    p.generateCells = function(){
        var halfBorderW = GameMap.borderW / 2 + GameMap.aiborder;
        var w = 0,h = 0;
        var tr = GameMap.cellRows,tc = GameMap.cellCols;
        var cW = GameMap.cellW * 2, cH = GameMap.cellH * 2;

        for(var i=0; i< tr; i++) {
            var x = cW*i;
            var edge = false;
            if( i == 0){
                x = x + halfBorderW;
                w = cW - halfBorderW;
                edge = true;
            }else if(i == GameMap.xCnt-1){
                w = cW - halfBorderW;
                edge = true;
            }
            else{
                w = cW;
            }

            for(var j=0; j< tc; j++) {
                var y = cH*j;
                if(y == 0){
                    y = y + halfBorderW;
                    h = cH - halfBorderW;
                    edge = true;
                }else if(i == GameMap.xCnt-1){
                    h = cH - halfBorderW;
                    edge = true;
                }else{
                    h = cH;
                }

                var cell = new MapCell(i,j,x,y,w,h,edge);
                this.m_cells.push(cell);
            }
            //36个格子
        }  
    }

    p.getRandomX = function(radius) {
        var px= this.m_aibounds.x + Math.random()*this.m_aibounds.width;
        if(px - radius < this.m_aibounds.x)
            px = this.m_aibounds.x + radius;
        else if(px + radius > this.m_aibounds.width)
            px = this.m_aibounds.width - radius;

        return px;
    }

    p.getRandomY = function(radius) {
        var py = this.m_aibounds.y + Math.random()*this.m_aibounds.height;        
        if(py - radius < this.m_aibounds.y)
            py = this.m_aibounds.y + radius;
        else if(py + radius > this.m_aibounds.height)
            py = this.m_aibounds.height - radius;

        return py;
    }

    p.getBounds = function(){
        return this.m_bounds;
    }

    p.getAIBounds = function(){
        return this.m_aibounds;
    }

    p.getCellByPos = function(x,y){
        for(var i = this.m_cells.length - 1; i >= 0; i--){
            var cell = this.m_cells[i];
            if(cell == null) continue;

            if(cell.isInCell(x,y)){
                return cell;
            }
        }
        //这里用坐标去除会快些

        return null;
    }

    p.getCellByIndex = function(row,col){
        for(var i = this.m_cells.length - 1; i >=0; i--){
            var cell = this.m_cells[i];
            if(cell == null) continue;

            if(cell.row() == row && cell.col() == col){
                return cell;
            }
        }
        return null;
    }

    p.resetMapCellPlayerRecord =function(){
        for(var i = this.m_cells.length - 1; i >= 0; i--){
            var cell = this.m_cells[i];
            cell.setHasPlayer(false);
        }

    }

    p.getNearestCellPosWithoutPlayer = function(row,col){
        if(row == -1 && col == -1){
            return this.getRandomCellPosWithoutPlayer();
        }

        var minDistance = Number.MAX_VALUE;
        var nearestCell = null;

        for(var i = this.m_cells.length - 1; i>= 0; i--){
            var cell = this.m_cells[i];
            if(cell.hasPlayer()) continue;

            var dis = Utils.getDistanceSqr(row,col,cell.row(),cell.col());
            if(dis < minDistance) {
                nearestCell = cell;
                minDistance = dis;
            }
        }

        if(nearestCell!=null){
            return nearestCell.getCenterPos();
        }else{
            return new Point(0,0);
        }
    }

    p.getRandomCellPosWithoutPlayer = function(){
        for(var i = this.m_cells.length - 1; i>= 0; i--){
            var cell = this.m_cells[i];
            if(cell.hasPlayer()) continue;

            this.m_temp.push(cell);
        }

        if(this.m_temp.length == 0) {
            //都满了随意找个
            var randomIndex = parseInt(Math.random()*(this.m_cells.length));
            return this.m_cells[randomIndex].getCenterPos();
        }

        var index = parseInt((Math.random() * this.m_temp.length));
        
        var p = this.m_temp[index].getCenterPos();
        this.m_temp.length = 0;
        return p;
    }

    p.addBallToCell = function(ball){
        if(ball == null) return;

        var row = ball.getCellRow();
        var col = ball.getCellCol();
        if(row >=0 && col >= 0)
        {
            var cell = this.getCellByIndex(row,col);
            var p = cell.getRandomPos(ball.getRadius(),this.m_aibounds);
            ball.pos(p.x,p.y);
        }else{
            var cell = null;
            for(var i = this.m_cells.length - 1; i >= 0; i--){
                cell = this.m_cells[i];
                if(cell.isFull()) continue;

                this.m_temp.push(cell);
            }

            if(this.m_temp.length == 0) return;

            var index = parseInt((Math.random() * this.m_temp.length));
            cell = this.m_temp[index];
            if(cell == null){
                cell = this.m_temp[0];
            }
            
            cell.addBall(ball.getId());

            var p = cell.getRandomPos(ball.getRadius(),this.m_aibounds);

            ball.pos(p.x,p.y);
            ball.setMapCell(cell.row(),cell.col()); 

            this.m_temp.length = 0;
        }
    }

    p.removeBallFromCell = function(ball){
        if(ball == null) return;

        var row = ball.getCellRow();
        var col = ball.getCellCol();
        if(row < 0 || col < 0) return;

        var cell = this.getCellByIndex(row,col);
        cell.removeBall(ball.getId());
    }

    return GameMap;
})();