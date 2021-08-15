/* 게시물 1건을 표현하는 클래스 정의
주의) 이 파일은 게시물 자체가 아닌, 1건을 생성할 수 있는 틀이다
*/
class Comments{
    constructor(container, msg, author, writeDay) {
        this.container=container; //이 객체가 부착될 부모여소
        this.wrapper;
        this.msgDiv;
        this.authorDiv;
        this.writeDayDiv;

        this.msg=msg;
        this.author=author
        this.writeDay=writeDay;
        
        this.wrapper=document.createElement("div");
        this.msgDiv=document.createElement("div");
        this.authorDiv=document.createElement("div");
        this.writeDayDiv=document.createElement("div");

        //스타일 지정
        this.msgDiv.style.width=70+"%";
        this.msgDiv.style.borderBottom="1px solid lightgray"
        this.msgDiv.style.padding=10+"px";

        this.authorDiv.style.width=15+"%";
        this.authorDiv.style.borderBottom="1px solid lightgray"
        this.authorDiv.style.padding=10+"px";
        this.authorDiv.style.textAlign="center";

        this.writeDayDiv.style.width=10+"%";
        this.writeDayDiv.style.borderBottom="1px solid lightgray"
        this.writeDayDiv.style.padding=10+"px";
        this.writeDayDiv.style.textAlign="center";


        this.msgDiv.innerHTML=this.msg;
        this.authorDiv.innerHTML=this.author;
        this.writeDayDiv.innerHTML=this.writeDay;

        this.wrapper.classList.add("comment-list");

        //div 간 조립
        this.wrapper.appendChild(this.msgDiv);
        this.wrapper.appendChild(this.authorDiv);
        this.wrapper.appendChild(this.writeDayDiv);

        this.container.appendChild(this.wrapper);
    }
}