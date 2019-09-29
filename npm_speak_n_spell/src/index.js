import * as PIXI from 'pixi.js';
const TextInput = require('./PIXI.TextInput')
import sound from 'pixi-sound';

import { getSoundUrl } from './service_play.js';



//Create a Pixi Application
let app = new PIXI.Application({
    width: 800,
    height: 800,
    antialiasing: true,
    transparent: false,
    resolution: 1
}
);

const loader = PIXI.Loader.shared;

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);


loader.add("assets/images/cat.png")
    .add("assets/images/ibm.png")
    .add("assets/images/ibmXT.png")
    .add("assets/config.json")
    .load(setup);


const boingSound = sound.Sound.from('assets/sounds/boing.mp3');
const buzzerSound = sound.Sound.from('assets/sounds/buzzer.mp3');
const enterKeySound = sound.Sound.from('assets/sounds/KEYBOARD/enter-key.mp3');
const spaceKeySound = sound.Sound.from('assets/sounds/KEYBOARD/space-bar.mp3');
const backSpaceKeySound = sound.Sound.from('assets/sounds/KEYBOARD/backspace-key.mp3');



//Define any variables that are used in more than one function
let cat, state, input;
let gameData = {};

input = new TextInput({
    input: {
        fontFamily: 'VT323',
        fontSize: '96px',
        padding: '0px',
        width: '500px',
        color: 'greenyellow'
    },
    box: {
        default: { fill: 'black', rounded: 12, stroke: { color: 'black', width: 0 } },
        focused: { fill: 'black', rounded: 12, stroke: { color: 'black', width: 0 } },
        disabled: { fill: 'black', rounded: 12 }
    }
})
input.placeholder = '';
input.x = 160;
input.y = 650;



//input.pivot.x = 0;//input.width
//input.pivot.y = input.height / 2

input.restrict = ">abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
input.maxLength = 20;
input.text = ">";



function isLetter(str) {
    return str.length === 1 && str.match(/[a-z]/i);
}
gameData['scoreCounter'] = 0;

// sleep time expects milliseconds
function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

const buzzer = sound.Sound.from({
    url: 'assets/sounds/buzzer.mp3',
    volume: 0.25,
    loop: false
});


function setQuestion() {
    gameData['currentQuestion'] = gameData.allQuestions.shift();
}






function playGreeting() {
    let urlSound = getSoundUrl('GREETINGS', gameData);
    setQuestion();
    console.log(urlSound);

    sound.Sound.from({
        url: urlSound,
        autoPlay: true,
        volume: 0.5,
        complete: function () {
            playQuestion();
        }
    });

}


function playQuestion() {
    input.setInputStyle('color',"yellowgreen");
    input.text = ">";
    let urlSound = getSoundUrl('INTRO', gameData);

    sound.Sound.from({
        url: urlSound,
        autoPlay: true,
        volume: 0.5,
        complete: function () {
            let urlSound = getSoundUrl('QUESTIONS', gameData);
            console.log(urlSound);
            sound.Sound.from(urlSound).play();
        }
    });



}



function playScore1() {
    scoreboard.text = gameData.scoreCounter.toString().padStart(2, '0').concat(' points');
    let urlSound = getSoundUrl('SCORE_INFOS_1', gameData);
    sound.Sound.from({
        url: urlSound,
        autoPlay: true,
        volume: 0.5,
        complete: playNumber
    })
}

function playNumber() {
    let urlSound = getSoundUrl('NUMBER', gameData);
    sound.Sound.from({
        url: urlSound,
        autoPlay: true,
        volume: 0.5,
        complete: playScore2
    })
}

function playScore2() {
    let urlSound = getSoundUrl('SCORE_INFOS_2', gameData);
    sound.Sound.from({
        url: urlSound,
        autoPlay: true,
        volume: 0.5,
        complete: playQuestion
    })
}



function playAnswer(isOk) {
    let urlSound = ""
    let resultSound = boingSound;
    if (isOk) {
        urlSound = getSoundUrl('ANSWERS_OK', gameData);
        resultSound = boingSound;

    } else {
        urlSound = getSoundUrl('ANSWERS_NOK', gameData);
        resultSound = buzzerSound;
    }


    resultSound.play(function () {
        sound.Sound.from({
            url: urlSound,
            autoPlay: true,
            volume: 0.5,
            complete: function () {
              
                if (isOk) {
                    playScore1();
                } else {
                    playQuestion();
                }


                console.log('Sound finished');

            }
        })


    })


}


input.on('keyup', keycode => {

    input.text = input.text.toUpperCase();
    console.log(input.text)
   

    if (keycode == 13) {
        enterKeySound.play();
        if (input.text.substr(1).toLowerCase() == gameData.data['QUESTIONS'][gameData.currentQuestion]) {
            input.setInputStyle('color',"#FF55FF");
            playAnswer(true);
            gameData.scoreCounter++;


            
            message.text = "";
            message.position.set(100, 430);
            setQuestion();


            
            
           
        } else {
            playAnswer(false);

            input.text = ">";
        }

    } else {
        spaceKeySound.play();
    }

})

app.stage.addChild(input)

let styleMessage = new PIXI.TextStyle({
    fontFamily: "VT323",
    fontSize: 48,
    fill: "greenyellow",
});



let styleScore = new PIXI.TextStyle({
    fontFamily: "VT323",
    fontSize: 60,
    fill: "greenyellow",
});

let message = new PIXI.Text("START", styleMessage);
let scoreboard = new PIXI.Text("0 points", styleScore);




message.position.set(100, 430);
scoreboard.position.set(270, 200);







function setup() {

    gameData['data'] = loader.resources['assets/config.json'].data.data;

    gameData['allQuestions'] = Object.keys(gameData.data['QUESTIONS']);



    //Create the `cat` PIXI.PIXI.Sprite 
    cat = new PIXI.Sprite(loader.resources["assets/images/cat.png"].texture);
    cat.y = 96;
    cat.vx = 0;
    cat.vy = 0;
    app.stage.addChild(cat);

    let ibmXT = new PIXI.Sprite(loader.resources["assets/images/ibmXT.png"].texture);
    ibmXT.x = 0;
    app.stage.addChild(ibmXT);



    //Set the game state
    state = play;

    //Start the game loop 
    app.ticker.add(delta => gameLoop(delta));

    input.focus();
    app.stage.addChild(message);
    app.stage.addChild(scoreboard);
    playGreeting();



}

function gameLoop(delta) {

    //Update the current game state:
    state(delta);
}

function play(delta) {

    //Move the cat 1 pixel to the right each frame
    cat.vx = 1
    cat.x += cat.vx;
}


