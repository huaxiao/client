
var Platform = {
    Web : 0, //网页
    QQHall : 1, //QQ大厅
    QQPlay : 2, //QQ玩一玩
    Wechat : 3, //微信小游戏
}

var BuffType = {
    IncKillScore : 1,   //增加击杀分数
    IncKillBall : 2,    //增加击杀爆豆
    Invincible : 3,    //无敌
    IncMoveSpeed : 4,    //增加移动速度
    IncAtkSpeed : 5,    //增加攻速
    IncAllScore : 6,    //增加所有分数
    IncSettleGold : 7,  //结算金币加成
}

var GameMode = {
    Normal : 1,
    Grade : 2, //段位
    Endless : 3, //无尽
}

var TaskType = {
    endRank : "endRank",
    killCnt : "killCnt",
    sumScore : "sumScore",
    highScore : "highScore",
    tripleKill : "tripleKill",
    doubleKill : "doubleKill",
}

var VideoPos = {
    DailyLogin : 1,
    FourHourGold : 2,
    Skin : 3,
    GradeInvincible : 4,
    GradeNormalRevive : 5,
    GradeFiveTimesScore : 6,
    GradeKillAll : 7,
    GradeDoubleGold : 8,
    EndlessFiveTimesScore : 9,
    EndlessKillAll : 10,
    EndlessInvincible : 11,
    EndlessNormalRevive : 12,
    EndlessDoubleGold : 13,
    StartFiveTimesScore : 14,
    StartKillAll : 15,
}

var ServerName = {
    Lijiaheng : "Lijiaheng",
    Huangjinzhanxue : "Huangjinzhanxue",
    Chengzhangdamaoxian: "Chengzhangdamaoxian",
}

/**
 * 收益状态
 */
var InComeState = {
    Normal : 1,     //正常状态
    Ckeck : 2,      //审核状态
    Fission : 3,    //分裂状态
}

var GameConst = {
    Game_Frame : 60,
    ShowPlayerCircle : false,
    ShowPlayerAttackCircle: false,
    ShowPlayerViewCircle : false,
    ShowWeaponRect : false,
    ShowBallCircle : false,
    BtreeLog : false,
    NetLog : false,
    Server : false,   //是否是服务端
    GM : false,
    Debug : false,   //显示调试窗口
    VConsole : false,   //显示VConsole插件
    IgnoreVideoAd : true, //忽略广告
    Platform : Platform.Wechat, //平台
    UseRemoteGameConst : true,//远程配置
    Release : false,   //发布模式
    OneLife : true,//一条命模式
    Online : false, //联网模式
    BallBornAnim : false,   //球的出生动画
    BannerOrder: 4000,
    PHPUrl: "https://czdmx-wx1.goldenfoot.com.cn/index.php/",
    AvailableNet : true,
    SupportOpenDomain : true,
    WeChatGroup : true, //微信群判
    WeChatIPCheck: true, //微信IP查询
    State : InComeState.Normal,
    LimitMinDay : 1,
    LimitMaxDay : 5,
    LimitMinHour : 8,
    LimitMaxHour : 22, 
    OPENAD : true,      //广告开启
    LoginUrl : "https://czdmx-wx.goldenfoot.com.cn",
    ShareProtectedStep : 3,
    CDN: "https://r2cdn-cnp.r2games.com.cn/yhz/",
    Sandbox : false,
    FragmentSkinId : 0,
}