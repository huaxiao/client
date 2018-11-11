/*
* 无尽模式复活界面;
*/
var EndlessOneLifeView = (function (_super) {
    function EndlessOneLifeView() {
        EndlessOneLifeView.__super.call(this);
    }

    Laya.class(EndlessOneLifeView,'view.EndlessOneLifeView',_super);

    var p = EndlessOneLifeView.prototype;

    p.init = function(data){
		this.shareAni.play(0,true);
		Utils.checkVideoBtn(this.adBtn);
		this.adBtn.on(Laya.Event.CLICK,this,this.onShowVideoAd);
		this.closeBtn.on(Laya.Event.CLICK,this,this.onContinueBtnClick);
		this.reviveBtn.on(Laya.Event.CLICK,this,this.onReviveBtnClick);

		this.m_muteMusic = false;
		this.refreshView(data);
		this.onUpdateGoods();

		EventMgr.getInstance().on(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
		EventMgr.getInstance().on(EEvent.CloseShowAd,this,this.onCloseShowAd);
		EventMgr.getInstance().on(EEvent.UseReviveStoneResult,this,this.OnUseReviveStoneCallback);
		EventMgr.getInstance().on(EEvent.Player_Goods_Update,this,this.onUpdateGoods);
	}

	p.uninit = function(){
		this.shareAni.stop();
		
        this.adBtn.off(Laya.Event.CLICK,this,this.onShowVideoAd);
		this.closeBtn.off(Laya.Event.CLICK,this,this.onContinueBtnClick);
		this.reviveBtn.off(Laya.Event.CLICK,this,this.onReviveBtnClick);


		EventMgr.getInstance().off(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
		EventMgr.getInstance().off(EEvent.CloseShowAd,this,this.onCloseShowAd);
		EventMgr.getInstance().off(EEvent.UseReviveStoneResult,this,this.OnUseReviveStoneCallback);
		EventMgr.getInstance().off(EEvent.Player_Goods_Update,this,this.onUpdateGoods);
	}

	p.refreshView = function(data){
		var gameMgr = GameMgr.getInstance();
		var role = gameMgr.m_role.getAvatar();
        var overFriend = RankMgr.getInstance().nextSurpassFriend(role.getHighScore());

		this.curGrowTxt.text = "" + role.getScore();
        if(overFriend){
            this.highGrowTitle.text = "即将超越";
            this.highGrowTxt.text = "" + overFriend.score;
            this.highGrowName.text = overFriend.nick;
        }else
        {
            this.highGrowName.text = "";
            this.highGrowTitle.text = "新纪录";
            this.highGrowTxt.text = "" + role.getHighScore();
        }
        
		
        if(data!=null){
            this.highestScoreTxt.text = data.highestScore;
            this.leftReliveCntTxt.text = data.leftReliveCnt + "";
            this.highestScoreName.text = data.name;
        }
	}

	p.onUpdateGoods = function(){
		var stone = GameData.getInstance().goods.reviveStone;
		this.reviveBtn.disabled =  stone == 0;
		this.reviveStoneTxt.text = stone  + "";
	}

	p.onShowVideoAd = function(){
		CheckIPMgr.getInstance().showVideoOrShare(ShareVideoPos.EndlessNormalRevive);
		this.m_muteMusic = SoundMgr.getInstance().isMusicMuted();
	}

	p.onShowAdCompleted = function(pos){
		if(pos == ShareVideoPos.EndlessNormalRevive){
			GameMgr.getInstance().setAdReward(true);
			GameMgr.getInstance().addShowAdNum();
		}
	}

	p.onCloseShowAd = function(){
		this.playBgm();
		if(GameMgr.getInstance().isAdReward()) {
			this.continue(true);
			return;
		}
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
		UIMgr.getInstance().hideUI(EUI.EndlessOneLifeView);
		this.uninit();
		GameMgr.getInstance().fightOver();
	}

	p.continue = function(isShared){
		GameMgr.getInstance().setAdReward(false);
		UIMgr.getInstance().hideUI(EUI.EndlessOneLifeView);
		this.uninit();
		GameMgr.getInstance().oneLifeRevive(isShared);
	}

	p.playBgm = function(){
		SoundMgr.getInstance().playBattleBgm();
		SoundMgr.getInstance().setMusicMute(this.m_muteMusic);
	}

    return EndlessOneLifeView;
})(EndlessOneLifeViewUI)