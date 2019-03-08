var express = require('express');
var app = express();
var request = require('request');
var path = require('path');
var parser = require('xml2js');
var mysql = require('mysql');

var connectionPool = mysql.createPool({
    connectionLimit : 5,
    host     : 'localhost',
    user     : 'root',
    password : 'q1w2e3r4',
    database : 'kisapay'
});

app.use(express.urlencoded());
app.use(express.json());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/index', function(req, res){
    res.render('home');
});

app.get('/callback', function(req, res){
    var auth_code = req.query.code;
    var getTokenUrl = "https://testapi.open-platform.or.kr/oauth/2.0/token"
    var option = {
        method : 'POST',
        url : getTokenUrl,
        header : {
            "Content-Tpye":"application/x-www-form-urlencoded;"
        },
        form : {
            code : auth_code,
            client_id : "l7xxbc81871cb4994378a29a53ce5eb673c8",
            client_secret : "69b4d191748b41f798b3f2d18fb1af1c",
            redirect_uri : "http://localhost:3000/callback",
            grant_type : "authorization_code"
        }
    };
    request(option, function(err,response,body){
        if(err) throw err;
        else{
            console.log(body);
            var accessRequestResult = JSON.parse(body);
        }
        res.render('resultChild', {data : accessRequestResult});
    })
    console.log(auth_code);
});

app.get('/home', function(req,res){
    res.render('home')
})

app.get('/signup', function (req, res) {
    res.render('signup');
})
app.post('/join', function(req, res){
    var name = req.body.name;
    var id = req.body.id;
    var password = req.body.password;
    var accessToken = req.body.accessToken;
    var refreshToken = req.body.refreshToken;
    var usernum = req.body.usernum;
    console.log(name + "님 회원 가입 시작");
    
    connectionPool.getConnection(function(err, conn){
        conn.query('INSERT into user (userid, username, userpassword, accessToken, refreshToken, usernum) VALUES (?,?,?,?,?,?)',[id,name,password, accessToken, refreshToken, usernum], 
        function (error, results, fields) {
            if (error){ throw error; }
            else {
                conn.release();
                res.json(1);
            }
          });
    })
})

app.get("/login",function(err,res){
    res.render('login')
});
app.post('/login', function(req, res){
    var id = req.body.id;
    var password = req.body.password;
    connectionPool.getConnection(function(err, conn){
        conn.query("SELECT * FROM kisapay.user WHERE userid = ?",[id], function(err, result){
            if(err){
                throw err;
            }
            else {
                var userData = result;
                console.log(userData);
                conn.release();
                res.json(userData);
                
            }
        })
    })
})

app.post('/user', function(req, res){
    var accessToken = req.body.accessToken;
    var usernum = req.body.usernum;
    var requestURL = "https://testapi.open-platform.or.kr/user/me?user_seq_no="+ usernum;
    var option = {
        method : "GET",
        url : requestURL,
        headers : {
            Authorization : "Bearer " + accessToken,
        }
    }
    request(option, function(err, response, body){
        obj = JSON.parse(body)
        res.send(obj);
    })
})

app.post('/balance',function(req, res){
    var accessToken = req.body.accessToken;
    var finusenum = req.body.finusenum;
    var requestURL = "https://testapi.open-platform.or.kr/v1.0/account/balance?fintech_use_num="+finusenum+"&tran_dtime=20190307101010";
    var option = {
        method : "GET",
        url : requestURL,
        headers : {
            "Authorization" : "Bearer " + accessToken
        }
    }
    request(option, function(err, response, body){
        var data = JSON.parse(body);
        res.json(data);
    })
})

app.get('/list', function(req, res){
    var accessToken = "df2fc6a7-dee8-4000-bf88-a90ead9d017a";
    var requestURL = "https://testapi.open-platform.or.kr/v1.0/account/transaction_list?"
                    + "fintech_use_num=199004092057725927017297&"
                    + "inquiry_type=A&"
                    + "from_date=20190307&"
                    + "to_date=20190308&"
                    + "sort_order=D&"
                    + "page_index=00001&"
                    + "tran_dtime=20190307155021";
    var option = {
        method : "GET",
        url : requestURL,
        headers : {
            Authorization : "Bearer " + accessToken,
        }
    }
    request(option, function(err, response, body){
        res.send(body);
    })
})

app.get('/amount', function(err, res){
    res.render('amount')
})

app.get('/withdraw',function(req, res){
    var accessToken = "df2fc6a7-dee8-4000-bf88-a90ead9d017a";
    var requestURL = "https://testapi.open-platform.or.kr/v1.0/transfer/withdraw"
    var option = {
        method : "POST",
        url : requestURL,
        headers : {
            "Content-Tpye":"application/json; charset=UTF-8",
            "Authorization" : "Bearer " + accessToken
        },
        json : {
            dps_print_content: "쇼핑몰환불",
            fintech_use_num : "199004092057725927017297",
            tran_amt : "000000001000",
            tran_dtime : "20190307155021"
        }
    }
    request(option, function(err, response, body){
        console.log(body)
        res.json(body);
    })
})

app.get('/qrcode', function(req, res){
    res.render('qrcode')
})
app.listen(3000);