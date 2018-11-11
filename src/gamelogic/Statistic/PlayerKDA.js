/*
* PlayerKDA 玩家kda信息;
*/
var PlayerKDA = (function () {
    var PlayerKDA = Class();

    var p = PlayerKDA.prototype;

    p.ctor = function(playerId){
        this.m_playerId = playerId;
        this.m_killNum = 0; //击杀数
        this.m_deadNum = 0; //死亡数
        this.m_lastAttackId = 0;        //最近击杀我的人
        this.m_killHighLvNum =0;        //击杀比我等级高的玩家的数目 
    }

    p.addKillNum = function(){
        this.m_killNum += 1;
    }

    p.addHighLvNum = function(){
        this.m_killHighLvNum +=1;
    }

    p.addDeadNum = function(){
        this.m_deadNum +=1;
    }

    p.getKillNum = function(){
        return this.m_killNum;
    }

    p.getDeadNum = function(){
        return this.m_deadNum;
    }

    p.setAttackId = function(attackId){
        this.m_lastAttackId = attackId;
    }

    p.getAttackId = function(){
        return this.m_lastAttackId;
    }

    p.getKillHighLvNum = function(){
        return this.m_killHighLvNum;
    }

    return PlayerKDA;

})();