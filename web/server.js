var http = require("http");
var express = require("express");//외부모듈(설치완료)
var static = require("serve-static");//외부모듈(설치완료)
var ejs = require("ejs");//외부모듈(설치완료)
var mysql = require("mysql");//외부모듈(설치완료)
var path = require("path");
var mymodule=require("./lib/mymodule.js");

var expressSession=require("express-session"); //서버측 세션을 관리하는 모듈


const conStr={
    url:"localhost",
    user:"root",
    password:"1234",
    database:"stocksite",
    dateStrings:'date'
};

var app = express();
app.use(static(__dirname+"/static"));
app.use(express.urlencoded({
    extended:true
}));//post 요청의 파라미터 받기 위함.

app.use(expressSession({
    secret:"key secret",
    resave:true,
    saveUninitialized:true
}));


//템플릿 뷰 엔진 등록(서버 스크립트 위치 등록)
app.set("view engine", "ejs");//등록 후에는 자동으로 무조건 view하위에서 ejs를 찾아간다.(따라서 view라는 정해진 디렉토리 무조건 존재 시켜야 한다.)

/*--------------------------------------------
메인화면
--------------------------------------------*/
app.get("/coin/main", function(request, response){
    var loginCheck;
    if(request.session.user==undefined){
        loginCheck = undefined;
    }else{
        loginCheck = request.session.user;
    }
    
    var sql = "select * from (";
    sql += "select  s.stock_name, sc.close_price, s.stock_id, sc.stock_date";
    sql += " from stock s  left outer join stock_chart sc";
    sql += " on s.stock_id = sc.stock_id";
    sql += ")t";
    sql += " where (stock_id, stock_date) in(";
    sql += "select stock_id, max(stock_date) as stock_date";
    sql += " from stock_chart group by stock_id)";


    // console.log(sql);
    var con = mysql.createConnection(conStr);
    con.query(sql, [], function (err, result, fields) {
        if (err) {
            console.log("등록 실패", err);
        } else {
            response.render("main", {
                joinUser: loginCheck,
                joinResult: result
            });
            // console.log(result);
        }
        con.end();
    });
});

/*--------------------------------------------
차트 데이터 비동기 처리
--------------------------------------------*/


//차트 가져오기
app.get("/coin/main/chart", function(request, response){
    var stock_id;
    if(request.query.stock_id == undefined){
        stock_id = 1;
    }else{
        stock_id = request.query.stock_id; //파라미터 받기
    }

    // console.log(request.query.stock_id);
    var sql = "select s.stock_id, open_price, high_price, low_price, close_price, stock_date, stock_name";
    sql += " from stock_chart as c";
    sql += " join stock as s";
    sql += " on c.stock_id=s.stock_id="+stock_id;
    


    // 쿼리문 실행~~~~
    var con = mysql.createConnection(conStr);
    con.query(sql, function(err, result, fields){
        if(err){
            console.log("차트 데이터 가져오기 실패", err);
        }else{
            // console.log("result is ", result);
            data = result;
            // console.log("data는 ", data);

            response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
            response.end(JSON.stringify(result));
        }
        con.end();
    });
});

//차트 데이터 입력 처리
app.get("/coin/main/regist", function(request, response){
    //파라미터 받기
    var stock_id = request.query.stock_id;
    var date = request.query.date;
    var open = request.query.open;
    var low = request.query.low;
    var high = request.query.high;
    var close = request.query.close;
    console.log("넘어온 데이터는 ", stock_id, date, open, low, high, close);

    var sql = "insert into stock_chart(stock_id, open_price, high_price, low_price, close_price, stock_date)";
    sql += " values(?, ?, ?, ?, ?, ?)";

    var con = mysql.createConnection(conStr);

    con.query(sql, [stock_id, open, high, low, close, date], function(error, result){
        if(error){
            console.log("insert 쿼리 실행중 에러 발생", error);
        }else{
            response.writeHead(200, {"Content-Type":"text/html;charset=utf-8"});
            response.end("/coin/main/chart?stock_id="+stock_id);
        }
        con.end();
    });
});

//차트 데이터 로그
app.get("/coin/main/log", function(request, response){
    var sql = "select * from stock_chart";

    var con = mysql.createConnection(conStr);
    con.query(sql, function(err, result, fields){
        if(err){
            console.log("차트 로그 가져오기 실패", err);
        }else{
            response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
            response.end(JSON.stringify(result));
        }
        con.end();
    });
});


app.get("/coin/main/investment", function(request, response){
    
    checkUserSession(request,response,"investment"); //로그인 처리
    
});


/*--------------------------------------------
투자내역
--------------------------------------------*/

app.get("/coin/main/investment", function(request, response){
    
    checkUserSession(request,response,"investment"); //로그인 처리
    
});


app.get("/coin/main/investmentdata", function (request, response) {
    // console.log("메서드호출");
    
    var sql = "select stock_chart_id, stock.stock_id, member_id, stock_name, close_price, total_count, price_average";
    sql += " from member_trading inner join stock";
    sql += " on member_trading.stock_id = stock.stock_id";
    sql += " inner join stock_chart";
    sql += " on stock.stock_id = stock_chart.stock_id";
    sql += " order by stock_chart_id desc limit 1";
 
    var con = mysql.createConnection(conStr);
    con.query(sql, function (err, result, fields) {
        if (err) {
            console.log("투자 내역 불러오기 실패", err);
        } else {
            console.log("투자 내역 불러오기 성공", result);
            if (request.session.user) { //  undefined가 아니라면..
                var param={
                    joinUser: request.session.user,                    
                    invest: result
                };
                response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
                response.end(JSON.stringify(param));
            }else {
                response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
                response.end("로그인이 필요한 서비스입니다.");
            }

            con.end();
        }
    });
});

/*--------------------------------------------
로그인
--------------------------------------------*/

//회원가입 폼 요청
app.get("/coin/main/signupform", function (request, response) {
    if (request.session.user == undefined) {
        response.render("signup", {
            joinUser: undefined
        });
    }
});

//회원가입 폼 요청 처리
app.post("/coin/main/signup", function(request, response){
    
    var user_id=request.body.user_id;
    var user_pass=request.body.user_pass;
    var user_name = request.body.user_name;
    
    console.log("입력 데이터 : " +user_id,user_pass,user_name);

    var sql="insert into member(user_id,user_pass,user_name)";
    sql+= " values(?,?,?)";
    var con=mysql.createConnection(conStr);
    con.query(sql, [user_id, user_pass, user_name] , function(err,  result , fields){
        if(err){
            console.log("등록 실패", err);
            response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
            response.end(mymodule.getMsgBack("가입 실패"));
       
        }else{
            
            console.log("등록 성공", user_id,user_name,user_pass);
            
            response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
            response.end(mymodule.getMsgUrl("회원가입 성공","/coin/main/loginform"));
        }

        con.end();
    });
});

//로그인 폼 요청
app.get("/coin/main/loginform", function(request, response){
    response.render("login",{
        joinUser:undefined
    });
});

//로그인 폼 요청 처리
app.post("/coin/main/login", function(request, response){
    var user_id=request.body.user_id;
    var user_pass=request.body.user_pass;
    console.log(user_id , user_pass);
    

    var sql="select * from member";
    sql +=" where user_id=? and user_pass=?";

    var con=mysql.createConnection(conStr);
    con.query(sql, [user_id, user_pass] , function(err,  result , fields){
        if(err){
            console.log("조회 실패", err);
        }else{
            //로그인이 일치 하는지 않하는지? 
            if(result.length <1){
                console.log("로그인 실패");
                response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
                response.end(mymodule.getMsgBack("로그인 정보가 올바르지 않습니다"));
            }else{
                console.log("로그인 성공",result);
               
                request.session.user={
                    member_id: result[0].member_id,
                    user_id:result[0].user_id,
                    user_pass:result[0].user_pass,
                    user_name:result[0].user_name,
                    user_money : result[0].user_money
                };
               
                response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
                response.end(mymodule.getMsgUrl("로그인성공","/coin/main"));
            }
        }
        con.end();
    });
  //  http://localhost:7777/coin/main


});

//로그아웃
app.get("/coin/logout", function (req, res) {
    if (req.session.user) {
        console.log('로그아웃 처리');
        req.session.destroy(
            function (err) {
                if (err) {
                    console.log('로그아웃 에러');
                    return;
                }
                console.log('로그아웃 성공');
                //파일 지정시 제일 앞에 / 를 붙여야 root 즉 public 안에서부터 찾게 된다
                res.redirect('main');
            }
        );          //세션정보 삭제

    } else {
        console.log('로그인이 안되어 있음');
        res.redirect('main');
    }

});



/*--------------------------------------------
매수매도
--------------------------------------------*/

//매수 요청 처리
app.get("/inc/trade_buy", function (request, response) {

    //파라미터 받기(get)
    var member_id = request.session.user.member_id;
    var coin_id = request.query.coinid;
    var price = request.query.nowprice;
    var cnt = request.query.buy_cnt;
    console.log("매수 요청시 ",member_id, coin_id, price, cnt);

    var trade_money = (parseInt(price) * parseInt(cnt));  //구매 총 가격

    var mainsql = "select * from member_trading";
    var maincon = mysql.createConnection(conStr);
    maincon.query(mainsql, [], function (err, result, fields) {
        if (err) {
            console.log("검색실패", err);
        } else {

            console.log("검색성공, result는 ",result);
            // console.log(result.length);

            var membercheckcnt = 0;
            var coincheckcnt = 0;   

            if(result.length==0){
                var price_average = parseInt(trade_money) / parseInt(cnt);

                //따로 삭제와 검색없이 새로운 데이터 입력
                var insertsql = "insert into member_trading(member_id, stock_id, total_count, price_average) values(?, ?, ? ,?)"
                var insertcon = mysql.createConnection(conStr);
                insertcon.query(insertsql, [member_id, coin_id, cnt, price_average], function (err, result, fields) {
                    if (err) {
                        console.log("해당하는 코인이 존재하지않아 구매 실패", err);
                    } else {
                        response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
                        response.end();
                    }
                });

            }else{
                for (var i = 0; i < result.length; i++) {
                    if (member_id != result[i].member_id || member_id == undefined) {
                        membercheckcnt++;
    
                        if (membercheckcnt == result.length) { //전부돌아도 해당하는 멤버id가 데이터베이스에 없을때,
                            //console.log("해당 유저가 구매한 코인이 하나도 없다");
    
                            var price_average = parseInt(trade_money) / parseInt(cnt);
    
                            //따로 삭제와 검색없이 새로운 데이터 입력
                            var insertsql = "insert into member_trading(member_id, stock_id, total_count, price_average) values(?, ?, ? ,?)"
                            var insertcon = mysql.createConnection(conStr);
                            insertcon.query(insertsql, [member_id, coin_id, cnt, price_average], function (err, result, fields) {
                                if (err) {
                                    console.log("해당하는 코인이 존재하지않아 구매 실패", err);
                                } else {
                                    response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
                                    response.end();
                                }
                            });
                        }
    
                    }
    
                    if (member_id == result[i].member_id && coin_id != result[i].stock_id) {
                        coincheckcnt++;
                        if (coincheckcnt == result.length) {   //전부 돌아도 해당하는 코인id가 데이터베이스에 없을때
                            //console.log("코인id가 없어서 코인 따로 생성")
    
                            var price_average = parseInt(trade_money) / parseInt(cnt);
    
                            //따로 삭제와 검색없이 새로운 데이터 입력
                            var insertsql = "insert into member_trading(member_id, stock_id, total_count, price_average) values(?, ?, ? ,?)"
                            var insertcon = mysql.createConnection(conStr);
                            insertcon.query(insertsql, [member_id, coin_id, cnt, price_average], function (err, result, fields) {
                                if (err) {
                                    console.log("해당하는 코인이 존재하지않아 구매 실패", err);
                                } else {
    
                                    response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
                                    response.end();
                                }
                            });
    
                        }
                    }
    
    
                    if (member_id == result[i].member_id && coin_id == result[i].stock_id) {
                        //멤버id, 코인id가 데이터베이스에 있을때
    
                        var store_money = (parseInt(result[i].total_count) * parseInt(result[i].price_average))
                        var total_cnt = (parseInt(result[i].total_count) + parseInt(cnt));
                        var total_money = trade_money + store_money;
                        var total_average = total_money / total_cnt;
                        console.log(store_money, trade_money, total_cnt, total_money, total_average);

                        //기존 데이터 업데이트
                        var updatesql = "update member_trading set total_count=?,price_average=? where member_id=? and stock_id=?";
                        var updatecon = mysql.createConnection(conStr);
                        updatecon.query(updatesql, [total_cnt, total_average, member_id, coin_id], function (err, result, fields) {
                            if (err) {
                                console.log("업데이트 실패!!", err);
                            } else {
                                console.log("업데이트 성공!!");
                                response.end();
                            }
                        });
                    }
                }
            } 


            //가진 현금에서 구매 가격만큼 마이너스 하기 
            //stock 테이블 개수를 빼줘야함 하지만, 개수가 엄청 많다고 가정하고 빼는거 생략~!


        }
        maincon.end();
    });


});

//매도 요청 처리
app.get("/inc/trade_sell", function (request, response) {

    //파라미터 받기(get)
    var member_id = request.session.user.member_id;
    var coin_id = request.query.coinid;
    var price = request.query.nowprice;
    var cnt = request.query.sell_cnt;
    console.log("매도 시 받아온 데이터 ",member_id, coin_id, price, cnt);

    var trade_money = (parseInt(price) * parseInt(cnt));  //주문 총 가격

    var mainsql = "select *  from member_trading";
    var maincon = mysql.createConnection(conStr);
    maincon.query(mainsql, [], function (err, result, fields) {

        if (err) {
            console.log("검색실패", err);
        }
        else {

            console.log("검색성공");
            console.log(result);

            var membercheckcnt = 0;
            var coincheckcnt = 0;

            if(result.length==0){
                response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
                response.end("0"); //판매 실패
            }else{
                for (var i = 0; i < result.length; i++) {
    
                    if (member_id != result[i].member_id) {
                        membercheckcnt++;
                        if (membercheckcnt == result.length) { //전부돌아도 해당하는 멤버id가 데이터베이스에 없을때,
                            response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
                            response.end("1"); //판매 실패
                        }
                    }
    
                    if (member_id == result[i].member_id && coin_id != result[i].stock_id) {
                        coincheckcnt++;
                        if (coincheckcnt == result.length) {   //전부 돌아도 해당하는 코인id가 데이터베이스에 없을때
                            response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
                            response.end("1"); //판매 실패
                        }
                    }
    
                    if (member_id == result[i].member_id && coin_id == result[i].stock_id) {
                        //멤버id, 코인id가 데이터베이스에 있을때
                        if (parseInt(cnt) > parseInt(result[i].total_count)) {
                            // 가진 수량보다 입력한 수량이 더 많을때,
                            response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
                            response.end("2");
                        }
                        else {   
    
                            var total_cnt = parseInt(result[i].total_count) - parseInt(cnt); //총개수 -판매 주문개수
                            var result_average = parseInt(result[i].price_average); //판매는 평균 구매가격이 변동X
                            var total_money= parseInt(result[i].price_average) * parseInt(result[i].total_count);
    
                            var benefit; //순수익
                            if (parseInt(price) == parseInt(result[i].price_average)) { //주문가격 = 평단가
                                benefit = 0;
                            }
                            else { //주문가격 < 평단가 || 주문가격 > 평단가 
                                benefit = ( parseInt(price)-parseInt(result[i].price_average) ) * parseInt(cnt) ;
                            }
    
                            console.log("매도 후 정보 ",total_cnt, result_average, benefit , trade_money , total_money);
                            
                            if( (parseInt(result[i].total_count) - parseInt(cnt))>=1){
                                
                                //기존 데이터 업데이트
                                var updatesql = "update member_trading set total_count=? where member_id=? and stock_id=?";
                                var updatecon = mysql.createConnection(conStr);
                                updatecon.query(updatesql, [total_cnt,member_id, coin_id], function (err, result, fields) {
                                    if (err) {
                                        console.log("업데이트 실패!!", err);
                                    } else {
                                        console.log("업데이트 성공!!");
                                        response.end();
                                    }
                                });
                            }
                            else{ 
                                    //기존 데이터 삭제
                                    var deletesql = "delete from member_trading where member_id=? and stock_id=?";
                                    var deletecon = mysql.createConnection(conStr);
                                    deletecon.query(deletesql, [member_id, coin_id], function (err, result, fields) {
                                        if (err) {
                                            console.log("기존 데이터 삭제 실패", err);
                                        } else {
                                            console.log("기존 데이터 삭제성공");
                                            response.end();
                                        }
                                    });

                            }
                          
    
                        }
    
                    }
                }

            }

        }
        maincon.end();
    });

});

/*--------------------------------------------
게시판 
--------------------------------------------*/

//게시판 목록 요청 처리 
app.get("/notice/list", function(request, response){
   
 
    //클라이언트가 전송한 파라미터 받기!!!
    var currentPage = request.query.currentPage; //클라이언트가 보기를 원하는 페이지수
    
    if(currentPage==undefined){ 
        currentPage=1;
    } 
    console.log("currentPage ", currentPage);

    var sql="select  n.notice_id, title, writer, regdate, hit , count(msg) as cnt";
    sql+=" from notice n  left outer join  comments c";
    sql+=" on n.notice_id=c.notice_id";
    sql+=" group by n.notice_id, title, writer, regdate, hit";
    sql+=" order by n.notice_id desc";

    var con=mysql.createConnection(conStr);
    con.query(sql, function(err, result, fields){
        if(err){
            console.log("게시판 리스트 가져오기 실패", err);
        }else{
            console.log(result);
            if(request.session.user==undefined){
                response.render("notice/list",{
                    joinUser:undefined,
                    param:{
                        "currentPage":currentPage,
                        "noticeList":result,
                        "lib":mymodule
                    }
                });        
            }else{
                response.render("notice/list",{
                    joinUser:request.session.user,
                    param:{
                        "currentPage":currentPage,
                        "noticeList":result,
                        "lib":mymodule
                    }
                });        
            }
        }
        con.end();
    });

});


//제목으로 검색
app.post("/notice/search", function(request, response){
    var category=request.body.category;
    var keyword=request.body.keyword;

    console.log("제목 키워드", keyword);
    var currentPage = request.query.currentPage; //클라이언트가 보기를 원하는 페이지수
    
    if(currentPage==undefined){ 
        currentPage=1;
    } 
    
    
    var sql="";
    sql="select  n.notice_id, title, writer, regdate, hit , count(msg) as cnt";
    sql+=" from notice n  left outer join  comments c";
    sql+=" on n.notice_id=c.notice_id";

    if(keyword !=undefined){//검색한 경우엔 
        sql+=" where "+category+" like '%"+keyword+"%'";
    }
    sql+=" group by n.notice_id, title, writer, regdate, hit";
    sql+=" order by n.notice_id desc";

    var con = mysql.createConnection(conStr);

    con.query(sql, function(error, result, fields){
        if(error){
            console.log("검색 에러발생", error);
        }else{
            console.log(sql);
            console.log(result);
            if(request.session.user==undefined){
                response.render("notice/list",{
                    joinUser:undefined,
                    param:{
                        "currentPage":currentPage,
                        "noticeList":result,
                        "lib":mymodule
                    }
                });        
            }else{
                response.render("notice/list",{
                    joinUser:request.session.user,
                    param:{
                        "currentPage":currentPage,
                        "noticeList":result,
                        "lib":mymodule
                    }
                });        
            }
        }
        con.end();
    });
       
});



//게시글 등록 폼
app.get("/notice/registform", function(request, response){
    
    if(request.session.user==undefined){
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgUrl("로그인이 필요합니다", "/coin/main/loginform"))
    }else{
        response.render("notice/regist_form", {
            joinUser:request.session.user
        });
    }
});


//게시글 등록요청 처리
app.post("/notice/regist", function(request, response){
    //파라미터 받기(post)
    var title=request.body.title;
    var writer=request.session.user.user_id;
    var content=request.body.content;
    console.log(request.session.user);

    var sql="insert into notice(title, writer, content) values(?, ?, ?)"

    var con=mysql.createConnection(conStr);
    con.query(sql, [title, writer, content], function(err, fields){
        if(err){
            console.log("게시글 등록 실패", err);
        }else{
            response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
            response.end(mymodule.getMsgUrl("등록완료", "/notice/list"))
        }
        con.end();
    });
});

//상세보기 요청 처리
app.get("/notice/detail", function(request, response){
    //파라미터 받기
    var notice_id=request.query.notice_id; 
    var sql="select * from notice where notice_id="+notice_id;
    
    var con=mysql.createConnection(conStr);
    con.query(sql,function(err, result, fields){
        if(err){
            console.log("상세보기 불러오기 실패", err);
        }else{
            
            console.log(result);
              //댓글 목록도 가져오자
            sql="select * from comments where notice_id=? order by comments_id asc";
            con.query(sql, [notice_id] ,function(e, record){
                if(e){
                    console.log("코멘트 목록 가져오기 에러", e);
                }else{
                    //조회수도 증가시키자
                    con.query("update notice set hit=hit+1 where notice_id=?;", [notice_id],function(er, fields){
                        if(er){
                            console.log(er);
                        }else{
                            if(request.session.user==undefined){
                                console.log(request.session.user);
                                response.render("notice/detail", {
        
                                    joinUser:"undefined",
                                    noticeList:result[0], //게시판 목록
                                    commentsList:record, //코멘트 목록
                                    lib:mymodule
                                });       
                            }else{
                                console.log(request.session.user);
                                response.render("notice/detail", {
                                
                                    joinUser:request.session.user,
                                    noticeList:result[0], //게시판 목록
                                    commentsList:record, //코멘트 목록
                                    lib:mymodule
                                });     
                            }
                            con.end(); //mysql 접속 끊기
                        }
                    });
                }
            });
        }
    });

});

//게시글 수정 폼 가져오기
app.get("/notice/editform", function (request, response){
    var notice_id=request.query.notice_id; 
    var sql="select * from notice where notice_id="+notice_id;

    var con=mysql.createConnection(conStr);
    con.query(sql, function(err, result, fields){
        if(err){
            console.log(err);
        }else{
            response.render("notice/edit_form", {
                joinUser:request.session.user,
                noticeList:result[0]
            });
        }
        con.end();
    });

});


//글 수정요청 처리
app.post("/notice/edit", function(request, response){
    //파라미터 받기
    var title=request.body.title;
    var writer=request.session.user.user_id;
    var content=request.body.content;
    var notice_id=request.body.notice_id;

    //파라미터가 총 4개 필요
    var sql="update notice set title=?, writer=?, content=? where notice_id=?";

    var con=mysql.createConnection(conStr);

    con.query(sql, [title, writer, content, notice_id], function(err, fields){
        if(err){
            console.log(err);
        }else{
            response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
            response.end(mymodule.getMsgUrl("수정 성공","/notice/detail?notice_id="+notice_id));
        }
        con.end();//mysql 연결 종류
    });
});



//코멘트 댓글 등록 요청 처리
app.post("/comments/regist", function(request, response){
    //파라미터 받기
    var notice_id=request.body.notice_id;
    var msg=request.body.msg;
    var author=request.body.author;

    var sql="insert into comments( notice_id, msg, author)";
    sql+=" values(?,?,?)";

    var con = mysql.createConnection(conStr);

    con.query(sql, [notice_id, msg, author], function(error, result){
        if(error){
            console.log("insert 쿼리 실행중 에러 발생", error);
            //클라이언트에게 오류를 공지하기 위함
            response.writeHead(500, {"Content-Type":"text/html;charset=utf-8"});
            response.end("이용에 불편을 드려 죄송합니다");
        }else{
            response.writeHead(200, {"Content-Type":"text/json;charset=utf-8"});
            //네트워크 상으로 주고받는 데이터는 문자열화 시켜서 주고 받는다(""안에 담아서 보냄)
            // console.log("코멘트 리절트", result);
            var str="";
            str+="{";
            str+="\"result\": 1";
            str+="}";

            // console.log("str은 ", str);
            response.end(str); //end()메서드는 문자열을 인수로 받는다!
    
        }
        con.end();
    });
        
});



//코멘트 목록 가져오기 
app.get("/comments/list", function(request, response){
    var notice_id=request.query.notice_id; 
    var sql="select * from comments where notice_id="+notice_id;
    sql+=" order by comments_id desc";
    var con = mysql.createConnection(conStr);

    con.query(sql, function(error, result, fields){
        if(error){
            console.log("등록 에러발생", error);
        }else{
            // console.log("result is ", result);

            //디자인 코드가 아닌, 코멘트 목록을 보내자!!!
            response.writeHead(200, {"Content-Type":"text/json;charset=utf-8"});
            //코멘트 목록을 문자열화 시켜 보내자!!
            response.end(JSON.stringify(result)); 
        }
        con.end();
    });
       
});

//삭제요청
app.post("/notice/delete", function(request, response){
    
    var notice_id=request.body.notice_id;
    
    var con=mysql.createConnection(conStr);
    var sql="delete from comments where notice_id="+notice_id
    //댓글삭제
    con.query(sql, function(err, fields){
        if(err){
            console.log("해당 notice_id 의 댓글삭제실패", err);
        }else{
            //게시글 삭제
            sql="delete from notice where notice_id="+notice_id;
            con.query(sql, function(err, fields){
                if(err){
                    console.log(err);
                }else{
                    response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
                    response.end(mymodule.getMsgUrl("삭제 성공","/notice/list"));
                }
                con.end();
            });

        }
    })

});




/*---------------------------------------------------
마이페이지
---------------------------------------------------*/

//마이페이지 가져오기.
app.get("/coin/main/mypage", function (request, response) {
    if(request.session.user == undefined){
        response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
        response.end(mymodule.getMsgBack("로그인이 필요한 서비스입니다.", "/coin/main/loginform"));
        
    }else{
        var member_id = request.session.user.member_id;
        var sql = "select * from member where member_id=?"
        var con = mysql.createConnection(conStr);
        
        con.query(sql,[member_id], function(err, result, fields){
            if(err){
                console.log("마이페이지 가져오기 실패", err);
            }else{
                response.render("mypage", {
                    joinUser: request.session.user
                });
            }
            con.end();
        });
        
    }
    //console.log(member_id);
    
});

//마이페이지 폼 수정 요청 처리
app.post("/coin/main/editmypage", function (request, response) {
    var user_name = request.body.user_name;
    var user_pass = request.body.user_pass;
    var user_id = request.session.user.member_id;

    console.log(user_id);

    var sql = "update member set user_name=?, user_pass=?"
    sql+= " where member_id=?"

    var con = mysql.createConnection(conStr);
    con.query(sql, [user_name, user_pass, user_id], function (err, result, fields) {
        if (err) {
            console.log("수정 실패", err);
            response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
            response.end(mymodule.getMsgBack("수정 실패"));

        } else {
        console.log("입력 데이터 : " + user_name, user_pass);
        console.log("등록 성공", user_name, user_pass);

        response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
        response.end(mymodule.getMsgUrl("수정 성공", "/coin/main"));
        }

         con.end();
    });
});


/*---------------------------------------------------
세션 체크
---------------------------------------------------*/
function checkUserSession(request, response, url){
    if(request.session.user){ //  undefined가 아니라면..
        response.render(url, {
            joinUser:request.session.user
        });
        // console.log(request);
    }else{
        response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
        response.end(mymodule.getMsgBack("로그인이 필요한 서비스입니다.","/coin/main/loginform"));
    }
}


/*--------------------------------------------
미니게임
--------------------------------------------*/



 //리듬게임
 app.get("/coin/game/rhythm", function(request, response){
    response.render("intro",{
        joinUser: request.session.user 
    });
});
app.get("/coin/game/selectSong", function(request, response){
    response.render("selectSong",{
        joinUser: request.session.user 
    });
});
app.get("/coin/game/rhythmmain", function(request, response){
   response.render("rhythmmain",{
    joinUser: request.session.user 
    });;
});
//테트리스
app.get("/coin/game/tetris", function(request, response){
    response.render("table",{
        joinUser: request.session.user 
    });
});


var server = http.createServer(app);
server.listen(7777, function(){
    console.log("Take your money...");
});





