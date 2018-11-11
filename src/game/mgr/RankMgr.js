/*
* name;
*/
var RankMgr = (function () {

    function RankMgr() {
        this.m_friendRankList = [];
        this.m_regionRankList = [];
        this.m_endlessFriendRankList = [];
        this.m_endlessRegionRankList = [];
        this.m_selfRankData = null;
        this.m_isQuerying = false;
        this.m_lastQueryFriendRankTime = 0;
        this.m_lastQueryRegionRankTime = 0;

        this.m_lastQueryEndlessFriendRankTime = 0;
        this.m_lastQueryEndlessRegionRankTime = 0;

        this.m_reqType = 0;
    }

      /**
     * 单例
     */
    RankMgr.getInstance = function(){
        if(RankMgr._instance == null){
            RankMgr._instance = new RankMgr();
        }
        return RankMgr._instance;
    }

    var p = RankMgr.prototype;

    p.RegionRankList = function(){
        return this.m_regionRankList;
    }

    p.EndlessFriendRankList = function(){
        return this.m_endlessFriendRankList;
    }

    p.EndlessRegionRankList = function(){
        return this.m_endlessRegionRankList;
    }

    p.GetFriendRankList = function(mainType){
        if(mainType == RankType.Grade)
            return this.m_friendRankList;
        else if(mainType == RankType.Endless)
            return this.m_endlessFriendRankList;
        return null;
    }

    p.GetRegionRankList = function(mainType){
        if(mainType == RankType.Grade)
            return this.m_regionRankList;
        else if(mainType == RankType.Endless)
            return this.m_endlessRegionRankList;
        return null;
    }

    p.queryFriendRank = function(mainType,force){
        if(mainType == RankType.Grade){
            if(this.m_friendRankList.length > 0 &&  TimerUtil.currTimer - this.m_lastQueryFriendRankTime < 3){
                EventMgr.getInstance().event(EEvent.RefreshFriendRank);
                return true;
            }
        }else if(mainType == RankType.Endless){
            if(this.m_endlessFriendRankList.length > 0 &&  TimerUtil.currTimer - this.m_lastQueryEndlessFriendRankTime < 3){
                EventMgr.getInstance().event(EEvent.RefreshFriendRank);
                return true;
            }
        }

        if(this.m_isQuerying && !force) return false;

        this.m_reqType = mainType;

        this.m_isQuerying = true;
        var handler = Laya.Handler.create(this,this.parseFriendRank);
        SDKMgr.getInst().queryRank(mainType,"friend",handler); 

        if(mainType == RankType.Grade)
            this.m_lastQueryFriendRankTime = TimerUtil.currTimer();
        else if(mainType == RankType.Endless)
            this.m_lastQueryEndlessFriendRankTime = TimerUtil.currTimer();
            
        return true;
    }

    p.parseFriendRank = function(obj){
        var list = null;
        if(this.m_reqType == RankType.Grade){
            list = this.m_friendRankList;
        }else if(this.m_reqType == RankType.Endless)
        {
            list = this.m_endlessFriendRankList;
        }
        if(list == null) return;

        list.length = 0;

        var datalist = obj.data.ranking_list;
        var data = null;
        var len = datalist != null ? datalist.length : 0;
        for(var i = 0; i < len;i++){
            data = datalist[i];
            if(data.selfFlag)
            {
                if(this.m_reqType == RankType.Endless){
                    this.m_historyHighScore = data.score;
                    this.m_selfRankData = data;
                }
            }
            list.push(data);
        }

        
        this.m_isQuerying = false;

        EventMgr.getInstance().event(EEvent.RefreshFriendRank);
    }


    p.queryRegionRank = function(mainType){
        if(mainType == RankType.Grade){
             if(this.m_regionRankList.length > 0 &&  TimerUtil.currTimer - this.m_lastQueryRegionRankTime < 3){
                EventMgr.getInstance().event(EEvent.RefreshRegionRank);
                return true;
            }
        }else if(mainType == RankType.Endless){
            if(this.m_endlessRegionRankList.length > 0 &&  TimerUtil.currTimer - this.m_lastQueryEndlessRegionRankTime < 3){
                EventMgr.getInstance().event(EEvent.RefreshFriendRank);
                return true;
            }
        }

        // if(this.m_isQuerying) return false;       
        
        this.m_reqType = mainType;
        this.m_isQuerying = true;
        var handler = Laya.Handler.create(this,this.parseRegionRank);
        SDKMgr.getInst().queryRank(mainType,"region",handler); 

        if(mainType == RankType.Grade)
            this.m_lastQueryRegionRankTime = TimerUtil.currTimer();
        else
            this.m_lastQueryEndlessRegionRankTime = TimerUtil.currTimer();

        return true;
    }

    p.parseRegionRank = function(obj){
        var list = null;
        if(this.m_reqType == RankType.Grade){
            list = this.m_regionRankList;
        }else if(this.m_reqType == RankType.Endless)
        {
            list = this.m_endlessRegionRankList;
        }
        if(list == null) return;

        list.length = 0;

        var datalist = obj.data.ranking_list;
        var data = null;
        var len = datalist != null ? datalist.length : 0;
        for(var i = 0; i < len;i++){
            data = datalist[i];
            list.push(data);
        }

        this.m_isQuerying = false;
        EventMgr.getInstance().event(EEvent.RefreshRegionRank);
    }

    ///更新自己的排行数据
    p.updateSelfRankScore = function(highScore){
        if(this.m_selfRankData != null && highScore > this.m_selfRankData.score){
            this.m_selfRankData.score = highScore;
        }
    }

    //获取超越了的好友
    p.overFriendIndex = function(highScore) {
        var data = null;
        for(var i = 0;i < this.m_endlessFriendRankList.length;i++){
            data = this.m_endlessFriendRankList[i];
            if(highScore > data.score){
                return i;
            }
        }
        return this.m_endlessFriendRankList.length;
    }

    //即将超越
    p.nextSurpassFriend = function(highScore){
        var index = this.overFriendIndex(highScore);
        if(index == 0){
            return null;
        }else
        {
            return this.m_endlessFriendRankList[index-1];
        }
    }
    
    //超越了玩家名字
    p.surpassFriend = function(highScore){
        if(this.m_endlessFriendRankList.length == 0) return null;

        var data = null;
        for(var i = 0;i < this.m_endlessFriendRankList.length;i++){
            data = this.m_endlessFriendRankList[i];
            if(highScore > data.score){
                return data;
            }
        }
        return null;
    }
    return RankMgr;
}());