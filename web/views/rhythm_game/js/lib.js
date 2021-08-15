/* -------------------------------------------------------------
앞으로 졸업할때까지 유용하고 재사용성이 높은 코드는 모아두자!
나만의 라이브러리
---------------------------------------------------------------*/




/* -----------------------------------------------------
1. 매개변수 n : 0~n미만까지의 랜덤한 수를 반환하는 함수
------------------------------------------------------*/
function getRandom(n){
    var r=parseInt(Math.random()*n); //0.00xxx ~ 1미만 사이의 난수를 발생시켜줌 
    // console.log(r);
    return r;
}

/* -----------------------------------------------------
2. 색상을 랜덤으로 가져오는 함수
------------------------------------------------------*/
function rgbRandom(){
    var r=parseInt(Math.random()*256);
    var g=parseInt(Math.random()*256);
    var b=parseInt(Math.random()*256);

    var str="rgb("+r+","+g+","+b+")";
    return str;
}


/* -----------------------------------------------------
3. 오브젝트 삭제(1.화면에서 삭제 2.메모리상 삭제)
        container : 어떤 부모 요소에서 지울지 결정
        child : 어떤 요소를 지울지
        arr : 어떤 배여레 있는지
        index : 해단 배열의 몇번째 요소를 지울지
------------------------------------------------------*/
function removeObject(container, child, arr, index){
    container.removeChild(child);
    arr.splice(index,1);
}


/* -----------------------------------------------------
4. 충돌검사
------------------------------------------------------*/

function hitTest(me, target) {
    //두물체간 충돌 여부 판단 
    var me_x= parseInt(me.style.left);
    var me_y= parseInt(me.style.top);
    var me_width=parseInt(me.style.width);
    var me_height=parseInt(me.style.height);

    var target_x= parseInt(target.style.left);
    var target_y= parseInt(target.style.top);
    var target_width=parseInt(target.style.width);
    var target_height=parseInt(target.style.height);


    var result1=(me_x >= target_x) && (me_x <= (target_x+target_width));//나의 x좌표위치가 타겟의 x range 내에 있는지 판단 
    var result2=(me_x+me_width >= target_x) && (me_x+me_width <= (target_x+target_width));  //나의 가로폭이 타겟의 가로폭 내에 있는지 판단
    var result3=(me_y >= target_y) && (me_y <= (target_y+target_height));//나의 y좌표위치가 타겟의 세로폭 내에 있는지 판단
    var result4=(me_y+me_height >= target_y) && (me_y+me_height <= (target_y+target_height));//나의 y폭이 타겟의 세로폭 내에 있는지 판단
    
    return (result1 || result2) && (result3 || result4);
}

/* -----------------------------------------------------
5. 자리수 처리
    한자리수의 경우 앞에 0 붙이기
------------------------------------------------------*/
function getZeroString(n){
    var result=(n>10)? n: "0"+n;
    return result;
}






