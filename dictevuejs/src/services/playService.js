

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

