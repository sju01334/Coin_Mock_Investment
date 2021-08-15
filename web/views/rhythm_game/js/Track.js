//트랙을 정의한다.
class Track{
    constructor(container, src, song, title, x){
        this.container=container;
        this.img=document.createElement("img");
        this.src=src;
        this.song=song;
        this.title=title;
        this.x=x;
        this.y=0;
        this.init();


    }
    init(){
        this.img.style.width=500+"px";
        this.img.style.height=500+"px";
        this.img.style.position="absolute";
        this.img.style.left=this.x+"px";
        this.img.style.top=this.y+"px";
        this.img.src=this.src;

        this.container.appendChild(this.img);
    
    }
 
}