
var TaskFontStyle = {
    Main : "Main",
    Settlement : "Settlement",
    Revive : "Revive"
}

/*
* 任务管理;
*/
var TaskMgr = (function () {
    function TaskMgr() {
    }

    /**
     * 单例
     */
    TaskMgr.getInstance = function(){
        if(TaskMgr._instance == null){
            TaskMgr._instance = new TaskMgr();
            TaskMgr._instance.init();
        }
        return TaskMgr._instance;
    }

    var p = TaskMgr.prototype;

    p.init = function() {
        EventMgr.getInstance().on(EEvent.CheckTask,this,this.onCheckTask);
    }

    p.uninit = function() {
        EventMgr.getInstance().off(EEvent.CheckTask,this,this.onCheckTask);
    }

    p.enterBattle = function() {
        var user = GameData.getInstance().user;
        var nextStar = 1 + user.star % 4;
        var cfg = DataMgr.getInstance().getUserGradeCfg(user.grade);
        var arrCfgTask = cfg["task"+nextStar];
        this.m_arrTask = [];
        for(var i=0; i<arrCfgTask.length; i++) {
            var task = {index:i,condition:arrCfgTask[i],finish:0,trigger:0};
            task.info = this.getTaskInfo(task,TaskFontStyle.Main);
            this.m_arrTask[i] = task;
        }
    }

    p.clear = function() {
        this.m_arrTask = null;
    }

    p.getResult = function() {
        if(this.m_arrTask == null || this.m_arrTask.length==0) return 0;
        for(var k in this.m_arrTask) {
            if(this.m_arrTask[k].finish == 0) {
                return 0;
            }
        }
        return 1;
    }

    p.onCheckTask = function(data) {
        if(this.m_arrTask == null) return;
        // console.log("onCheckTask",data);
        var task,val;
        for(var type in data) {
            for(var k in this.m_arrTask) {
                task = this.m_arrTask[k];
                val = task.condition[type];
                if(val == null) continue;
                if(type != TaskType.endRank && task.finish != 1) {
                    task.trigger = data[type] || 0;
                    if(data[type] >= val) {
                        task.trigger = val;  
                        task.finish = 1;
                    }
                    task.info = this.getTaskInfo(task,TaskFontStyle.Main);
                    EventMgr.getInstance().event(EEvent.TaskTrigger,task);
                }
                if(type == TaskType.endRank) {
                    var finish = data[type] <= val ? 1 : 0;
                    task.finish = finish;
                    task.info = this.getTaskInfo(task,TaskFontStyle.Main);
                    EventMgr.getInstance().event(EEvent.TaskFinish,task);
                    // console.log("onCheckTask ok",task.condition);
                }
            }
        }
    }

    p.getTaskArray = function(noRefreshInfo){
        if(!noRefreshInfo)
            this.refreshSettlementStyle();
        return this.m_arrTask;
    }

    p.refreshSettlementStyle = function(){
        var task;
        for(var k in this.m_arrTask) {
            task = this.m_arrTask[k];
            task.settleStyle = this.getTaskInfo(task,TaskFontStyle.Settlement);
            task.reviveStyle = this.getTaskInfo(task,TaskFontStyle.Revive);
        }
    }

    p.getFontColor = function(finish,style){
        if(style != TaskFontStyle.Main) {
            if(finish == 0) return "#5e5e5e";
            return "#24245b";
        }
        if(finish == 0) return "#e2403e";
        return "#fbda54";
    }

    p.getTaskInfo = function(task,style){
        var condition = task.condition;
        var color = "#ffffff";
        if(style == TaskFontStyle.Settlement || style == TaskFontStyle.Revive)
            color = this.getFontColor(task.finish,style);
        var font = "17";
        if(style == TaskFontStyle.Revive)
            font = "30";
        
        var info = "<span style='color:"+color+";font-weight:bold;font-size:"+font+"'>";
        color = this.getFontColor(task.finish,style);
        for(var k in condition) {
            var str = "<span style='color:"+color+";font-weight:bold;font-size:"+font+"'>("+task.trigger+"/"+condition[k]+")</span>";
            switch(k) {
                case TaskType.endRank:
                    str = "<span style='color:"+color+";font-weight:bold;font-size:"+font+"'>("+task.finish+"/1)</span>";
                    info += "最终名次前"+condition[k]+"</span>"+str;
                    break;
                case TaskType.killCnt:
                    info += "单场击杀"+condition[k]+"名玩家</span>"+str;
                    break;
                case TaskType.sumScore:
                    info += "累计积分达到"+condition[k]+"</span>"+str;
                    break;
                case TaskType.highScore:
                    info += "最高分数达到"+condition[k]+"</span>"+str;
                    break;
                case TaskType.tripleKill:
                    info += "三杀次数达到"+condition[k]+"</span>"+str;
                    break;
                case TaskType.doubleKill:
                    info += "双杀次数达到"+condition[k]+"</span>"+str;
                    break;
                default:
                    console.error("unknown task:"+k);
                    break;
            }
        }
        return info;
    }

    return TaskMgr;
}());