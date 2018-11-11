/**
 * 一条命结算
 * */
var OneLifeView=(function(_super){
	function OneLifeView(){
		OneLifeView.__super.call(this);
	}

	Laya.class(OneLifeView,'view.OneLifeView',_super);

	var p = OneLifeView.prototype;

	p.init = function(){
		this.shareAni.play(0,true);

		Utils.checkVideoBtn(this.shareBtn);
		this.shareBtn.on(Laya.Event.CLICK,this,this.onShowVideoAd);
		this.continueBtn.on(Laya.Event.CLICK,this,this.onContinueBtnClick);
		this.closeBtn.on(Laya.Event.CLICK,this,this.onContinueBtnClick);
		this.reviveBtn.on(Laya.Event.CLICK,this,this.onReviveBtnClick);
		this.dailyBtn.on(Laya.Event.CLICK,this,this.onDailyBtnClick);
		
		this.refreshView();
		this.onUpdateGoods();

		// if(GameMgr.getInstance().hasDailyReviveCnt()) {
		// 	this.dailyBtn.visible = true;
		// 	this.shareBtn.visible = false;
		// 	this.continueBtn.visible = false;
		// 	this.reviveBtn.visible = false;
		// 	this.adReviveLabel.visible = false;
		// 	this.countDownImg.visible = false;
		// 	GameMgr.getInstance().setGamePause(true);
		// }
		// else {
			this.dailyBtn.visible = false;
			this.shareBtn.visible = true;
			this.continueBtn.visible = true;
			this.reviveBtn.visible = true;
			this.adReviveLabel.visible = true;
			this.countDownImg.visible = true;
			this.m_time = 5;
			this.countdownTxt.changeText(""+this.m_time);
			Laya.timer.loop(1000,this,this.onCountDown);
			if(GameMgr.getInstance().showAdNum() < 5){
				this.shareBtn.on(Laya.Event.CLICK,this,this.onShowVideoAd);
				this.shareBtn.visible = true;
				this.continueBtn.visible = false;
			}
			else{
				this.shareBtn.visible = false;
				this.continueBtn.visible = true;
			}
			GameMgr.getInstance().setGamePause(true);
		// }


		EventMgr.getInstance().on(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
		EventMgr.getInstance().on(EEvent.CloseShowAd,this,this.onCloseShowAd);
		EventMgr.getInstance().on(EEvent.UseReviveStoneResult,this,this.OnUseReviveStoneCallback);
		EventMgr.getInstance().on(EEvent.Player_Goods_Update,this,this.onUpdateGoods);
	}

	p.uninit = function(){
		this.shareAni.stop();
		Laya.timer.clear(this,this.onCountDown);
		this.clearTexture();
		
		EventMgr.getInstance().off(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
		EventMgr.getInstance().off(EEvent.CloseShowAd,this,this.onCloseShowAd);
		EventMgr.getInstance().off(EEvent.UseReviveStoneResult,this,this.OnUseReviveStoneCallback);
		EventMgr.getInstance().off(EEvent.Player_Goods_Update,this,this.onUpdateGoods);
	}

	p.clearTexture = function(){
		if(this.canvasTexture!=null){
            this.canvasTexture.destroy();
            this.canvasTexture = null;
        }
	}

	p.refreshView = function(){
		var gameMgr = GameMgr.getInstance();
		var role = gameMgr.m_role.getAvatar();

		this.curGrowTxt.text = ""+role.getScore();
		this.highGrowTxt.text = ""+role.getHighScore();
		var liveTime = gameMgr.getLiveTime();
		this.liveTimeTxt.text = StringUtil.formatSeconds(liveTime);

		// this.shareBtn.disabled = gameMgr.m_shareCnt > 0;
		this.refreshTaskInfo();
	}

	p.refreshTaskInfo = function(){
		if(!GameMgr.getInstance().isGradeMode()) {
			this.taskBox.visible = false;
			return;
		}
		this.normalBox.visible = false;
		var arrTask = TaskMgr.getInstance().getTaskArray();
        var task,dom;
        for(var i=0; i<3; i++) {
            task = arrTask[i];
            dom = this.taskBox.getChildByName("task"+i);
			done = this.taskBox.getChildByName("done"+i);
            if(task != null) {
                dom.visible = true;
                dom.innerHTML = task.reviveStyle;
				done.visible = task.finish == 1;
            }
            else {
                dom.visible = false;
				done.visible = false;
            }
        }
	}

	p.onUpdateGoods = function(){
		var stone = GameData.getInstance().goods.reviveStone;
		this.reviveBtn.disabled =  stone == 0;
		this.reviveStoneTxt.text = stone  + "";
	}

	p.onCountDown = function(){
		this.countdownTxt.changeText(""+this.m_time);
		this.m_time--;
		if(this.m_time < 0) {
			this.continue(false);
		}
	}

	p.onShowVideoAd = function(){
		Laya.timer.clear(this,this.onCountDown);
		CheckIPMgr.getInstance().showVideoOrShare(ShareVideoPos.GradeNormalRevive);
		this.m_muteMusic = SoundMgr.getInstance().isMusicMuted();
	}

	p.onShowAdCompleted = function(pos){
		if(pos == ShareVideoPos.GradeNormalRevive){
			GameMgr.getInstance().setAdReward(true);
			GameMgr.getInstance().addShowAdNum();
		}
	}

	p.onCloseShowAd = function(){
		SoundMgr.getInstance().playBattleBgm();
		if(GameMgr.getInstance().isAdReward()) {
			this.continue(true);
			return;
		}

		Laya.timer.loop(1000,this,this.onCountDown);
	}

	p.onReviveBtnClick = function(){
		this.reviveBtn.disabled = true;
		
		//TODO 告诉服务器使用了复活币
		ServerAgency.getInstance().rpcUseReviveStone();
	}

	p.OnUseReviveStoneCallback = function(isOk){
		this.continue(isOk);
	}

	p.onContinueBtnClick = function(){
		this.continue(false);
	}

	p.continue = function(isShared){
		GameMgr.getInstance().setGamePause(false);
		GameMgr.getInstance().setAdReward(false);
		UIMgr.getInstance().hideUI(EUI.OneLifeView);
		this.uninit();
		GameMgr.getInstance().oneLifeRevive(isShared);
	}

	p.onDailyBtnClick = function(){		
		this.continue(true);
	}

	return OneLifeView;
})(OneLifeViewUI)