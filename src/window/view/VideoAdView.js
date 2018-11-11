
var VideoAdType = {
    TimesScore : "TimesScore",
    KillAll : "KillAll",
    Prepare : "Prepare"
}

/*
* 视频广告;
*/
var VideoAdView = (function (_super) {
    function VideoAdView() {
        VideoAdView.__super.call(this);
        this.m_curVideoPos = 0;
    }

    var buffID = 6;

    Laya.class(VideoAdView,'view.VideoAdView',_super);
    var p = VideoAdView.prototype;

    p.init = function(data) {
        EventMgr.getInstance().on(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
		EventMgr.getInstance().on(EEvent.CloseShowAd,this,this.onCloseShowAd);

        this.closeBtn.on(Laya.Event.CLICK,this,this.onClose);
        this.m_closeCallback = data.callback;
        this.m_type = data.type;
        this.m_killAllCnt = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.KillAllCnt) || 1;

        Utils.checkVideoBtn(this.videoBtn);
        Utils.checkVideoBtn(this.videoGetBtn);
        Utils.checkVideoBtn(this.timesScoreBtn);
        Utils.checkVideoBtn(this.killAllBtn);

        if(this.m_type == VideoAdType.TimesScore) {
            this.videoBtn.on(Laya.Event.CLICK,this,this.onVideo);
            this.continueBtn.on(Laya.Event.CLICK,this,this.onContinue);
            var cfg = DataMgr.getInstance().getBuffData(buffID);
            var times = cfg&&cfg.effectVal||1;
            this.closeBtn.visible = false;
        }
        else if(this.m_type == VideoAdType.KillAll) {
            this.closeBtn.false = true;
            TimerUtil.once(3000,this,this.showCloseBtn);

            this.videoGetBtn.on(Laya.Event.CLICK,this,this.onVideoGet);
            Laya.LocalStorage.removeItem("killAllCnt");
        }
        else if(this.m_type == VideoAdType.Prepare) {
            var killAllCnt = parseInt(Laya.LocalStorage.getItem("killAllCnt")) || 0;
            if(killAllCnt > 0) {
                this.killAllBtn.disabled = true;
            }
            else {
                this.killAllBtn.on(Laya.Event.CLICK,this,this.onKillAll);
                this.killAllDone.visible = false;
            }

            var buffId = parseInt(Laya.LocalStorage.getItem("videoBuffId")) || 0;
            if(buffId != 0) {
                this.timesScoreBtn.disabled = true;
            }
            else {
                this.timesScoreBtn.on(Laya.Event.CLICK,this,this.onTimesScore);
                this.timesScoreDone.visible = false;
            }
        }
        this.killall.visible = this.m_type == VideoAdType.KillAll;
        this.addpoint.visible = this.m_type == VideoAdType.TimesScore;
        this.cat.visible = this.m_type!=VideoAdType.KillAll;
        this.prepareBox.visible = this.m_type == VideoAdType.Prepare;
    }

    /**
     * 卸载界面
     */
    p.uninit = function(){
        EventMgr.getInstance().off(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
		EventMgr.getInstance().off(EEvent.CloseShowAd,this,this.onCloseShowAd);
    }

    p.showCloseBtn = function(){
        this.closeBtn.visible = true;
    }

    p.onClose = function(){
        UIMgr.getInstance().closeUI(EUI.VideoAdView);
        if(this.m_closeCallback != null) {
            this.m_closeCallback.run();
        }
    }

    p.onVideo = function(){
        var pos = GameMgr.getInstance().getSpace()==null ? ShareVideoPos.StartMultiTimesScore :
            GameMgr.getInstance().isGradeMode() ? ShareVideoPos.GradeMultiTimesScore : ShareVideoPos.EndlessMultiTimesScore;

        this.m_curVideoPos = pos;
        CheckIPMgr.getInstance().showVideoOrShare(pos);
    }

    p.onContinue = function(){
        this.onClose();
    }

    p.onVideoGet = function(){
        var pos = GameMgr.getInstance().getSpace()==null ? ShareVideoPos.StartKillAll :
            GameMgr.getInstance().isGradeMode() ? ShareVideoPos.GradeKillAll : ShareVideoPos.EndlessKillAll;
        
        this.m_curVideoPos = pos;
        CheckIPMgr.getInstance().showVideoOrShare(pos);
    }

    p.onShowAdCompleted = function(pos){
        if(pos == this.m_curVideoPos){
            if(this.m_type == VideoAdType.TimesScore) {
                Laya.LocalStorage.setItem("videoBuffId",buffID);
            }
            else if(this.m_type == VideoAdType.KillAll) {
                Laya.LocalStorage.setItem("killAllCnt",this.m_killAllCnt);
            }
            else if(this.m_type == VideoAdType.Prepare) {
                if(this.m_clickTimesScore) {
                    Laya.LocalStorage.setItem("videoBuffId",buffID);   
                }
                if(this.m_clickKillAll) {
                    Laya.LocalStorage.setItem("killAllCnt",this.m_killAllCnt);
                }
            }
        }
    }

    p.onCloseShowAd = function(){
        this.onClose();
    }

    p.onTimesScore = function(){
        this.m_clickTimesScore = true;
        this.onVideo();
    }

    p.onKillAll = function(){
        this.m_clickKillAll = true;
        this.onVideoGet();
    }

    return VideoAdView;
}(VideoAdViewUI));