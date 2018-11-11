/*
* 公告管理器;
*/
var BroadcastType = {
    Common : 1,
    Private : 2,
    Reward : 3
}

var BroadcastMgr = (function () {
    function BroadcastMgr() {
        this.init();
    }

    BroadcastMgr.getInstance = function () {
        if (BroadcastMgr._instance == null) {
            BroadcastMgr._instance = new BroadcastMgr();
        }
        return BroadcastMgr._instance;
    };

    var p = BroadcastMgr.prototype;

    p.init = function(){
        this.m_contextQueue = new Queue();
        this.m_lastShowLocalType = 0;
        this.m_ShowBroadcastTime = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.CommonTipsDuration);
        this.m_lastShowBroadcastTime = 0;
        this.m_switchBroadcastInternal = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.NoticeQueueTime);

        this.m_privateMsgQueue = new Queue();
        this.m_ShowPrivateBroadcastTime = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.PrivateTipsDuration);
        this.m_lastShowPrivateBroadcastTime = 0;
        this.m_switchPrivateBroadcastInternal = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.PNoticeQueueTime);

        this.m_rewardMsgQueue = new Queue();
        this.m_ShowRewardBroadcastTime = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.RewardTipsDuration);
        this.m_lastShowRewardBroadcastTime = 0;
        this.m_switchRewardBroadcastInternal = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.RNoticeQueueTime);


        TimerUtil.loop(this.m_switchBroadcastInternal,this,this.showNextBroadcast);
        TimerUtil.loop(this.m_switchPrivateBroadcastInternal,this,this.showNextPrivateBroadcast);
        TimerUtil.loop(this.m_switchRewardBroadcastInternal,this,this.showNextRewardBroadcast);
    }

    p.getPrivateBroadcastTime = function(){
        return this.m_ShowPrivateBroadcastTime;
    }

    p.getRewardBroadcastTime = function(){
        return this.m_ShowRewardBroadcastTime;
    }

    p.addNewContent = function(data){
        if(data == null) return;
        if(data.id == null) return;
        var player = GameMgr.getInstance().GetPlayerById(data.id);
        if(player == null) return;

        // console.log('broadcast',data)
        var strParam = [];
        strParam.push(player.getName());
        strParam.push(data.param);
        var content = this.getContentByType(data.type,strParam);

        this.m_contextQueue.push(content);

        if(this.m_contextQueue.size() == 1){
            this.showNextBroadcast();
        }else{
            TimerUtil.clear(this,this.clearBroadcast);
        }
    }

    p.showLocalBroadcast = function(type,param){
        if(this.m_lastShowLocalType == type) return;

        this.m_lastShowLocalType = type;
        var content = this.getContentByType(type,param);
        if(content == null) return;

        this.m_privateMsgQueue.push(content);

        if(this.m_privateMsgQueue.size() == 1){
            this.showNextPrivateBroadcast();
        }else{
            TimerUtil.clear(this,this.clearPrivateBroadcast);
        }
    }

    p.showRewardBroadcast = function(type,param){
        var content;
        if(type == KDAType.KillScoreAchievement) {
           content = this.getKillContent(param);
        }else if(type == KDAType.Revenge){
            content = this.getContentByType(KDAType.Revenge) + this.getKillContent(param);
        }else if(type == KDAType.KillHighLv){
            content = this.getContentByType(KDAType.KillHighLv) + this.getKillContent(param);
        }
        else {
            content = this.getContentByType(type,param);
        }    

        this.m_rewardMsgQueue.push(content);

         if(this.m_rewardMsgQueue.size() == 1){
            this.showNextRewardBroadcast();
        }
        else{
            TimerUtil.clear(this,this.clearRewardBroadcast);
        }
    }

    p.getKillContent = function(param){
        var content = DataMgr.getInstance().getContentById(KDAType.KillScoreAchievement);
        if(content == null) return;
        var imgStr = "";
        var imgTemplateStr = "<img src='broadcast/{0}.png' />";
        var newParam = [];
        newParam.push(param[0]);
        for(var i=1;i<param.length;i++) {
            imgStr += imgTemplateStr.replace("{0}",param[i]);
        }
        newParam.push(imgStr);
        content = StringUtil.format(content,newParam);
        return content;
    }

    p.showNextBroadcast = function(){
        if(this.m_contextQueue.size() == 0){
             return;
        }
        var curTime = Date.now();
        if(curTime - this.m_lastShowBroadcastTime < this.m_ShowBroadcastTime) return;

        var content = this.m_contextQueue.shift();
        EventMgr.getInstance().event(EEvent.Broadcast_Show_Content,{type:BroadcastType.Common,content:content}); 
        this.m_lastShowBroadcastTime = curTime;

        if(this.m_contextQueue.size() == 0){
            TimerUtil.once(this.m_ShowBroadcastTime,this,this.clearBroadcast);
        }
    }

    p.showNextPrivateBroadcast = function(){
        if(this.m_privateMsgQueue.size() == 0) return;
        var curTime = Date.now();
        if(curTime - this.m_lastShowPrivateBroadcastTime < this.m_ShowPrivateBroadcastTime) return;

        var content = this.m_privateMsgQueue.shift();
        EventMgr.getInstance().event(EEvent.Broadcast_Show_Content,{type:BroadcastType.Private,content:content}); 
        this.m_lastShowPrivateBroadcastTime = curTime;

        if(this.m_privateMsgQueue.size() == 0){
            TimerUtil.once(this.m_ShowPrivateBroadcastTime,this,this.clearPrivateBroadcast);
        }
    }

    p.showNextRewardBroadcast = function(){
        if(this.m_rewardMsgQueue.size() == 0) return;
        var curTime = Date.now();
        if(curTime - this.m_lastShowRewardBroadcastTime < this.m_ShowRewardBroadcastTime) return;

        var content = this.m_rewardMsgQueue.shift();
        EventMgr.getInstance().event(EEvent.Broadcast_Show_Content,{type:BroadcastType.Reward,content:content}); 
        this.m_lastShowRewardBroadcastTime = curTime;

        if(this.m_rewardMsgQueue.size() == 0){
            TimerUtil.once(this.m_ShowRewardBroadcastTime,this,this.clearRewardBroadcast);
        }
    }

    p.clearBroadcast = function(){
        EventMgr.getInstance().event(EEvent.Broadcast_Clear_Content,BroadcastType.Common); 
    }

    p.clearPrivateBroadcast = function(){
        EventMgr.getInstance().event(EEvent.Broadcast_Clear_Content,BroadcastType.Private); 
    }

    p.clearRewardBroadcast = function(){
        EventMgr.getInstance().event(EEvent.Broadcast_Clear_Content,BroadcastType.Reward);
    }

    p.getContentByType = function(type,param){
        var content = DataMgr.getInstance().getContentById(type);
        if(param!=null && content!=null){
            return StringUtil.format(content,param);
        }
        return content;
    }

    p.clear= function(){
        this.m_contextQueue.clear();
        this.m_privateMsgQueue.clear();
        this.m_rewardMsgQueue.clear();
    }

    p.resetLocalBroadcast = function(){
        this.m_lastShowLocalType = 0;
    }

    return BroadcastMgr;
}());

BroadcastMgr._instance = null;