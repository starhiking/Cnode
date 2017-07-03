let https = require('https');

Date.prototype.Format = function (fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

Date.prototype.trans = function (lastTime) {
  let fmtLastTime = new Date(lastTime).Format("yyyyMMddhhmm"); 
  let nowTime = new Date().Format("yyyyMMddhhmm");
  let year = parseInt(nowTime.substring(0,4)) - parseInt(fmtLastTime.substring(0,4));
  let month = parseInt(nowTime.substring(4,6)) - parseInt(fmtLastTime.substring(4,6));
  let day = parseInt(nowTime.substring(6,8)) - parseInt(fmtLastTime.substring(6,8));
  let hour = parseInt(nowTime.substring(8,10)) - parseInt(fmtLastTime.substring(8,10));
  let minute = parseInt(nowTime.substring(10,12)) - parseInt(fmtLastTime.substring(10,12));
  if(year > 1 || year == 1 && month >= 0 ) return year+'年前';
  if(year==1) return (12+month)+'月前';
  if(month>1||month==1&&day>= 0) return month+'月前';
  if(month==1) return (30+day)+'天前';
  if(day >1 || day==1 && hour >= 0 ) return day+'天前';
  if(day==1) return (24+hour)+'小时前';
  if(hour>1||hour==1&&minute>=0) return hour+'小时前';
  if(hour==1) return (60+minute)+'分钟前';
  if(minute>=1) return minute+'分钟前';
  return '刚刚';
}

function dealData(reData){

  for(let i = 0;i<reData.length;i++){
    reData[i].re_last_reply_at = new Date().trans(reData[i].last_reply_at);
  }

  for(let i = 0;i< reData.length; i++ ){
      let temp = reData[i];
      temp.content = '';
      temp.re_create_at= new Date(reData[i].create_at).Format("yyyy-MM-dd hh:mm");
      if(temp.top){
        temp.nature='置顶';
        temp.class = 'top';
        continue;
      }
      if(!temp.top&&temp.good){
        temp.nature='精华';
        temp.class = 'good';
        continue;
      }
      if(temp.tab=='share'){
        temp.nature = '分享';
        temp.class = 'share';
      }
      else if(temp.tab=='ask'){
        temp.nature = '问答';
        temp.class = 'ask';
      } 
      else if(temp.tab=='job'){
        temp.nature = '招聘';
        temp.class = 'job';
      }
      else{
        temp.nature = '其他';
        temp.class = 'other';
      } 
  }
  return reData;
}


module.exports = (app)=>{
  //主页分页请求
  app.get('/',(req,res)=>{
    if(!req.query.tab) req.query.tab = '';
    https.get('https://cnodejs.org/api/v1/topics?limit=15&mdrender=true&tab='+req.query.tab,(response)=>{
      let data = null;
      let html = '';
      response.on('data',(chunk)=>{
        response.setEncoding('utf8');
        html+=chunk;
      });
      response.on('end',()=>{
        data = JSON.parse(html);
        if(data.success == true){
          res.render('index',{topics:dealData(data.data),tab:req.query.tab});
        }
      });
    });
  });

  //处理下滑ajax加载
  app.get('/ajax',(req,res)=>{// /ajax?page=3&tab=share
      https.get('https://cnodejs.org/api/v1/topics?limit=15&mdrender=true&tab='+req.query.tab+'&page='+req.query.page,(response)=>{
      let data = null;
      let html = '';
      response.on('data',(chunk)=>{
        response.setEncoding('utf8');
        html+=chunk;
      });
      response.on('end',()=>{
        data = JSON.parse(html);
        if(data.success == true){
          res.send(JSON.stringify(dealData(data.data)));
        }
      });
    });
  });
  //处理topic请求 id单页
  app.get('/topic',(req,res)=>{
    let id = req.query.id;
    https.get('https://cnodejs.org/api/v1/topic/'+id,(response)=>{
      let data = null;
      let html = '';
      response.on('data',(chunk)=>{
        response.setEncoding('utf8');
        html+=chunk;
      });
      response.on('end',()=>{
        data = JSON.parse(html);
        if(data.success == true){
          data.data.re_create_at_along = new Date().trans(data.data.create_at);
          for(let i =0;i<data.data.replies.length;i++){
            data.data.replies[i].re_create_at = new Date().trans(data.data.replies[i].create_at);
          }
          // res.send(JSON.stringify(dealData(data.data)));
          res.render('topic',{data:data.data});
        }
      });
    });
  });


  app.get('/user/:name',(req,res)=>{
    let name = req.params.name;
    https.get('https://cnodejs.org/api/v1/user/'+name,(response)=>{
      let data = null;
      let html = '';
      response.on('data',(chunk)=>{
        response.setEncoding('utf8');
        html+=chunk;
      });
      response.on('end',()=>{
        data = JSON.parse(html);
        if(data.success == true){
          data.data.create_at = new Date(data.data.create_at).Format("yyyy-MM-dd");
          for(let i=0 ; i < data.data.recent_replies.length ; i++ ){
            data.data.recent_replies[i].re_last_reply_at = new Date().trans(data.data.recent_replies[i].last_reply_at);
          }
          for(let i=0 ; i < data.data.recent_topics.length ; i++ ){
            data.data.recent_topics[i].re_last_reply_at = new Date().trans(data.data.recent_topics[i].last_reply_at);
          }
          res.render('user',{user:data.data}); 
        }
      });
    });
  });
}
