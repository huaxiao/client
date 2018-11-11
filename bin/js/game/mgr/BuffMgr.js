
var BuffType = {
    IncKillScore : 1,   //增加击杀分数
    IncKillBall : 2,    //增加击杀爆豆
    Invincible : 3,    //无敌
    IncMoveSpeed : 4,    //增加移动速度
    IncAtkSpeed : 5,    //增加攻速
    IncAllScore : 6,    //增加所有分数
    IncSettleGold : 7,  //结算金币加成
    Skill : 8,   //技能buff
    IncAtkDistance : 9,   //攻击距离
}

var BuffTriggerType = {
    Dead : 0,   //死亡触发
    FightBegin : 1, //开始战斗触发
}

var BuffTriggerCond = {
    Normal : 0, //默认 
    Attack : 1, //攻击触发
    BeAttack : 2,   //受击触发
}

var BuffSkill = {
    KillAll : 1, //秒杀
    Bullet : 2, //剑气
} 

/*
* Buff管理;
*/
var BuffMgr = (function () {
    function BuffMgr() {
    }

    /**
     * 单例
     */
    BuffMgr.getInstance = function(){
        if(BuffMgr._instance == null){
            BuffMgr._instance = new BuffMgr();
        }
        return BuffMgr._instance;
    }

    var p = BuffMgr.prototype;

    p.init = function() {        
        this.initData();

        EventMgr.getInstance().on(EEvent.TriggerBuff,this,this.onCheckTrigger);
    }

    p.uninit = function() {
        EventMgr.getInstance().off(EEvent.TriggerBuff,this,this.onCheckTrigger);
    }

    p.initData = function(){
        this.m_arrTrigger = [];
        this.m_buffData = {};
        var buffTriggerCfg = DataMgr.getInstance().buffTriggerCfgData;        
        for(var id in buffTriggerCfg) {
            if(buffTriggerCfg[id].pop == 1) {
                this.m_arrTrigger.push(buffTriggerCfg[id]);
                this.m_buffData[id] = {id:parseInt(id),dailyCnt:0};
            }
        }

        var lastDate = parseInt(Laya.LocalStorage.getItem("buff_data_date")||"0");
        var date = new Date().getDate();
        if(date == lastDate) {
            var dataJson = Laya.LocalStorage.getItem("buff_data");
            if(dataJson != null) {
                var dataObj = JSON.parse(dataJson);
                for(var key in dataObj) {
                    var data = dataObj[key];
                    var id = parseInt(data.id);
                    if(this.m_buffData[id]==null) continue;
                    var dailyCnt = parseInt(data.dailyCnt);
                    this.m_buffData[id].dailyCnt = dailyCnt;
                }
            }
        }
        else {
            Laya.LocalStorage.removeItem("buff_data");
        }
    }

    p.onCheckTrigger = function(data){
        if(data.type == BuffTriggerType.FightBegin) {
            this.m_nozeroLvMeet = 0;
        }

        var hasReviveCnt = GameMgr.getInstance().getSpace().hasReviveCnt();
        if(!hasReviveCnt) return;

        var lastOkCfg = null;
        var size = this.m_arrTrigger.length;
        for(var i=0; i<size; i++) {
            var cfg = this.m_arrTrigger[i];
            if(cfg.battleType!=data.battleType) continue;
            if(cfg.type!=data.type) continue;
            if(data.trigger.lv >= cfg.trigger.minLv) {
                if(cfg.trigger.maxLv != null && data.trigger.lv > cfg.trigger.maxLv) {
                    continue;
                }
                lastOkCfg = cfg;
                if(cfg.trigger.maxLv==null) {
                    if(cfg.order<=this.m_nozeroLvMeet) continue;
                    this.m_nozeroLvMeet = cfg.order;
                }
                break;
            }
        }
        // console.log(lastOkCfg);
        this.onTriggerBuff(lastOkCfg);
        return lastOkCfg != null;
    }

    p.onTriggerBuff = function(cfg){
        if(cfg == null) return;

        var id = cfg.id;
        if(cfg.dailyCnt > 0 && this.m_buffData[id].dailyCnt>cfg.dailyCnt) return;

        this.m_buffData[id].dailyCnt += 1;
        this.saveData();        

        var data = cfg;
        if(cfg.view == "EndlessOneLifeView") {
            data = GameMgr.getInstance().getSpace().getOneLifeViewData();
        }
        UIMgr.getInstance().openUIUnique(EUI[cfg.view],data);
    }

    p.activeBuff = function(cfg){
        if(cfg == null) return;
        var gameMgr = GameMgr.getInstance();
        gameMgr.setGamePause(false);
        var role = gameMgr.getRolePlayer();

        var isInvincible = false;
        var noRandomPos = false;
        for(var i=0; i<cfg.buffArray.length; i++) {
            var buffCfg = DataMgr.getInstance().getBuffData(cfg.buffArray[i]);
            if(buffCfg && buffCfg.effectType==BuffType.Invincible && buffCfg.durationMS>2000) {
                isInvincible = true;
                noRandomPos = true;
                break;
            }
        }
        var reviveLv = cfg.reviveLv;
        // console.log("noRandomPos",noRandomPos);

        for(var i=0; i<cfg.buffArray.length; i++) {
            role.activeBuff(cfg.buffArray[i]);
        }
        role.onRevive(true,noRandomPos,reviveLv);
    }

    p.saveData = function(){
        Laya.LocalStorage.setItem("buff_data", JSON.stringify(this.m_buffData));
        var date = new Date().getDate();
        Laya.LocalStorage.setItem("buff_data_date", date);
    }

    return BuffMgr;
}());

BuffMgr._instance = null;