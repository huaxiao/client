/*
* MainView 主界面;
*/
var MainView = (function (_super) {
    var _maxBarWidth;
    var _lvClip2InitX;
    var _lvClipCenterX;

    function MainView() {
        MainView.__super.call(this);

        _maxBarWidth = Laya.stage.width;
        this.canvasTexture = null;

        this.lvupAni.on(Laya.Event.COMPLETE,this,this.onAniComplete);
        this.Attack.on(Laya.Event.COMPLETE,this,this.onAttackAniComplete);        

        EventMgr.getInstance().on(EEvent.Player_Lvup,this,this.onPlayerLvup);
        EventMgr.getInstance().on(EEvent.Player_Energy_Change,this,this.onEnergyChange);
        EventMgr.getInstance().on(EEvent.Player_Rank_Update,this,this.onRankUpdate);
        EventMgr.getInstance().on(EEvent.Player_KillNum_Change,this,this.onRefreshKillNum);
        EventMgr.getInstance().on(EEvent.Battle_Time_Change,this,this.onRefreshBattleTime);
        EventMgr.getInstance().on(EEvent.Player_HighScore_Change,this,this.onRefreshHighScore);
        EventMgr.getInstance().on(EEvent.Broadcast_Show_Content,this,this.onShowBroacastContent);
        EventMgr.getInstance().on(EEvent.Broadcast_Clear_Content,this,this.onClearBroadcastContent);
        EventMgr.getInstance().on(EEvent.Main_OverFriend_Change,this,this.onChangeOverFriend);
        EventMgr.getInstance().on(EEvent.TaskTrigger,this,this.showTaskInfo);
        EventMgr.getInstance().on(EEvent.TaskFinish,this,this.showTaskInfo);
        EventMgr.getInstance().on(EEvent.RefreshEndlessHighest,this,this.refreshEndlessHighest);
        EventMgr.getInstance().on(EEvent.RefreshFriendRank,this,this.refreshFriendRank);

        Laya.stage.on(Laya.Event.FOCUS_CHANGE,this, this.onFocusChange);
        Laya.stage.on(Laya.Event.RESIZE,this, this.onScreenResize);
        

        this.energyBar._setLayoutEnabled(true);
        // this.energyBar.scaleX = 0;
        this.onEnergyChange();
        this.energyBar.visible = true;

        this.lvupImg.visible = false;

        //joystick init
       if(Utils.onMobile())
       {
           this.m_joystick = new JoystickModule(this.m_joystickview,this.m_joystickbtn,this.thumb,this.joystick_touch,this.joystick_center);
           this.m_joystick.on(JoystickModule.JoystickMoving, this, this.onJoystickMoving);
           this.m_joystick.on(JoystickModule.JoystickUp, this, this.onJoystickUp);
           this.m_joystickview.visible = true;
       }else
       {
           this.m_joystickview.visible = false;
       }
        
        this.killAllBtn.on(Laya.Event.MOUSE_DOWN,this,this.onKillAllClick);
        if(Utils.onMobile()){
            this.atkBtn.on(Laya.Event.MOUSE_DOWN,this,this.onAttackClick);
            this.incSpeedBtn.on(Laya.Event.MOUSE_DOWN,this,this.onSpeedUpStart);
            this.incSpeedBtn.on(Laya.Event.MOUSE_UP,this,this.onSpeedUpEnd);
            this.incSpeedBtn.on(Laya.Event.MOUSE_DOWN,this,this.onClickSpeedup);
            this.incSpeedBtn.on(Laya.Event.MOUSE_OUT,this,this.onSpeedUpEnd);
            this.atkBtn.visible = true;
            this.incSpeedBtn.visible = true;     
        } else {
            this.mouseLayer.on(Laya.Event.MOUSE_DOWN,this,this.onAttackClick)
            Laya.stage.on(Laya.Event.RIGHT_MOUSE_DOWN,this,this.onSpeedUpStart);
            Laya.stage.on(Laya.Event.RIGHT_MOUSE_UP,this,this.onSpeedUpEnd);
            Laya.stage.on(Laya.Event.RIGHT_CLICK,this,this.onClickSpeedup);
            Laya.stage.on(Laya.Event.MOUSE_OUT,this,this.onSpeedUpEnd);
            this.atkBtn.visible = false;
            this.incSpeedBtn.visible = false;

            var firstTime = Laya.LocalStorage.getItem("firstTimePlay") || 0;
            if(firstTime == 0)
            {
                UIMgr.getInstance().showTips("吃豆升级，左键攻击，右键加速",3000,30,"#FFFF00");
                Laya.LocalStorage.setItem("firstTimePlay",1);
            }
        }
        this.attackAniImg.visible = false;
        this.speedupAniImg.visible = false;

        this.commonTips = this.getChildByName("CommonTips");
        this.commonTipsContent = this.commonTips.getChildByName("content");
        this.commonTipsContent.style.align = "center";

        this.selfTips = this.getChildByName("SelfTips");
        this.selfTipsContent = this.selfTips.getChildByName("content");
        this.selfTipsContent.style.align = "center";

        this.otherTips = this.getChildByName("OtherTips");
        this.otherTipsContent = this.otherTips.getChildByName("content");
        this.otherTipsContent.style.align = "center";

        this.commonTips.visible = false;
        this.selfTips.visible  = false;
        this.otherTips.visible = false;
        this.m_levelExp = 0;
        this.m_beginClickSpeedTime = 0;
        this.lastSpeedTime = 0;
        this.m_muteMusic = false;

        this.onRankUpdate();
        this.showTaskInfo();
        this.switchUI();
        this.setChipData();

        this.m_killAllCnt = parseInt(Laya.LocalStorage.getItem("killAllCnt")) || 0;
        this.killAllBtn.visible = this.m_killAllCnt > 0;

    }

    Laya.class(MainView,'view.MainView',_super);
	var p = MainView.prototype;

    p.setChipData = function(){
        var str = "fightCnt_grade";
        var fightId = EGlobalCfg.GradeFightChipTipsCnt;
        var maxCntId = EGlobalCfg.GradeChipTipsMaxCnt;
        var isEndlessMode = GameMgr.getInstance().isEndlessMode();
        if(isEndlessMode) {
            str = "fightCnt_endless";
            fightId = EGlobalCfg.EndlessFightChipTipsCnt;
            maxCntId = EGlobalCfg.EndlessChipTipsMaxCnt;
        }
        var fightSum = parseInt(Laya.LocalStorage.getItem(str)) || 0;
        this.m_showChipTips = fightSum <= DataMgr.getInstance().getGlobalCfg(fightId);
        this.m_chipMaxCnt = DataMgr.getInstance().getGlobalCfg(maxCntId);
        this.m_chipMaxWait = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.ChipMaxWaitTime); 
        this.m_chipMinWait = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.ChipMinWaitTime);
        this.chipTips.visible = false;
    }

    p.initSdk = function(){
        if(SDKMgr.IsWebChat() && typeof(wx) != "undefined"){
            this.m_drawerskeleton = new Laya.Skeleton();
            this.dragonbones.addChild(this.m_drawerskeleton);
            this.m_drawerskeleton.pos(0,0);
            this.m_drawerskeleton.load("res/drawer/NewProject.sk");
            this.m_showDrawer = false;

            this.drawerBtn.on(Laya.Event.CLICK,this,this.onShowHideDrawer);
        }
    }

    p.onScreenResize = function(){
        _maxBarWidth = Laya.stage.width;
        this.onEnergyChange();
    }

    p.onFocusChange = function(){
        if(!Laya.stage.isFocused){
            if(this.m_joystick!=null)
                this.m_joystick.resetJoystick();
        }
    }

    p.switchUI = function(){
        this.endlessHighestPnl = this.rankPnl.getChildByName("EndlessHighest");
        var rankListPnl = this.rankPnl.getChildByName("RankList");
        if(GameMgr.getInstance().isGradeMode()){
            this.centerTop.visible = true;
            this.endlessTop.visible = false;
            rankListPnl.y = 33;
            this.EndlessHighest.visible = false;
            this.rankBg.height -= this.EndlessHighest.height;
            this.RankList.top -= this.EndlessHighest.height;
            this.getChildByName("endlessScore").visible = false;
        }else if(GameMgr.getInstance().isEndlessMode()){
            this.centerTop.visible = false;
            this.endlessTop.visible = true;
            this.selfHistoryScore.text = GameMgr.getInstance().m_historyHighScore + "";
            this.overFriendTips.visible = false;
            if(!GameMgr.getInstance().isLowDevice()){
                TimerUtil.loop(10000,this,this.showOverFriendInfo);
                this.showOverFriendInfo();
            }
            var rankListPnl = this.rankPnl.getChildByName("RankList");
            this.endlessHighestPnl.visible = true;
            rankListPnl.y = 73;
            this.refreshEndlessHighest();
        }else{
            this.centerTop.visible = true;
            this.endlessTop.visible = false;
        }
    }

    p.refreshEndlessHighest = function(){
        var data = GameMgr.getInstance().getEndlessHighest();
        if(data!=null){
            var nameTxt = this.endlessHighestPnl.getChildByName("Name");
            var scoreTxt = this.endlessHighestPnl.getChildByName("Score");

            nameTxt.text = data.name;
            scoreTxt.text = data.score + "";
        }
    }

    p.refreshFriendRank = function(){
        if(GameMgr.getInstance().isEndlessMode()){
            this.selfHistoryScore.text = RankMgr.getInstance().m_historyHighScore + "";
        }
    }

    p.onVisibleChange = function(){
        if(!Laya.stage.isVisibility){
            this.m_muteMusic = SoundMgr.getInstance().isMusicMuted();
        }else{
            SoundMgr.getInstance().playBattleBgm();
            SoundMgr.getInstance().setMusicMute(this.m_muteMusic);
        }
    }

    p.onAniComplete = function() {
        this.lvupImg.visible = false;
    }
    
    p.onAttackAniComplete = function(){
        this.attackAniImg.visible = false;
    }

    p.onPlayerLvup = function(oldLv) {
        var role = GameMgr.getInstance().m_role;
        if(role == null)
            return;

        var lv = role.getLevel();

        this.m_levelExp = DataMgr.getInstance().getTotalEnergyByLevel(lv);
        if(lv > 1 && lv > oldLv)
        {
            this.lvupImg.visible = true;
            this.lvupAni.play(0,false);
        }
    }

    p.onEnergyChange = function() {
        var role = GameMgr.getInstance().m_role;
        var needExp = role.getExp();
        if(needExp <= 0) return;

        var w = _maxBarWidth * role.getEnergyPoint() / needExp;
        if(w > _maxBarWidth)
            w = _maxBarWidth;

        this.energyBar.width = w;
    }

    p.onRankUpdate = function(){
        var players = GameMgr.getInstance().getPlayers();
        var len = players.length;
        var player = null;
        var rank,nameTxt=null,scoreTxt=null,highlight = null;
        var selfInRank = false;
        var i=0;
        var rankListPnl = this.rankPnl.getChildByName("RankList");

        for(; i < 10 && i < len;i++){
            player = players[i];
            if(player.isMainRole())
            {
                selfInRank = true;
            }

            rank = rankListPnl.getChildByName("Rank"+(i+1));
            if(rank == null) continue;

            nameTxt = rank.getChildByName("Name");
            scoreTxt = rank.getChildByName("Score");
            hightlight = rank.getChildByName("highlight");
            nameTxt.text = player.getName();
            scoreTxt.text = player.getScore().toString();
            if(highlight)
                hightlight.visible = player.isMainRole();

            rank.visible = true;
        }

        for(j = i; j < 10;j++)
        {
            rank = rankListPnl.getChildByName("Rank"+(j+1));
            if(rank == null) continue;

            rank.visible = false;
        }

        if(selfInRank)
        {
            this.selfRank.visible = false;
        }else
        {
            var role = GameMgr.getInstance().m_role;
            if(role === null) return;
            this.selfRank.visible = true;
            this.selfRankRank.text = GameMgr.getInstance().m_roleRank;
            this.selfName.text = role.getName();
            this.selfScore.text = role.getScore().toString();
        }
    }

    p.init = function(){
        this.initSdk();

        var gameMgr = GameMgr.getInstance();
        var role = gameMgr.m_role;
        if(role === null) return;

        SoundMgr.getInstance().playBattleBgm();

        this.onRefreshKillNum(role.getKillNum());
        this.onRefreshBattleTime(gameMgr.getLeftTime());
        this.onRefreshHighScore(role.getHighScore());
    }

    p.onRefreshKillNum = function(num){
        this.killNumTxt.text = num.toString();
        this.endlessKillNum.text = num.toString();
        if(this.m_showChipTips && num <=this.m_chipMaxCnt && num>0)
            this.showChipTips(num);
    }

    p.showChipTips = function(num){
        var str = DataMgr.getInstance().getContentById(19);
        var arr = [num,num];
        str = StringUtil.format(str,arr);

        this.m_chipNextHideTime = TimerUtil.currTimer() + this.m_chipMaxWait;
        if(this.m_chipTipsQueue == null) {
            this.m_chipTipsQueue = [];
            this.m_chipTipsQueue.push(str);
            TimerUtil.loop(100,this,this.onShowChipTips);
        }
        else {
            this.m_chipTipsQueue.push(str);  
        }        
    }

    p.onShowChipTips = function(){
        var curTime = TimerUtil.currTimer();
        if(curTime > this.m_chipNextHideTime) {
            this.chipTips.visible = false;
            return;
        }
        var str = this.m_chipTipsQueue.shift();
        if(str != null) {
            this.chipTips.innerHTML = str;
            this.chipTips.visible = true;
        }
    }

    p.onRefreshBattleTime= function(leftTime){
        if(leftTime <= 30 && leftTime>0){
            this.battleTimeTxt.color = "#ff0000";
            TimerUtil.once(500,this,this.changeTextColor);
        }
        var min =  Utils.getInt(leftTime / 60);
        var sec = leftTime - min * 60;
        var timeStr = "";
        if(min >= 10)
            timeStr = min.toString();
        else
            timeStr = "0"+min.toString();
        if(sec >= 10)
            timeStr = timeStr +":"+sec.toString();
        else
            timeStr = timeStr +":0"+sec.toString();

        this.battleTimeTxt.text = timeStr;
    }

    p.changeTextColor = function(){
        this.battleTimeTxt.color = "#ffffff";
    }

    p.onRefreshHighScore = function(val){
        this.highScoreTxt.text = val.toString();
        this.endlessScore.text = val.toString();
    }

    p.onShowBroacastContent = function(data){
        var content = data.content;
        if(content == null) return;

        switch(data.type){
            case BroadcastType.Common:
                this.showCommonBroadcast(content);
                break;
            case BroadcastType.Private:
                this.showLocalBroadcast(content);
                break;
            case BroadcastType.Reward:
                this.showRewardBroadcast(content);
                break;
        }
    }

    p.showCommonBroadcast = function(content){
        this.commonTipsContent.innerHTML =  content;
        this.commonTips.visible = true;
    }

    p.showLocalBroadcast = function(content){
        this.selfTipsContent.innerHTML = content;
        var vis = this.selfTips.visible;
        this.selfTips.visible = true;
        if(!vis)
            this.bobao1.play(0,false);
    }

    p.showRewardBroadcast = function(content){
        this.otherTipsContent.innerHTML = content;
        var vis = this.otherTips.visible;
        this.otherTips.visible = true;
        if(!vis)
            this.bobao2.play(0,false);
    }

    p.clearCommonBroadcast = function(){
        this.commonTipsContent.innerHTML = "";
        this.commonTips.visible = false;
    }

    p.clearLocalBroadcast = function(){
        this.selfTipsContent.innerHTML = "";
        this.selfTips.visible = false;
    }

    p.clearRewardBroadcast = function(){
        this.otherTipsContent.innerHTML = "";
        this.otherTips.visible = false;
    }

    p.onClearBroadcastContent = function(type){
        switch(type){
            case BroadcastType.Common:
                this.clearCommonBroadcast();
                break;
            case BroadcastType.Private:
                this.clearLocalBroadcast();
                break;
            case BroadcastType.Reward:
                this.clearRewardBroadcast();
                break;
        }
    }

    p.onJoystickMoving = function(deg){
        var role = GameMgr.getInstance().m_role;

        if(role.isDead()) return;

        role.setModelRatation(deg);
    }

    p.onJoystickUp = function(){

    }

    /**
     * 攻击按键
     */
    p.onAttackClick = function(){
        var role = GameMgr.getInstance().m_role;
        if(role != null)
            role.attack();
        if(Utils.onMobile()){
            this.attackAniImg.visible = true;
            this.Attack.play(0,true);
        }
    }

    /**
     * 开始加速
     */
    p.onSpeedUpStart = function(){
        this.m_beginClickSpeedTime  = TimerUtil.currTimer();
        var role = GameMgr.getInstance().m_role;
        if(role != null)
            role.StartSpeedUp();
    }

    /**
     * 点击单次加速
     */
    p.onClickSpeedup = function(){
        var curTimer = TimerUtil.currTimer();
        var detlaClickTime = curTimer - this.lastSpeedTime;
        var deltaTime = curTimer - this.m_beginClickSpeedTime;
        if(deltaTime < 100 && detlaClickTime>=299){
            var role = GameMgr.getInstance().m_role;
            role.onSpeedUp();
            this.lastSpeedTime = curTimer;
        }
    }

    /**
     * 结束加速
     */
    p.onSpeedUpEnd =  function(){
        var role = GameMgr.getInstance().m_role;
        if(role === null) return;
        role.EndSpeedUp();
    }

    p.showOverFriendInfo = function(){
        if(!GameConst.SupportOpenDomain) return;

        if(typeof(wx) == "undefined") return;
        
        var openDataContext = wx.getOpenDataContext();
        var sharedCanvas = openDataContext.canvas;
        sharedCanvas.width = this.overFriendSPTips.width;
        sharedCanvas.height = this.overFriendSPTips.height;
            
        Laya.timer.once(20, this, this.refreshNextGoal);
        GameMgr.getInstance().getNextGoalTip(true);
    }

    p.refreshNextGoal = function(){
        if(this.canvasTexture == null)
            this.canvasTexture = new Laya.Texture(sharedCanvas);
        else
            this.canvasTexture.setTo(sharedCanvas);
            
        this.overFriendSPTips.graphics.clear();
        this.overFriendSPTips.graphics.drawTexture(this.canvasTexture);
    }

    p.onChangeOverFriend = function(){
         this.fadeInAni.play(0,false);
    }

    p.clearTexture = function(){
        if(this.canvasTexture!=null){
            this.overFriendSPTips.graphics.clear();
            this.overFriendSPTips.destroy();
            this.canvasTexture = null;
        }
    }

    p.onShowHideDrawer = function(){
        this.m_showDrawer = true;
        AladinSDK.ShowDrawer();
    }

    p.showTaskInfo = function(task){
        if(!GameMgr.getInstance().isGradeMode()) {
            this.taskBox.visible = false;
            return;
        }
        if(task != null) {
            this.m_taskDom[task.index].innerHTML = task.info;
            return;
        }
        this.taskBox.visible = true;
        var arrTask = TaskMgr.getInstance().getTaskArray();
        var task,dom;
        var line = 0;
        this.m_taskDom = this.m_taskDom||{};
        for(var i=0; i<3; i++) {
            task = arrTask[i];
            dom = this.m_taskDom[i]||this.taskBox.getChildByName("task"+i);
            this.m_taskDom[i] = dom;
            if(task != null) {
                dom.visible = true;
                dom.innerHTML = task.info;
                line ++;
            }
            else {
                dom.visible = false;
            }
        }
        this.taskBox.height = line == 3 ? 100 : 66;
    }
    
    p.onKillAllClick = function(){
        if(this.m_killAllCnt <= 0) {
            return;
        }
        this.m_killAllCnt -= 1;
        Laya.LocalStorage.setItem("killAllCnt",this.m_killAllCnt);
        GameMgr.getInstance().killAllAIPlayer();
        if(this.m_killAllCnt <= 0) {
            this.killAllBtn.visible = false;
        }
    }

    /**
     * 卸载界面
     */
    p.uninit = function(){
        if(this.m_drawerskeleton!=null){
            this.dragonbones.removeChild(this.m_drawerskeleton);
            this.m_drawerskeleton.destroy();
            this.m_drawerskeleton = null;
			this.m_showDrawer = false;
            AladinSDK.HideDrawer();
        }

        if(this.m_joystick!=null)
        {
            this.m_joystick.clear();
            this.m_joystick = null;
        }
        this.clearTexture();
    
        EventMgr.getInstance().off(EEvent.Player_Lvup,this,this.onPlayerLvup);
        EventMgr.getInstance().off(EEvent.Player_Energy_Change,this,this.onEnergyChange);
        EventMgr.getInstance().off(EEvent.Player_Rank_Update,this,this.onRankUpdate);
        EventMgr.getInstance().off(EEvent.Player_KillNum_Change,this,this.onRefreshKillNum);
        EventMgr.getInstance().off(EEvent.Battle_Time_Change,this,this.onRefreshBattleTime);
        EventMgr.getInstance().off(EEvent.Player_HighScore_Change,this,this.onRefreshHighScore);
        EventMgr.getInstance().off(EEvent.Broadcast_Show_Content,this,this.onShowBroacastContent);
        EventMgr.getInstance().off(EEvent.Broadcast_Clear_Content,this,this.onClearBroadcastContent);
        EventMgr.getInstance().off(EEvent.Main_OverFriend_Change,this,this.onChangeOverFriend);
        EventMgr.getInstance().off(EEvent.TaskTrigger,this,this.showTaskInfo);
        EventMgr.getInstance().off(EEvent.TaskFinish,this,this.showTaskInfo);
        EventMgr.getInstance().off(EEvent.RefreshEndlessHighest,this,this.refreshEndlessHighest);
        EventMgr.getInstance().off(EEvent.RefreshFriendRank,this,this.refreshFriendRank);

        this.mouseLayer.off(Laya.Event.MOUSE_DOWN,this,this.onAttackClick)
        Laya.stage.off(Laya.Event.RIGHT_MOUSE_DOWN,this,this.onSpeedUpStart);
        Laya.stage.off(Laya.Event.RIGHT_MOUSE_UP,this,this.onSpeedUpEnd);
        Laya.stage.off(Laya.Event.RIGHT_CLICK,this,this.onClickSpeedup);
        Laya.stage.off(Laya.Event.MOUSE_OUT,this,this.onSpeedUpEnd);
        Laya.stage.off(Laya.Event.FOCUS_CHANGE,this, this.onFocusChange);
        Laya.stage.off(Laya.Event.RESIZE,this, this.onScreenResize);

        
        TimerUtil.clearAll(this);
    }

    return MainView;
}(MainViewUI));