var ResPreload = (function() {
    function ResPreload() {

    }

    ResPreload.url = [
        { url: "res/atlas/common.atlas", type: Laya.Loader.ATLAS },
        { url: "res/atlas/comp.atlas", type: Laya.Loader.ATLAS },
        { url: "res/atlas/map.atlas", type: Laya.Loader.ATLAS },
        { url: "res/atlas/effect.atlas", type: Laya.Loader.ATLAS },
        // { url: "res/atlas/effect/ui_jiesuanliuguang.atlas", type: Laya.Loader.ATLAS },
        { url: "res/atlas/effect/baozou.atlas", type: Laya.Loader.ATLAS },
        { url: "res/atlas/broadcast.atlas", type: Laya.Loader.ATLAS },
        { url: "res/atlas/weapon.atlas", type: Laya.Loader.ATLAS },
        { url: "res/atlas/main.atlas",type: Laya.Loader.ATLAS},
        { url: "res/atlas/onelife.atlas",type: Laya.Loader.ATLAS},
        { url: "res/btree/AI.json", type: Laya.Loader.JSON },
        { url: "res/cfg/player.json", type: Laya.Loader.JSON },
        { url: "res/cfg/energyball.json", type: Laya.Loader.JSON },
        { url: "res/cfg/killball.json", type: Laya.Loader.JSON },
        { url: "res/cfg/room.json", type: Laya.Loader.JSON },
        { url: "res/cfg/ainameconfig.json", type: Laya.Loader.JSON },
        { url: "res/cfg/user.json", type: Laya.Loader.JSON },
        { url: "res/cfg/buff.json", type: Laya.Loader.JSON },
        { url: "res/cfg/globalcfg.json", type: Laya.Loader.JSON },
        { url: "res/cfg/text.json", type: Laya.Loader.JSON },
        { url: "res/cfg/cellweight.json", type: Laya.Loader.JSON },
        { url: "res/cfg/videoShareCfg.json", type: Laya.Loader.JSON },
        { url: "res/cfg/limitedCity.json", type: Laya.Loader.JSON },
        { url: "res/cfg/AIDifficultyCfg.json",type: Laya.Loader.JSON},
        { url: "res/cfg/userGrade.json", type: Laya.Loader.JSON },
        { url: "res/cfg/endlessAiCfg.json", type: Laya.Loader.JSON },
        { url: "res/cfg/skinCfg.json", type: Laya.Loader.JSON },
        { url: "res/cfg/shop.json", type: Laya.Loader.JSON },
        { url: "res/cfg/growProp.json", type: Laya.Loader.JSON },
        { url: "res/cfg/reportCfg.json", type: Laya.Loader.JSON },
        { url: "res/cfg/bannerCfg.json", type: Laya.Loader.JSON },
        { url: "res/sounds/Battle_BGM.mp3", type: Laya.Loader.SOUND },
        { url: "res/sounds/Born.wav", type: Laya.Loader.SOUND },
        { url: "res/sounds/Attack.mp3", type: Laya.Loader.SOUND },
        { url: "res/sounds/Dead.mp3", type: Laya.Loader.SOUND },
        { url: "res/sounds/Button.mp3", type: Laya.Loader.SOUND },
        { url: "res/sounds/Main_BGM.mp3", type: Laya.Loader.SOUND },
        { url: "res/sounds/Victory.mp3", type: Laya.Loader.SOUND },
    ];

    ResPreload.AnimList = [
        "res/bone/runAni.sk"
    ];

    return ResPreload;
}());