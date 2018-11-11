/*
* 无尽模式结算界面
*/
var EndlessSettlementView = (function (_super) {
    function EndlessSettlementView() {
        EndlessSettlementView.__super.call(this);
        this.gold  = 0;
        this.hScore = 0;
        this.dScore = 0;
		this.newScore = false;
    }

    Laya.class(EndlessSettlementView,'view.EndlessSettlementView',_super);

    var p = EndlessSettlementView.prototype;

    p.init = function(data){
		this.initSdk();

		Utils.checkVideoBtn(this.watchAdBtn);
		this.continueBtn.on(Laya.Event.CLICK,this,this.onClose);
		this.flauntBtn.on(Laya.Event.CLICK,this,this.onShare);
		this.watchAdBtn.on(Laya.Event.CLICK,this,this.onShowAd);
		EventMgr.getInstance().on(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
		this.flauntAni.play(0,true);

		if(data == null){
			return;
		}

		this.hScore = data.highScore;	
        this.dScore = this.hScore * 2;	
		this.titleImg.skin = "offlineSettlementView/" + Utils.getTitleImg(this.hScore,8) + ".png";
		this.newScore = data.new;

		this.gold = this.calGoldByBattleScore(this.hScore);
        // this.newFlag.visible = this.newScore;

        this.highScore.text = this.hScore + "";
        this.goldTxt.text = this.gold + "";

		this.doubleScore.text = this.dScore + "";

		var temp = 2 * this.gold;
        this.doubleGold.text = temp + "";

		var cfgId = EGlobalCfg.EndlessChipTipsMaxCnt;
        var cfgMaxNum = DataMgr.getInstance().getGlobalCfg(cfgId);
        var chipCnt = Math.min(data.killNum,cfgMaxNum);
		this.m_chipCnt = chipCnt;
		
        this.chipTxt.text = chipCnt + "";
		this.doubleChip.text = (chipCnt*2)+"";

		// var ani = new Laya.Animation();
		// ani.pos(this.doubleBg.width/2,this.doubleBg.height/2);
		// ani.loadAnimation("ani/ui_jiesuanliuguang.ani",Laya.Handler.create(this,function(){
		// 	ani.play(0,true);
		// }));  
		// this.doubleBg.addChild(ani);
		// ani.zOrder = -1;
		
		this.showSupressed();
		this.showSkin();

		SoundMgr.getInstance().stopMusic();
		SoundMgr.getInstance().playSound(ESound.Settlement);
    }

	p.onShowHideDrawer = function(){
         this.m_showDrawer = true;
         AladinSDK.ShowDrawer();
    }

	p.initSdk = function(){
        if(SDKMgr.IsWebChat() && typeof(wx) != "undefined") {
            this.moreNode = AladinSDK.getMoreNode();
            this.moreNode.x = 0;
            this.moreNode.y = 0;
			this.linkNode.addChild(this.moreNode);  //获取更多好玩节点
            AladinSDK.ShowMore();

            this.m_drawerskeleton = new Laya.Skeleton();
            this.dragonbones.addChild(this.m_drawerskeleton);
            this.m_drawerskeleton.pos(0,0);
            this.m_drawerskeleton.load("res/drawer/NewProject.sk");
            this.m_showDrawer = false;

			this.drawerBtn.on(Laya.Event.CLICK,this,this.onShowHideDrawer);
        }
    }

	p.showSkin = function(){
		// if(SkinMgr.getInstance().usingSkinId() > 0) {
		// 	this.skinBox.visible = false;
		// 	return;
		// }
		if(this.m_skinSkeleton == null){
            this.m_skinSkeleton = ResMgr.getInstance().getSkeleton();
            this.m_skinSkeleton.rotation = 90;
			this.m_skinSkeleton.pos(this.newskin.width/2,this.newskin.height/2);
            this.newskin.addChild(this.m_skinSkeleton);
            this.m_skinSkeleton.play("headskin1_run",true,true);
			this.newskin.on(Laya.Event.CLICK,this,function(){
				UIMgr.getInstance().openUI(EUI.SkinShowView);
			});
        }
	}

	p.showSupressed = function(){
		var overFriend = RankMgr.getInstance().surpassFriend(this.dScore);
        if(overFriend != null){
			if(overFriend.selfFlag){
				this.beyondTips.text = "观看视频可刷新";
				this.beyondName.text = "新纪录";
			}else{
				this.beyondTips.text = "观看视频可超越";
				this.beyondName.text = overFriend.nick;
			}
			this.beyondbox.visible = true;
        }else 
		{
			overFriend = RankMgr.getInstance().surpassFriend(this.hScore);
			if(overFriend != null){
				if(overFriend.selfFlag){
					this.beyondTips.text = "您刷新了新纪录";
					this.beyondName.text = "";
				}else{
					this.beyondTips.text = "您超越了";
					this.beyondName.text = overFriend.nick;
				}
				this.beyondbox.visible = true;
			}else{
				this.beyondbox.visible = false;
			}
		}
	}

	p.calGoldByBattleScore = function(score){
		var cfgRatio = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.ScoreGoldRatio) || 0.001;
		var cfgMin = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.ScoreGoldMin) || 1;
		var cfgMax = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.ScoreGoldMax) || 20;

		var gold = Math.floor(score * cfgRatio);
		var goldRatio = GameMgr.getInstance().m_role.getAvatar().getBuffVal(BuffType.IncSettleGold);
		gold = Math.ceil(gold * goldRatio);
		if(gold > cfgMax) 
			gold = cfgMax;
		else if(gold < cfgMin)
			gold = cfgMin;
		return gold;
	}

	p.onShare = function(){
		CheckIPMgr.getInstance().showVideoOrShare(ShareVideoPos.EndlessShare);
	}

	p.onClose = function() {
        SoundMgr.getInstance().playUIClick();
		this.close();
    }

	p.close = function(){
        UIMgr.getInstance().closeUI(EUI.EndlessSettlementView);
		GameMgr.getInstance().preExitBattle();
	}

	p.onShowAd = function(){
		this.m_showAdClicked = true;
		CheckIPMgr.getInstance().showVideoOrShare(ShareVideoPos.EndlessDoubleGold);
	}

	p.onShowAdCompleted = function(pos){
		if(pos == ShareVideoPos.EndlessDoubleGold){
			SDKMgr.getInst().report(ReportType.EndlessDouble);

			if(!this.m_showAdClicked) return;
			this.beyondbox.visible = false;
			this.watchAdBtn.disabled = true;

			//计算看完视频积分刷新为最新数据
			if(!this.newScore){
				var newHis = this.dScore > GameMgr.getInstance().m_historyHighScore;
				if(newHis) GameMgr.getInstance().m_historyHighScore = this.dScore;
			}

			GameMgr.getInstance().m_role.setHighScore(this.dScore);
			
			SDKMgr.getInst().uploadScore(GameMgr.getInstance().m_battleStartTime,this.dScore,GameData.getInstance().user.star);
			ServerAgency.getInstance().sendWatchAdToGetGold(2);
			GameData.getInstance().user.addSkinChip(this.m_chipCnt);
			this.close();
		}
	}

	p.uninit = function(){
		EventMgr.getInstance().off(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);

		if(this.moreNode!=null){
            AladinSDK.HideMore();
            this.linkNode.removeChild(this.moreNode);  //获取更多好玩节点
            this.moreNode = null;
        }

        if(this.m_drawerskeleton!=null){
            this.dragonbones.removeChild(this.m_drawerskeleton);
            this.m_drawerskeleton.destroy();
            this.m_drawerskeleton = null;
			this.m_showDrawer = false;
            AladinSDK.HideDrawer();
        }
	}

    return EndlessSettlementView;
})(EndlessSettlementViewUI)