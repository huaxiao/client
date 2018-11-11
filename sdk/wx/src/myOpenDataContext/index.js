let sharedCanvas = wx.getSharedCanvas();
let context = sharedCanvas.getContext('2d');
let myOpenID = null;
let itemCanvas = wx.createCanvas();
let ctx = itemCanvas.getContext('2d');
let myScore = undefined;
let myInfo = {};
let iconSize = 62;
let iconPadding = 10;
let topPos = 0;
let leftPos = 0;
let restHeight = 890;
let screenWidth = sharedCanvas.width
let screenHeight = sharedCanvas.height
let isInited = false;
let rectHeight = 1050;
let type = "min";
let category = "grade";
let count = 0;
let showCnt = 0;
let itemHeight = 110;
let lastQueryRankTime = 0;
let lastQueryGradeTime = 0;
let friendRankList = [];
let gradeRankList = [];
let contents = [];
let hideRank = false;
let loadedCnt = 0;
let selfScore = 0;
let selfStar = 0;
let maxUserGrade = 10;
let gradeImgs = {};
let offsetMinY = 40;

wx.onMessage(data => {
  if (data.text == "RankScore") {
    myOpenID = data.openid;
    type = data.type;
    category = data.category;

    if(category == "grade"){
      var deltaTime = Date.now() - lastQueryGradeTime;
      if (gradeRankList.length == 0 || (deltaTime >= 3000)) {
        getGradeRanking();
        lastQueryGradeTime = Date.now();
      } else {
        showGradeList();
      }
    }else{
      var deltaTime = Date.now() - lastQueryRankTime;
      if (friendRankList.length == 0 || (deltaTime >= 3000)) {
        getFriendsRanking();
        lastQueryRankTime = Date.now();
      } else {
        showRankList();
      }
    }

    if (type == "max") {
      hideRank = false;
    }
  } else if (data.text == "NextGoalTip") {
    hideRank = true;
    handleNextGoalTip(data.historyScore, data.highScore, data.mainView);
  } else if (data.text == "HideRank") {
    if (type == "max") {
      hideRank = true;
    }
  } else if (data.text == "UploadScore") {
    myOpenID = data.openid;
    if(data.score> 0){
      uploadScore(data.score);
    }else{
      uploadStar(data.star);
    }
  }else if(data.text == "SetGradeData"){
    maxUserGrade = data.maxUserGrade;
    initGradeImgs(data.cfgData);
  }
});

function initEle() {
  screenWidth = sharedCanvas.width;
  screenHeight = sharedCanvas.height;
  restHeight = screenHeight;
  rectHeight = screenHeight;
  context.restore();
  context.clearRect(0, 0, screenWidth, screenHeight);
  context.fillStyle = 'rgba(255, 255, 255, 0)';
  context.fillRect(0, 0, screenWidth, screenHeight);

  itemCanvas.width = (screenWidth - leftPos * 2);
  if (type == "min") {
    itemCanvas.height = screenHeight;
  } else {
    itemCanvas.height = (itemHeight + iconPadding) * count;
  }
}

let rank1 = wx.createImage();
rank1.src = "images/rank_1.png";
let rank2 = wx.createImage();
rank2.src = "images/rank_2.png";
let rank3 = wx.createImage();
rank3.src = "images/rank_3.png";
let rank4 = wx.createImage();
rank4.src = "images/rank_4.png";
let starImg = wx.createImage();
starImg.src = "images/star1.png";

function initRanklist(list) {
  if (list && count > 0) {
    loadedCnt = 0;

    list.map((item, index) => {
      if (type == "min") {
        if (index < 3) {
          let avatar = wx.createImage();
          avatar.height = itemHeight;
          avatar.onload = function () {
            ctx.drawImage(avatar, 0, offsetMinY + index * 90, itemHeight, itemHeight);
            loadedCnt++;
            reDrawItem(0);
          }
          avatar.src = item.avatarUrl;
        }
      }
      else {
        let rankIndex = index + 1;
        let img;
        if (rankIndex == 1) {
          img = rank1;
        }
        else if (rankIndex == 2) {
          img = rank2;
        }
        else if (rankIndex == 3) {
          img = rank3;
        }
        else {
          img = rank4;
        }

        let avatar = wx.createImage();
        avatar.onload = function () {
          ctx.drawImage(img, 42, index * itemHeight + iconPadding / 2, 62, 62);
          ctx.drawImage(avatar, 140, index * itemHeight + iconPadding / 2, iconSize, iconSize);
          ctx.fillStyle = 'rgba(67, 54, 83, 1)';
          ctx.font = '30px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(item.nickname, 448, index * itemHeight + itemHeight / 2 + 10);
          ctx.fillStyle = 'rgba(0, 157, 159, 1)';
          ctx.font = '32px Arial';
          ctx.textAlign = 'right';
          ctx.fillText((item.RankScore || ''), 1026, index * itemHeight + itemHeight / 2 + 10);
          ctx.font = '60px Arial';
          ctx.textAlign = 'left';
          ctx.fillStyle = 'rgba(255, 255, 255, 1)';
          ctx.fillText(rankIndex, 236, index * itemHeight + itemHeight / 2 + 20);
          loadedCnt++;
          reDrawItem(0);
        }
        avatar.src = item.avatarUrl;
      }
    });
  } else {
    // 没有数据
  }
}

function initGradeList(list){
  if (list && count > 0) {
    list.map((item, index) => {
      if (type == "min") {
        if (index < 3) {
          let avatar = wx.createImage();
          avatar.height = itemHeight;
          avatar.onload = function () {
            ctx.drawImage(avatar, 0, offsetMinY + index * 90, itemHeight, itemHeight);
            reDrawItem(0);
          }
          avatar.src = item.avatarUrl;
        }
      }
      else {
        let rankIndex = index + 1;
        let img;
        if (rankIndex == 1) {
          img = rank1;
        }
        else if (rankIndex == 2) {
          img = rank2;
        }
        else if (rankIndex == 3) {
          img = rank3;
        }
        else {
          img = rank4;
        }

        let cfg = null;
        let gradeStar = 0;
        let grade = 0;
        let gradeImg = null;
        if(item.GradeData!=null){
          gradeStar = item.GradeData.gradeStar;
          grade = item.GradeData.grade;
          gradeImg = gradeImgs[grade];
        }
        
        let avatar = wx.createImage();
        avatar.onload = function () {
          ctx.drawImage(img, 42, index * itemHeight + iconPadding / 2, 62, 62);
          ctx.drawImage(avatar, 140, index * itemHeight + iconPadding / 2, iconSize, iconSize);
          ctx.font = '60px Arial';
          ctx.textAlign = 'left';
          ctx.fillStyle = 'rgba(255, 255, 255, 1)';
          ctx.fillText(rankIndex, 236, index * itemHeight + itemHeight / 2 + 20);

          ctx.fillStyle = 'rgba(67, 54, 83, 1)';
          ctx.font = '30px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(item.nickname, 448, index * itemHeight + itemHeight / 2 + 10);

          ctx.drawImage(gradeImg, 849, index * itemHeight + iconPadding / 2, 64, 60);
          ctx.drawImage(starImg, 918, index * itemHeight + iconPadding / 2+16, 38, 35);

          ctx.fillStyle = 'rgba(255, 255, 255, 1)';
          ctx.font = '26px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(("x"+gradeStar), 940, index * itemHeight + itemHeight / 2 + 20);

          reDrawItem(0);
        }
        avatar.src = item.avatarUrl;
      }
    });
  } 
}

// 因为头像绘制异步的问题，需要重新绘制
function reDrawItem(y) {
  context.clearRect(leftPos, topPos, screenWidth - leftPos * 2, restHeight);
  context.fillStyle = 'rgba(255, 255, 255, 0)';
  context.fillRect(leftPos, topPos, screenWidth - leftPos * 2, restHeight);
  context.drawImage(itemCanvas, 0, y, screenWidth - leftPos * 2, restHeight, leftPos, iconPadding, screenWidth - leftPos * 2, restHeight);
  // console.log("restHeight", restHeight)
  // console.log(y, screenWidth - leftPos * 2, restHeight, leftPos, iconPadding, screenWidth - leftPos * 2, restHeight);
}

function sortByStar(data){
  let array = [];
  data.map(item => {
    // console.log(item);
    if(item['KVDataList']!=null && item['KVDataList'].length > 0){
      array.push({
        avatarUrl: item.avatarUrl,
        nickname: item.nickname,
        openid: item.openid,
        Star: item['KVDataList'][0].value,
        GradeData: getGradeDataByStar(item['KVDataList'][0].value)
      })
    }
  })
  array.sort((a, b) => {
    return parseInt(b['Star']) - parseInt(a['Star']);
  });
  return array;
}

function initGradeImgs(cfgData){
  if(cfgData == null) return;

  for (var key in cfgData) {
    if (cfgData.hasOwnProperty(key)) {
      if (cfgData[key].icon == null) continue;
      var gradeImgData = {};
      var img = wx.createImage();
      img.src = "images/"+cfgData[key].icon;
      gradeImgs[key] = img;
    }
  }
}

function getGradeDataByStar(star){
    var grade = Math.ceil((parseInt(star)+1)/4);
    if(grade < 1)
      grade = 1;
    else if(grade > maxUserGrade)
      grade = maxUserGrade;

    if(grade == maxUserGrade) {
        star -= 4 * (grade - 1);
    }
    else {
        star = star % 4;
    }
    return {grade:grade,gradeStar:star};
}

function sortByScore(data) {
  let array = [];
  data.map(item => {
    if(item['KVDataList']!=null && item['KVDataList'].length > 0){
      array.push({
        avatarUrl: item.avatarUrl,
        nickname: item.nickname,
        openid: item.openid,
        RankScore: item['KVDataList'][0].value
      })
    }
  })
  array.sort(function(a, b){
    var score1 = parseInt(a['RankScore']);
    var score2 = parseInt(b['RankScore']);
    return score2 - score1;
  });
  return array;
}

function getFriendsRanking() {
  friendRankList.length = 0;
  wx.getFriendCloudStorage({
    keyList: ['maxScore'],
    success: res => {
      let data = res.data;
      let allList = sortByScore(data);
      for (var i = 0; i < allList.length; i++)
        friendRankList.push(allList[i]);
      showRankList();

      for (var i = 0; i < friendRankList.length; i++) {
        if (friendRankList[i].openid == myOpenID) {
          selfScore = friendRankList[i].RankScore;
          break;
        }
      }
    }
  });
}

function getGradeRanking(){
  gradeRankList.length = 0;
  wx.getFriendCloudStorage({
    keyList: ['maxStar'],
    success: res => {
      let data = res.data;
      let allList = sortByStar(data);
      for (var i = 0; i < allList.length; i++)
        gradeRankList.push(allList[i]);
      showGradeList();

      for (var i = 0; i < gradeRankList.length; i++) {
        if (gradeRankList[i].openid == myOpenID) {
          selfStar = gradeRankList[i].Star;
          break;
        }
      }
    }
  });
}

function showRankList() {
  count = friendRankList.length;
  itemHeight = type == "min" ? 80 : 72;
  showCnt = screenHeight / itemHeight;

  initEle();
  initRanklist(friendRankList);
}

function showGradeList(){
  count = gradeRankList.length;
  itemHeight = type == "min" ? 80 : 72;
  showCnt = screenHeight / itemHeight;

  initEle();
  initGradeList(gradeRankList);
}

function uploadScore(scoreValue) {
  if (scoreValue < selfScore) return;

  selfScore = scoreValue; 
  wx.setUserCloudStorage({
    KVDataList: [{ 'key': 'maxScore', 'value': ('' + selfScore) }],
    success: function (res) {
      console.log("saveMaxScore=" + selfScore + "-->", res);
    },
    fail: function (res) {
      console.log("saveMaxScore=" + selfScore + "-->", res);
    }
  });
}

function uploadStar(star){
  if (star < selfStar) return;

  selfStar = star;
  wx.setUserCloudStorage({
    KVDataList: [{ 'key': 'maxStar', 'value': ('' + selfStar) }],
    success: function (res) {
      console.log("saveStar=" + selfStar + "-->", res);
    },
    fail: function (res) {
      console.log("saveStar=" + selfStar + "-->", res);
    }
  });
}

let startY = undefined, moveY = 0;
// 触摸移动事件
wx.onTouchMove(e => {
  if (!hideRank && type == "max" && count > showCnt) {
    let touch = e.touches[0];
    // 触摸移动第一次触发的位置
    if (startY === undefined) {
      startY = touch.clientY + moveY;
    }
    moveY = startY - touch.clientY;
    reDrawItem(moveY);
  }
});
wx.onTouchEnd(e => {
  if (!hideRank && type == "max" && count > showCnt) {
    startY = undefined;
    if (moveY < 0) { // 到顶
      moveY = 0;
    } else if (moveY > itemCanvas.height - rectHeight) { // 到底
      moveY = itemCanvas.height - rectHeight;
    }
    reDrawItem(moveY);
  }
});

//battle start
function handleNextGoalTip(historyScore, highScore, mainView) {
  screenWidth = sharedCanvas.width;
  screenHeight = sharedCanvas.height;
  restHeight = screenHeight;
  rectHeight = screenHeight;

  // console.log("screenWidth:" + screenWidth + "screenHeight:" + screenHeight + " historyScore:" + historyScore + " highScore:" + highScore + " friendRankList.length:" + friendRankList.length);
  context.restore();
  context.clearRect(0, 0, screenWidth, screenHeight);
  context.fillStyle = 'rgba(255, 255, 255, 0)';
  context.fillRect(0, 0, screenWidth, screenHeight);

  itemCanvas.width = screenWidth;
  itemCanvas.height = screenHeight;

  if (mainView)
    getNextGoalTipOnMainView(historyScore, highScore);
  else
    getNextGoalTipOnDead(historyScore, highScore);

  var x = 0;
  for (var i = 0; i < contents.length; i++) {
    var content = contents[i];
    ctx.fillStyle = content.color;
    ctx.font = content.font;
    ctx.textAlign = 'left';
    ctx.fillText(content.text, x, screenHeight / 2);
    // console.log("content.text:" + content.text);
    x += ctx.measureText(content.text).width;
  }
  context.drawImage(itemCanvas, 0, 0, screenWidth, restHeight, 0, 0, screenWidth, restHeight);
}

function overFriendIndex(highScore) {
  for (var i = 0; i < friendRankList.length; i++) {
    if (highScore > friendRankList[i].RankScore) {
      return i;
    }
  }
  return friendRankList.length;
}

function surpassFriendName(historyScore, highScore) {
  if (friendRankList.length == 0) return null;

  for (var i = 0; i < friendRankList.length; i++) {
    if (historyScore < friendRankList[i].RankScore && highScore > friendRankList[i].RankScore) {
      return friendRankList[i].nickname;
    }
  }
  return null;
}

function getNextGoalTipOnMainView(historyScore, highScore) {
  contents.length = 0;
  if (friendRankList.length == 0) {
    if (historyScore > highScore) {
      contents.push({ 'font': '16px Arial', 'color': '#02f0ff', 'text': '正在刷新记录，加油!' });
    }
  } else {
    var index = overFriendIndex(highScore);
    if (index == 0) {
      contents.push({ 'font': '16px Arial', 'color': '#02f0ff', 'text': '正在刷新记录，加油！' });
    } else {
      var data = friendRankList[index - 1];
      if (data.openid == myOpenID) {
        var deltaScore = data.RankScore - highScore;
        if (deltaScore == 0) {
          contents.push({ 'font': '16px Arial', 'color': '#02f0ff', 'text': '正在刷新记录，加油！' });
        } else {
          contents.push({ 'font': '16px Arial', 'color': '#02f0ff', 'text': '还差' });
          contents.push({ 'font': '18px Arial', 'color': '#ffcb68', 'text': deltaScore + "" });
          contents.push({ 'font': '16px Arial', 'color': '#02f0ff', 'text': '刷新记录' });
        }
      } else {
        var deltaScore = data.RankScore - highScore;
        if (deltaScore == 0) {
          contents.push({ 'font': '16px Arial', 'color': '#02f0ff', 'text': '正在刷新记录，加油!' });
        }
        else {
          contents.push({ 'font': '16px Arial', 'color': '#02f0ff', 'text': '还差' });
          contents.push({ 'font': '18px Arial', 'color': '#ffcb68', 'text': deltaScore + "" });
          contents.push({ 'font': '16px Arial', 'color': '#02f0ff', 'text': '超越' });
          contents.push({ 'font': '18px Arial', 'color': '#d138fd', 'text': data.nickname });
        }
      }
    }
  }
}

function getNextGoalTipOnDead(historyScore, highScore) {
  contents.length = 0;
  if (friendRankList.length == 0) {
    if (historyScore > highScore) {
      contents.push({ 'font': '16px Arial', 'color': '#02f0ff', 'text': '复活后可更快刷新记录，加油！' });
    }
  } else {
    var index = overFriendIndex(highScore);
    if (index == 0) {
      contents.push({ 'font': '16px Arial', 'color': '#02f0ff', 'text': '复活后可更快刷新记录，加油！' });
    } else {
      var data = friendRankList[index - 1];
      if (data.openid == myOpenID) {
        var deltaScore = data.RankScore - highScore;
        if (deltaScore == 0) {
          contents.push({ 'font': '16px Arial', 'color': '#02f0ff', 'text': '复活后可更快刷新记录，加油！' });
        } else {
          contents.push({ 'font': '16px Arial', 'color': '#02f0ff', 'text': '成长 ' });
          contents.push({ 'font': '18px Arial', 'color': '#ffcb68', 'text': deltaScore + "" });
          contents.push({ 'font': '16px Arial', 'color': '#02f0ff', 'text': ' 可刷新记录' });
        }
      } else {
        var deltaScore = data.RankScore - highScore;
        if (deltaScore == 0) {
          contents.push({ 'font': '16px Arial', 'color': '#02f0ff', 'text': '正在刷新记录，加油!' });
        }
        else {
          contents.push({ 'font': '16px Arial', 'color': '#02f0ff', 'text': '成长 ' });
          contents.push({ 'font': '18px Arial', 'color': '#ffcb68', 'text': deltaScore + "" });
          contents.push({ 'font': '16px Arial', 'color': '#02f0ff', 'text': ' 可超越' });
          contents.push({ 'font': '18px Arial', 'color': '#d138fd', 'text': data.nickname });
        }
      }
    }
  }
}
//battle end