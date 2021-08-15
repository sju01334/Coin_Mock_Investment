/*
모듈은 변수, 함수 등의 코드를 모아놓고 파일로 저장한 단위
개발자가 모듈을 정의할 때는 내장 객체 중 exports 객체를 사용하면 됨
*/
//getMsg 메서드를 현재 모듈 안에 정의한다.
exports.getMsg=function(){
    return "this message is from my module";
}

exports.getRandom=function(n){
    var r=parseInt(Math.random()*n);//0~1미만 난수 발생
    //console.log(r);
    return r;
}
exports.getZeroString=function(n){
    var result=(n>=10)?n:"0"+n;
    return result;
}

/*메시지 처리 함수
alert()출력할 메시지 생성해주는 함수

*/
exports.getMsgUrl=function(msg, url){
    var tag="<script>";
    tag+="alert('"+msg+"');";
    tag+="location.href='"+url+"';";
    tag+="</script>";
    return tag; //함수 호출자에게 최종적으로 생성된 태그문자열 반환
}
//원하는 메시지 출력후 뒤로 돌아가기
exports.getMsgBack=function(msg){
    var tag="<script>";
    tag+="alert('"+msg+"');";
    tag+="history.back();";  //back()뒤에 세미콜론은 반드시 처리하자!!
    tag+="</script>";
    return tag;
}
