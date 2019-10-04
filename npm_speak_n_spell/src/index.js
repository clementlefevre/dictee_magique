import * as PIXI from 'pixi.js';

import sound from 'pixi-sound';
import * as soundService from './service/playService.js';
import * as textService from './service/textService.js';
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

//Define any variables that are used in more than one function
let game = {};
let state;

game['loader'] = PIXI.Loader.shared;
//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);



game['input'] = getInput();
game['scoreCounter'] = 0;
game['trials'] = 0;
game['player'] = '';


game.loader.add("assets/images/cat.png")
    .add("assets/images/ibm.png")
    .add("assets/images/ibmXT.png")
    .add("assets/images/ibmXT_screen.png")
    .add(soundService.getMainSounds(game))
    .load(start);



game.input.on('keyup', keycode => {

    if (keycode == 38) {
        soundService.playQuestion(game);
    }
    if (keycode != 8) {
        game.input.text = game.input.text.toUpperCase().replace('▌', '').concat('▌');
    }

    if (keycode == 13) {
        game.input.text = game.input.text.replace('▌', '');
        if (game['player'] == '') {

            let player = game.input.text.substr(1).replace('▌', '').toLowerCase();

            game.floppyDrive.play();
            game.loader.add("assets/config.json", ["assets/config_", player, ".json"].join('')).load(
                function () {
                    game['player'] = player;
                    setup();

                }
            );


        } else {
            game.enterKeySound.play();
            if (game.input.text.substr(1).replace('▌', '').toLowerCase() == game.data['QUESTIONS'][game.currentQuestion]) {
                game.input.setInputStyle('color', "transparent");
                //game.input.setInputStyle('text-shadow', '0 0 0 #4bf321;');
                game.message.style = textService.styleMessageOK;
                game.message.text = "CORRECT !";
                game.trials = 0;
                soundService.playAnswer(game, true);
                game.scoreCounter++;

                soundService.setQuestion(game);
            } else {
                game.message.style = textService.styleMessageNOK;
                game.message.text = "WRONG !";
                game.trials++;
                soundService.playAnswer(game, false);



            }
        }
    }
    else {
        game.spaceKeySound.play();
    }


})




function start() {
    game.boingSound = game.loader.resources['assets/sounds/SOUNDS/s_1.mp3'].sound;
    game.buzzerSound = game.loader.resources['assets/sounds/SOUNDS/s_2.mp3'].sound;
    game.enterKeySound = game.loader.resources['assets/sounds/SOUNDS/s_3.mp3'].sound;
    game.spaceKeySound = game.loader.resources['assets/sounds/SOUNDS/s_4.mp3'].sound;
    game.backSpaceKeySound = game.loader.resources['assets/sounds/SOUNDS/s_5.mp3'].sound;
    game.floppyDrive = game.loader.resources['assets/sounds/SOUNDS/s_6.mp3'].sound;



    let ibmXT = new PIXI.Sprite(game.loader.resources["assets/images/ibmXT_screen.png"].texture);

    //ibmXT.anchor.set(window.innerWidth/2,window.innerHeight/2);

    let ratio = window.innerHeight / ibmXT.height * .9
    ibmXT.scale.set(ratio, ratio);

    let centerX = window.innerWidth / 2;
    let centerY = window.innerHeight / 2;

    ibmXT.x = centerX - ibmXT.width / 2;
    ibmXT.y = centerY - ibmXT.height / 2;

    app.stage.addChild(ibmXT);

    game['choices'] = new PIXI.Text("Loading", textService.styleMessageOK);
    game['message'] = new PIXI.Text("", textService.styleMessageOK);
    game['scoreboard'] = new PIXI.Text("00 point", textService.styleScore);


    game.input.position.set(ibmXT.x + ibmXT.width * .2, ibmXT.y + ibmXT.height * .5);

    game.choices.position.set(ibmXT.x + ibmXT.width * .2, ibmXT.y + ibmXT.height * .3);
    game.message.position.set(ibmXT.x + ibmXT.width * .2, ibmXT.y + ibmXT.height * .6);
    game.scoreboard.position.set(ibmXT.x + ibmXT.width * .6, ibmXT.y + ibmXT.height * .25);

    app.stage.addChild(game.choices);

    game['loadProgress'] = 0;
    game.choices.text = "Loading"

   

    state = loadProgress;
    app.ticker.add(delta => gameLoop(game, delta));

    game.floppyDrive.play(function () {

        app.stage.addChild(game.input);

        game.input.setInputStyle('width',[ibmXT.width * .5,'px'].join(''));

        game.input.setInputStyle('outline', 'none');

        app.stage.addChild(game.message);
        app.stage.addChild(game.scoreboard);
        game.choices.text = "";
        game.input.focus();

    });


}

function setup() {
    state = playGame;
    game['data'] = game.loader.resources['assets/config.json'].data.data;
    game['allQuestions'] = Object.keys(game.data['QUESTIONS']);

    const allSoundsUrls = soundService.getSoundsUrls(game);

    game.loader.add(allSoundsUrls);
    game.loader.load(function () {

        soundService.playGreeting(game);
        if (game.player == 'juliette') {
            game.choices.text = "[DPLMR][AEIOU]";
        }



    })

}

function gameLoop(game, delta) {
    state(game, delta);

}

function loadProgress(game, delta) {

    game.loadProgress++;
    if (game.loadProgress % 20 == 0 & game.loadProgress <= 100) {
        game.choices.text = game.choices.text.concat('.');
        console.log(game.loadProgress);
    }

    if (game.loadProgress == 101) {
        game.choices.text = "type your name :";
    }

}

function playGame(game, delta) {

}


