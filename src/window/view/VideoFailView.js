var VideoFailView = (function (_super) {
    function VideoFailView() {
        VideoFailView.__super.call(this);
    }

    Laya.class(VideoFailView,'view.VideoFailView',_super);
    var p = VideoFailView.prototype;

    p.init = function(params){
        if(params!=null){
            this.canShare = params.showShare;
            this.videoPos = params.pos;
            this.gold = params.gold;
        }else{
            this.canShare = false;
            this.videoPos = 0;
            this.gold = 0;
        }

        this.m_callShare = false;

        this.closeBtn.on(Laya.Event.CLICK,this,this.onClose);
        this.shareBtn.on(Laya.Event.CLICK,this,this.onShare);
        this.buyBtn.on(Laya.Event.CLICK,this,this.onBuy);
        this.shareBtn.visible =  this.canShare;
        this.buyBtn.label = this.gold;
        EventMgr.getInstance().on(EEvent.GetFocus,this,this.onGameFocus);
        EventMgr.getInstance().on(EEvent.CostGold,this,this.onCostGold);
    }

    p.uninit = function(){
        EventMgr.getInstance().off(EEvent.GetFocus,this,this.onGameFocus);
        EventMgr.getInstance().off(EEvent.CostGold,this,this.onCostGold);
    }

    p.onClose = function(){
        UIMgr.getInstance().closeUI(EUI.VideoFailView);
    }

    p.onShare = function(){
        if(CheckIPMgr.getInstance().onlyShare(this.videoPos))
        {
            this.shareBtn.disabled  = true;
            this.m_callShare = true;
        }
    }

    p.onBuy = function(){
        if(this.gold > GameData.getInstance().goods.gold){
            UIMgr.getInstance().showTips("金币不足",2000);
            return;
        }

        ServerAgency.getInstance().rpcCostGold(this.gold);
    }

    p.onCostGold = function(){
        this.onClose();
        Utils.finishVideo(this.videoPos);
    }

    p.onGameFocus = function(){
        if(this.m_callShare){
            this.onClose();
            Utils.finishVideo(this.videoPos);
        }
    }

    return VideoFailView;
}(VideoFailViewUI));