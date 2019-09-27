

//Aliases
let Application = PIXI.Application,
    Container = PIXI.Container,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    TextureCache = PIXI.utils.TextureCache,
    Sprite = PIXI.Sprite;
Text = PIXI.Text;

//Create a Pixi Application
let app = new Application({
    width: 800,
    height: 800,
    antialiasing: true,
    transparent: false,
    resolution: 1
}
);

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);


loader
    .add("images/cat.png")
    .add("images/ibm.png")
    .add("images/ibmXT.png")
    .add("config.json")
    .load(setup);


const boingSound = PIXI.sound.Sound.from('sounds/boing.mp3');
const buzzerSound = PIXI.sound.Sound.from('sounds/buzzer.mp3');
const enterKeySound = PIXI.sound.Sound.from('sounds/KEYBOARD/enter-key.mp3');
const spaceKeySound = PIXI.sound.Sound.from('sounds/KEYBOARD/space-bar.mp3');
const backSpaceKeySound = PIXI.sound.Sound.from('sounds/KEYBOARD/backspace-key.mp3');



//Define any variables that are used in more than one function
let cat, state;

input = new PIXI.TextInput({
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
input.y = 600;



//input.pivot.x = 0;//input.width
//input.pivot.y = input.height / 2

input.restrict = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
input.maxLength = 20;



function isLetter(str) {
    return str.length === 1 && str.match(/[a-z]/i);
}

scoreCounter = 0;

// sleep time expects milliseconds
function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

const buzzer = PIXI.sound.Sound.from({
    url: 'sounds/buzzer.mp3',
    volume: 0.25,
    loop: false
});


function setQuestion() {
    currentQuestion = allQuestions.shift();
}

function getRandomIndex(family) {
    const length = (Object.keys(data[family])).length;

    const urlSoundIndex = Math.floor(Math.random() * length)
    return urlSoundIndex;

}

function getSoundUrl(soundFamily) {
    let urlSound = "";

    if (soundFamily == 'QUESTIONS') {
        index = currentQuestion;
        urlSound = 'sounds/'.concat(soundFamily).concat('/').concat(index);
    } else if (soundFamily == 'NUMBER') {

        number_string = scoreCounter.toString()
        urlSound = 'sounds/'.concat(soundFamily).concat('/').concat(number_string);
    } else {
        index = getRandomIndex(soundFamily)
        urlSound = 'sounds/'.concat(soundFamily).concat('/').concat(Object.keys(data[soundFamily])[index]);
    }

    urlSound = urlSound.concat('.mp3');

    return urlSound;
}




function playGreeting() {
    let urlSound = getSoundUrl('GREETINGS');
    setQuestion();

    PIXI.sound.Sound.from({
        url: urlSound,
        autoPlay: true,
        volume: 0.5,
        complete: function () {


            playQuestion();

        }
    });

}


function playQuestion() {

    let urlSound = getSoundUrl('INTRO');

    PIXI.sound.Sound.from({
        url: urlSound,
        autoPlay: true,
        volume: 0.5,
        complete: function () {
            let urlSound = getSoundUrl('QUESTIONS');
            const sound = PIXI.sound.Sound.from(urlSound);
            sound.play();
        }
    });



}



function playScore1() {
    let urlSound = getSoundUrl('SCORE_INFOS_1');
    PIXI.sound.Sound.from({
        url: urlSound,
        autoPlay: true,
        volume: 0.5,
        complete: playNumber
    })
}

function playNumber() {
    let urlSound = getSoundUrl('NUMBER');
    PIXI.sound.Sound.from({
        url: urlSound,
        autoPlay: true,
        volume: 0.5,
        complete: playScore2
    })
}

function playScore2() {
    let urlSound = getSoundUrl('SCORE_INFOS_2');
    PIXI.sound.Sound.from({
        url: urlSound,
        autoPlay: true,
        volume: 0.5,
        complete: playQuestion
    })
}



function playAnswer(isOk) {
    let urlSound = ""
    let resultSound = {};
    if (isOk) {
        urlSound = getSoundUrl('ANSWERS_OK');
        resultSound = boingSound;

    } else {
        urlSound = getSoundUrl('ANSWERS_NOK');
        resultSound = buzzerSound;
    }


    resultSound.play(complete = function () {
        PIXI.sound.Sound.from({
            url: urlSound,
            autoPlay: true,
            volume: 0.5,
            complete: function () {
                if (isOk) {
                    playScore1();
                } else{
                    playQuestion();
                }


                console.log('Sound finished');

            }
        });
    });




}


input.on('keyup', keycode => {
    console.log('input.text', input.text)
    input.text = input.text.toUpperCase();
    console.log('key pressed:', keycode)
    if (keycode == 13) {
        enterKeySound.play(complete = function () {
            if (input.text.toLowerCase() == data['QUESTIONS'][currentQuestion]) {
                playAnswer(true);
                scoreCounter++;

                /// WTF ?
                app.stage.addChild(message);
                app.stage.addChild(scoreboard);


                input.text = "";
                message.text = "";
                message.position.set(100, 430);
                setQuestion();


                scoreboard.text = scoreCounter.toString().padStart(2, '0').concat(' points');
            } else {
                playAnswer(false);

                input.text = "";
            }



        })
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

let styleCursor = new PIXI.TextStyle({
    fontFamily: "VT323",
    fontSize: 96,
    fill: "greenyellow",
});

let styleScore = new PIXI.TextStyle({
    fontFamily: "VT323",
    fontSize: 60,
    fill: "greenyellow",
});

let message = new Text("START", styleMessage);
let scoreboard = new Text("0 points", styleScore);
let cursor = new Text(">", styleCursor);
cursor.position.set(130, 610);



message.position.set(100, 430);
scoreboard.position.set(270, 200);


let data = {};
let answer = "";

let allQuestions = [];
let currentQuestion = {};

function setup() {


    data = resources['config.json']['data']['data'];

    allQuestions = Object.keys(data['QUESTIONS']);
    console.log(allQuestions)


    //Create the `cat` sprite 
    cat = new Sprite(resources["images/cat.png"].texture);
    cat.y = 96;
    cat.vx = 0;
    cat.vy = 0;
    app.stage.addChild(cat);

    ibmXT = new Sprite(resources["images/ibmXT.png"].texture);
    ibmXT.x = 0;
    app.stage.addChild(ibmXT);



    //Set the game state
    state = play;

    //Start the game loop 
    app.ticker.add(delta => gameLoop(delta));

    input.focus();
    app.stage.addChild(cursor);
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


