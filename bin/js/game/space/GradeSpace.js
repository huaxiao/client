/*
* 段位模式;
*/
var GradeSpace = (function () {
    var GradeSpace = Class(Space);
    var p = GradeSpace.prototype;
    
    p.__GradeSpace_ctor = p.ctor;
    p.__GradeSpace_preStart = p.preStart;
    p.__GradeSpace_start = p.start;
    p.__GradeSpace_update = p.update;
    p.__GradeSpace_preEnd = p.preEnd;
    p.__GradeSpace_end = p.end;
    p.__GradeSpace_exit = p.exit;
    p.__GradeSpace_setGamePause = p.setGamePause;
    p.__GradeSpace_checkTask = p.checkTask;

    p.ctor = function() {
        this.__GradeSpace_ctor();
        this.m_pauseBeginTime = null;
        this.m_gameMode = GameMode.Grade;
    }

    p.preStart = function(playerName){
        // this.m_battleTime = DataMgr.getInstance().roomCfgData[1].fightTime;
        var data = DataMgr.getInstance().getUserGradeAIData();
        this.m_battleTime = data&&data.time||300;
        return this.__GradeSpace_preStart(playerName);
    }

    p.registerEvent = function(){
        EventMgr.getInstance().on(EEvent.MainRoleRevive,this,this.onRoleRevive);
    }

    p.unregisterEvent = function(){
        EventMgr.getInstance().off(EEvent.MainRoleRevive,this,this.onRoleRevive);
    }

    p.start = function(){
        this.registerEvent();

        this.m_kda = {reborn:0,reborn_interval:0,kill:0,score:0,star:0,incr_star:0,
            task1:0,task2:0,task3:0};
        var star = GameData.getInstance().user.star;
        this.m_gradeData = DataMgr.getInstance().getGradeDataByStar(star);

        this.__GradeSpace_start();

        TimerUtil.loop(1000,this,this.updateBattleTime);
        TaskMgr.getInstance().enterBattle();

        SDKMgr.getInst().report(ReportType.Start_GradeFight,{'star':star});
        this.report("game_begin",{'star':star});
    }

    p.update = function(){
        this.__GradeSpace_update();
    }

    p.preEnd = function(param){
         this.__GradeSpace_preEnd();
    }

    p.calKDAData = function(){
        var role = this.role.getAvatar();
        this.m_kda.kill = role.getKillNum();
        this.m_kda.score = role.getScore();
        var taskResult = TaskMgr.getInstance().getResult();
        var star = GameData.getInstance().user.star;
        if(taskResult == 1) star += 1;
        this.m_kda.star = star;
        this.m_kda.incr_star = taskResult;
        var arrTask = TaskMgr.getInstance().getTaskArray(true);
        for(var i=0; i<3; i++) {
            var task = arrTask[i];
            this.m_kda["task"+(i+1)] = task&&task.finish || 0; 
        }
    }

    p.end = function(){
        this.calKDAData();

        SDKMgr.getInst().report(ReportType.End_GradeFight,this.m_kda);
        this.report("game_over",this.m_kda);
        this.m_kda = null;

        Utils.localStorageAddVal("fightCnt_grade",1);

        this.__GradeSpace_end();
    }
    

    p.exit = function(){
        this.__GradeSpace_exit();
        this.unregisterEvent();

    }

    //刷新战斗时长
    p.updateBattleTime = function(serverTime){
        if(serverTime != null) {
            this.m_leftBattleTime = serverTime;
            EventMgr.getInstance().event(EEvent.Battle_Time_Change,this.m_leftBattleTime); 
        }
        else {
            if(this.m_leftBattleTime == 0){ //战斗结束
                TimerUtil.clear(this,this.updateBattleTime);
                EventMgr.getInstance().event(EEvent.FightOver); 
            }else{
                this.m_leftBattleTime -=1;
                EventMgr.getInstance().event(EEvent.Battle_Time_Change,this.m_leftBattleTime); 
            }
        }
    }

    p.setGamePause = function(isPause){
        this.__GradeSpace_setGamePause(isPause);
        if(isPause) {
            TimerUtil.clear(this,this.updateBattleTime);
            this.m_pauseBeginTime = DateUtil.getCurrentTimeStamp();;
        }
        else {
            TimerUtil.loop(1000,this,this.updateBattleTime);
            if(this.m_pauseBeginTime != null) {
                this.m_battleBeginTime += DateUtil.getCurrentTimeStamp() - this.m_pauseBeginTime;
            }
        } 
    }
    
    p.onRoleRevive = function(){
        if(this.m_kda == null) return;
        this.m_kda.reborn += 1;
        if(this.m_kda.reborn_interval == 0) {
            this.m_kda.reborn_interval = this.m_battleTime - this.m_leftBattleTime;
        }

    }

    p.checkTask = function(data){
        this.__GradeSpace_checkTask(data);
        EventMgr.getInstance().event(EEvent.CheckTask,data);
    }

    p.report = function(typeStr,params){
        params = params || {};
        var openid = GameData.getInstance().user.openid;
        params.openid = openid;
        params.nick = GameData.getInstance().user.uname;
        var host = GameConst.PHPUrl+"duanwei_stat/";

        var paramStr = Utils.parseParams(params);
        var url = host + typeStr + "?" + paramStr; 
        var http = new HttpLaya(function(err, data) {
            if(err != null) {
                EventMgr.getInstance().event(EEvent.Error,"\nerror:"+err);
            }
            else {
                if(data.result != 0) {
                    EventMgr.getInstance().event(EEvent.Error,data);
                }
            }
        });
        http.sendGetWithUrl(url);
    }

    return GradeSpace;
}());