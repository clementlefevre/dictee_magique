import { Howl } from 'howler';


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
        let gamos = this.game

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }


        async function play_audio(file_names) {
            if (gamos.showResult && file_names[0].url.includes("ALPHABET/")) {
                console.log("file_names[0].url  :", file_names[0].url)
                gamos.result = gamos.result + file_names[0].text

            }
            if (file_names[0].url.includes("INTRO/")) {
                await sleep(5000)
            }

            let sound = new Howl({
                src: [require("@/assets/sounds/" + file_names[0].url + ".mp3")],
                volume: 1,
                onend: async function () {
                    file_names.shift();
                    if (file_names.length > 0) {
                        play_audio(file_names);
                        console.log("gamos.showResult :", gamos.result)


                    } else {
                        console.log("! file_names.length > 0")
                        gamos.result = "-->"

                        //gamos.showResult = false
                    }
                }
            });
            sound.play();
        }
        play_audio(soundList)

    }

    playLetter(letter) {

        this.playList([{ text: 'click', url: "SOUNDS/s_3" }, { text: letter, url: "ALPHABET/" + letter }])
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
        let soundBeepOk = { text: "beepOK", url: "SOUNDS/s_1" }
        let soundOK = this.setSound("ANSWERS_OK")
        let soundIntro = this.setSound("INTRO")
        let soundQuestion = this.game['currentQuestion']
        let sounds = [soundBeepOk, soundOK, soundIntro, soundQuestion]
        this.game.currentQuestion['sounds'] = sounds
        this.playList(sounds)

    }
    playWin() {
        let soundWin = this.setSound("SCORE_INFOS_2")
        this.playList([soundWin])
    }

    async playWrongAnswer() {
        let soundBeepNOK = { text: "beepOK", url: "SOUNDS/s_2" }
        let soundWrong = this.setSound("ANSWERS_NOK")

        if (this.game.status.retry == 1) {
            //this.game.result = this.game.currentQuestion.text
            console.log("this.game.status.retry == 3", this.game.status.retry)
            let soundCorrectAnswer = this.playCorrectAnswer()

            this.game.setQuestion()

            let lista = [...[soundBeepNOK, soundWrong], ...soundCorrectAnswer, ...[this.setSound("INTRO"), this.game['currentQuestion']]]
            console.log("lista:", lista)
            this.playList(lista)




        } else {
            this.playList([soundBeepNOK, soundWrong, this.setSound("INTRO"), this.game['currentQuestion']])
        }

    }
    playCorrectAnswer() {
        this.game.showResult = true
        let sounds = [this.game.data['ANSWER_EXPLANATION']['answer_1'], this.game['currentQuestion']]
        sounds.push(this.game.data['ANSWER_EXPLANATION']['answer_2'])
        let spelling_letters = this.getCorrectSpelling()
        spelling_letters.forEach(item => sounds.push(item));


        return sounds

    }
    getCorrectSpelling() {
        let sound_correct_spelling = this.game['currentQuestion'].text.split("")
        let sound_list = []
        sound_correct_spelling.map(x => {

            sound_list.push({ text: x, url: "ALPHABET/" + x })

        })
        console.log(" sound_correct_spelling:", sound_correct_spelling)
        return (sound_list)

    }

    playAnswerOK() {

    }
}