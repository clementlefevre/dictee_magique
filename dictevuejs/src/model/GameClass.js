//import * as playService from "../services/playService"
import configJson from "../assets/config.json"

export default class GameClass {
    constructor() {

        this.data = configJson.data
        this.allQuestions = Object.keys(this.data['QUESTIONS']);
        this.initSoundUrls()
        console.log(this.data)
    }



    initSoundUrls() {
        Object.keys(this.data).forEach((key) => {
            console.log(this.data[key])
            Object.keys(this.data[key]).forEach((data_key) => {
                let text = this.data[key][data_key]
                this.data[key][data_key] = {}

                this.data[key][data_key]["text"] = text
                this.data[key][data_key]["url"] = key + "/" + data_key
            });

        });
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


    playGreeting() {
        let key = this.getRandomProperty("GREETINGS")
        let url = [this.data['GREETINGS'][key]["url"], this.data['GREETINGS'][key]["url"]]
        this.playList(url)
    }





}