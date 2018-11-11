/**
 * 每日登陆复活
 * */
var DailyReviveView=(function(_super){
	function DailyReviveView(){
		DailyReviveView.__super.call(this);
	}

	Laya.class(DailyReviveView,'view.DailyReviveView',_super);

	var p = DailyReviveView.prototype;

	p.init = function(){
		this.adCompleted =false;
		Utils.checkVideoBtn(this.shareBtn);
		this.shareBtn.on(Laya.Event.CLICK,this,this.onShowVideoAd);
		this.closeBtn.on(Laya.Event.CLICK,this,this.onClose);

		this.closeBtn.visible = false;
		var cfgWait = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.DailyPrizeCloseWait) || 0;
		Laya.timer.once(cfgWait,this,this.showCloseBtn);
		this.shareAni.play(0,true);

		this.m_getPrize = 0;

		EventMgr.getInstance().on(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
		EventMgr.getInstance().on(EEvent.CloseShowAd,this,this.onCloseShowAd);
	}

	p.uninit = function(){
		this.shareAni.stop();
		Laya.timer.clear(this,this.showCloseBtn);

		EventMgr.getInstance().off(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
		EventMgr.getInstance().off(EEvent.CloseShowAd,this,this.onCloseShowAd);
	}

	p.showCloseBtn = function(){
		this.closeBtn.visible = true;
	}

	p.onClose = function(){
		ServerAgency.getInstance().rpcDailyPrize(this.m_getPrize);
		UIMgr.getInstance().closeUI(EUI.DailyReviveView);
	}

	p.onShowVideoAd = function(){
		CheckIPMgr.getInstance().showVideoOrShare(ShareVideoPos.DailyLogin);
		this.m_muteMusic = SoundMgr.getInstance().isMusicMuted();
	}

	p.onShowAdCompleted = function(pos){
		if(pos == ShareVideoPos.DailyLogin){
			this.m_getPrize = 1;
			this.adCompleted = true;
		}
	}

	p.onCloseShowAd = function(){
		ServerAgency.getInstance().rpcDailyPrize(this.m_getPrize);
		SoundMgr.getInstance().playBgm();
		SoundMgr.getInstance().setMusicMute(this.m_muteMusic);
		
		if(this.adCompleted){
			this.shareBtn.disabled = true;
			this.shareAni.stop();
			UIMgr.getInstance().closeUI(EUI.DailyReviveView);
		}
	}

	return DailyReviveView;
})(DailyReviveViewUI)