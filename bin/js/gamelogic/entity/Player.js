/*
* Player, 玩家;
*/
 var Player = (function () {
    var Player = Class(BaseEntity);
    var p = Player.prototype;
    var _initWeaponRotation = -180;
    var _speedupTime = 300;
    var _maxMoveSpeed = 744;

    p.__BaseEntity_ctor = p.ctor;
    p.__BaseEntity_onRevive = p.onRevive;
    p.__BaseEntity_onDead = p.onDead;
    p.__BaseEntity_pos = p.pos;
    p.__BaseEntity_clear = p.clear;
  
    p.ctor = function(){
        this.__BaseEntity_ctor();

        _initWeaponRotation = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.WeaponInitRotaion) || _initWeaponRotation;
        _maxMoveSpeed = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.MaxMoveSpeed) || _maxMoveSpeed;

        this.reset();
        this.init();
    }   

    p.init = function() {
        this.m_entityType = EntityType.Player;
        this.m_isMainRole = false;
        
        this.m_weaponRect = new Rectangle();
        this.m_nexPos = new Point();
        this.m_moveBounds = new Rectangle();
        this.m_weaponInitLTPoint = new Point();
        this.m_weaponInitRTPoint = new Point();
        this.m_collisionLines = [];        
    }

    p.reset = function() {
        this.m_cfgPlayer = null;
        this.x = 0;
        this.y = 0;

        this.m_modelRatate = 0;        
        
        this.wrapper = null;
        this.m_aiAgent = null;
        this.m_isMainRole = null;
        this.m_weaponRadius = 0;
        this.m_weaponCirx = 0;
        this.m_weaponCiry = 0;
        this.m_weaponInitCirx = 0;
        this.m_weaponInitCiry = 0;
        this.m_weaponRot = _initWeaponRotation;
        this.m_offsetRot = 0;
        this.m_attackSpeed = 0;
        this.m_accumScore = 0;
        this.m_highScore = 0;
        this.m_killNum = 0;
        this.m_killScore = 0;
        this.m_name = null;
        this.m_isAI = false;
        this.m_killRank = 0;    //击杀排名
        this.m_scoreRank = 0;   //当前积分片名
        this.m_accumScoreRank = 0;  //总积分排名
        this.m_cellRow = -1;
        this.m_cellCol = -1;
        this.m_aiAgentId = 0;
        this.m_lastMoveTime = 0;
        this.m_playerLv = 0; 
        this.m_energyPoint = 0;
        this.m_totalEnergyPoint = 0;
        this.m_lastAIUpdateFrame = 0;
        this.m_updateAIInterval = 1;
        this.m_ballAddScale = 0;
        this.m_aiLevel = 1;
        this.m_buffdata = {};

        this.initData();
        this.clearData();
    }

    p.clearData = function(){
        this.m_lastPlayerLv = this.m_playerLv;//播报统计数据还需使用
        this.m_moveSpeed = 0;
        this.m_status = PlayerStatus.Idle;

        this.m_isInvicible = false;//无敌
        this.m_buffIncMoveSpeed = 1;
        this.m_buffIncAtkSpeed = 1;

        this.m_attackForward = false;
        this.m_maxWeaponRotation = 0;
        this.m_attackEndTime = 0;
        this.m_speedupEndTime = 0;
        this.m_selectTarget = null;
        this.m_weaponRot = _initWeaponRotation;
        this.m_offsetRot = 0;
        this.m_skillCDTime = 0;
        if(this.m_collisionLines!=null)
            this.clearLines();

        if(this.m_aiAgent) {
            this.m_aiAgent.stopAI();
            this.m_aiAgent.clearViewTargets();
        }
        this.m_isSpeedingup = false;    //是否正在加速
        this.m_preKillNum = 0;
        this.m_killReward = 0;
        this.m_lastCastSkillTime = 0;   //上一次释放技能的时间
        this.m_revenge = false;
        this.m_killHighLv = false;
    }
    
    p.initData = function(){
        this.m_score = 0;    
    }
    
    p.clear = function(){
        this.__BaseEntity_clear();
        TimerUtil.clearAll(this);
        this.reset();
        this.m_unvisibleBall = null;
        this.m_lastVisibalBall = null;
        this.uid = null;
        this.sid = null;

        Utils.clearDictionary(this.m_syncData);
        this.onSyncDataEnd();
    }

    p.born = function(lv){
        (lv===void 0)&& (lv=1);

        this.setVisible(true);
        this.setLevel(lv);
        this.setIsDead(false);
    }

    p.setAIAgentId = function(id,aiCnt){
        this.m_aiAgentId = id%aiCnt;
    }

    p.isMainRole = function(){
        return this.m_isMainRole;
    }

    p.setMainRole = function(mainRole){
        this.m_isMainRole = mainRole;
    }

    p.setInvincible = function(val){
        this.m_isInvicible = val;
        if(!val) {
            this.clearInvincible();
            return;
        }
        var time = DataMgr.getInstance().getBuffData(BuffType.Invincible).durationMS;
        TimerUtil.once(time,this,this.clearInvincible);
        var buff = DataMgr.getInstance().getBuffData(BuffType.IncMoveSpeed);
        this.m_buffIncMoveSpeed = buff.effectVal;
        buff = DataMgr.getInstance().getBuffData(BuffType.IncAtkSpeed);
        this.m_buffIncAtkSpeed = buff.effectVal;
        this.calcMoveSpeed();
        this.onSyncSpeedup(true);
        this.calcAtkSpeed();
        this.onSyncInvincible(true);
    }
    p.isInvincible = function(){
        return this.m_isInvicible;
    }
    p.clearInvincible = function(){
        this.m_isInvicible = false;
        this.m_buffIncMoveSpeed = 1;
        this.m_buffIncAtkSpeed = 1;
        this.calcMoveSpeed();
        this.onSyncSpeedup(false);
        this.calcAtkSpeed();
        this.onSyncInvincible(false);
    }

    p.initMapMgr = function(mapMgr){
        this._mapMgr = mapMgr;
    }

    p.setLevel = function(lv) {
        if(this.m_playerLv == lv)
            return false;

        var playerJson = DataMgr.getInstance().playerCfgData;
        var cfgPlayer = playerJson[lv.toString()];
        if(cfgPlayer == null)
        {
            return false;
        }

        this.m_cfgPlayer = cfgPlayer;
        this.m_skillCDTime = this.m_cfgPlayer.skillCDTime + Math.random() * 0.3;

        this.calcMoveSpeed();

        var cfgModelR = this.m_cfgPlayer.modelR;
        this.setRadius(cfgModelR);
        
        var map = this._mapMgr.m_curMap;
        var bounds = null;
        if(this.m_isAI)
            bounds = map.getAIBounds();
        else
            bounds = map.getBounds();
        this.m_moveBounds.setTo(bounds.x+cfgModelR,bounds.y+cfgModelR,bounds.width-2*cfgModelR,bounds.height-2*cfgModelR);
        this.width=this.height=cfgModelR*2;        
        
        if(!GameConst.Online || GameConst.Server){
            if(this.m_playerLv == 0)
            {
                this.bornRandomPos();
            }  
        }
        
        var oldLv = this.m_playerLv;
        this.m_playerLv = lv;
        this.setWeaponData();
        this.onSyncLevel(oldLv,lv);
        this.updateAIDiff();
        return true;
    }

    p.setAILevel = function(aiLevel){
        this.m_aiLevel = aiLevel;
        this.updateAIDiff();
    }

    p.updateAIDiff = function(){
        if(this.wrapper == null) return;

        var aiDiff = null;
        if(GameMgr.getInstance().isGradeMode()) {
            var data = DataMgr.getInstance().getUserGradeAIData();
            var id = data&&data.ai||1;
            aiDiff = DataMgr.getInstance().getAIDifficulty(id,this.m_playerLv);
        }
        else {
            aiDiff = DataMgr.getInstance().getAIDifficulty(this.m_aiLevel,this.m_playerLv);
        }
        this.wrapper.setAIDiff(aiDiff);
        this.m_updateAIInterval = aiDiff.aiInterval;
        this.m_ballAddScale = aiDiff.addScale;
    }

    p.bornRandomPos = function(){
        var pos = this._mapMgr.m_curMap.getNearestCellPosWithoutPlayer(this.m_cellRow,this.m_cellCol);
        this.pos(pos.x,pos.y);
        this.setModelRatation(Math.random() * 360);
    }

    p.getLevel = function(){
        return this.m_playerLv;
    }

    p.getLastLevel = function(){
        return this.m_lastPlayerLv;
    }

    p.getEnergyPoint = function(){
        return this.m_energyPoint;
    }

    p.getTotalEnergyPoint = function(){
        return this.m_totalEnergyPoint;
    }

    p.setTotalEnergyPoint = function(val){
        this.m_totalEnergyPoint = val;
    }

    p.getStatus = function(){
        return this.m_status;
    }

    p.setStatus = function(stat){
        this.m_status = stat;
    }

    p.isSpeedingUp = function(){
        return this.m_isSpeedingup;
    }

    p.getExp = function(){
        if(this.m_cfgPlayer == null) return 0;

        return this.m_cfgPlayer.exp;
    }

    p.getName = function(){
        return this.m_name;
    }

    p.setName = function(name){
        this.m_name = name;
    }

    p.getCfg = function(){
        return this.m_cfgPlayer;
    }

    p.setIsAI = function(isAI) {
        this.m_isAI = isAI;
    }

    p.getIsAI = function() {
        return this.m_isAI;
    }

    //挂机
    p.switchAI = function() {        
        if(this.m_aiAgent != null) {
            return this.m_aiAgent.switchRunning();
        }
        else {
            this.setupAIAgent();
            return true;
        }
    }

    p.switchMove = function() {
        // if(this.m_status == PlayerStatus.Idle)
            this.setStatus(PlayerStatus.Move);
        // else 
        //     this.setStatus(PlayerStatus.Idle);
    }

    p.getModelRotate = function(){
        return this.m_modelRatate;
    }

    p.getWeaponX = function(){
        return this.m_weaponInitX;
    }

    p.getWeaponY = function(){
        return this.m_weaponInitY;
    }

    p.setWeaponData = function () {
        var cfg = this.getCfg();

        var cfgModelR = cfg.modelR;
        var scale = this.m_buffdata[BuffType.IncAtkDistance]||1;
        this.m_weaponRect.width = cfg.attackR * scale;
        this.m_weaponRect.height = cfg.weaponH * scale;

        this.m_weaponInitX = 0;
        this.m_weaponInitY = cfgModelR - cfg.weaponH/2;

        var temp = this.m_weaponRect.height/2 + cfgModelR;
        this.m_weaponRadius = Math.sqrt(this.m_weaponRect.width * this.m_weaponRect.width + temp  * temp);
        this.setWeaponRotation(this.m_weaponRot);
        if(this.m_isAI)
            this.setupAIAgent();

        if(this.getStatus() != PlayerStatus.Attack)
            this.setStatus(PlayerStatus.Move);
    }

    p.setupAIAgent = function() {
        if(this.wrapper == null){
            this.wrapper = new AIAgentObject(this);
        }

        if(this.m_aiAgent == null) {
            this.m_aiAgent = new AIAgent();
            this.m_aiAgent.startAI(this,this.m_cfgPlayer.aiName);
        }
        this.m_aiAgent.setIsRunning(true);
    }

    p.onDead = function(killer) {
        if(this.m_isInvicible)
            return;
     
        this.m_selectTarget = null;
        this.m_lastTotalEnergyPoint = this.m_totalEnergyPoint;
        this.syncMapCell(false);
        this.clearData();
        this.__BaseEntity_onDead(killer);

        if(killer!=null){
            this.m_killerId = killer.getId();
            this.m_killerX = killer.x;
            this.m_killerY = killer.y;
            var buff = killer.getBuffState(); 
            if(buff!=null) {
                for(var effectType in buff) {
                    if(buff.effectType == BuffType.IncKillBall || buff.effectType == BuffType.IncAllScore)
                        this.m_score *= buff[effectType];
                }
            }
        }

        if(this.m_isMainRole)
        {
            if(GameMgr.getInstance().isGradeMode()){
                if(GameMgr.getInstance().checkNoInvincible(this.m_playerLv))
                {
                    if(GameConst.OneLife && this.m_score >= 516) {
                        GameMgr.getInstance().onOneLifeDead();
                    }
                    else {
                        TimerUtil.once(1000,this,this.onRevive);
                    }
                }
            }
            EventMgr.getInstance().event(EEvent.MainRoleDie);
        }
        else
        {
            if(this.m_killerId!=null){
                this._mapMgr.generateKillBall(this.m_score,this.m_killerX,this.m_killerY,this.x,this.y,this.getRadius());
            }
            TimerUtil.once(1000,this,this.onRevive);
        }
        this.setVisible(false);
    }

    p.onRevive = function(isShared,noRandomPos){
        this.setVisible(true);
        if(isShared) {
            // var energy = this.m_lastTotalEnergyPoint - DataMgr.getInstance().getGlobalCfg(EGlobalCfg.OneLifeShareSubScore);
            // var energy = this.m_lastTotalEnergyPoint;//满血复活
            // if(energy < 0) energy = 0;
            // this.m_accumScore = 0;
            // this.addEnergyPoint(energy);
            // var lv = DataMgr.getInstance().getPlayerLvBySumExp(energy);
            // this.setLevel(lv);
            // this.subEnergyPoint(DataMgr.getInstance().getTotalEnergyByLevel(lv),false);
        }else {
            if(this.m_isMainRole && this.m_killerId!=null) {
                this._mapMgr.generateKillBall(this.m_score,this.m_killerX,this.m_killerY,this.x,this.y,this.getRadius());
            }
            this.initData();
            this.m_killerId = null;
            this.m_energyPoint = 0;
            this.m_totalEnergyPoint = 0;
            this.m_playerLv = 0;
            this.setLevel(1);
        }

        if(!noRandomPos)
            this.bornRandomPos();

        this.setIsDead(false);
        this.calcMoveSpeed();
        this.setStatus(PlayerStatus.Move);
        // this._mapMgr.syncDeathStatus(this.getId(),false,0);
        this.__BaseEntity_onRevive();

        if(this.m_isServerAIRunning)
            this.setupAIAgent();
        
        if(this.m_isMainRole){
            EventMgr.getInstance().event(EEvent.MainRoleRevive);
        }
    }
    
    p.update = function() {
        if(this.m_isDead)
            return;

        if(this.m_aiAgent != null) {
            if(TimerUtil.currFrame()%30 == this.m_aiAgentId){
                 this.m_aiAgent.update(); 
            }else{
                if(this.wrapper.isMoving())
                    this.wrapper.moveTo();

                 if(TimerUtil.currFrame() % 6 == 0) {
                    this._mapMgr.checkBallCollision(this); 
                }     
            }
        }

        this.onAttacking();

        if(this.m_aiAgent == null) {
            this.onMoving();   
            if(TimerUtil.currFrame() % 6 == 0) {
                this._mapMgr.checkBallCollision(this); 
            }        
        }
    }

    p.rotateToPos = function(tx,ty) {
        var angle = Utils.getAngle(this.x,this.y,tx,ty);
        this.setModelRatation(angle);
    }

    p.syncSrvPos = function(x,y){
        this.pos(x, y);
    }
    
    p.pos = function(x,y) {
        this.setPos(x,y);
        if(GameConst.Server || !GameConst.Online){
            this.checkEdgeDeath();
        }
    }

    p.setPos = function(x,y){
        this.__BaseEntity_pos(x,y);
        var cell = this._mapMgr.getMapCell(x,y);
        if(cell!=null){
            this.m_cellRow = cell.row();
            this.m_cellCol = cell.col();
            cell.setHasPlayer(true);
        }

    }

    p.checkEdgeDeath = function(){
        if(this.isOnEdge()){
            this.onDead(null);
        }
    }

    p.isOnEdge = function(){
        return this._mapMgr.m_curMap.isEdge(this.x,this.y,this.getRadius());
    }

    p.isAIEdge = function(){
        return this._mapMgr.m_curMap.isAIEdge(this.x,this.y,this.getRadius());
    }

    p.syncMapCell = function(exist){
        var mapcell = this._mapMgr.m_curMap.getCellByIndex(this.m_cellRow,this.m_cellCol);
        if(mapcell == null) return;
        
        mapcell.setHasPlayer(exist);
    }

    p.setScore = function(score){
        this.m_score = Math.ceil(score);
        this.setHighScore(score);
    }

    p.getScore = function(){
        return this.m_score;
    }

    //累加分数
    p.getAccumScore = function(){
        return this.m_accumScore || 0;
    }

    p.setAccumScore = function(val){
        this.m_accumScore = val;
        if(this.m_isMainRole && GameMgr.getInstance().hasTask()) {
            GameMgr.getInstance().checkTask({sumScore:this.m_accumScore});
        }
    }

    //最高分数
    p.getHighScore = function(){
        return this.m_highScore;
    }
    p.setHighScore = function(val){
        val = val > this.m_highScore ? val : this.m_highScore;
        if(val == this.m_highScore)
            return;
        this.m_highScore = val;
        this.onSyncHighScore();

        if(this.m_isMainRole && GameMgr.getInstance().hasTask()) {
            GameMgr.getInstance().checkTask({highScore:this.m_highScore});
        }
    }

    p.setKillNum = function(killnum){
        this.m_killNum = killnum;
    }

    p.getKillNum = function(){
        return this.m_killNum;
    }

    p.addKillNum = function(score){
        this.m_killNum += 1;
        this.m_killScore +=Math.ceil(score);
        this.onSyncKillNum();    

        if(this.m_isMainRole && GameMgr.getInstance().hasTask()) {
            GameMgr.getInstance().checkTask({killCnt:this.m_killNum});
        }    
    }

    p.getKillScore = function(){
        return this.m_killScore;
    }

    p.getKillRank = function(){
        return this.m_killRank;
    }

    p.setKillRank = function(rank){
        this.m_killRank = rank;
    }

    p.getScoreRank = function(){
        return this.m_scoreRank;
    }

    p.setScoreRank = function(rank){
        this.m_scoreRank = rank;
    }

    p.getAccumScoreRank = function(){
        return this.m_accumScoreRank;
    }

    p.setAccumScoreRank = function(rank){
        this.m_accumScoreRank = rank;
    }

    p.getHighScoreRank = function(){
        return this.m_highScoreRank;
    }

    p.setHighScoreRank = function(rank){
        this.m_highScoreRank = rank;
    }

    p.getBattleEndStar = function() {
        var star = 0;
        if(this.m_killRank <= 3)
            star ++;
        if(this.m_scoreRank <= 3)
            star ++;
        if(this.m_highScoreRank <= 3)
            star ++;
        return star;
    }
    
    p.canModelRotate = function() {
        if(this.m_isDead || this.getStatus() == PlayerStatus.Attack)
            return false;
        return true;
    }

    p.setModelRatation = function(rotate) {
        if(!this.canModelRotate())
            return;

        // this.m_modelRatate = Math.round(rotate);
        this.m_modelRatate = rotate;
        if(isNaN(this.m_modelRatate)) {
            console.error("modelRatate isNaN");
            this.m_modelRatate = 0;
        }
        this.setWeaponCircle(0);
        this.onSyncRotaion();
        // this._mapMgr.syncModelRot(this.getId(),rotate);
    }

    p.syncModelRot = function(rotate){
        this.m_modelRatate = Math.round(rotate);
        if(isNaN(this.m_modelRatate)) {
            console.error("modelRatate isNaN");
            this.m_modelRatate = 0;
        }
        this.setWeaponCircle(0);
        this.onSyncRotaion();
    }

    p.setWeaponCircle = function(rotate){
        if(this.m_weaponRect!=null)
        {
            if(rotate == 0 && this.m_weaponRect.width > 0)
            {
                var radius = this.m_cfgPlayer.modelR;
                var angle = this.m_modelRatate+rotate;
                var cosVal = Utils.getCos(angle);
                var sinVal = Utils.getSin(angle);
                this.m_weaponCirx = this.x + radius * sinVal;
                this.m_weaponCiry = this.y - radius * cosVal;

                this.m_weaponInitCirx = this.m_weaponCirx;
                this.m_weaponInitCiry = this.m_weaponCiry;

                var temp = this.m_weaponRect.height/2 + radius;
                var w = this.m_weaponRect.width,h = this.m_weaponRect.height;
                var angle = Utils.radToDeg(Math.atan(w/temp));
                var angle2 = this.m_modelRatate + rotate  - angle;
                var cosVal2 = Utils.getCos(angle2);
                var sinVal2 = Utils.getSin(angle2);

                this.m_weaponInitLTPoint.x = this.x + this.m_weaponRadius * sinVal2;
                this.m_weaponInitLTPoint.y = this.y - this.m_weaponRadius * cosVal2;

                this.m_weaponInitRTPoint.x = this.x + temp * sinVal;
                this.m_weaponInitRTPoint.y = this.y - temp * cosVal;
            }
        }
    }

    p.setWeaponRotation = function(rotate) {
        if(isNaN(rotate))
        {
            console.error('setWeaponRotation err',rotate);
            rotate = 0;
        }

        var rot = rotate;
        this.m_weaponRot = rot;
        var lastOffsetRot = this.m_offsetRot;
        this.m_offsetRot = rot - _initWeaponRotation;
        this.setWeaponCircle(this.m_offsetRot);
       
        if(this.canCheckAttackCollision()){
            this.clearLines();
            
            if(!this.getIsAI()){
                var line = null;
                var sampleCnt = parseInt((this.m_offsetRot - lastOffsetRot)/5);
                for(var i = 0; i < sampleCnt;i++){
                    var line = this.sampleLine(lastOffsetRot + i * sampleCnt);
                    this.m_collisionLines.push(line);
                }
            }

            line = this.sampleLine(this.m_offsetRot);
            this.m_collisionLines.push(line);
            this.m_weaponRect.x = line.sx;
            this.m_weaponRect.y = line.sy;
            this._mapMgr.checkHitPlayer(this);
        }
        this.onSyncWeapon();
        // this._mapMgr.syncWeaponRot(this.getId(),this.m_weaponRot);
    }

    p.syncWeaponRotation = function(rotate){
        if(isNaN(rotate))
        {
            console.error('setWeaponRotation err',rotate);
            rotate = 0;
        }
        var rot = Math.round(rotate);
        this.m_weaponRot = rot;
        var lastOffsetRot = this.m_offsetRot;
        this.m_offsetRot = rot - _initWeaponRotation;
        this.setWeaponCircle(this.m_offsetRot);
        this.onSyncWeapon();
    }

    p.sampleLine = function(rot){
        var line = this._mapMgr.generateLine();

        var wx = this.m_weaponInitLTPoint.x;
        var wy = this.m_weaponInitLTPoint.y;
        var cosVal = Utils.getCos(rot);
        var sinVal = Utils.getSin(rot);

        line.sx = (wx - this.x) * cosVal - (wy - this.y) * sinVal + this.x;
        line.sy = (wx - this.x) * sinVal + (wy - this.y) * cosVal + this.y;

        wx = this.m_weaponInitRTPoint.x;
        wy = this.m_weaponInitRTPoint.y;
        line.ex = (wx - this.x) * cosVal - (wy - this.y) * sinVal + this.x;
        line.ey = (wx - this.x) * sinVal + (wy - this.y) * cosVal + this.y;
        return line;
    }

    p.clearLines = function(){
        var len = this.m_collisionLines.length;
        for(var i =0; i < len;i++){
            var line = this.m_collisionLines[i];
            this._mapMgr.recoverLine(line);
        }
        this.m_collisionLines.length = 0;
    }    

    p.getWeaponRect = function(){
        return this.m_weaponRect;
    }

    p.getWeaponRot = function(){
        return this.m_weaponRot;
    }

    p.getWeaponCircleX = function(){
        return this.m_weaponCirx;
    }

    p.getWeaponCircleY = function(){
        return this.m_weaponCiry;
    }

    p.getWeaponInitCircleX = function(){
        return this.m_weaponInitCirx;
    }

    p.getWeaponInitCircleY = function(){
        return this.m_weaponInitCiry;
    }

    p.canSpeedup = function() {
        if(this.m_isInvicible || this.m_isDead || PlayerStatus.Move != this.getStatus())
            return false;

        if(this.m_totalEnergyPoint < this.m_cfgPlayer.speedupCost)
            return false;

        return true;
    }

    p.speedup = function() {
        if(!this.canSpeedup()) return;

        this.m_isSpeedingup = true;

        this.subEnergyPoint(this.m_cfgPlayer.speedupCost,true);
        this.calcMoveSpeed();
        this.m_speedupEndTime = TimerUtil.currTimer() + _speedupTime;
        this.onSyncSpeedup(true);

    }

    p.calcMoveSpeed = function() {
        var buffval = this.m_buffdata&&this.m_buffdata[BuffType.IncMoveSpeed] || 1;
        if(this.m_isSpeedingup) {
            this.m_moveSpeed = Math.round(this.m_cfgPlayer.moveSpeed * ( 1+ this.m_cfgPlayer.addSpeed * 0.01)* this.m_buffIncMoveSpeed * buffval);
        }
        else {
            this.m_moveSpeed = Math.round(this.m_cfgPlayer.moveSpeed * this.m_buffIncMoveSpeed * buffval);
        }
        if(this.m_moveSpeed > _maxMoveSpeed)
            this.m_moveSpeed = _maxMoveSpeed;
        // if(this.m_isMainRole)
        //     console.log("role speed:"+this.m_moveSpeed);
    }

    p.calcAtkSpeed = function(){
        var buffval = this.m_buffdata&&this.m_buffdata[BuffType.IncAtkSpeed] || 1;
        this.m_attackSpeed = (this.m_cfgPlayer.attackAngle * 2) / this.m_cfgPlayer.attackInterval * this.m_buffIncAtkSpeed * buffval;
    }

    p.setEnergyPoint = function(point) {
        this.m_energyPoint = point;
        this.onSyncExp();
    }

    p.addEnergyPoint = function(point){
        this.m_energyPoint += point;
        this.m_totalEnergyPoint += point;
        this.setScore(this.m_score + point);
        this.setAccumScore(this.m_accumScore + point);
        this.onSyncExp();
        this._mapMgr.refreshAccumScore(this);
    }

    p.subEnergyPoint = function(point,speedup){
        this.m_energyPoint -= point;
        if(this.m_energyPoint < 0)
            this.m_energyPoint = 0;

        if(speedup)
        {
            this.m_score -= point;
            if(this.m_score < 0)
                this.m_score = 0;

            this.m_totalEnergyPoint -=point;
            if(this.m_totalEnergyPoint < 0)
                this.m_totalEnergyPoint = 0;
            if(this.m_energyPoint == 0){
                this.setLevel(this.m_playerLv-1);
                if(this.m_totalEnergyPoint > this.m_cfgPlayer.exp)
                    this.m_energyPoint = this.m_totalEnergyPoint - DataMgr.getInstance().getTotalEnergyByLevel(this.m_cfgPlayer.lv);
                else
                    this.m_energyPoint = this.m_totalEnergyPoint;
            }
        }

        this.onSyncExp();
    }

    p.canAttack = function() {
        if(this.m_isDead || PlayerStatus.Attack == this.getStatus())
            return false;

        var curTime = TimerUtil.currTimer();
        if(curTime < this.m_attackEndTime)
            return false;

        return true;
    }

    p.attack = function() {
        if(!this.canAttack()) return false;

        this.m_attackEndTime = TimerUtil.currTimer() + this.m_cfgPlayer.attackInterval*1000;
        this.setStatus(PlayerStatus.Attack);
        this.m_attackForward = true;
        this.m_maxWeaponRotation = _initWeaponRotation+this.m_cfgPlayer.attackAngle;
        this.m_attackSpeed = (this.m_cfgPlayer.attackAngle * 2) / this.m_cfgPlayer.attackInterval;
        this.setWeaponRotation(_initWeaponRotation);
        this.m_lastCastSkillTime = TimerUtil.currTimer();
        this.recordKillData();
        return true;
    }

    p.recordKillData = function(){
        this.m_preKillNum = this.m_killNum;
        this.m_killScore = 0;
        this.onStartAttack();
    }

    p.calcKillData = function(){
        this.onEndAttack();
        if(this.m_killScore > 0)
            this.onSyncKillScore(this.m_killScore,this.m_preKillNum,this.m_killNum);
    }

    p.onAttacking = function() {
        if(PlayerStatus.Attack != this.getStatus())
            return;

        if(this.m_attackEndTime != 0 && TimerUtil.currTimer() > this.m_attackEndTime)
        {
            this.m_attackEndTime = 0;
            this.setWeaponRotation(_initWeaponRotation);
            this.setStatus(PlayerStatus.Move);
            return;
        }

        var delta = TimerUtil.delta() / 1000;
        var rotation = this.m_attackSpeed * delta;
        if(this.m_attackForward == false)
            rotation = -rotation;
        var newRotation = rotation + this.m_weaponRot;
        if(newRotation > this.m_maxWeaponRotation) {
            newRotation = this.m_maxWeaponRotation;
            this.calcKillData();
            this.m_attackForward = false;
        }
        else if(this.m_weaponRot < _initWeaponRotation) {
            newRotation = _initWeaponRotation;
        }
        this.setWeaponRotation(newRotation);
    }

    p.onMoving = function() {
        if(PlayerStatus.Move != this.getStatus()) {
            return;
        }
        this.onMove();
    }

    p.onMove = function(){
        var delta = 0;
        if(this.m_lastMoveTime == 0)
            delta = TimerUtil.delta() / 1000;
        else
            delta = (TimerUtil.currTimer() - this.m_lastMoveTime)/1000;
        if(delta < 0.01) return false;

        if(this.m_speedupEndTime != 0 && TimerUtil.currTimer() >= this.m_speedupEndTime) {
            this.m_speedupEndTime = 0;
            this.m_isSpeedingup = false;
            this.calcMoveSpeed();
            this.onSyncSpeedup(false);
        }
        
        var dt = TimerUtil.delta() / 1000;

        var distance = this.m_moveSpeed * dt;

        var cosVal = Utils.getCos(this.m_modelRatate);
        var sinVal = Utils.getSin(this.m_modelRatate);
        

        var newX = distance * cosVal + this.x;
        var newY = distance * sinVal + this.y;
        newX = Utils.clamp(newX,this.m_moveBounds.x,this.m_moveBounds.right);
        newY = Utils.clamp(newY,this.m_moveBounds.y,this.m_moveBounds.bottom);
        this.pos(newX, newY);

        distance = this.m_moveSpeed * dt;
        var nx = distance * cosVal + newX;
        var ny = distance * sinVal + newY;
        nx = Utils.clamp(nx,this.m_moveBounds.x,this.m_moveBounds.right);
        ny = Utils.clamp(ny,this.m_moveBounds.y,this.m_moveBounds.bottom);
        this.m_nexPos.setTo(nx,ny);
        this.m_lastMoveTime = TimerUtil.currTimer();
        return true;
    }
    
    p.tackEnergy = function(energy) {
        energy = Math.ceil(energy);
        this.addEnergyPoint(energy);
        var exp = this.m_cfgPlayer.exp;
        if(this.m_energyPoint > exp) {
            var costEnergy = 0;
            var level = this.m_playerLv;
            var playerJson = DataMgr.getInstance().playerCfgData;
            var cfgPlayer = null;
            var tempEnergy = this.m_energyPoint;
            while(tempEnergy > 0 && level <= 20 )
            {
                if(level > 0){
                    var cfgPlayer = playerJson[level.toString()];
                    if(tempEnergy < cfgPlayer.exp) break;

                    tempEnergy -= cfgPlayer.exp;
                    costEnergy+= cfgPlayer.exp;
                }
                
                level+=1;
            }

            if((level > this.m_playerLv) && this.setLevel(level)) {
                this.subEnergyPoint(costEnergy,false);
            }
        }
    }

    p.onCollision = function(target) {
        if(target.getEntityType() == EntityType.EnergyBall) {
            if(target.intersetCircle(this)) {   
                var exp = target.getEnergyPoint();
                exp = parseInt((1 + this.m_ballAddScale/100) * exp);
                target.onDead(this);
                var times = this.m_buffdata[BuffType.IncAllScore] || 1;
                exp = exp * times;
                this.tackEnergy(exp);
                return true;
            }
        }
        else if(target.getEntityType() == EntityType.Player) {
            if(this.canCheckAttackCollision() && this != target)
            { 
                if(this.hittedPlayer(target)){
                    var reward = target.GetKillReward();

                    if(this.m_buffdata !=null){
                        for(var effectType in this.m_buffdata) {
                            if(effectType == BuffType.IncKillScore || effectType == BuffType.IncAllScore) {
                                reward *= this.m_buffdata[effectType];
                            }
                        }
                    }

                    target.onDead(this);
                    this.tackEnergy(reward);
                    this.addKillNum(reward);
                    return true;
                }
            }   
        }

        return false;
    }

    p.hittedPlayer = function(target){
        var len = this.m_collisionLines.length;
        if(len == 0) return false;

        for(var i =len-1; i >=0;i--){
            var line = this.m_collisionLines[i];
            if(target.intersetWithLine(line.sx,line.sy,line.ex,line.ey))
            {
                return true;
            }
        }

        if(Utils.getDistance(target.x,target.y,this.x,this.y) < this.getRadius())
            return true;

        return false;
    }

    p.canCheckAttackCollision = function(){
        return this.getStatus() == PlayerStatus.Attack  && this.m_attackForward;
    }

    p.GetKillReward = function(){
        return this.m_cfgPlayer.killAward;
    }

    p.getQuadtreeObject = function(){
        this.m_quadTreeObj = this.m_quadTreeObj || {width:1320,height:760};
        this.m_quadTreeObj.x = this.x;
        this.m_quadTreeObj.y = this.y;
        return this.m_quadTreeObj;
    }

    /** Server Sync */
    p.getSyncData = function(isDetail) {
        var data = this.m_syncData;
        if(data == null) {
            data = {};
            this.m_syncData = data;
        }
        
        if(this.m_syncDataChange == false)
            return data;

        data.x = this.x;
        data.y = this.y;

        if(isDetail) {
            data.id = this.m_id;
            // data.x = this.x;
            // data.y = this.y;
            if(this.m_name == null) {
                console.error('player syncData name is null');
                this.m_name = "";
            }
            data.name = this.m_name;
            data.rotate = this.m_modelRatate;
            data.lv = this.m_playerLv;
            data.status = this.m_status;
            data.exp = this.m_energyPoint;
            data.dead = this.m_deadSign;
            data.weaponRot = this.m_weaponRot;
            data.score = this.m_score;
            data.killNum = this.m_killNum;
            data.speed = this.m_moveSpeed;
            data.lastAttackId = this.getLastAttackId();
        }
        else {
            delete data.name;
            // delete data.x;
            // delete data.y;
            delete data.rotate;
            delete data.lv;
            delete data.status;
            delete data.exp;
            delete data.dead;
            delete data.weaponRot;
            delete data.score;
            delete data.killNum;
            delete data.killScore;
            delete data.speed;
            delete data.lastAttackId;

            // if(this.m_syncX != this.x)
            //     data.x = this.x;
            // if(this.m_syncY != this.y)
            //     data.y = this.y;            
            if(this.m_syncName != this.m_name && this.m_name != null)
                data.name = this.m_name;
            if(this.m_syncModelRot != this.m_modelRatate)
                data.rotate = this.m_modelRatate;
            if(this.m_syncLv != this.m_playerLv)
                data.lv = this.m_playerLv;
            if(this.m_syncStatus != this.m_status)
                data.status = this.m_status;
            if(this.m_syncExp != this.m_energyPoint)
                data.exp = this.m_energyPoint;
            if(this.m_syncDead != this.m_deadSign){
                data.dead = this.m_deadSign;
            }
            if(this.m_syncWeaponRot != this.m_weaponRot)
                data.weaponRot = this.m_weaponRot;
            // if(this.m_syncScore != this.m_score)
            //     data.score = this.m_score;
            if(this.m_syncKillNum != this.m_killNum){
                data.killNum = this.m_killNum;
                data.killScore = this.m_killScore;
            }
            if(this.m_syncSpeed != this.m_moveSpeed) {
                data.speed = this.m_moveSpeed;
            }
            var lastAttackId = this.getLastAttackId();
            if(this.m_syncLastAttackId != lastAttackId)
                data.lastAttackId = lastAttackId;

            // console.log(data)
        }
        this.m_syncDataChange = false;

        return data;
    }

    p.onSyncDataEnd = function() {
        this.m_syncX = this.x;
        this.m_syncY = this.y;
        this.m_syncName = this.m_name;
        this.m_syncModelRot = this.m_modelRatate;
        this.m_syncLv = this.m_playerLv;
        this.m_syncStatus = this.m_status;
        this.m_syncExp = this.m_energyPoint;
        this.m_syncDead = this.m_deadSign;
        this.m_syncWeaponRot = this.m_weaponRot;
        this.m_syncScore = this.m_score;
        this.m_syncKillNum = this.m_killNum;
        this.m_syncSpeed = this.m_moveSpeed;
        this.m_syncLastAttackId = this.getLastAttackId();

        this.m_syncDataChange = true;
    }

    p.getLastAttackId = function() {
        if(this._mapMgr == null || this._mapMgr.m_kdaSta == null) return 0;
        
        var playerKDA = this._mapMgr.m_kdaSta.findPlayerKDA(this.m_id);
        if(playerKDA != null)
            return playerKDA.getAttackId();
        return 0;
    }

    p.setRevengeStatus = function(val){
        this.m_revenge = val;
    }

    p.hasRevenge = function(){
        return this.m_revenge;
    }

    p.setKillHighLvStatus = function(val){
        this.m_killHighLv = val;
    }

    p.hasKillHighLv = function(){
        return this.m_killHighLv;
    }

    p.setBuffState = function(buffId){
        this.m_buffdata = this.m_buffdata || {};
        var cfg = DataMgr.getInstance().getBuffData(buffId);
        if(cfg == null) return;
        
        this.m_buffdata[cfg.effectType] = this.m_buffdata[cfg.effectType] || 0;
        var addVal = cfg.effectVal;
        if(buffId == 6 && this.m_buffdata[cfg.effectType] > 1)
            addVal -= 1;
        this.m_buffdata[cfg.effectType] += addVal;
    }

    p.getBuffState = function(){
        return this.m_buffdata;
    }

    p.addSkinBuffState = function(skinId){
        var skin = SkinMgr.getInstance().getSkinById(skinId);
        if(skin == null) return;

        this.m_buffdata = this.m_buffdata || {};
        this.m_buffdata[skin.getBuffType()] = 1 + skin.getBuffVal() / 100;
    }

    p.setGrowProp = function(grow){
        for(var id in grow) {
            var lv = grow[id] || 0;
            var cfg = DataMgr.getInstance().getGrowPropCfg(id,lv);
            if(cfg == null) continue;
            var val = this.m_buffdata[cfg.bufftype] || 1;
            val = val * (1 + cfg.buffval/100);
            this.m_buffdata[cfg.bufftype] = val;
            if(cfg.bufftype == BuffType.IncMoveSpeed) {
                this.calcMoveSpeed();
            }
            else if(cfg.bufftype == BuffType.IncAtkSpeed) {
                this.calcAtkSpeed();
            }
            else if(cfg.bufftype == BuffType.IncAtkDistance) {
                this.setWeaponData();
                if(this.m_iActor)
                    this.m_iActor.refreshWeapon();
            }
        }
    }

    p.setTarget = function(target){
        this.m_selectTarget = target;
    }

    p.getTarget = function(){
        return this.m_selectTarget;
    }
    

    return Player;
}());