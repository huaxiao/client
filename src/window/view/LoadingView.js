/*
* LoadingView;
*/
var LoadingView = (function (_super) {
    function LoadingView() {
        LoadingView.__super.call(this);
    }

    Laya.class(LoadingView,'view.LoadingView',_super);
    var p = LoadingView.prototype;

    p.init = function() {
        EventMgr.getInstance().on(EEvent.Res_Load_Progress,this,this.onRefreshProgress);        
        ResMgr.getInstance().loadBattleRes(Laya.Handler.create(this,this.createModel));

        SDKMgr.getInst().report(ReportType.Loading_Start,{openid:'',event:'Loading_Start'});
    }

    /**
     * 卸载界面
     */
    p.uninit = function(){
        SDKMgr.getInst().report(ReportType.Loading_End);

        EventMgr.getInstance().off(EEvent.Res_Load_Progress,this,this.onRefreshProgress);
        this.m_skeletonParent.destroy();
        this.m_skeletonParent = null;
        this.m_skeleton.destroy();
        this.m_skeleton = null;
    }

    p.onRefreshProgress = function(progress){
        this.bar.value = progress;
        this.info.text = "资源加载中，当前进度：" + parseInt(progress * 100) + "%";
        this.m_skeletonParent.pos(this.bar.x+progress*this.bar.width,this.bar.y);
    }

    p.createModel = function(){
        this.m_skeletonParent = new Laya.Sprite();
        this.m_skeletonParent.scale(0.5,0.5);
        this.m_skeleton = ResMgr.getInstance().getSkeleton();
        this.m_skeletonParent.addChild(this.m_skeleton);
        this.m_skeleton.play("role1_run",true,true);
        this.addChild(this.m_skeletonParent);
        this.m_skeletonParent.pos(this.bar.x,this.bar.y);
    }

    return LoadingView;
}(LoadingViewUI));