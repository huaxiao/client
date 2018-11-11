/*
* 玩家的avatar封装类;
*/
this.r2 = this.r2 || {};

(function () {
    var PlayerActor = Class();
    var p = PlayerActor.prototype;

    p.ctor = function(){
        this.m_moveSpeed = 0;
    }

    p.setData = function(rolePlayer,id,name,isAI,fromServer){
        this.avatar = new MapMgr.getInstance().addPlayer(this,id);
        this.avatar.setMainRole(rolePlayer);
        this.avatar.setName(name)
        this.avatar.setIsAI(isAI);
        this.reset();
        this.init();
        // var lv = parseInt(Math.random() * 20);
        // if(lv == 0) lv = 1;
        this.avatar.born();
        this.m_bornAni.loadAnimation("ani/chusheng.ani",Laya.Handler.create(this,this.onBornAniLoaded));
        this.setVisible(false);
        this.setLv();
    }

    p.init = function(){
        var mapActor = GameMgr.getInstance().m_mapActor;

        this.m_skeleton = ResMgr.getInstance().getSkeleton();
        mapActor.m_playerSkeletonContainer.addChild(this.m_skeleton);

        this.m_sprite = new Laya.Sprite();

        this.m_weaponSprite = new Laya.Sprite();
        this.m_weaponSprite.name = "Weapon";
        this.m_sprite.addChild(this.m_weaponSprite); 
        
        //攻击动画特效
        this.m_attackAni = new Laya.Animation();
        this.m_attackAniLoaded = false;
        this.m_attackAni.loadAnimation("ani/daoguang.ani",Laya.Handler.create(this,this.onAttackAniLoaded));     

        //死亡动画特效
        this.m_deathAni = new Laya.Animation();
        this.m_deathAniLoaded = false;
        this.m_deathAni.loadAnimation("ani/siwang.ani",Laya.Handler.create(this,this.onDeathAniLoaded));

        //加速动画特效
        this.m_speedupAni = new Laya.Animation();
        this.m_speedupAniLoaded = false;
        this.m_speedupAni.loadAnimation("ani/jiasu.ani",Laya.Handler.create(this,this.onSpeedupAniLoaded));

        //出生动画特效
        this.m_bornAni = new Laya.Animation();
        this.m_bornAniLoaded = false;

        mapActor.m_playerContainer.addChild(this.m_sprite);   

        this.m_nameTxt = new Laya.Text();
        this.m_nameTxt.color = "#FFFFFF";
		this.m_nameTxt.fontSize = 20;
        this.m_nameTxt.width = 160;
        this.m_nameTxt.height = 30;
        this.m_nameTxt.align = "center";
        this.m_nameTxt.valign = "middle";
        this.m_nameHalfWid = this.m_nameTxt.width / 2;
        mapActor.m_nameTxtContainer.addChild(this.m_nameTxt);
        if(this.isMainRole() && SkinMgr.getInstance().wearedSkin())
        {
            var skinId = SkinMgr.getInstance().usingSkinId();
            var skin = SkinMgr.getInstance().getSkinById(skinId);
            this.avatar.addSkinBuffState(skinId);
            this.skinUrl = skin.skinUrl();
            this.skinWeapon = skin.weaponUrl();
        }else{
            this.skinUrl = null;
            this.skinWeapon = null;
        }
    }

    p.setLv = function(){
        if(this.isMainRole()){
            var mapActor = GameMgr.getInstance().m_mapActor;
            this.m_lvBgSprite = new Laya.Sprite();
            mapActor.m_topContainer.addChild(this.m_lvBgSprite);
            var url = "map/lvbg.png";
            var lvbgRes = Laya.loader.getRes(url);
            this.m_lvBgSprite.graphics.drawTexture(lvbgRes,-20,18,39,36);

            this.m_lvTxt = new Laya.Text();
            this.m_lvTxt.color = "#FFFFFF";
            this.m_lvTxt.fontSize = 20;
            this.m_lvTxt.width = 30;
            this.m_lvTxt.height = 30;
            this.m_lvTxt.align = "center";
            this.m_lvTxt.valign = "middle";
            this.m_lvTxt.text = this.getLevel();
            this.m_lvTxt.pos(-15, 20);
            this.m_lvBgSprite.addChild(this.m_lvTxt);
        }
    }

    p.reset = function(){
        this.m_attackAni = null;
        this.m_skeleton = null;
        this.m_weaponSprite = null;
        this.m_nameTxt = null;
        this.m_signSprite = null;
        this.m_showSign = false;
        this.m_isLoaded = false;
        this.m_animName = null;
        this.x = 0;
        this.y = 0;
        this.m_modelRot = 0;
        this.m_lastVisible = true;
        this.m_levelDirty = false;
        this.bSetName = false;
    }

    p.clearAniEffect = function(){
        this.m_bornAni.clear();
        this.m_attackAni.clear();
        this.m_deathAni.clear();
        this.m_speedupAni.clear();

        if(this.m_bornAni!=null && this.m_bornAni.parent!=null)
            this.m_bornAni.parent.removeChild(this.m_bornAni);

        this.m_sprite.removeChild(this.m_speedupAni);

        if(this.m_deathAni!=null && this.m_deathAni.parent!=null)
            this.m_deathAni.parent.removeChild(this.m_deathAni);

        if(this.m_attackAni!=null && this.m_attackAni.parent!=null)
            this.m_attackAni.parent.removeChild(this.m_attackAni);
    }

    p.destroySprite = function(){
        if(this.m_signSprite!=null){
            this.m_signSprite.parent.removeChild(this.m_signSprite);
            this.m_signSprite.destroy();
            this.m_signSprite = null;
        }
        if(this.m_invincibleAni!=null){
            this.m_invincibleAni.destroy();
            this.m_invincibleAni = null;
        }
    }

    p.setAIAgentId = function(id,aiCnt){
        this.avatar.setAIAgentId(id,aiCnt);
    }

    p.playAnimation = function(animName){
        this.m_lastAniName = animName;
        this.m_skeleton.play(animName,true,true);
    }

    p.stopAnimation = function(){
        this.m_skeleton.stop();
    }

    p.getId = function() {
        return this.avatar.getId();
    }

    p.kill = function(bClear){
        this.avatar.clear();
        this.onDeath(null,bClear);

        var mapActor = GameMgr.getInstance().m_mapActor;
        if(this.m_signSprite!=null) {
            mapActor.m_topContainer.removeChild(this.m_signSprite);
        }

        mapActor.m_playerSkeletonContainer.removeChild(this.m_skeleton);
        this.m_skeleton.destroy();
        this.m_skeleton = null;
        this.avatar = null;
    }

    p.clear = function(){
        TimerUtil.clearAll(this);
        
        this.clearAniEffect();
        this.destroySprite();
    }

    p.getName = function(){
        return this.avatar.getName();
    }

    p.syncServerData = function(data){
        if(data.x != null && data.y != null){
            this.syncServerPos(data.x,data.y);
        }
        else if(data.x != null && data.y == null){
            this.syncServerPos(data.x,this.avatar.y);
        }
        else if(data.x == null && data.y != null){
            this.syncServerPos(this.avatar.x,data.y);
        }
        
        if(data.lv != null)
            this.avatar.setLevel(data.lv);

        if(data.exp != null)
            this.avatar.setEnergyPoint(data.exp);

        if(data.status != null){
            var lastStatus = this.avatar.getStatus();
            this.avatar.setStatus(data.status);
            if(lastStatus != PlayerStatus.Attack && data.status == PlayerStatus.Attack){
                this.onStartAttack();
            }else if(lastStatus == PlayerStatus.Attack && data.status != PlayerStatus.Attack){
                this.onEndAttack();
            }
        }

        if(data.rotate != null){
            this.syncServerRot(data.rotate);
        }
        
        if(data.weaponRot != null){
            this.syncServerWeaponRot(data.weaponRot);
        }

        if(data.speed!=null){
            var basicSpeed = this.getCfg().moveSpeed;
            var lastSpeed = this.m_moveSpeed;
            this.m_moveSpeed = data.speed;
            if(lastSpeed>0 && this.m_moveSpeed > basicSpeed){
                this.onSyncSpeedup(true);
            }else if(lastSpeed > basicSpeed && this.m_moveSpeed == basicSpeed){
                this.onSyncSpeedup(false);
            }
        }

        if(data.score != null)
            this.avatar.setScore(data.score);

        if(data.killNum != null && this.getKillNum()!=data.killNum){
            var lastKillNum = this.getKillNum();
            this.syncSrvKillNum(data.killNum);
            this.onSyncKillScore(data.killScore,lastKillNum,data.killNum);
        }

        if(data.dead != null && data.dead!=this.avatar.getDeadSign())
            this.setDeathStatus(data.dead);
    }

    p.update = function(){
        if(this.avatar.getStatus() != PlayerStatus.Move || this.isDead()) return;

        var delta = TimerUtil.delta() / 1000;        
        var distance = this.m_moveSpeed * delta;
        var cosVal = Utils.getCos(this.getModelRotation());
        var sinVal = Utils.getSin(this.getModelRotation());

        var newX = distance * cosVal + this.x;
        var newY = distance * sinVal + this.y;

        newX = Utils.clamp(newX,this.avatar.m_moveBounds.x,this.avatar.m_moveBounds.right);
        newY = Utils.clamp(newY,this.avatar.m_moveBounds.y,this.avatar.m_moveBounds.bottom);

        this.avatar.pos(newX,newY);
    }

    p.syncServerPos = function(x,y){
        this.avatar.pos(x,y);
    }

    p.syncServerRot = function(rot){
        this.avatar.syncModelRot(rot);
    }

    p.syncServerWeaponRot = function(rot){
        if(this.avatar.getStatus() == PlayerStatus.Attack){
            var oldRot = rot - this.avatar.getWeaponRot();
            if(oldRot < 0 ){
                this.onEndAttack();
            }
        }
        this.avatar.syncWeaponRotation(rot);
    }

    p.setDeathStatus = function(isDead,killer){
        var deadSign = isDead ? 1 : 0;
        this.avatar.setDeadSign(deadSign);
        if(killer != null && killer.getId() != this.getId())
            this.playDeathParticle();
        if(isDead)
            this.avatar.setModelRatation(0);
        
        if(killer != null && this.isMainRole()) {
            if(this.m_lastKiller && this.m_lastKiller!=killer)
                    this.m_lastKiller.setKillerSign(false);
            killer.setKillerSign(true);
            this.m_lastKiller = killer;
        }
    }

    p.setKillerSign = function(bShow) {
        //仇人图标
        if(bShow) {
            if(this.m_signSprite == null) {
                var mapActor = GameMgr.getInstance().m_mapActor;
                this.m_signSprite = new Laya.Sprite();
                mapActor.m_topContainer.addChild(this.m_signSprite);
                var url = "main/foe.png";
                var feoRes = Laya.loader.getRes(url);
                this.m_signSprite.graphics.drawTexture(feoRes,-20,18,39,36);
            }
            this.m_signSprite.visible = true;
            this.m_showSign = true;
        }
        else {
            if(this.m_signSprite != null) {
                this.m_signSprite.visible = false;
                this.m_showSign = false;
            }
        }
    }

    p.syncClientCacheData = function(data){
        this.avatar.setName(data.name);
        this.avatar.setPos(data.x,data.y);
        this.avatar.setLevel(data.lv);
        this.avatar.setTotalEnergyPoint(data.totalEnergy);
        this.avatar.setEnergyPoint(data.curEnergy);
        this.avatar.setScore(data.score);
        this.syncSrvKillNum(data.killNum);
        this.avatar.setAccumScore(data.accumScore);
        this.setBornSpritePos(data.x,data.y);
    }

    p.setInView = function(bInView) {
        if(this.m_lastInView == bInView)
            return;
        this.m_lastInView = bInView;
        this.setVisible(bInView && !this.isDead());
    }

    p.setVisible = function(vis) {
        if(this.m_lastVisible == vis)
            return;

        if(vis && this.m_levelDirty){
            this.refreshLevelData();
        }

        this.m_lastVisible = vis;
        this.m_sprite.visible = vis;
        this.m_nameTxt.visible = vis;
        this.m_skeleton.visible = vis;
        
        if(this.m_lvBgSprite!=null)
            this.m_lvBgSprite.visible = vis;

        if(this.m_signSprite!=null)
            this.m_signSprite.visible = vis && this.m_showSign;
        
        this.avatar.setVisible(vis);
        this.onSyncRotation();
        this.onSyncWeapon();
    }

    p.isVisible = function(){
        return this.m_sprite.visible;
    }

    p.onBorn = function() {
        SoundMgr.getInstance().playSound(ESound.Born);
    }

    p.onDeath = function(killer,bClear) {
        this.m_modelRot = 0;
        if(this.isMainRole() || (killer && killer.isMainRole()))
            SoundMgr.getInstance().playSound(ESound.Die);
        this.setVisible(false);
        if(this.isMainRole())
        {
            this.onSyncExp();
            this.EndSpeedUp();
            EventMgr.getInstance().event(EEvent.Player_Lvup,0); 

            if(killer!=null) {
                if(this.m_lastKiller && this.m_lastKiller!=killer)
                    this.m_lastKiller.setKillerSign(false);
                killer.setKillerSign(true);
                this.m_lastKiller = killer;
            }
            if(GameMgr.getInstance().isGradeMode()){
                SDKMgr.getInst().report(ReportType.DieInGrade);   
            }else if(GameMgr.getInstance().isEndlessMode()){
                SDKMgr.getInst().report(ReportType.DieInEndless);   
            }
        }
        this.stopSpeedupAnim();
        // if(killer != null && killer.getId() != this.getId())
        if(bClear != true)
            this.playDeathParticle();
        this.stopAnimation();
    }

    p.playDeathParticle = function(){
        if( this.m_lastInView && this.m_deathAniLoaded){
             this.m_deathAni.pos(this.m_sprite.x,this.m_sprite.y);
             this.m_deathAni.play(0,true);
             this.m_deathAni.visible = true;
             TimerUtil.once(500,this,this.onHideDeathParticle);
        } 
    }

    p.onHideDeathParticle = function(){
        this.m_deathAni.stop();
        this.m_deathAni.visible = false;
    }

    p.playSpeedupAnim = function(){
        if(this.isVisible() && this.m_speedupAniLoaded){
             this.m_speedupAni.play(0,true);
             this.m_speedupAni.pos(-this.getCfg().modelR,0);
             this.m_speedupAni.visible= true;
        } 
    }

    p.stopSpeedupAnim = function(){
        this.m_speedupAni.stop();
        this.m_speedupAni.visible= false;
    }

    p.onRelive = function() {
        this.setVisible(true);
        this.onEndAttack();
        this.playBornAni();
        this.onSyncWeapon();
        this.playAnimation(this.m_animName);
    }

    p.onSyncPosition = function() {
        if(this.avatar == null) return;

        this.x = this.avatar.x;
        this.y = this.avatar.y;

        if(this.m_sprite != null){
            this.m_sprite.pos(this.x,this.y);
        }
        if(this.m_invincibleAni!=null){
            this.m_invincibleAni.pos(this.x,this.y);
        }

        this.m_skeleton.pos(this.x,this.y);

        if(this.m_nameTxt!=null){
            this.m_nameTxt.pos(this.x - this.m_nameHalfWid,this.y + this.getCfg().modelR);
        }
        if(this.m_signSprite!=null){
            this.m_signSprite.pos(this.x - this.m_nameHalfWid, this.y+this.getCfg().modelR-20);
        }
        if(this.m_lvBgSprite!=null){
            this.m_lvBgSprite.pos(this.x - this.m_nameHalfWid, this.y+this.getCfg().modelR-20);
        }
    }    

    p.onSyncRotation = function() {

        if(this.avatar == null) return;

        if(!this.isVisible()) return;

        if(this.m_sprite != null){
            var rot = this.avatar.getModelRotate();
            this.m_skeleton.rotation = rot;
            this.m_sprite.rotation = rot;            
        }
    }

    p.onSyncScale = function() {

    }

    p.onSyncWeapon = function() {
        if(this.avatar == null) return;

        if(!this.isVisible()) return;

        var rot = this.avatar.getWeaponRot();
        if(this.m_weaponSprite != null) {
            this.m_weaponSprite.rotation = rot;
        }            
    }

    p.onSyncLevel = function(oldLv,lv) {
        if(this.avatar!=null)
        {
            this.x = this.avatar.x;
            this.y = this.avatar.y;
        }

        if(this.m_lastInView == false && oldLv > 0 && oldLv != lv) {
            this.m_levelDirty = true;
            return;
        }

        this.refreshLevelData();        

        if(this.avatar.isMainRole()){
            EventMgr.getInstance().event(EEvent.Player_Lvup,oldLv);  
            if(this.m_lvTxt)
                this.m_lvTxt.text = ""+lv;
        }
    }

    p.refreshLevelData = function(){
        var aniName = this.skinUrl;
        if(aniName == null){
            aniName = "role"+this.getLevel()+"_run";
        }
        
        if(aniName != this.m_animName) {
            this.m_animName = aniName;
            this.playAnimation(this.m_animName);
        }
        this.onLoaded();

        if(this.m_attackAniLoaded){
            var initWeaponW = 100;
            var w = this.avatar.getWeaponRect().width;
            var scale = w / initWeaponW;
            this.m_attackAni.scale(scale,scale);
        }
        this.m_levelDirty = false;
    }

    p.onBornAniLoaded = function(aa){
        this.m_bornAniLoaded = true;
        GameMgr.getInstance().m_mapActor.m_topContainer.addChild(this.m_bornAni);
        this.removeBornAni();
    }

    p.playBornAni = function(){
        if(this.m_lastVisible == false) return;

        if(!this.isVisible()) return;

        this.setBornSpritePos(this.x,this.y);

        this.m_bornAni.play(0,false);
        this.m_bornAni.visible = true;
        TimerUtil.once(1000,this,this.removeBornAni);
    }

    p.removeBornAni = function(){
        this.m_bornAni.stop();
        this.m_bornAni.visible = false;
    }

    p.setBornSpritePos = function(x,y){
        this.m_bornAni.pos(x,y);
    }

    p.onAttackAniLoaded = function(aa){
        this.m_attackAniLoaded = true;
        this.m_weaponSprite.addChild(this.m_attackAni);
        this.m_attackAni.stop();
    }

    p.onDeathAniLoaded = function(aa){
        this.m_deathAniLoaded = true;
        GameMgr.getInstance().m_mapActor.m_topContainer.addChild(this.m_deathAni);
        this.onHideDeathParticle();
    }

    p.onSpeedupAniLoaded = function(aa){
        this.m_speedupAniLoaded = true;
        this.m_sprite.addChild(this.m_speedupAni);
        this.stopSpeedupAnim();
    }

    p.onInvincibleAniLoaded = function(aa){
        this.m_invincibleAniLoaded = true;
        GameMgr.getInstance().m_mapActor.m_playerBottomContainer.addChild(this.m_invincibleAni);        
    }

    p.onLoaded = function (aa) {
        this.m_isLoaded = true;

        var cfg = this.getCfg();

        var initModelR = 75;
        var cfgModelR = cfg.modelR;
        var scale = cfgModelR / initModelR;
        this.m_skeleton.scale(scale,scale);

        if(!this.bSetName) {
            this.m_nameTxt.text = this.getName();
            this.bSetName = true;
            if(this.isMainRole()) {
                this.m_sprite.name = "RolePlayer";
            } 
            else {
                this.m_sprite.name = "Player"+this.avatar.getId();
            }
        }

        this.refreshWeapon();

        if(this.isMainRole()) {
            var map = GameMgr.getInstance().m_mapActor;
            map.lookAt(this);
        }
    }

    p.refreshWeapon = function(){
        var cfg = this.getCfg();
        var url = this.skinWeapon;
        if(this.skinWeapon == null){
            url = "weapon/" + cfg.weapon + ".png";
        }else{
            url = "weapon/" + this.skinWeapon;
        }
        var weaponRes = Laya.loader.getRes(url);
        if(weaponRes == null) {
            console.error("weaponRes null",url);
            return;
        }

        var weaponRect = this.avatar.getWeaponRect();
        this.m_weaponSprite.graphics.cleanByTexture(weaponRes,this.avatar.getWeaponX(),this.avatar.getWeaponY(),weaponRect.width,weaponRect.height);
    }

    p.setMainRole = function(mainRole){
        this.avatar.setMainRole(mainRole);        
    }

    p.isMainRole = function(){
        return this.avatar.isMainRole();
    }

    p.getCfg = function(){
        return this.avatar.getCfg();
    } 

    p.isDead = function(){
        return this.avatar.isDead();
    }

    p.getEnergyPoint = function(){
        return this.avatar.getEnergyPoint();
    }

    p.getTotalEnergyPoint = function(){
        return this.avatar.getTotalEnergyPoint();
    }

    p.getExp = function(){
        return this.avatar.getExp();
    }

    p.getLevel = function(){
        return this.avatar.getLevel();
    }

    p.getAvatar = function(){
        return this.avatar;
    }

    p.getScore = function(){
        return this.avatar.getScore();
    }

    p.syncSrvScore = function(score){
        this.avatar.setScore(score);
    }

    p.getKillNum = function(){
        return this.avatar.getKillNum();
    }

    p.getHighScore = function(){
        return this.avatar.getHighScore();
    }

    p.setHighScore = function(val){
        this.avatar.setHighScore(val);
    }

    p.syncSrvKillNum = function(killNum){
        var preKillNum = this.getKillNum();
        if(preKillNum!=killNum)
        {
            this.avatar.setKillNum(killNum);
            this.broadcastSyncKillNum(killNum,preKillNum)
            this.onSyncKillNum();
        }
         
    }
    
    p.getScoreRank = function(){
        return this.avatar.getScoreRank();
    }

    p.getKillRank = function(){
        return this.avatar.getKillRank();
    }

    p.getAccumScore = function(){
        return this.avatar.getAccumScore();
    }

    p.getAccumScoreRank = function(){
        return this.avatar.getAccumScoreRank();
    }

    p.setModelRatation = function(deg){
        
        if(!this.avatar.canModelRotate())
            return;

        if(GameConst.Online) {
            deg = parseInt(deg);
            
            var offDeg = this.avatar.getModelRotate() - deg;
            if(offDeg > -5 && offDeg < 5)
                return;

            ServerAgency.getInstance().sendRotate(deg);
        }else{
            this.avatar.setModelRatation(deg);
        }
        
    }

    p.getModelRotation = function(){
        return this.avatar.getModelRotate();
    }

    p.StartSpeedUp = function(){
        TimerUtil.loop(299,this,this.onSpeedUp,null,true);
    }

    p.EndSpeedUp = function(){
        TimerUtil.clear(this,this.onSpeedUp);
    }

    p.onSpeedUp = function(){
        if(!this.canSpeedup())
            return;

        if(GameConst.Online) {
            ServerAgency.getInstance().rpcSpeedUp();
        }
        else {
            this.avatar.speedup();
        }
    }

    p.canSpeedup = function(){
         if(this.avatar == null) return false;
         
         if(this.isDead() || PlayerStatus.Move != this.avatar.getStatus())
            return false;

        if(!GameConst.Online){
            if(this.m_totalEnergyPoint < this.getCfg().speedupCost)
                return false;
        }

        return true;
    }

    p.attack = function(){
        if(!this.avatar.canAttack())
            return;


        if(GameConst.Online) {
            ServerAgency.getInstance().rpcAttack();
        }
        else {
            if(this.avatar.attack())
                SoundMgr.getInstance().playSound(ESound.Attack);
        }
    }

    p.stopMove = function() {
        if(GameConst.Online) {
            ServerAgency.getInstance().rpcSwitchMove();
        }
        else {
            if(this.avatar.getStatus() == PlayerStatus.Move)
                this.avatar.setStatus(PlayerStatus.Idle);
            else 
                this.avatar.setStatus(PlayerStatus.Move);
        }
    }

    p.onSyncExp = function(){
        if(this.isMainRole())
            EventMgr.getInstance().event(EEvent.Player_Energy_Change);
    }

    p.onSyncKillNum = function(){
        if(this.isMainRole())
        {
            EventMgr.getInstance().event(EEvent.Player_KillNum_Change,this.getKillNum()); 
        }
    }

    p.onSyncHighScore = function(){
        if(this.isMainRole())
            EventMgr.getInstance().event(EEvent.Player_HighScore_Change,this.getHighScore());
    }

    p.onSyncKillScore = function(score,lastKillNum,curKillNum){
         if(this.isMainRole()){
             var h = parseInt(curKillNum/100);
             var d = parseInt((curKillNum - 100 * h) / 10);
             var u = curKillNum - 100 * h - d * 10;
             var revenge = this.avatar.hasRevenge();
             var killhigh = this.avatar.hasKillHighLv();
             if(!revenge && !killhigh){
                if(h > 0)
                    BroadcastMgr.getInstance().showRewardBroadcast(KDAType.KillScoreAchievement,[score,h,d,u]);
                else if(d > 0 )
                    BroadcastMgr.getInstance().showRewardBroadcast(KDAType.KillScoreAchievement,[score,d,u]);
                else if(u > 0)
                    BroadcastMgr.getInstance().showRewardBroadcast(KDAType.KillScoreAchievement,[score,u]);
             }else if(revenge){
                if(h > 0)
                    BroadcastMgr.getInstance().showRewardBroadcast(KDAType.Revenge,[score,h,d,u]);
                else if(d > 0 )
                    BroadcastMgr.getInstance().showRewardBroadcast(KDAType.Revenge,[score,d,u]);
                else if(u > 0)
                    BroadcastMgr.getInstance().showRewardBroadcast(KDAType.Revenge,[score,u]);
             }else if(killhigh){
                 if(h > 0)
                    BroadcastMgr.getInstance().showRewardBroadcast(KDAType.KillHighLv,[score,h,d,u]);
                 else if(d > 0 )
                    BroadcastMgr.getInstance().showRewardBroadcast(KDAType.KillHighLv,[score,d,u]);
                 else if(u > 0)
                    BroadcastMgr.getInstance().showRewardBroadcast(KDAType.KillHighLv,[score,u]);
             }

             this.broadcastSyncKillNum(lastKillNum,curKillNum);
         }
    }

    p.onStartAttack = function(){
        if(!this.m_attackAniLoaded) return;

        if(!this.isVisible()) return;

        this.m_attackAni.visible= true;
        this.m_attackAni.play(0,true);
    }

    p.onEndAttack = function(){
        if(!this.m_attackAniLoaded) return;

        if(!this.m_attackAni.visible) return;
        
        this.m_attackAni.stop();
        this.m_attackAni.visible= false;
    }

    p.onSyncSpeedup = function(inSpeeding){
        if(inSpeeding){
            this.playSpeedupAnim();
        }else{
            this.stopSpeedupAnim();
        }
    }

    p.onSyncInvincible = function(val){
        if(val){
            if(this.m_invincibleAni==null) {
                this.m_invincibleAni = new Laya.Animation();
                this.m_invincibleAni.loadAnimation("ani/buff_wudijiasu.ani",Laya.Handler.create(this,this.onInvincibleAniLoaded));
            }
            this.m_invincibleAni.play(0,true);
            this.m_invincibleAni.visible = true;
            

        }else if(!val && this.m_invincibleAni!=null){
            this.m_invincibleAni.stop();
            this.m_invincibleAni.visible= false;
        }
    }
    
    p.broadcastSyncKillNum = function(lastKillNum,curKillNum){
        if(this.isMainRole()){
            var incKillNum = curKillNum - lastKillNum;
            
             if(lastKillNum < 10 && curKillNum>=10){
                BroadcastMgr.getInstance().showLocalBroadcast(KDAType.KillAchievement1);
            }else if(lastKillNum < 20 && curKillNum>=20){
                BroadcastMgr.getInstance().showLocalBroadcast(KDAType.KillAchievement2);
            }else if(lastKillNum < 30 && curKillNum>=30){
                BroadcastMgr.getInstance().showLocalBroadcast(KDAType.KillAchievement3);
            }

            if(incKillNum == 2){
                this.m_doubleKill = this.m_doubleKill || 0;
                this.m_doubleKill ++;
                BroadcastMgr.getInstance().showLocalBroadcast(KDAType.DoubleKill);
                SoundMgr.getInstance().playSound(ESound.DoubleKill);
                if(GameMgr.getInstance().hasTask())
                    GameMgr.getInstance().checkTask({doubleKill:this.m_doubleKill});
            }else if(incKillNum >= 3){
                this.m_tripleKill = this.m_tripleKill || 0;
                this.m_tripleKill ++;
                BroadcastMgr.getInstance().showLocalBroadcast(KDAType.TripleKill);
                SoundMgr.getInstance().playSound(ESound.TripleKill);
                ShakeInst.stageShake(GameMgr.getInstance().m_mapActor.m_sprite);
                if(GameMgr.getInstance().hasTask())
                    GameMgr.getInstance().checkTask({tripleKill:this.m_tripleKill});
            }
        }
    }

     p.setBuffState = function(buffId){
        this.avatar.setBuffState(buffId);
    }

    p.setAILevel = function(aiLevel){
        this.avatar.setAILevel(aiLevel);
    }
    

    r2.PlayerActor = PlayerActor;
    
})();