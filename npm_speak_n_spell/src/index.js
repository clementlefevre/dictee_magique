import * as PIXI from 'pixi.js';

import sound from 'pixi-sound';
import * as soundService from './service/playService.js';
import { getInput } from './service/inputService.js';

//Create a Pixi Application
let app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
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



//Define any variables that are used in more than one function

let gameData = {};


gameData['input'] = getInput();

gameData['scoreCounter'] = 0;

gameData['trialCounter'] = 0;


gameData.input.on('keyup', keycode => {

    if (keycode == 38) {
        soundService.playQuestion(gameData);
    }
    if (keycode != 8) {
        gameData.input.text = gameData.input.text.toUpperCase().replace('▌', '').concat('▌');

    }

    if (keycode == 13) {
        gameData.enterKeySound.play();
        if (gameData.input.text.substr(1).replace('▌', '').toLowerCase() == gameData.data['QUESTIONS'][gameData.currentQuestion]) {
            gameData.input.setInputStyle('color', "transparent");
            //gameData.input.setInputStyle('text-shadow', '0 0 0 #4bf321;');
            gameData.message.style = styleMessageOK;
            gameData.message.text = "CORRECT !";
            soundService.playAnswer(gameData, true);
            gameData.scoreCounter++;
            
            soundService.setQuestion(gameData);
        } else {
            gameData.message.style = styleMessageNOK;
            gameData.message.text = "WRONG !";
            soundService.playAnswer(gameData, false);
            
        }
    } else {
        gameData.spaceKeySound.play();
    }
})

app.stage.addChild(gameData.input);

let styleMessageOK = new PIXI.TextStyle({
    fontFamily: "VT323",
    fontSize: 96,
    fill: "greenyellow",
});

let styleMessageNOK = new PIXI.TextStyle({
    fontFamily: "VT323",
    fontSize: 96,
    fill: "red",
});

let styleScore = new PIXI.TextStyle({
    fontFamily: "VT323",
    fontSize: 60,
    fill: "greenyellow",
});

gameData['message'] = new PIXI.Text("", styleMessageOK);
gameData['scoreboard'] = new PIXI.Text("00 point", styleScore);

gameData.message.position.set(window.innerWidth / 2, window.innerHeight / 2 * 1.4);
gameData.scoreboard.position.set(270, 200);

function setup() {
    gameData['data'] = loader.resources['assets/config.json'].data.data;
    gameData['allQuestions'] = Object.keys(gameData.data['QUESTIONS']);
    let ibmXT = new PIXI.Sprite(loader.resources["assets/images/ibmXT.png"].texture);
    ibmXT.x = 0;
    app.stage.addChild(ibmXT);
    gameData.input.setInputStyle('outline', 'none');
    app.stage.addChild(gameData.message);
    app.stage.addChild(gameData.scoreboard);

    gameData.input.focus();

    const allSoundsUrls = soundService.getSoundsUrls(gameData);

    loader.add(allSoundsUrls);
    loader.load(function (loader) {
        gameData.boingSound = loader.resources['assets/sounds/SOUNDS/s_1.mp3'].sound;
        gameData.buzzerSound = loader.resources['assets/sounds/SOUNDS/s_2.mp3'].sound;
        gameData.enterKeySound = loader.resources['assets/sounds/SOUNDS/s_3.mp3'].sound;
        gameData.spaceKeySound = loader.resources['assets/sounds/SOUNDS/s_4.mp3'].sound;
        gameData.backSpaceKeySound = loader.resources['assets/sounds/SOUNDS/s_5.mp3'].sound;
        gameData.floppyDrive = loader.resources['assets/sounds/SOUNDS/s_6.mp3'].sound;
        gameData['loader'] = loader;
        soundService.playGreeting(gameData);

    })





}


