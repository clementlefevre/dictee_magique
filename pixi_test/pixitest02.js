

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
    width: 256 * 2,
    height: 256 * 2,
    antialiasing: true,
    transparent: false,
    resolution: 1
}
);

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

loader
    .add("images/cat.png")
    .load(setup);


const sound = PIXI.sound.Sound.from('sounds/boing.mp3');


sound.play();

//Define any variables that are used in more than one function
let cat, state;

input = new PIXI.TextInput({
    input: {
        fontFamily: 'Arial',
        fontSize: '12px',
        padding: '12px',
        width: '500px',
        color: '#26272E'
    },
    box: {
        default: { fill: 0xE8E9F3, rounded: 12, stroke: { color: 0xCBCEE0, width: 3 } },
        focused: { fill: 0xE1E3EE, rounded: 12, stroke: { color: 0xABAFC6, width: 3 } },
        disabled: { fill: 0xDBDBDB, rounded: 12 }
    }
})
input.placeholder = 'Enter your Text...'
input.x = 10
input.y = 100
input

input.pivot.x = 0;//input.width
input.pivot.y = input.height / 2

input.restrict = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
input.maxLength = 20;

let inputEntered = "";


function isLetter(str) {
    return str.length === 1 && str.match(/[a-z]/i);
  }



const wordsList = ['coucou','caca','toto'];

wordCounter = 0;

console.log(wordsList[2]);

// sleep time expects milliseconds
function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }
  
  // Usage!
  

input.on('input', stringo => {
        if(stringo.toLowerCase()==wordsList[wordCounter]){
            sound.play();
            wordCounter++;
            input.text="";
            message.text = "C est bien petit loup";
            message.position.set(20, 100);
            PIXI.sound.add('caca', 'sounds/caca.mp3');
            sleep(1000).then(() => {
               
                PIXI.sound.play('caca');
            });
          
            scoreboard.text = wordCounter.toString().padStart(2, '0')
        }
})
app.stage.addChild(input)

let style = new PIXI.TextStyle({
    fontFamily: "Arial",
    fontSize: 36,
    fill: "white",
    stroke: '#ff3300',
    strokeThickness: 4,
    dropShadow: true,
    dropShadowColor: "#000000",
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
  });

let message = new Text("Hello Pixi!", style);
let scoreboard = new Text("0 points", style);



message.position.set(10, 50);
scoreboard.position.set(10, 150);
app.stage.addChild(message);
app.stage.addChild(scoreboard);



function setup() {

    //Create the `cat` sprite 
    cat = new Sprite(resources["images/cat.png"].texture);
    cat.y = 96;
    cat.vx = 0;
    cat.vy = 0;
    app.stage.addChild(cat);

    //Set the game state
    state = play;

    //Start the game loop 
    app.ticker.add(delta => gameLoop(delta));
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



