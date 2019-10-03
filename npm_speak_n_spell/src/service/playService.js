import sound from 'pixi-sound';



function getFilePath(x, gameData) {
    const folderFiles = Object.keys(gameData.data[x]);
    const allUrls = folderFiles.map(f => ['assets/sounds/',x,'/',f,'.mp3'].join(''));
    return allUrls;
}

export function getSoundsUrls(gameData) {
    const allFolders = Object.keys(gameData.data);
    let allUrls = allFolders.map(x => getFilePath(x, gameData));
    let allNumbers = Array(gameData.allQuestions.length).fill().map((_, i) => i + 1);
    allNumbers = allNumbers.map(x => 'assets/sounds/NUMBER/'.concat(x).concat('.mp3'))
    allUrls = allUrls.flat().concat(allNumbers);
    return (allUrls);

}


export function getSoundUrl(soundFamily, gameData) {
    let urlSound = "";
    let index = 0;

    if (soundFamily == 'QUESTIONS') {
        index = gameData.currentQuestion;
        urlSound = ['assets/sounds/',soundFamily,'/',index].join('');
    } else if (soundFamily == 'NUMBER') {

        let number_string = gameData.scoreCounter.toString()
        urlSound = ['assets/sounds/', soundFamily, '/', number_string].join('');
    } else {
        index = getRandomIndex(soundFamily, gameData.data)
        urlSound = ['assets/sounds/',soundFamily,'/',Object.keys(gameData.data[soundFamily])[index]].join('');
    }

    urlSound = urlSound.concat('.mp3');

    return urlSound;
}

export function getRandomIndex(family, data) {
    const length = (Object.keys(data[family])).length;

    const urlSoundIndex = Math.floor(Math.random() * length)
    return urlSoundIndex;

}

export function setQuestion(gameData) {
    gameData['currentQuestion'] = gameData.allQuestions.shift();
}


export function playGreeting(gameData) {
    gameData.floppyDrive.play(function(){
        gameData.loader.resources[getSoundUrl('GREETINGS', gameData)].sound.play(() => playQuestion(gameData));
        setQuestion(gameData);
    })
  
}

export function playQuestion(gameData) {
    //input.setInputStyle('color', "yellowgreen");
    gameData.input.text = ">";
    gameData.message.text = "";
    gameData.loader.resources[getSoundUrl('INTRO', gameData)].sound.play(() =>
        gameData.loader.resources[getSoundUrl('QUESTIONS', gameData)].sound.play());


}

export function playScore1(gameData) {
    
    gameData.loader.resources[getSoundUrl('SCORE_INFOS_1', gameData)].sound.play(() => playNumber(gameData))

}


export function playNumber(gameData) {
    gameData.loader.resources[getSoundUrl('NUMBER', gameData)].sound.play(() => playScore2(gameData))
}

export function playScore2(gameData) {
    gameData.scoreboard.text = gameData.scoreCounter.toString().padStart(2, '0').concat(' points');
    gameData.loader.resources[getSoundUrl('SCORE_INFOS_2', gameData)].sound.play(() => playQuestion(gameData))
}

export function playAnswer(gameData, isOk) {
    let urlSound = ""
    let resultSound = gameData.boingSound;
    if (isOk) {
        urlSound = getSoundUrl('ANSWERS_OK', gameData);
        resultSound = gameData.boingSound;
    } else {
        urlSound = getSoundUrl('ANSWERS_NOK', gameData);
        resultSound = gameData.buzzerSound;
    }

    resultSound.play(function () {
        gameData.loader.resources[urlSound].sound.play(function () {
            if (isOk) {
                playScore1(gameData);
            } else {
                playQuestion(gameData);
            }
        })
    });
}