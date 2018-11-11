/*
* GameData;
*/
var GameData = (function () {
    function GameData() {
        this.user = new User();
        this.goods = new Goods();

        this.headIconUrl = "";
    }
    GameData.getInstance = function () {
        if (GameData._instance == null) {
            GameData._instance = new GameData();
        }
        return GameData._instance;
    };

    return GameData;
}());

GameData._instance = null;