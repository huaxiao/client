var ReportType = {
    Launch: 1,
    SDK_LoginStart : 2,
    SDK_LoginEnd: 3,
    Login : 4,
    Logout : 5,
    Loading_Start: 6,
    Loading_End: 7,
    Auth: 8,
    Link: 9,
    Click_Ad : 10,
    Show_Ad_Reward : 11,
    Share : 12,
    Start_EndlessFight : 13,
    End_EndlessFight : 14,
    Start_GradeFight : 15,
    End_GradeFight : 16,
    DieInEndless : 17,
    DieInGrade : 18,
    EndlessDouble : 19,
    GradeDouble : 20,
    Get_Skin : 21,
}

 /**
 * SDK 管理
 */
var SDKMgr = (function(){
    function SDKMgr(){
    }

    /**
     * 单例模式
     */
    SDKMgr.getInst = function () {
        if (SDKMgr._Instance == null) {
            switch(GameConst.Platform) {
                case Platform.Wechat:
                    SDKMgr._Instance = new SDK_Wechat();
                    break;
            }            
        }
        return SDKMgr._Instance;
    };

    var p = SDKMgr.prototype;

    SDKMgr.IsWebChat = function(){
        return GameConst.Platform == Platform.Wechat; 
    }

    SDKMgr.IsQQPlay = function(){
        return GameConst.Platform == Platform.QQPlay;
    }

    SDKMgr.IsQQHall = function(){
        return GameConst.Platform == Platform.QQHall;
    }

    SDKMgr.IsWeb = function(){
        return GameConst.Platform == Platform.Web;
    }

    return SDKMgr;
})();

SDKMgr._Instance = null;