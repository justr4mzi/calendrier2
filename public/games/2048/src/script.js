document.addEventListener('DOMContentLoaded', () => {
    const gridDisplay = document.querySelector('.grid');
    const scoreDisplay = document.querySelector('#score');
    const resultDisplay = document.querySelector('#result');
    const width = 4;
    let squares = [];
    let score = 0;

    function createBoard() {
        for(let i = 0; i < width * width; i++) {
            const square = document.createElement('div');
            square.innerHTML = 0;
            gridDisplay.appendChild(square);
            squares.push(square);
        }
        generate();
        generate();
    }
    createBoard();


    function generate() {
        const randomNumber = Math.floor(Math.random() * squares.length);
        if(squares[randomNumber].innerHTML == 0){
            squares[randomNumber].innerHTML = 2;
            checkForGameOver();
        } else {
            generate(); 
        }
    }

    function moveRight() {
        for (let i = 0; i < 16; i++) {
            if (i % 4 === 0) {
                let totalOne = squares[i].innerHTML;
                let totalTwo = squares[i+1].innerHTML;
                let totalThree = squares[i+2].innerHTML;
                let totalFour = squares[i+3].innerHTML;

                let row = [
                    parseInt(totalOne),
                    parseInt(totalTwo),
                    parseInt(totalThree),
                    parseInt(totalFour)
                ];
                let filteredRow = row.filter(num => num);
                let missing = 4 - filteredRow.length;
                let zeros = Array(missing).fill(0);
                let newRow = zeros.concat(filteredRow);
                console.log(newRow);
                squares[i].innerHTML = newRow[0];
                squares[i+1].innerHTML = newRow[1];
                squares[i+2].innerHTML = newRow[2];
                squares[i+3].innerHTML = newRow[3];
            }
        }
    }

    function moveLeft(){
         for (let i = 0; i < 16; i++) {
            if (i % 4 === 0) {
                let totalOne = squares[i].innerHTML;
                let totalTwo = squares[i+1].innerHTML;
                let totalThree = squares[i+2].innerHTML;
                let totalFour = squares[i+3].innerHTML;

                let row = [
                    parseInt(totalOne),
                    parseInt(totalTwo),
                    parseInt(totalThree),
                    parseInt(totalFour)
                ];
                let filteredRow = row.filter(num => num);
                let missing = 4 - filteredRow.length;
                let zeros = Array(missing).fill(0);
                let newRow = filteredRow.concat(zeros);
                console.log(newRow);
                squares[i].innerHTML = newRow[0];
                squares[i+1].innerHTML = newRow[1];
                squares[i+2].innerHTML = newRow[2];
                squares[i+3].innerHTML = newRow[3];
            }
        }
    }
    
    function moveUp(){
        for(let i =0; i < 4; i++){
            let totalOne = squares[i].innerHTML;
                let totalTwo = squares[i+width].innerHTML;
                let totalThree = squares[i+width*2].innerHTML;
                let totalFour = squares[i+width*3].innerHTML;

                let column = [
                    parseInt(totalOne),
                    parseInt(totalTwo),
                    parseInt(totalThree),
                    parseInt(totalFour)
                ];
                let filteredColumn = column.filter(num => num);
                let missing = 4 - filteredColumn.length;
                let zeros = Array(missing).fill(0);
                let newColumn = filteredColumn.concat(zeros);
                console.log(newColumn);
                squares[i].innerHTML = newColumn[0];
                squares[i+width].innerHTML = newColumn[1];
                squares[i+width*2].innerHTML = newColumn[2];
                squares[i+width*3].innerHTML = newColumn[3];
        }
    }


    function moveDown(){
    for(let i =0; i < 4; i++){
            let totalOne = squares[i].innerHTML;
                let totalTwo = squares[i+width].innerHTML;
                let totalThree = squares[i+width*2].innerHTML;
                let totalFour = squares[i+width*3].innerHTML;

                let column = [
                    parseInt(totalOne),
                    parseInt(totalTwo),
                    parseInt(totalThree),
                    parseInt(totalFour)
                ];
                let filteredColumn = column.filter(num => num);
                let missing = 4 - filteredColumn.length;
                let zeros = Array(missing).fill(0);
                let newColumn = zeros.concat(filteredColumn);

                squares[i].innerHTML = newColumn[0];
                squares[i+width].innerHTML = newColumn[1];
                squares[i+width*2].innerHTML = newColumn[2];
                squares[i+width*3].innerHTML = newColumn[3];
        }
    }


function combineRow(){
    for(let i=0; i < 15; i++){
        if(squares[i].innerHTML === squares[i+1].innerHTML){
            let combineTotal = parseInt(squares[i].innerHTML) + parseInt(squares[i+1].innerHTML);
            squares[i].innerHTML = combineTotal;
            squares[i+1].innerHTML = 0;
            score += combineTotal;
            scoreDisplay.innerHTML = score;
        }
    }
}

function combineColumn(){
    for(let i=0; i < 11; i++){
        if(squares[i].innerHTML === squares[i+width].innerHTML){
            let combineTotal = parseInt(squares[i].innerHTML) + parseInt(squares[i+width].innerHTML);
            squares[i].innerHTML = combineTotal;
            squares[i+width].innerHTML = 0;
            score += combineTotal;
            scoreDisplay.innerHTML = score;
        }
    }
    checkForWin();
}

 //async function
 function control(e){
    if (e.key === 'ArrowLeft'){
        keyLeft();
    } else if(e.key === 'ArrowRight'){
        keyRight();
    } else if(e.key === 'ArrowUp'){
        keyUp();
    }else if(e.key === 'ArrowDown'){
        keyDown();
    }
 }
 document.addEventListener('keydown', control);
  
function keyLeft(){
    moveLeft();
    combineRow();
    moveLeft();
    generate();
}

function keyRight(){
    moveRight();
    combineRow();
    moveRight();
    generate();
}

function keyUp(){
    moveUp();
    combineColumn();
    moveUp();
    generate();
}

function keyDown(){
    moveDown();
    combineColumn();
    moveDown();
    generate();
}

//check number for to win

function checkForWin(){
    for(let i = 0; i < squares.length ;i++){
        if(squares[i].innerHTML == 2048) {
            resultDisplay.innerHTML = "You win";
            document.removeEventListener('keydown', control);
        }
    }
}

//check lose
function checkForGameOver(){
    let zeros = 0;
    for(let i=0; i < squares.length; i++){
        if(squares[i].innerHTML == 0){
            zeros++;
        }
    }

    if(zeros === 0){
        resultDisplay.innerHTML = "You lose";
        document.removeEventListener('keydown', control);
    }
}

function clear(){
    resultDisplay.innerHTML = "You lose";
    document.removeEventListener('keydown', control);
    setTimeout(clear, 3000);
}
//add colors 
function addColors(){
    for(let i=0; i < squares.length; i++){
        if(squares[i].innerHTML == 0){
            squares[i].style.backgroundColor = '#afa192';
        } else if(squares[i].innerHTML == 2){
            squares[i].style.backgroundColor = '#eee4da';
        } else if(squares[i].innerHTML == 4){
            squares[i].style.backgroundColor = '#ede0c8';
        } else if(squares[i].innerHTML == 8){
            squares[i].style.backgroundColor = '#f2b179';
        } else if(squares[i].innerHTML == 16){
            squares[i].style.backgroundColor = '#ffcea4';
        } else if(squares[i].innerHTML == 32){
            squares[i].style.backgroundColor = '#e8c064';
        } else if(squares[i].innerHTML == 64){
           squares[i].style.backgroundColor = '#ffab6e';
        } else if(squares[i].innerHTML == 128){
            squares[i].style.backgroundColor = '#fd9982';
        } else if(squares[i].innerHTML == 256){
            squares[i].style.backgroundColor = '#ead79c';
        } else if(squares[i].innerHTML == 512){
            squares[i].style.backgroundColor = '#76daff';
        } else if(squares[i].innerHTML == 1024){
            squares[i].style.backgroundColor = '#beeaa5';
        } else if(squares[i].innerHTML == 2048){
            squares[i].style.backgroundColor = '#d7d4f0';
        }
    }
}

addColors();
let myTimer = setInterval(addColors, 50);

});
