//import * as playService from "../services/playService"
import configJson from "@/assets/config.json"
import SoundService from "./SoundService";


export default class GameClass {
    constructor() {

        this.data = configJson["data"]


        this.sounds = new SoundService(this)
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
        let currentQuestionKey = this.allQuestions.shift();
        this['currentQuestion'] = this.data["QUESTIONS"][currentQuestionKey]

    }
    startGame() {
        this.setQuestion()
        this.sounds.playGreeting()
    }
    checkAnswer(self, answer) {
        self.response = "█"
        console.log("answer is:", answer)
        console.log("current question is:", this.currentQuestion)
        if (answer === this.currentQuestion.text) {
            console.log("bonne reponse")
            this.askNextQuestion()
        }
        console.log("answer is : ", answer)
    }
    repeatQuestion() {
        this.sounds.playCurrentQuestion()
    }
    askNextQuestion() {
        if (this.allQuestions.length < 23) {
            console.log("FINISHED !")
            this.sounds.playWin()
        } else {
            this.setQuestion()
            this.sounds.playNextQuestion()
        }


    }
    getRandomGreetingSound() {
        let key = this.getRandomProperty("GREETINGS")
        console.log("kex :", key)
    }




    playQuestion() {

    }





}