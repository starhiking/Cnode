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

function dealData(reData){
  for(let i = 0;i< reData.length ; i++ ){
      let temp = reData[i];
      temp.content = '';
      temp.re_create_at= new Date(reData[i].create_at).Format("yyyy-MM-dd hh:mm");
      if(temp.top){
        temp.nature='置顶';
        temp.class = 'top'
        continue;
      }
      if(!temp.top&&temp.good){
        temp.nature='精华';
        temp.class = 'good'
        continue;
      }
      if(temp.tab=='share'){
        temp.nature = '分享';
        temp.class = 'share'
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
          // res.send(JSON.stringify(dealData(data.data)));
          res.render('topic',{data:data.data});

        }
      });
    });
  });
//bug在这
  app.get('/user/:name',(req,res)=>{
    console.log(req.params);
    // let name = req.params.name;
    res.render('user');
  });

}
