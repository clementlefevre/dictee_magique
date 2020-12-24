//import * as playService from "../services/playService"
import configJson from "../assets/config.json"
import SoundService from "./SoundService";


export default class GameClass {
    constructor() {

        this.config = configJson.data
        this.data = {}
        this.sounds = new SoundService()
        this.allQuestions = Object.keys(this.data['QUESTIONS']);
    }

    getRandomIndex(family) {
        const length = (Object.keys(this.data[family])).length;
        const urlSoundIndex = Math.floor(Math.random() * length)
        return urlSoundIndex;

    }

    getRandomProperty(family) {
        var keys = Object.keys(this.data[family]);
        return keys[Math.floor(Math.random() * keys.length)];
    }

    setQuestion() {
        this['currentQuestion'] = this.allQuestions.shift();
    }

    playSound(sound) {
        var audio = new Audio()
        audio.volume = 0.9;
        audio.loop = false;

        // https://stackoverflow.com/a/37228426/3209276
        console.log("playing : " + "@/assets/sounds/" + sound + ".mp3")
        audio.src = require("@/assets/sounds/" + sound + ".mp3");
        return (audio)
    }

    playList(soundList) {
        var i = 0
        var audio = this.playSound(soundList[0])
        if (i <= soundList.length) {
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

    getRandomGreetingSound() {
        let key = this.getRandomProperty("GREETINGS")
    }


    playGreeting() {
        let key = this.getRandomProperty("GREETINGS")
        let key2 = this.getRandomProperty("INTRO")
        let key3 = this.getRandomProperty("QUESTIONS")
        let url = [this.data['GREETINGS'][key]["url"], this.data['INTRO'][key2]["url"], this.data['QUESTIONS'][key3]["url"]]
        this.playList(url)

    }

    playQuestion() {

    }





}