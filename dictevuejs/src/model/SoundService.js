
//import SoundClass from "./SoundClass";
export default class SoundService {
    constructor(gameClass) {
        this.extraSounds = {}
        this.initSoundUrls(gameClass)
        this.game = gameClass
    }

    addAlphabetSounds(gameClass) {

        let allLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
        gameClass.data['ALPHABET'] = {}
        console.log("gameClass.data : ", gameClass.data)

        allLetters.forEach((letter) => {
            gameClass.data['ALPHABET'][letter] = { text: letter, url: 'ALPHABET' + "/" + letter }
        })
    }


    initSoundUrls(gameClass) {
        const configGame = gameClass["data"]
        Object.keys(configGame).forEach((category) => {
            Object.keys(configGame[category]).forEach((item) => {
                let text_content = configGame[category][item]

                configGame[category][item] = { text: text_content, url: category + "/" + item }
                console.log("coucou")

            });

        });
        this.addAlphabetSounds(gameClass)

    }

    playList(soundList) {
        console.log("playList(soundList : ", soundList)
        var i = 0
        var audio = this.playSound(soundList[0])
        if (i <= soundList.length && soundList.length > 1) {
            audio.addEventListener("ended", () =>
                this.handleEnded(i, soundList.length, soundList)
            )
        }
        audio.play();
        i++;

    }
    handleEnded(i, length, soundList) {
        console.log("handleEnded, i:", i);

        var audio = this.playSound(soundList[i])
        i++;

        if (i < soundList.length) {
            audio.addEventListener("ended", () =>
                this.handleEnded(i, length, soundList)
            )

        }
        audio.play();
    }
    playSound(sound) {
        var audio = new Audio()
        audio.volume = 0.9;
        audio.loop = false;

        // https://stackoverflow.com/a/37228426/3209276
        console.log("playing : " + "@/assets/sounds/" + sound.url + ".mp3")
        audio.src = require("@/assets/sounds/" + sound.url + ".mp3");
        return (audio)
    }

    playLetter(letter) {
        console.log("LETTER:", letter)
        var audio = new Audio()
        audio.volume = 0.9;
        audio.loop = false;

        // https://stackoverflow.com/a/37228426/3209276

        audio.src = require("@/assets/sounds/ALPHABET/" + letter + ".mp3");
        audio.play();
    }

    setSound(category) {
        let item = this.game.getRandomProperty(category)
        return (this.game.data[category][item])
    }
    playGreeting() {
        let sound1 = this.setSound("GREETINGS")
        let sound2 = this.setSound("INTRO")
        let sound3 = this.game['currentQuestion']
        let sounds = [sound1, sound2, sound3]
        this.playList(sounds)

    }

    playCurrentQuestion() {
        console.log("this.game.currentQuestion['sounds']:", this.game.currentQuestion['sounds'])
        this.playList(this.game.currentQuestion['sounds'])
    }
    playNextQuestion() {
        let soundIntro = this.setSound("INTRO")
        let soundQuestion = this.game['currentQuestion']
        let sounds = [soundIntro, soundQuestion]
        this.game.currentQuestion['sounds'] = sounds
        this.playList(sounds)

    }
    playWin() {
        let soundWin = this.setSound("SCORE_INFOS_2")
        this.playList([soundWin])
    }
}