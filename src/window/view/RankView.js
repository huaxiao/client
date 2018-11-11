
/**
 * 排行榜
 */
var RankType = {
    Friend : "friend",
    Region : "region",
    Grade : "grade",
    Endless : "endless",
}

var RankView = (function(_super){
    function RankView(_super) {
        RankView.__super.call(this);
        this.rank_arr = [];
        this.callCnt = 0
    }

    Laya.class(RankView,'view.RankView',_super);
    var p = RankView.prototype;

    p.init = function(){
        this.friendRankSp.on(laya.events.Event.MOUSE_MOVE, this, this.OnTouchMove);
        this.friendRankSp.on(laya.events.Event.MOUSE_UP, this, this.OnTouchUp);
        this.friendTab.on(Laya.Event.CLICK,this,this.onFriendTabClick);
        this.regionTab.on(Laya.Event.CLICK,this,this.onRegionTabClick);
        this.gradeTab.on(Laya.Event.CLICK,this,this.onGradeTabClick);
        this.endlessTab.on(Laya.Event.CLICK,this,this.onEndlessTabClick);
        this.shareBtn.on(Laya.Event.CLICK,this,this.onShareBtnClick);
        this.closeBtn.on(Laya.Event.CLICK,this,this.onCloseBtnClick);       

        EventMgr.getInstance().on(EEvent.RefreshRegionRank,this,this.onRefreshRegionRank);
        //this.refreshRankHandler = Laya.Handler.create(this,this.refreshRank,null,false);        

        this.loadingImg.visible = false;
        this.onGradeTabClick();
        this.onFriendTabClick();
    }
    
    p.clearTexture = function(){
        if(this.rankTexture!=null){
            this.friendRankSp.graphics.clear();
            this.rankTexture.destroy(true);
            this.rankTexture = null;
        }
    }

    p.uninit = function(){
        this.clearTexture();
        this.friendRankSp.off(laya.events.Event.MOUSE_MOVE, this, this.OnTouchMove);
        this.friendRankSp.off(laya.events.Event.MOUSE_UP, this, this.OnTouchUp);
        EventMgr.getInstance().off(EEvent.RefreshRegionRank,this,this.onRefreshRegionRank);
        Laya.timer.clearAll(this);
    }

    p.showLoading = function() {
        this.content.visible = false;
        this.loadingImg.visible = true;
        this.ani1.play(0,true);
        this.selfIndex = -1;
    }

    p.onCloseBtnClick = function(){
        UIMgr.getInstance().closeUI(EUI.RankView);
        Laya.timer.clear(this,this.refreshFriendRankViewTimer);
        EventMgr.getInstance().event(EEvent.StartViewShowFriendRank);
    }

    p.onFriendTabClick = function(){
        this.onSubTabClick(RankType.Friend);        
    }

    p.onRegionTabClick = function(){
        this.onSubTabClick(RankType.Region);
    }

    p.onGradeTabClick = function(){
        this.onTabClick(RankType.Grade);        
    }

    p.onEndlessTabClick = function(){
        this.onTabClick(RankType.Endless);
    }

    p.onTabClick = function(type){
        if(this.loadingImg.visible) return;
        this.gradeTab.selected = !(type == RankType.Grade);
        this.endlessTab.selected = !(type == RankType.Endless);
        if(this.selectedMainType == type) return;
        this.selectedMainType = type;
        this.queryRank();
    }

    p.onSubTabClick = function(type){
        if(this.loadingImg.visible) return;
        this.friendTab.selected = !(type == RankType.Friend);
        this.regionTab.selected = !(type == RankType.Region);
        if(this.selectedSubType == type) return;
        this.selectedSubType = type;        
        this.queryRank();
    }

    p.queryRank = function(){
        if(this.selectedMainType==null||this.selectedSubType==null) return;
        this.showLoading();
        this.friendRankSp.visible = false;
        if(this.selectedSubType == RankType.Friend)
        {
            if(SDKMgr.IsWebChat()) {
                this.friendRankSp.visible = true;
                this.showWechatFriendRank(this.selectedMainType);
            }
            else {
                if(RankMgr.getInstance().queryFriendRank(this.selectedMainType,false)){
                }else{
                    this.closeLoading();
                }
            }
        }
        else
        {
            SDKMgr.getInst().hideFriendRank("max");

            Laya.timer.clear(this,this.refreshFriendRankViewTimer);
            if(RankMgr.getInstance().queryRegionRank(this.selectedMainType)){

            }else{
                this.closeLoading();
            }
        }
    }

    p.showWechatFriendRank = function(category){
        if(!GameConst.SupportOpenDomain){
            this.closeLoading();
            return;
        }

        var openDataContext = wx.getOpenDataContext();
        var sharedCanvas = openDataContext.canvas;
        sharedCanvas.width = this.friendRankSp.width;
        sharedCanvas.height = this.friendRankSp.height;

        this.callCnt = 0;  
        Laya.timer.loop(100, this, this.refreshFriendRankViewTimer);
        
        this.closeLoading();
        SDKMgr.getInst().showFriendRank("max",category);
    }

    p.refreshFriendRankViewTimer = function(){
        this.callCnt++;
        this.refreshFriendRankView();
        if(this.callCnt == 10){
            Laya.timer.clear(this, this.refreshFriendRankViewTimer);
        }
    }

    p.refreshFriendRankView = function(){
        this.clearTexture();
        
        this.rankTexture = new Laya.Texture(sharedCanvas);
        this.friendRankSp.graphics.drawTexture(this.rankTexture);
    }

    p.OnTouchMove = function(){
        if(this.selectedSubType == RankType.Friend){
            this.refreshFriendRankView();
        }
    }

    p.OnTouchUp = function(){
        if(this.selectedSubType == RankType.Friend){
            this.refreshFriendRankView();
        }
    }

    p.onShareBtnClick = function(){
        CheckIPMgr.getInstance().showVideoOrShare(ShareVideoPos.ShareOnRank);
    }

    p.onRefreshRegionRank = function(){
        this.refreshRank(RankMgr.getInstance().GetRegionRankList(this.selectedMainType));
    }

    p.refreshRank = function(datalist){
        if(datalist == null) return;
        
        // EventMgr.getInstance().event(EEvent.Error,JSON.stringify(datalist));
        var rank,nameTxt=null,scoreTxt=null,highlight = null;
        var selfInRank = false;
        var data,obj;
        var i=0;
        var len = datalist != null ? datalist.length : 0;
        // var rd = data.data.ranking_list[i];
        // rd 的字段如下:
        //var rd = {
        //    url: '',            // 头像的 url
        //    nick: '',           // 昵称
        //    score: 1,           // 分数
        //    selfFlag: false,    // 是否是自己
        //};
        var nickName = "",url;
        this.rank_arr.length = 0;
        for(; i < 100 && i < len;i++){
            data = datalist[i];
            nickName = data.nick;
            url = data.url;
            if(data.selfFlag)
            {
                selfInRank = true;
                nickName = GameData.getInstance().user.uname;
                this.selfIndex = i;
                url = GameData.getInstance().headIconUrl;
            }

            obj = {num:(i+1).toString(), name:nickName, url:url};
            obj.score = data.score!=null?data.score.toString():""
            obj.star = data.star || data.a1;
            // console.log(obj);
            this.rank_arr.push(obj);
        }
        this.rankList.array = this.rank_arr;   

        this.rankList.renderHandler = new Laya.Handler(this,this.onRankListRender);

        this.content.visible = true;
        this.closeLoading();
    }

    p.onRankListRender = function(item,index)
    {
        var highlight = item.getChildByName("highlight");
        if(this.selfIndex != -1 && index == this.selfIndex) 
        {
            highlight.visible = true;
        }
        else
        {
            highlight.visible = false;
        }

        if(index < 0 || index >= this.rank_arr.length) return;

        var data = this.rank_arr[index];
        var url = data.url;
        var icon = item.getChildByName("head");
        if(icon != null){
            icon.graphics.clear();
            if(url != null &&  url != ""){
                 icon.loadImage(url,0,0,icon.width,icon.height);
            }
        }
        var rankIcon = item.getChildByName("rankIcon");
        if(rankIcon != null){
            var id = index < 3 ? index + 1 : 4;
            rankIcon.skin = "rank/rank_"+id+".png"
        }

        var box = item.getChildByName("grade");
        if(this.selectedMainType == RankType.Grade) {
            item.getChildByName("score").visible = false;
            box.visible = true;
            var obj = DataMgr.getInstance().getGradeDataByStar(data.star);
            var cfg = DataMgr.getInstance().getUserGradeCfg(obj.grade);
            if(cfg!=null){
                box.getChildByName("icon").skin = cfg.icon;
            }
            var starCntLabel = box.getChildByName("starCnt");
            starCntLabel.text = "x"+obj.gradeStar;
        }
        else {
            box.visible = false;
            item.getChildByName("score").visible = true;
        }
    }

    p.closeLoading = function(){
        this.ani1.stop();
        this.loadingImg.visible = false;
    }
    return RankView;
})(RankUI);