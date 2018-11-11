/**
 * 无敌复活
 * */
var InvincibleView=(function(_super){
	function InvincibleView(){
		InvincibleView.__super.call(this);
		this.m_curVideoPos = 0;
	}

	Laya.class(InvincibleView,'view.InvincibleView',_super);

	var p = InvincibleView.prototype;

	p.init = function(){
		this.adCompleted =false;
		Utils.checkVideoBtn(this.shareBtn);
		this.shareBtn.on(Laya.Event.CLICK,this,this.onShowVideoAd);
		this.closeBtn.on(Laya.Event.CLICK,this,this.onClose);

		this.closeBtn.visible = false;
		Laya.timer.once(3000,this,this.showCloseBtn);
		this.shareAni.play(0,true);
		GameMgr.getInstance().setGamePause(true);
		this.createModel();

		Laya.timer.once(1700,this,this.playOldmanAni);

		EventMgr.getInstance().on(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
		EventMgr.getInstance().on(EEvent.CloseShowAd,this,this.onCloseShowAd);
	}

	p.uninit = function(){
		this.shareAni.stop();
		Laya.timer.clear(this,this.showCloseBtn);
		if(this.m_skeleton) {
			this.m_skeleton.destroy();
			this.m_skeleton = null;
		}
		if(this.m_timeLine){
			this.m_timeLine.destroy();
			this.m_timeLine = null;
		}
		EventMgr.getInstance().off(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
		EventMgr.getInstance().off(EEvent.CloseShowAd,this,this.onCloseShowAd);
	}

	p.playOldmanAni = function(){
		this.ani4.play(0,true);
	}

	p.showCloseBtn = function(){
		this.closeBtn.visible = true;
	}

	p.onClose = function(){
		if(GameMgr.getInstance().isGradeMode()){
			GameMgr.getInstance().setGamePause(false);
			GameMgr.getInstance().oneLifeRevive(false);
			UIMgr.getInstance().closeUI(EUI.InvincibleView);
		}else
		{
			UIMgr.getInstance().closeUI(EUI.InvincibleView);
			GameMgr.getInstance().fightOver();
		}
	}

	p.onShowVideoAd = function(){
		if(GameMgr.getInstance().isGradeMode()){
			this.m_curVideoPos = ShareVideoPos.GradeInvincible;
		}else if(GameMgr.getInstance().isEndlessMode()){
			this.m_curVideoPos = ShareVideoPos.EndlessInvincible;
		}

		CheckIPMgr.getInstance().showVideoOrShare(this.m_curVideoPos);
		this.m_muteMusic = SoundMgr.getInstance().isMusicMuted();
	}

	p.onShowAdCompleted = function(pos){
		if(pos == this.m_curVideoPos){
			this.adCompleted = true;
		}
	}

	p.onCloseShowAd = function(){
		this.playBgm();
		if(this.adCompleted) {
			this.shareBtn.disabled = true;
			this.shareAni.stop();
			GameMgr.getInstance().setRoleInvincible();
			UIMgr.getInstance().closeUI(EUI.InvincibleView);
		}
	}

	p.createModel = function(){
        this.m_skeleton = ResMgr.getInstance().getSkeleton();
		var cfg = GameMgr.getInstance().m_role.getCfg()
		this.m_skeleton.pos(this.heroAvatar.width/2+cfg.modelR,this.heroAvatar.height/2);
		var aniName = GameMgr.getInstance().m_role.m_lastAniName;
        this.m_skeleton.play(aniName,true,true);

		this.m_speedupAni = new Laya.Animation();
        this.m_speedupAni.loadAnimation("ani/buff_wudijiasu_loop.ani",Laya.Handler.create(this,this.onSpeedupAniLoaded));
    }

	p.onSpeedupAniLoaded = function(aa){
        this.heroAvatar.addChild(this.m_speedupAni);
		this.heroAvatar.addChild(this.m_skeleton);
        this.m_speedupAni.play(0,true);
		var cfg = GameMgr.getInstance().m_role.getCfg();
		this.m_speedupAni.pos(+this.m_skeleton.x,this.m_skeleton.y);
    }

	p.playBgm = function(){
		SoundMgr.getInstance().playBattleBgm();
		SoundMgr.getInstance().setMusicMute(this.m_muteMusic);
	}

	return InvincibleView;
})(InvincibleViewUI)