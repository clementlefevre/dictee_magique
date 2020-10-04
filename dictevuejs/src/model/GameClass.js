import * as playService from "../services/playService"
import configJson from "../assets/config.json"

export default class GameClass {
    constructor() {
        this.config = configJson
        this.allQuestions = Object.keys(this.config.data['QUESTIONS']);

        this.allSoundsUrls = playService.getSoundsUrls(this);
    }

    playGreeting() {
        console.log(this.allSoundsUrls)
    }


}