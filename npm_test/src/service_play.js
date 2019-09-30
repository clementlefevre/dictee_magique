export function getSoundUrl(soundFamily) {
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