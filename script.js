window.addEventListener('load',() => {
    const mineSweeper =new MineSweeper();
    mineSweeper.init();
})

let logic;

const gameTypes=[
    {name:"small", size:9, mines:10},
    {name:"medium", size:16 , mines:40},
    {name:"large", size:24, mines:150}
]

class MineSweeper{
    init(){
        this.logic=new LocalLogic();
        this.generateBlocks();
    }

    generateBlocks(){
        const body=document.body;
        let contentDiv=this.createDiv("content");
        body.appendChild(contentDiv);
        
        contentDiv.appendChild(this.createHeader());
        contentDiv.appendChild(this.createPlayfield());
        contentDiv.appendChild(this.createButtonBar());
        contentDiv.appendChild(this.createFooter());
    }

    createDiv(className){
        let div=document.createElement("div");
        div.classList.add(className);

        return div;
    }

    createHeader(){
        let header=document.createElement("header");

        let div=document.createElement("div");
        div.id="title-div";

        let h1=document.createElement("h1");
        h1.innerText="Minesweeper";

        let p=document.createElement("p");
        p.innerText="by Yusuf Safa Köksal";

        header.appendChild(div);
        div.appendChild(h1);
        div.appendChild(p);

        return header;
    }

    createFooter(){
        let footer=document.createElement("footer");

        let div=document.createElement("div");
        div.id="footer-div";

        let p=document.createElement("p");
        p.innerHTML="&copy; 2025 by Yusuf Safa Köksal";

        footer.appendChild(div);
        div.appendChild(p);

        return footer;
    }

    createPlayfield(){
        let playfieldDiv=document.createElement("div");
        playfieldDiv.id="playfield";

        return playfieldDiv;
    }

    createButtonBar(){
        let buttonBarDiv=document.createElement("div");
        buttonBarDiv.id="buttonbar";

        buttonBarDiv.appendChild(this.generateSingleButton("gameSmall", "Small"));
        buttonBarDiv.appendChild(this.generateSingleButton("gameMedium", "Medium"));
        buttonBarDiv.appendChild(this.generateSingleButton("gameLarge", "Large"));

        return buttonBarDiv;
    }

    generateSingleButton(id, label){
        let button=document.createElement("button");
        button.id=id;
        button.innerText=label;
        button.addEventListener("click", ()=> {
            this.startGame(label.toLowerCase());
        });

        return button;
    }

    fillsPlayfield(gameTypes){
        let playfield=document.querySelector("#playfield")
        playfield.innerHTML="";

        for(let y=0; y<gameTypes.size;y++){
            for(let x=0; x<gameTypes.size;x++){
                let cell=this.generateCell(gameTypes.size);
                cell.classList.add("cell","covered");
                cell.setAttribute("data-y",y);
                cell.setAttribute("data-x",x);
                playfield.appendChild(cell);
            }
        }
    }

    generateCell(size){
        let cell=document.createElement("div");
        
        let style="calc((100% / size) - 6px)"
        style=style.replace("size",size);
        cell.style.width=style;
        cell.style.height=style;

        cell.addEventListener("click", (event) =>{
            this.cellClicked(event);
        });
        cell.addEventListener("contextmenu", (event) =>{
            this.cellRightClicked(event);
        });
        cell.addEventListener("touchstart", (event) =>{
            this.touchStart(event);
        });
        cell.addEventListener("touchend", (event) =>{
            this.touchEnd(event);
        });

        return cell;
    }

    async startGame(gameType){
        gameTypes.forEach(async game => {
            if(gameType == game.name){
                this.fillsPlayfield(game);
                await this.logic.init(game.size,game.mines);
            }   
        });
    }

    getCell(x,y){
        return document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    }

    placeSymbol(x,y,symbol){
        let cell=this.getCell(x,y);

        if(symbol)
            cell.classList.add("symbol",`symbol-${symbol}`)
        
        cell.classList.remove("covered");
        cell.classList.add("uncovered");
    }

    async cellClicked(event){
        const x=event.target.dataset.x;
        const y=event.target.dataset.y;

        let result=await this.logic.sweep(x,y);
    
        if(result.minehit){
            this.getCell(x,y).classList.add("hited-mine");
            result.mines.forEach((mine)=>{
                this.placeSymbol(mine.x,mine.y,"mine");
            })
            this.displayOverlay("You lose!");
        }   
        else{
            if(result.minesAround==0){
                this.placeSymbol(x,y);
                result.emptyCells.forEach((cell)=>{
                    if(cell.minesAround==0)
                        this.placeSymbol(cell.x,cell.y);
                    else
                        this.placeSymbol(cell.x,cell.y,cell.minesAround);
                });
            }
            else{
                this.placeSymbol(x,y,result.minesAround);
            }
            
            if(result.userwins==true)
                this.displayOverlay("You win!");
        }
            
        event.preventDefault();
    }

    cellRightClicked(event){
        const x=event.target.dataset.x;
        const y=event.target.dataset.y;
        let cell=this.getCell(x,y);

        if(!cell.classList.contains("uncovered")){
            cell.classList.toggle("symbol");
            cell.classList.toggle("symbol-flag");
        }

        event.preventDefault();
    }

    touchStart(event){
        this.startMs=new Date().getTime();
        event.preventDefault();
    }

    touchEnd(event){
        const elapsedTime=new Date().getTime() - this.startMs;

        if(elapsedTime < 500){
            alert("left touch");
        }
        else{
            alert("right touch");
        }   
        event.preventDefault();
    }

    displayOverlay(text){
        let overlay=this.createDiv("overlay");
        let textHolder=document.createElement("div");
        overlay.appendChild(textHolder);
        textHolder.innerText=text;
        document.querySelector("#playfield").appendChild(overlay);
    }
}

class LocalLogic{
    moveCounter;
    numberOfMines;
    size;
    field;
    uncoveredCells;

    async init(size, mines){
        this.field=[];
        this.uncoveredCells=[];
        this.numberOfMines=mines;
        this.size=size;
        this.moveCounter=0;

        for(let i = 0; i<size; i++){
            this.field[i]=[];
            for(let j = 0; j<size; j++){
                this.field[i][j]=false;
            }
        }

        for(let i = 0; i<size; i++){
            this.uncoveredCells[i]=[];
            for(let j = 0; j<size; j++){
                this.uncoveredCells[i][j]=false;
            }
        }
    }

    async sweep(x,y){
        x=parseInt(x);
        y=parseInt(y);

        if(this.moveCounter==0){
            this.putMines(x,y);
        }

        this.uncoveredCells[x][y]=true;

        this.moveCounter++;
        const numberOfMinesAround=this.countMinesAround(x,y);
        let emptyCells;

        if(numberOfMinesAround>0)
            emptyCells=undefined;
        else{
            emptyCells=this.getEmptyCells(x,y);

            emptyCells.forEach((cell) => {
                this.uncoveredCells[cell.x][cell.y]=true;
            })
        } 

        let userWin=false;
        if(this.countUncoveredCells()==(this.size*this.size)-this.numberOfMines)
            userWin=true;

        if(this.field[x][y]==true){
            var result={
                minehit:this.field[x][y],
                mines:this.findMines()
            }
        }
        else{
            var result={
                minehit:this.field[x][y],
                minesAround:numberOfMinesAround,
                emptyCells:emptyCells,
                userwins:userWin
            }
        }

        return result;
    }

    countUncoveredCells(){
        let count=0;
        for(let i = 0; i<this.size; i++){
            for(let j = 0; j<this.size; j++){
                if(this.uncoveredCells[i][j]==true)
                    count++;
            }
        }

        return count;
    }

    findPlaceForMine(x,y){
        while(true){
            let targetX=Math.floor(Math.random() * this.size);
            let targetY=Math.floor(Math.random() * this.size);

            if(targetX==x && targetY==y)
                continue;
            if(this.field[targetX][targetY]==true)
                continue;

            this.field[targetX][targetY]=true;
            break;
        }
    }

    putMines(x,y){
        for(let i=0;i<this.numberOfMines;i++){
            this.findPlaceForMine(x,y);
        }
    }

    findMines(){
        let mines=[];
        for(let i = 0; i<this.size; i++){
            for(let j = 0; j<this.size; j++){
                if(this.field[i][j]==true){
                    mines.push({x:i,y:j});
                }
            }
        }

        return mines;
    }

    getEmptyCells(x,y){
        let toDo=[{x:x, y:y, minesAround:0}];
        let done=[];

        while(toDo.length>0){
            let actual=toDo.shift();
            done.push(actual);
            const neighbors=this.getNeighbors(actual.x,actual.y);

            neighbors.forEach((cell) =>{
                if(this.inList(done,cell)==false){
                    if(cell.minesAround==0){
                        if(this.inList(toDo,cell)==false){
                            toDo.push(cell);
                        }
                    }
                    else{
                        done.push(cell);
                    }
                }   
            });
        }
    
        return done;
    }

    getNeighbors(x,y){
        let listOfNeighbors=[];
        let minesAround;

        for(let deltaX=-1;deltaX<=1;deltaX++){
            for(let deltaY=-1;deltaY<=1;deltaY++){
                if(this.getSafeAccess(deltaX+x,deltaY+y)==false){
                    minesAround=this.countMinesAround(x+deltaX,y+deltaY);
                    let neighbour={
                        x:x+deltaX,
                        y:y+deltaY,
                        minesAround:minesAround
                    };
                    listOfNeighbors.push(neighbour); 
                } 
            }
        }

        return listOfNeighbors;
    }

    inList(list,givenElement){
        return list.some(element=> element.x==givenElement.x && element.y==givenElement.y);
    }

    countMinesAround(x,y){
        let count=0;

        for(let deltaX=-1;deltaX<=1;deltaX++){
            for(let deltaY=-1;deltaY<=1;deltaY++){
                if(this.getSafeAccess(deltaX+x,deltaY+y)==true)
                    count++;
            }
        }

        return count;
    }

    getSafeAccess(x,y){
        if(x<0 || x>=this.size || y<0 || y>=this.size)
            return undefined;
        else
            return this.field[x][y];
    }
}

class RemoteLogic{
    serverUrl="https://www2.hs-esslingen.de/~melcher/it/minesweeper/";
    token = null;

    async init(size, mines){
        const request=`?request=init&userid=yukoit01&size=${size}&mines=${mines}`;
        const responseInit=await this.fetchAndDecode(request);
        console.dir(responseInit);
        this.token= responseInit.token;
    }

    async fetchAndDecode(request){
        return fetch(this.serverUrl+request).then(response => response.json());
    }

    async sweep(x,y){
        const request=`?request=sweep&token=${this.token}&x=${x}&y=${y}`;
        //const response= await this.fetchAndDecode(request);
        //console.dir(response);
        return this.fetchAndDecode(request);
    }
}