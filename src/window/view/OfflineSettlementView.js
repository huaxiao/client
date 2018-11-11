/**
 * OfflineSettlementView 结算界面
*/
var OfflineSettlementView=(function(_super){
	function OfflineSettlementView(){
		OfflineSettlementView.__super.call(this);

		this.gold = 0;

		this.moreNode = null;
        this.m_drawerskeleton = null;
        this.m_showDrawer = false;
	}

	Laya.class(OfflineSettlementView,'view.OfflineSettlementView',_super);

	var p = OfflineSettlementView.prototype;

	p.init = function(data){
		this.initSdk();

		Utils.checkVideoBtn(this.watchAdBtn);
		this.drawerBtn.on(Laya.Event.CLICK,this,this.onShowHideDrawer);
		this.continueBtn.on(Laya.Event.CLICK,this,this.onClose);
		this.flauntBtn.on(Laya.Event.CLICK,this,this.onShare);
		this.watchAdBtn.on(Laya.Event.CLICK,this,this.onShowAd);
		EventMgr.getInstance().on(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
		this.flauntAni.play(0,true);

		if(data == null){
			return;
		}
		var hScore = data.highScore;		

		this.highScore.text = hScore + "";
		this.killCntLbl.text = data.killNum + "";
		this.titleImg.skin = "offlineSettlementView/" + Utils.getTitleImg(hScore) + ".png";

		var isGradeMode = GameMgr.getInstance().isGradeMode();
		if(isGradeMode) {
			var grade = GameData.getInstance().user.grade;
			var star = TaskMgr.getInstance().getResult();
			this.gold = this.calGoldByGradeStar(grade,star);
			this.newFlag.visible = false;
			var cfg = DataMgr.getInstance().getUserGradeCfg(grade);
			this.showSkin();
		}
		this.goldCntTxt.text = this.gold + "";
		this.doubleGoldCntTxt.text = this.gold*2 + "";
		this.rankLbl.text = "第"+data.rank+"名";

		var cfgId = isGradeMode ? EGlobalCfg.GradeChipTipsMaxCnt : EGlobalCfg.EndlessChipTipsMaxCnt;
        var cfgMaxNum = DataMgr.getInstance().getGlobalCfg(cfgId);
        var chipCnt = Math.min(data.killNum,cfgMaxNum);
		this.m_chipCnt = chipCnt;

        this.chipTxt.text = chipCnt + "";
		this.doubleChipTxt.text = (chipCnt*2)+"";

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

	p.calGoldByGradeStar = function(grade,star){
		var cfg = DataMgr.getInstance().getUserGradeCfg(grade);
		var gold = cfg.staticGold;
		var goldRatio = GameMgr.getInstance().m_role.getAvatar().getBuffVal(BuffType.IncSettleGold);
		gold = Math.ceil(gold * goldRatio);
		if(star == 1)
			gold += cfg.addGold;
		return gold;
	}

	p.onShare = function(){
		CheckIPMgr.getInstance().showVideoOrShare(ShareVideoPos.GradeSettleShare2);
	}

	p.onClose = function() {
        SoundMgr.getInstance().playUIClick();
		this.close();
    }

	p.close = function(){
        UIMgr.getInstance().closeUI(EUI.OfflineSettlementView);
		GameMgr.getInstance().preExitBattle();
	}

	p.onShowAd = function(){
		CheckIPMgr.getInstance().showVideoOrShare(ShareVideoPos.GradeDoubleGold);
	}

	p.onShowAdCompleted = function(pos){
		if(pos == ShareVideoPos.GradeDoubleGold){
			SDKMgr.getInst().report(ReportType.GradeDouble);
			this.goldCntTxt.text = (this.gold*2) + "";
			this.watchAdBtn.disabled = true;
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

	return OfflineSettlementView;
})(OfflineSettlementViewUI)