/**
* 能量球的Avator封装 
*/
this.r2 = this.r2 || {};

(function () {
    
    var BallActor = Class();
    var p = BallActor.prototype;

    p.ctor = function() {   
        this.m_sprite = new Laya.Sprite();
    }

    p.setData = function(poolName,exp,fromServer,fromPlayer){
        this.avatar = MapMgr.getInstance().addBall(poolName,exp,this,fromPlayer);
        this.reset();
        this.m_poolSignName = poolName;
        this.m_exp = exp;
        this.m_inited = false;
        this.m_fromPlayer = fromPlayer;
        this.avatar.born();
        this.m_id = this.avatar.getId();
    }

    p.relive = function(id){
        this.avatar = MapMgr.getInstance().reuseBall(id,this.m_poolSignName,this.m_exp,this);
        if(this.avatar.IsFromPlayer() != this.m_fromPlayer) {
            console.error('BallActor relive err',id);
        }

        this.avatar.born();
        if(GameConst.BallBornAnim){
            this.fadeInFrameCnt = 0;
            this.m_scale = 0;
            this.m_fadeIn = true;
            this.onFadeIn();
            TimerUtil.loop(20,this,this.onFadeIn);
        }
    } 

    p.reset = function(){
        this.m_poolSignName = null;       
        this.m_exp = null;
        this.m_id = 0;
        this.m_ballRes = null;
        this.m_scale = 1;
        this.m_fadeIn = false;
    }

    p.clearTween = function(death){
        this.m_fadeIn = false;
        this.fadeInFrameCnt = 0;
        TimerUtil.clear(this,this.onFadeIn);
        if(this.m_scale < 1 && !death){
            this.m_scale = 1;
            this.scaleSprite();
        }
    }

    p.kill = function(){
        this.reset();
        if(this.m_fadeIn){
            this.clearTween(true);
        }
        this.avatar.setActor(null);
        var mapActor = GameMgr.getInstance().m_mapActor;
        mapActor.m_ballContainer.removeChild(this.m_sprite);
        this.avatar = null;
    }

    //玩家死亡爆的豆豆
    p.IsFromPlayer = function(){
        return this.m_fromPlayer;
    }

    p.getId = function(){
        return this.m_id;
    }

    p.setId = function(id) {
        this.m_id = id;
        this.avatar.setId(id);
    }

    p.getAvatar = function(){
        return this.avatar;
    }

    p.isDead = function(){
        return this.avatar.isDead();
    }

    p.draw = function(){
        var maxId = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.BallModelMaxCnt);
        var model = "map/food-sheet_"+parseInt(Math.random() * maxId)+".png";
        this.m_ballRes = Laya.loader.getRes(model);
        this.drawTexture();       
        var rot = Math.random() * 360;
        this.m_sprite.rotation = rot;

        var mapActor = GameMgr.getInstance().m_mapActor;
        mapActor.m_ballContainer.addChild(this.m_sprite);
    }

    p.onFadeIn = function(){
        this.m_scale = this.fadeInFrameCnt * 0.2;

        this.scaleSprite();

        if(this.fadeInFrameCnt == 5){
            this.clearTween();
        }else{
            this.fadeInFrameCnt++;
        }
    }

    p.scaleSprite = function(){
        this.m_sprite.scaleX = this.m_scale;
        this.m_sprite.scaleY = this.m_scale;
    }

    p.drawTexture = function(){
        this.m_sprite.graphics.clear();

        var radius = this.avatar.getRadius();
        var drawRadius = radius;
        var size = drawRadius * 2;
        
        this.m_sprite.graphics.drawTexture(this.m_ballRes,-drawRadius,-drawRadius,size,size);
    }
    
    p.onBorn = function(){
        if(!this.m_inited){
            this.draw();
            this.m_inited = true;
        }

        this.m_sprite.x = this.avatar.x;
        this.m_sprite.y = this.avatar.y;
    }

    p.setVisible = function(show){
        this.m_sprite.visible = show;
        if(!show && this.m_fadeIn){
             this.clearTween();
        }
    }

    p.isVisible = function(){
        return this.m_sprite.visible;
    }

    p.getRadius = function(){
        return this.avatar.getRadius();
    }

    p.pos = function(x,y){
        this.avatar.pos(x,y);
    }

    p.setRadius = function(r){
        this.avatar.setRadius(r);
    }

    p.setBallCfgId = function(id){
        this.avatar.setBallCfgId(id);
    }

    p.onDeath = function(killer){
        if(this.m_fadeIn){
            this.clearTween(true);
        }
        if(this.m_sprite!=null){
            this.m_sprite.visible = false;
        }
        this.avatar.setActor(null);
        GameMgr.getInstance().onRemoveBall(this);
    }

    p.onRelive = function(){
    }

    p.onSyncPosition = function(){
        if(this.avatar == null) return;

        this.m_sprite.x = this.avatar.x;
        this.m_sprite.y = this.avatar.y;
    }

    p.onSyncRotation = function(){

    }

    p.onSyncScale = function(){

    }

    p.onSyncWeapon = function(){

    }

    p.onSyncLevel = function(oldLv,lv){

    }

    p.onSyncExp = function(){

    }

    p.onSyncKillNum = function(){
    }

    p.onSyncHighScore = function(){}
    p.setKillerSign=function(){}

    p.onSyncKillScore = function(score,lastKillNum,curKillNum){
        
    }

     p.onStartAttack = function(){

    }

    p.onEndAttack = function(){
        
    }

    p.onSyncSpeedup = function(inSpeeding){
        
    }

    p.onSyncInvincible = function(val){        
    }

    p.inPlayerView = function(x,y,thresholdX,thresholdY){
        return Utils.validPos(x,y,this.avatar.x,this.avatar.y,thresholdX,thresholdY)
    }

    r2.BallActor = BallActor;
})();