//DOM
var playground = document.querySelector(".playground > ul");
var gameText = document.querySelector(".game-text");
var scoreDisplay = document.querySelector(".score");
var restartButton = document.querySelector(".game-text > button");

//Score
var score=0;

//Tetris_setting
var duration=500;//떨어지는 속도
var downInterval;//떨어지는

//setting
var rows = 20;
var cols = 10;
var tempMovingMinos;


//블록 모양 잡을 곳
var minos = {
    mino_O : [
        [[0,0], [0,1],[1,0],[1,1]],
        [[0,0], [0,1],[1,0],[1,1]],
        [[0,0], [0,1],[1,0],[1,1]],
        [[0,0], [0,1],[1,0],[1,1]]
    ],
    mino_i :[
        [[0,0], [0,1],[0,2],[0,3]],
        [[0,0], [1,0],[2,0],[3,0]],
        [[0,0], [0,1],[0,2],[0,3]],
        [[0,0], [1,0],[2,0],[3,0]]
    ],
    mino_T :[
        [[0,1], [1,0],[1,1],[1,2]],
        [[0,0], [1,0],[2,0],[1,1]],
        [[0,0], [0,1],[0,2],[1,1]],
        [[1,0], [0,1],[1,1],[2,1]]
    ],
    mino_Z :[
        [[1,0], [2,0],[0,1],[1,1]],
        [[0,0], [0,1],[1,1],[1,2]],
        [[1,0], [2,0],[0,1],[1,1]],
        [[0,0], [0,1],[1,1],[1,2]]
    ],
    mino_S :[
        [[0,0], [1,0],[1,1],[2,1]],
        [[0,1], [0,2],[1,0],[1,1]],
        [[0,0], [1,0],[1,1],[2,1]],
        [[0,1], [0,2],[1,0],[1,1]]
    ],
    mino_J :[
        [[0,2], [1,0],[1,1],[1,2]],
        [[0,0], [1,0],[2,0],[2,1]],
        [[0,0], [0,1],[0,2],[1,0]],
        [[0,0], [0,1],[1,1],[2,1]]
    ],
    mino_L :[
        [[0,0], [1,0],[1,1],[1,2]],
        [[0,0], [0,1],[1,0],[2,0]],
        [[0,0], [0,1],[0,2],[1,2]],
        [[2,0], [0,1],[1,1],[2,1]]
    ]
}


//움직이는 블럭의 Json 값
var movingMinos = {
    type : "",
    direction : 0,
    top : 0,
    left : 4
};


function init(){
    for(var i=0; i<rows; i++){
        prependNewLine();
    }
    
    tempMovingMinos={...movingMinos};//스프레드오퍼레이터(...)<-배열 복사인데, 객체자체는 복사되지 않고 원본값을 참조하는 것!
    // movingMinos 값을 변경하면 tempMovingMinos의 값도 반영이 되기 때문에
    // tempMovingMinos 값과 movingMinos 값을 따로 사용하기 위해서 ... 을 사용 함!!!

    createNewMino(); //시작과 함께 새로운 블럭 생성
}

//playground에 들어갈 십자선을 만듬
function prependNewLine(){
    var li = document.createElement("li");
    var ul = document.createElement("ul");
    for(var j=0; j<cols; j++){
        var matrix = document.createElement("li");
        ul.prepend(matrix);
    }
    li.prepend(ul);
    playground.prepend(li);
}


//블럭에 색을 입혀 출력
function renderMinos(moveType=""){
    var { type, direction, top, left} = tempMovingMinos; //객체 디스트럭처링을 사용하여 tempMovingMinos의 키 값들을 받아오자!!
    // console.log(type, direction, top, left);

    var movingBlocks = document.querySelectorAll(".moving");
    movingBlocks.forEach(moving =>{
        moving.classList.remove(type, "moving"); //moving의 클래스를 가진 블럭들을 moving과 type(색)의 class를 지운다! (초기화)
    });

    //some을 쓴 이유? foreach는 반복문 중간에서 break가 되지 않기 때문에 some을 사용해서 return true 로 반복문 중간에서 빠져나옴!!
    minos[type][direction].some(mino => { //블럭의 direction에 따른 좌표 값 
        var x = mino[0] + left; //x값
        var y = mino[1] + top; //y값
        //가로줄이 있다면 타겟을 지정하고, 없다면 null 값 부여!! (블럭이 아래에서 playground를 벗어나는지 확인 하기 위해서!)
        var target = (playground.childNodes[y])? playground.childNodes[y].childNodes[0].childNodes[x] : null;
        // console.log(target);
        
        var isAvailable = checkEmpty(target); //target이 지정 가능한지 확인!!
        // console.log(isAvailable);
        if(isAvailable){
            target.classList.add(type, "moving"); //target 블럭에 moving과 type(색) class를 부여
        }else{
            tempMovingMinos={...movingMinos}; //tempMovingMinos를 움직이기 이전의 블럭으로 초기화!!
            if(moveType =='retry'){ 
                clearInterval(downInterval); //인터벌을 중지!!
                showGameoverText(); //게임오버 메시지 출력!
            }
            setTimeout(()=> { //setTimeout을 쓰는 이유? 여러 동작이 한 번에 겹쳐서 순서를 늦춰줄 필요가 있기 때문!!
                renderMinos("retry"); //두 번 연속으로 isAvailable 값이 false이면(playground 위로 넘어간) 게임 오버!!
                if(moveType == "top"){ //바닥에 닿으면 블럭을 멈추기 위해서 확인!!
                    stopMino();
                }
            },0);
            return true; //반복문 종료!!
        }
    });
    movingMinos.left = left;
    movingMinos.top = top;
    movingMinos.direction = direction; //움직이는 블럭 JSON에 값 부여!
}

//블럭을 멈추게 한다!!
function stopMino(){
    var movingBlocks = document.querySelectorAll(".moving");
    movingBlocks.forEach(moving =>{ //moving중인 블럭들의 moving 클래스를 제거하고, stopped 클래스를 부여!!
        moving.classList.remove("moving");
        moving.classList.add("stopped");
    });
    checkMatch(); //가로줄 1줄이 블럭으로 채워져 있는지 확인!! (1줄이 다 채워지면 지우기 위해서)
}

//한 줄이 다 채워졌는지 확인
function checkMatch(){
    var childNodes = playground.childNodes;
    childNodes.forEach(child =>{ //child = 가로 1줄
        var matched = true;
        child.childNodes[0].childNodes.forEach(li => { //li = 블럭 1칸씩
            if(!li.classList.contains("stopped")){ //가로 1줄에 있는 블럭들 중 1개라도 stopped 클래스를 안 가진 블럭(빈칸)이 있다면 matched=false
                matched = false;
            }
        });
        if(matched){ //가로 1줄이 모두 채워져 있다면
            child.remove(); //가로 1줄을 지운다
            prependNewLine(); //새로운 가로 1줄 생성
            score++; //스코어 1점 추가
            scoreDisplay.innerText = score;
        }
    });
    createNewMino(); //새로운 블럭 생성
}

//새로운 블럭 생성
function createNewMino(){
    clearInterval(downInterval); //인터벌 종료!!
    downInterval = setInterval(() => {
        moveMinos('top', 1);
    }, duration); //새로운 인터벌 시작!!


    var minoArray = Object.entries(minos); //JSON 객체를 배열 객체로 변환!!
    var randomIndex = getRandom(minoArray.length); //블럭의 모양의 갯수 중 랜덤 인덱스 생성

    movingMinos.type = minoArray[randomIndex][0]; //minos 안에 있는 블럭 모양 중 랜덤 모양
    movingMinos.left = 4;
    movingMinos.top = 0;
    movingMinos.direction = 0; //초기 위치 지정
    tempMovingMinos={...movingMinos}; //새로운 블럭의 값들을 tempMovingMinos에 대입
    renderMinos(); //블럭 출력
}

//target이 사용할 수 있는 블럭인지 체크
function checkEmpty(target){
    if(!target || target.classList.contains("stopped")){ //target이 null 이거나(!null = true) stopped(멈춰있는)인 블럭 이라면
        return false;
    }
    return true;
}


//방향키를 누름에 따라 블럭의 위치를 변경시키고 모양을 찍는다
function moveMinos(moveType, amount){ //moveType: 좌,우,아래(left,top)  , amount: 움직일(더할) left,top 값
    tempMovingMinos[moveType] +=amount;
    renderMinos(moveType); //블럭 출력
}

//블럭을 바닥에 빠르게 떨어뜨리기
function dropMino(){
    clearInterval(downInterval); //인터벌 종료
    downInterval = setInterval(() => { //원래 속도보다 빠르게 인터벌을 돌림
        moveMinos('top', 1)
    }, 10);
}

//게임오버 메시지 출력
function showGameoverText(){
    gameText.style.display = "flex"; //display:none 으로 가려놨던 게임오버 메시지를 출력!!
}

//방향키를 누르는 이벤트 발생
document.addEventListener("keydown", e =>{
    // console.log(e.keyCode);
    switch(e.keyCode){
        case 39: //오른쪽
            moveMinos("left",1);
            break; 
        case 37: //왼쪽
            moveMinos("left",-1);
            break; 
        case 40: //아래쪽
            moveMinos("top",1);
            break; 
        case 38: //위쪽
            changeDirection();
            break; 
        case 32: //스페이스바
            dropMino();
            break; 
        default:
            break;
    }
});


//위쪽 방향키를 눌렀을 때 direction을 변경시킨다
//direction이 3이 되면 원래 방향으로 돌아와서 drection 값을 0으로 초기화 시켜준다
function changeDirection(){
    var direction = tempMovingMinos.direction;
    (direction===3)? tempMovingMinos.direction=0 : tempMovingMinos.direction+=1;
    renderMinos(); //블럭 출력
}

//게임 다시시작!!
restartButton.addEventListener("click", ()=>{
    playground.innerHTML=""; //HTML초기화
    gameText.style.display = "none";  //게임오버 메시지 가리기
    score = 0; //점수 초기화
    scoreDisplay.innerText = score; //점수 출력
    init(); //다시 처음부터 함수 시작
});

window.addEventListener("load", function(){
    init();
});