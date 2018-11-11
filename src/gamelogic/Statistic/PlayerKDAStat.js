var KDAType = {
    AchieveKillNum : 1,
    KillHighLvNum : 2,
    AccumScore : 3,
    FirstBlood : 4,
    Revenge : 5,
    RankOne : 6,
    RankInTen : 7,
    DoubleKill : 8,
    TripleKill : 9,
    KillAchievement1 : 10,
    KillAchievement2 : 11,
    KillAchievement3 : 12,
    KillFirstPlayer : 13,  
    KillScoreAchievement : 14,
    KillHighLv : 17
}

/*
* PlayerKDAStat 玩家KDA统计;
*/
var PlayerKDAStat = (function () {

    var PlayerKDAStat = Class();
    var p = PlayerKDAStat.prototype;

    p.ctor = function(){
        this.m_playerKDAMap = {};

        this.m_achieveKillMap = []; //累计击杀的统计
        this.m_playerAccumScoreMap = {};
        this.initData();
    }

    p.initData = function() {
        this.m_nextAchieveKillNum = 10;
        this.m_internal = 10;

        this.m_nextHightLvKillNum = 10;
        this.m_HighKillInternal = 10;

        this.m_nextAccumScore = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.AccumScoreFactor);
        this.m_internalScore = this.m_nextAccumScore;

        this.m_firstBloodTime = 0;  //第一个击杀的时间
        this.m_firstBloodPlayerId = 0;  //第一滴血的玩家ID
    }

    p.clear = function() {
        Utils.clearDictionary(this.m_playerKDAMap);
        this.m_achieveKillMap.length = 0;
        Utils.clearDictionary(this.m_playerAccumScoreMap);

        this.initData();

        this.m_broadcaseMsgCallback = null;
        this.m_broadcaseMsgCaller = null;
    }

    p.setBroadcastMsgCallback = function(callback, caller) {
        this.m_broadcaseMsgCallback = callback;
        this.m_broadcaseMsgCaller = caller;
    }

    p.broadcastMsg = function(data) {
        if(this.m_broadcaseMsgCallback == null || data == null)
            return;
        
        this.m_broadcaseMsgCallback.call(this.m_broadcaseMsgCaller,RPC.S2C_PlayerKDA,data);
    }

    p.addPlayerKDA = function(playerId){
        var kda = this.findPlayerKDA(playerId);
        if(kda == null){
            kda = new PlayerKDA();
            this.m_playerKDAMap[playerId] = kda;
        }
        return kda;
    }

    p.findPlayerKDA = function(playerId){
        var kda = this.m_playerKDAMap[playerId];
        return kda;
    }

    p.removePlayerKDA = function(playerId){
        var kda = this.findPlayerKDA(playerId);
        if(kda != null){
            this.m_playerKDAMap[playerId] = null;
        }
    }

    p.refreshPlayerKillInfo = function(player,target){
        if(player == null) return;

        var attackerId = player.getId();
        var targetId = target.getId();

        var kda = this.findPlayerKDA(attackerId);
        if(kda == null) {
            return;
        }

        if(target.getLastLevel() >= 6 && player.getLevel() < target.getLastLevel()) {
            kda.addHighLvNum();
            player.setKillHighLvStatus(true);
        }else{
            player.setKillHighLvStatus(false);
        }
        this.addKillNum(kda,attackerId);
        this.addAccumScore(attackerId,player.getAccumScore());
        this.checkFirstBlood(attackerId);
        var revenge = this.checkRevenge(kda,attackerId,targetId);
        player.setRevengeStatus(revenge);
        this.addDeadNum(attackerId,targetId);
        this.checkKillFirstPlayer(attackerId,target);
    }

    p.refreshAccumScore = function(player){
        if(player == null) return;

        var playerId = player.getId();

        var kda = this.findPlayerKDA(playerId);
        if(kda == null) {
            return;
        }
        this.addAccumScore(playerId,player.getAccumScore());
    }

    p.addKillNum = function(kda,playerId){
    
        kda.addKillNum();     
        if(kda.getKillNum() >= this.m_nextAchieveKillNum){
            //TODO 进行第一个个人累计击杀达到10，20等 信息的播报
            this.broadcastMsg({id:playerId,type:KDAType.AchieveKillNum,param:this.m_nextAchieveKillNum});

            this.m_nextAchieveKillNum +=this.m_internal;
        }

        if(kda.getKillHighLvNum() >= this.m_nextHightLvKillNum){
            //TODO XXX以小博大达到10次 
            this.broadcastMsg({id:playerId,type:KDAType.KillHighLvNum,param:this.m_nextHightLvKillNum});

            this.m_nextHightLvKillNum += this.m_HighKillInternal;
        }
    }

    
    p.addAccumScore = function(playerId,accumScore) {
        this.m_playerAccumScoreMap[playerId] = accumScore;

        if(accumScore >= this.m_nextAccumScore){
            //TODO XXX累计积分达到10000分 的播报
            this.broadcastMsg({id:playerId,type:KDAType.AccumScore,param:this.m_nextAccumScore});

            this.m_nextAccumScore +=this.m_internalScore;
        }
    }

    p.addDeadNum = function(attackerId,playerId){
        var kda = this.findPlayerKDA(playerId);
        if(kda == null) return;

        kda.setAttackId(attackerId);
        kda.addDeadNum();
    }

    p.checkFirstBlood = function(attackerId){
         if(this.m_firstBloodTime == 0){
            this.m_firstBloodPlayerId = attackerId;
            this.m_firstBloodTime = TimerUtil.currFrame();

            //TO 进行该局战斗第一个击杀者的公告
            this.broadcastMsg({id:attackerId,type:KDAType.FirstBlood});
        }
    }

    p.checkRevenge = function(kda,attackerId,targetId){
        if(kda.getAttackId() == targetId){
            kda.setAttackId(0);
            return true;
        }
        return false;
    }

    p.checkKillFirstPlayer = function(attackerId,target){
        if(target == null) return;

        if(target.getScore() >= 1000 && target.getScoreRank() == 1){
            //TO 击杀了第一名 播报
            this.broadcastMsg({id:attackerId,type:KDAType.KillFirstPlayer});
        }
    }

    return PlayerKDAStat;
})();