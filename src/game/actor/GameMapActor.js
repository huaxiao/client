this.r2 = this.r2 || {};

/*
* GameMap 地图 图形绘制
*/
(function () {
    var GameMapActor = Class();

    var p = GameMapActor.prototype;

    p.ctor = function(){
        this.m_sprite = null;
        this.m_debugSprite = null;
        this.m_ballContainer = null;
        this.m_playerBottomContainer = null;
        this.m_playerSkeletonContainer = null;
        this.m_playerContainer = null;
        this.m_nameTxtContainer = null;
        this.m_topContainer = null;            

        var map = MapMgr.getInstance().getMap();
        this.m_mapWidth = map.width;
        this.m_mapHeight = map.height;

        this.drawMap(this.m_mapWidth,this.m_mapHeight);
        this.m_sprite.width = this.m_mapWidth;
        this.m_sprite.height = this.m_mapHeight;

        Laya.stage.on(Laya.Event.RESIZE, this, this.setViewSize);
        this.setViewSize();
    }

    p.setViewSize = function() {
        this.m_halfStageW = Laya.stage.width / 2;
        this.m_halfStageH = Laya.stage.height / 2; 
        this.m_viewMinX = - this.m_mapWidth + Laya.stage.width;
        this.m_viewMinY = - this.m_mapHeight + Laya.stage.height;
    }

    p.drawMap = function(width,height) {
        this.m_sprite = new Laya.Sprite();
        this.m_sprite.name = "Game";
        Laya.stage.addChild(this.m_sprite);

        this.m_mapSprite = new Laya.Sprite();
        this.m_mapSprite.name = "Map";
        this.m_sprite.addChild(this.m_mapSprite);

        this.m_ballContainer = new Laya.Sprite();
        this.m_ballContainer.name = "BallContainer";
        this.m_ballContainer.zOrder = 100;
        this.m_sprite.addChild(this.m_ballContainer);

        this.m_playerBottomContainer = new Laya.Sprite();
        this.m_playerBottomContainer.name = "PlayerBottomContainer";
        this.m_playerBottomContainer.zOrder = 180;
        this.m_sprite.addChild(this.m_playerBottomContainer);

        this.m_playerSkeletonContainer = new Laya.Sprite();
        this.m_playerSkeletonContainer.name = "PlayerSkeletonContainer";
        this.m_playerSkeletonContainer.zOrder = 200;
        this.m_sprite.addChild(this.m_playerSkeletonContainer);

        this.m_playerContainer = new Laya.Sprite();
        this.m_playerContainer.name = "PlayerContainer";
        this.m_playerContainer.zOrder = 250;
        this.m_sprite.addChild(this.m_playerContainer);

        this.m_nameTxtContainer = new Laya.Sprite();
        this.m_nameTxtContainer.name = "NameTxtContainer";
        this.m_nameTxtContainer.zOrder = 300;
        this.m_sprite.addChild(this.m_nameTxtContainer);

        this.m_topContainer = new Laya.Sprite();
        this.m_topContainer.name = "TopContainer";
        this.m_topContainer.zOrder = 350;
        this.m_sprite.addChild(this.m_topContainer);

        //draw cell
        var cellRes = Laya.loader.getRes("map/tiledbackground.png");
        this.m_mapSprite.graphics.fillTexture(cellRes,0,0,this.m_mapWidth,this.m_mapHeight);

        var borderRes = Laya.loader.getRes("map/mapframe-line.png");
        var cornerRes = Laya.loader.getRes("map/mapframe-corner.png");
        var w=72,halfW = w/2,m = null,bVertical=false,ro,offX,offY,width,size;

        for(var i=0; i<4; i++) {
            var x = i == 1 ? width : 0;
            var y = i == 2 ? height : 0;
            width = i % 2 == 0 ? this.m_mapWidth : this.m_mapHeight;
            size = (width - w) / w;
            bVertical = i % 2 == 1;
            switch(i) {
                case 0:
                    ro = Math.PI; 
                    offX = w;
                    offY = 0;
                    m = Laya.Matrix.create();
                    m.rotate(-ro);
                    this.m_mapSprite.graphics.drawTexture(cornerRes,-halfW,-halfW,w,w,m);
                    m = Laya.Matrix.create();
                    m.rotate(-ro);
                    m.translate(-this.m_mapWidth,0);
                    m.scale(-1,1);
                    this.m_mapSprite.graphics.drawTexture(cornerRes,-halfW,-halfW,w,w,m);
                    break;
                case 1:
                    ro = - Math.PI / 2;
                    offX = 0;
                    offY = w;
                    m = Laya.Matrix.create();
                    m.rotate(ro);
                    m.translate(this.m_mapWidth,0);
                    this.m_mapSprite.graphics.drawTexture(cornerRes,-halfW,-halfW,w,w,m);
                    m = Laya.Matrix.create();
                    m.rotate(-ro);
                    m.translate(-this.m_mapWidth,this.m_mapHeight);
                    m.scale(-1,1);
                    this.m_mapSprite.graphics.drawTexture(cornerRes,-halfW,-halfW,w,w,m);
                    break;
                case 2:
                    ro = 0;
                    offX = w;
                    offY = 0;
                    m = Laya.Matrix.create();
                    m.translate(this.m_mapWidth,this.m_mapHeight);
                    this.m_mapSprite.graphics.drawTexture(cornerRes,-halfW,-halfW,w,w,m);
                    m = Laya.Matrix.create();
                    m.translate(0,this.m_mapHeight);
                    m.scale(-1,1);
                    this.m_mapSprite.graphics.drawTexture(cornerRes,-halfW,-halfW,w,w,m);
                    break;
                case 3:
                    ro = Math.PI / 2;
                    offX = 0;
                    offY = w;
                    m = Laya.Matrix.create();
                    m.rotate(ro);
                    m.scale(1,-1);
                    this.m_mapSprite.graphics.drawTexture(cornerRes,-halfW,-halfW,w,w,m);
                    m = Laya.Matrix.create();
                    m.rotate(ro);
                    m.translate(0,this.m_mapHeight);
                    this.m_mapSprite.graphics.drawTexture(cornerRes,-halfW,-halfW,w,w,m);
                    break;
            }
            for(var j=0; j<size; j++) {
                m = Laya.Matrix.create();
                m.rotate(ro);
                if(bVertical) {
                    m.translate(x+offX, y+j*w+offY);
                }
                else {
                    m.translate(x+j*w+offX, y+offY);
                }
                this.m_mapSprite.graphics.drawTexture(borderRes,-halfW,-halfW,w,w,m);
            }
        }
    }

    p.destroy = function() {
        Laya.stage.off(Laya.Event.RESIZE, this, this.setViewSize);
        Laya.stage.removeChild(this.m_sprite);
        this.m_sprite.destroy();
        this.m_sprite = null;
    }

    p.lookAt = function(rolePlayer) {
        var x = this.m_halfStageW - rolePlayer.m_sprite.x;
        var y = this.m_halfStageH - rolePlayer.m_sprite.y;
        this.m_sprite.x = x;
        this.m_sprite.y = y;
    } 

    p.show = function(){
        this.m_sprite.visible = true;
    }

    p.hide = function(){
        this.m_sprite.visible = false;
    }
    r2.GameMapActor = GameMapActor;
})();