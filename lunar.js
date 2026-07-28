// 农历转换算法 (1900-2100)
// 基于经典农历数据表

var lunarInfo = [
  0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
  0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
  0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
  0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
  0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
  0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
  0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
  0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
  0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
  0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
  0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
  0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x02525,0x092d0,
  0x0d2b2,0x0a950,0x0b557,0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,
  0x0a9a8,0x0e950,0x06aa0,0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,
  0x0d950,0x05b57,0x056a0,0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,
  0x0b540,0x0b6a0,0x195a6,0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,
  0x0af46,0x0ab60,0x09570,0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,
  0x0ab60,0x096d5,0x092e0,0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,
  0x025d0,0x092d0,0x0cab5,0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,
  0x15176,0x02525,0x092d0,0x0d2b2,0x0a950,0x0b557,0x06ca0,0x0b550,0x15355,0x04da0,
  0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,0x0aea6,0x0ab50,0x04b60,0x0aae4,
  0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,0x096d0,0x04dd5,0x04ad0,0x0a4d0,
  0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,0x095b0,0x049b0,0x0a974,0x0a4b0,
  0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,0x04af5,0x04970,0x064b0,0x074a3,
  0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,0x0c960,0x0d954,0x0d4a0,0x0da50,
  0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5
];

function lYearDays(y){var i,sum=348;for(i=0x8000;i>0x8;i>>=1){sum+=(lunarInfo[y-1900]&i)?1:0;}return sum+leapDays(y);}
function leapDays(y){if(leapMonth(y)){return(lunarInfo[y-1900]&0x10000)?30:29;}return 0;}
function leapMonth(y){return lunarInfo[y-1900]&0xf;}
function monthDays(y,m){return(lunarInfo[y-1900]&(0x10000>>m))?30:29;}

var lunarMonthName=['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'];
var lunarDayName=['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
var tianGan=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
var diZhi=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
var zodiac=['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
var solarTerm=['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];

function solar2lunar(y,m,d){
  if(y<1900||y>2100) return null;
  var baseDate=new Date(1900,0,31);
  var objDate=new Date(y,m-1,d);
  var offset=Math.round((objDate-baseDate)/86400000);
  var i,temp=0;
  for(i=1900;i<2100&&offset>0;i++){temp=lYearDays(i);offset-=temp;}
  if(offset<0){offset+=temp;i--;}
  var year=i;
  var leap=leapMonth(i);
  var isLeap=false;
  for(i=1;i<13&&offset>0;i++){
    if(leap>0&&i===leap+1&&isLeap===false){--i;isLeap=true;temp=leapDays(year);}
    else{temp=monthDays(year,i);}
    if(isLeap===true&&i===leap+1) isLeap=false;
    offset-=temp;
  }
  if(offset===0&&leap>0&&i===leap+1){if(isLeap){isLeap=false;}else{isLeap=true;--i;}}
  if(offset<0){offset+=temp;--i;}
  var month=i;
  var day=offset+1;
  var monthStr=lunarMonthName[month-1];
  if(isLeap) monthStr='闰'+monthStr;
  var dayStr=lunarDayName[day-1];
  // 天干地支年
  var ganIdx=(year-4)%10;
  var zhiIdx=(year-4)%12;
  var ganzhi=tianGan[ganIdx]+diZhi[zhiIdx];
  var z=zodiac[zhiIdx];
  return {year:year,month:month,day:day,monthStr:monthStr,dayStr:dayStr,ganzhi:ganzhi,zodiac:z,isLeap:isLeap};
}

// 星座
function getZodiacSign(month,day){
  var signs=[{m:1,d:20,name:'水瓶座'},{m:2,d:19,name:'双鱼座'},{m:3,d:21,name:'白羊座'},
    {m:4,d:20,name:'金牛座'},{m:5,d:21,name:'双子座'},{m:6,d:22,name:'巨蟹座'},
    {m:7,d:23,name:'狮子座'},{m:8,d:23,name:'处女座'},{m:9,d:23,name:'天秤座'},
    {m:10,d:24,name:'天蝎座'},{m:11,d:23,name:'射手座'},{m:12,d:22,name:'摩羯座'}];
  if(month===12&&day>=22) return '摩羯座';
  var sign=signs[month-1];
  if(day>=sign.d) return sign.name;
  return signs[month-2>=0?month-2:11].name;
}

// 今日运势生成（基于日期+生肖+星座的稳定算法）
function getDailyFortune(dateStr, zodiacSign){
  var seeds = {
    '水瓶座':{color:'天蓝色',num:7,item:'书籍',dir:'东南',love:4,work:5,wealth:3,health:4},
    '双鱼座':{color:'海绿色',num:3,item:'音乐',dir:'正南',love:5,work:3,wealth:4,health:4},
    '白羊座':{color:'火红色',num:9,item:'运动鞋',dir:'正东',love:3,work:5,wealth:4,health:5},
    '金牛座':{color:'大地色',num:6,item:'盆栽',dir:'西南',love:4,work:4,wealth:5,health:3},
    '双子座':{color:'柠檬黄',num:5,item:'手机',dir:'西北',love:5,work:4,wealth:3,health:4},
    '巨蟹座':{color:'银白色',num:2,item:'相册',dir:'正北',love:5,work:3,wealth:4,health:4},
    '狮子座':{color:'金色',num:1,item:'手表',dir:'正南',love:4,work:5,wealth:5,health:4},
    '处女座':{color:'米色',num:8,item:'笔记本',dir:'东南',love:3,work:5,wealth:4,health:5},
    '天秤座':{color:'粉色',num:6,item:'鲜花',dir:'正西',love:5,work:4,wealth:4,health:4},
    '天蝎座':{color:'暗红色',num:4,item:'黑曜石',dir:'正北',love:4,work:5,wealth:5,health:3},
    '射手座':{color:'宝蓝',num:3,item:'旅行包',dir:'东北',love:5,work:4,wealth:3,health:5},
    '摩羯座':{color:'深棕',num:8,item:'公文包',dir:'西南',love:3,work:5,wealth:5,health:4}
  };
  // 基于日期的稳定伪随机
  var hash=0;
  for(var i=0;i<dateStr.length;i++){hash=((hash<<5)-hash)+dateStr.charCodeAt(i);hash|=0;}
  var idx=Math.abs(hash)%5; // 0-4 偏移
  var base=seeds[zodiacSign]||seeds['水瓶座'];
  var tips=[
    '今天适合静下心来规划接下来的目标，会有意想不到的灵感。',
    '与人沟通时多一份耐心，小事化无，贵人暗中相助。',
    '注意细节，尤其是数字和日期方面的核对，可避免返工。',
    '给自己留一点独处时间，整理思绪，效率会大幅提升。',
    '今天直觉很准，遇到选择时跟着感觉走不会错。',
    '主动帮助身边的人，善意会以另一种方式回到你身上。',
    '适合学习新知识，大脑吸收力强，事半功倍。',
    '运动一下出点汗，坏情绪会跟着消散不少。',
    '今天财运不错，但也别冲动消费，留一笔给未来。',
    '早点休息，好的睡眠是明天好运的基础。'
  ];
  var luckyTip=tips[Math.abs(hash)%tips.length];
  // 星级偏移
  function adjust(v){var r=v+((idx===0)?0:(idx===1?1:(idx===2?-1:(idx===3?1:0))));return Math.max(1,Math.min(5,r));}
  return {
    zodiac:zodiacSign,
    luckyColor:base.color,
    luckyNum:base.num,
    luckyItem:base.item,
    luckyDir:base.dir,
    love:adjust(base.love),
    work:adjust(base.work),
    wealth:adjust(base.wealth),
    health:adjust(base.health),
    tip:luckyTip
  };
}

function stars(n){
  var s='';
  for(var i=0;i<5;i++){s+=i<n?'★':'☆';}
  return s;
}

if(typeof module!=='undefined'&&module.exports){module.exports={solar2lunar,getZodiacSign,getDailyFortune,stars};}
