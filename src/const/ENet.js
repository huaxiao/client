/**Net 网络连接枚举 */

var ENetList = {
    //腾讯云 Wechat
    0 : {
        LoginUrl : "https://czdmx-wx1.goldenfoot.com.cn",
        GameServer : {
            IP : "czdmx-wx1.goldenfoot.com.cn",
            url: "wss://czdmx-wx1.goldenfoot.com.cn/gate",
            Port: "443",
            wss: true
        }
    }
}

var ECode = 
{
    OK : 200,
    FAIL: 500, 

    LOGIN_PAR_ERROR:1001,//登录注册参数错误
	USER_RXISTS_ERROR:1002,//用户已经存在

    ENTRY: {
		FA_TOKEN_INVALID: 	1001, 
		FA_TOKEN_EXPIRE: 	1002, 
		FA_USER_NOT_EXIST: 	1003
	}, 

	GATE: {
		FA_NO_SERVER_AVAILABLE: 2001
	}, 
}