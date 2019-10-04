import sound from 'pixi-sound';



function getFilePath(x, game) {
    const folderFiles = Object.keys(game.data[x]);
    const allUrls = folderFiles.map(f => ['assets/sounds/', x, '/', f, '.mp3'].join(''));
    return allUrls;
}

export function getSoundsUrls(game) {
    const allFolders = Object.keys(game.data);
    let allUrls = allFolders.map(x => getFilePath(x, game));

    let allNumbers = Array(game.allQuestions.length).fill().map((_, i) => i + 1);
    allNumbers = allNumbers.map(x => 'assets/sounds/NUMBER/'.concat(x).concat('.mp3'))

    let allLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    allLetters = allLetters.map(x => 'assets/sounds/ALPHABET/'.concat(x).concat('.mp3'))

    allUrls = allUrls.flat().concat(allNumbers).concat(allLetters);
    return (allUrls);

}

export function getMainSounds(game) {
    let mainSounds = Array(6).fill().map((_, i) => i + 1)
    mainSounds = mainSounds.map(x => ['assets/sounds/SOUNDS/s_', x, '.mp3'].join(''));
    console.log(mainSounds);
    return (mainSounds);
}



export function getSoundUrl(soundFamily, game) {
    let urlSound = "";
    let index = 0;

    if (soundFamily == 'QUESTIONS') {
        index = game.currentQuestion;
        urlSound = ['assets/sounds/', soundFamily, '/', index].join('');
    } else if (soundFamily == 'NUMBER') {

        let number_string = game.scoreCounter.toString()
        urlSound = ['assets/sounds/', soundFamily, '/', number_string].join('');
    } else {
        index = getRandomIndex(soundFamily, game.data)
        urlSound = ['assets/sounds/', soundFamily, '/', Object.keys(game.data[soundFamily])[index]].join('');
    }

    urlSound = urlSound.concat('.mp3');

    return urlSound;
}

export function getRandomIndex(family, data) {
    const length = (Object.keys(data[family])).length;

    const urlSoundIndex = Math.floor(Math.random() * length)
    return urlSoundIndex;

}

export function setQuestion(game) {
    game['currentQuestion'] = game.allQuestions.shift();
}


export function playGreeting(game) {
    game.floppyDrive.play(function () {
        game.loader.resources[getSoundUrl('GREETINGS', game)].sound.play(() => playQuestion(game));
        setQuestion(game);
    })

}

export function playQuestion(game) {
    //input.setInputStyle('color', "yellowgreen");
    game.input.text = ">";
    game.message.text = "";
    game.loader.resources[getSoundUrl('INTRO', game)].sound.play(() =>
        game.loader.resources[getSoundUrl('QUESTIONS', game)].sound.play());


}

export function playScore1(game) {

    game.loader.resources[getSoundUrl('SCORE_INFOS_1', game)].sound.play(() => playNumber(game))

}


export function playNumber(game) {
    game.loader.resources[getSoundUrl('NUMBER', game)].sound.play(() => playScore2(game))
}

export function playScore2(game) {
    game.scoreboard.text = game.scoreCounter.toString().padStart(2, '0').concat(' points');
    game.loader.resources[getSoundUrl('SCORE_INFOS_2', game)].sound.play(() => playQuestion(game))
}

export function playAnswer(game, isOk) {
    let urlSound = ""
    let resultSound = game.boingSound;
    if (isOk) {
        urlSound = getSoundUrl('ANSWERS_OK', game);
        resultSound = game.boingSound;
    } else {
        urlSound = getSoundUrl('ANSWERS_NOK', game);
        resultSound = game.buzzerSound;
    }

    resultSound.play(function () {
        game.loader.resources[urlSound].sound.play(function () {
            if (isOk) {
                playScore1(game);
            } else {
                if (game.trials == 3) {
                    playFailed(game);

                } else {
                    playQuestion(game);
                }
                game.input.focus();
            }
        })
    });
}

export function playFailed(game) {
    game.loader.resources['assets/sounds/ANSWERS_FAILED/failed_1.mp3'].sound.play(() =>
        game.loader.resources[getSoundUrl('QUESTIONS', game)].sound.play(() =>
            game.loader.resources['assets/sounds/ANSWERS_FAILED/failed_2.mp3'].sound.play(() => playSpell(game))
        ))

}

export function playSpell(game) {
    const word = game.data['QUESTIONS'][game.currentQuestion].split('');
    loopArray(word, game);
}

let x = 0;

function loopArray(arr, game) {
    customAlert(arr[x], game, function () {
        // set x to next item
        x++;

        // any more items in array? continue loop
        if (x < arr.length) {
            loopArray(arr, game);
        } else if (x == arr.length) {
            console.log('coucou');
            setQuestion(game);
            playQuestion(game);
        }

    })
}

function customAlert(x, game, callback) {
    // code to show your custom alert
    // in this case its just a console log
    console.log(x);
    let url = ['assets/sounds/ALPHABET/', x, '.mp3'].join('');
    console.log(url);
    game.loader.resources[url].sound.play(callback);


}

