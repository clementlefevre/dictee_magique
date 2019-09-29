export function getSoundUrl(soundFamily,gameData) {
    let urlSound = "";
    let index = 0;

    if (soundFamily == 'QUESTIONS') {
        index = gameData.currentQuestion;
        urlSound = 'assets/sounds/'.concat(soundFamily).concat('/').concat(index);
    } else if (soundFamily == 'NUMBER') {

        let number_string = gameData.scoreCounter.toString()
        urlSound = 'assets/sounds/'.concat(soundFamily).concat('/').concat(number_string);
    } else {
        index = getRandomIndex(soundFamily,gameData.data)
        urlSound = 'assets/sounds/'.concat(soundFamily).concat('/').concat(Object.keys(gameData.data[soundFamily])[index]);
    }

    urlSound = urlSound.concat('.mp3');

    return urlSound;
}

function getRandomIndex(family,data) {
    const length = (Object.keys(data[family])).length;

    const urlSoundIndex = Math.floor(Math.random() * length)
    return urlSoundIndex;

}