
var http = require('http')
var fs = require('fs')
var url = require('url')
//console.log(Object.keys(http))
var port = process.env.PORT || 8888;

var server = http.createServer(function(request, response){
  var temp = url.parse(request.url, true)
  var path = temp.pathname
  var query = temp.query
  var method = request.method
  //从这里开始看，上面不要看

  if(path === '/'){  // 如果用户请求的是 / 路径
    var string = fs.readFileSync('./login.html')  
    response.setHeader('Content-Type', 'text/html;charset=utf-8')  
    response.end(string)   
  }else if(path === '/main.js'){
    let string = fs.readFileSync('./main.js')  
    response.setHeader('Content-Type', 'application/javascript;charset=utf-8')  
    response.end(string)  
  }else if(path === '/home.html'){
    var cookies =parseCookies(request.headers.cookie);
    response.setHeader('Content-Type', 'text/html;charset=utf-8') 
    if(cookies.logined === 'true'){
        response.end(`${cookies.user_id}已登录`)
    }else{
        var string = fs.readFileSync('./home.html') 
        response.end(string)    
    }      
    
  }else if(path === '/signUp' && method === 'POST'){
    getPostdata(request,function(postData){   
        let errors = checkPostData(postData)
        if(Object.keys(errors).length === 0){
            let {email,password} = postData
            let user = {
                email:email,
                passwordHash:userHash(password) //不要使用md5和自己发明加密算法
            }

            //往数据库注入用户信息
            let dbstring = fs.readFileSync('./db.json','utf-8')
            let dbObject = JSON.parse(dbstring)
            dbObject.user.push(user)
            let dbstring2 = JSON.stringify(dbObject)
            fs.writeFileSync('./db.json',dbstring2,{encoding:'utf-8'})
        }else{
            response.statusCode = 400
        }     
        response.setHeader('Content-Type', 'text/html;charset=utf-8') 
        response.end(JSON.stringify(errors))   
    })   
  }else if(path === '/login' && method === 'POST'){
    //读取数据库

    getPostdata(request,function(postData){
        let dbstring = fs.readFileSync('./db.json','utf-8')
        let dbObject = JSON.parse(dbstring)
        let users = dbObject.user

        let {email, password} = postData
        let found
        for( var i=0; i< users.length; i++){
            if(users[i].email === email && users[i].passwordHash === userHash(password)){
                //如果用户登录数据和数据库中数据一致
                found = users[i]
                break
            }
        }
        if(found){
            //用cookie标记用户登录
            response.setHeader('Set-Cookie', ['logined=true; expires=1000; path=/;', 'user_id='+email+'; expires=123456789; path=/;']) 
            response.end('')
        }else{
            response.statusCode = 400
            let errors = {email:'没有注册或密码错误'}
            response.setHeader('Content-Type', 'text/html;charset=utf-8') 
            response.end(JSON.stringify(errors))
        }
        
    })
    
  }else{  
    response.statusCode = 404
    response.setHeader('Content-Type', 'text/html;charset=utf-8') 
    response.end('找不到对应的路径，你需要自行修改 index.js')
  }

  // 代码结束，下面不要看
  console.log(method + ' ' + request.url)
})

//获取用户提交的数据
function getPostdata(request,callback){
    data = ''
    request.on('data', (postData) => {
        data += postData.toString()
        //获取数据
    })
    request.on('end', () => {
        let array = data.split('&')
        let postData = {}
        array.forEach(function(items ,index){
            let parts = items.split('=')
            let key = decodeURIComponent(parts[0])
            let value = decodeURIComponent(parts[1])
            postData[key] = value                     
        })
        callback.call(null, postData)
    })

}

//检测用户提交的注册数据
function checkPostData(postData){
    let {email,password,password_confirmation} = postData
        let errors = {}
        if(email.indexOf('@') <= 0){
            errors.email = '邮箱不合法'
        }
        if(password.length < 6){
            errors.password = '密码太短'
        }
        if(password_confirmation !== password){
            errors.password_confirmation = '两次输入的密码不相同'
        }     
    return errors  
}

//对用户提交的数据进行加密
function userHash(string){
    return 'yangyang'+string+'sheep'//对数据进行加密
}

function parseCookies(cookie){
    //JSON.parse
    try{
       return cookie.split(';').reduce(
        function(prev,curr){
            var m = / *([^=]+)=(.*)/.exec(curr);
            var key = m[1]
            var value = decodeURIComponent(m[2])
            prev[key] = value
            return prev
         },
        { }

       )
      }catch(error){
          return {}
      }
}

function stringifyCookies(cookies){
    //JSON.stringify
    var list = [ ]
    for(var key in cookies) {
        list.push(key + '=' + encodeURIComponent(cookies[key]))
    }
    return list.join(';')
}
server.listen(port)
console.log('监听 ' + port + ' 成功，请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)

