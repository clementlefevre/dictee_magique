//import * as playService from "../services/playService"
import configJson from "@/assets/config.json";
import SoundService from "./SoundService";

let status = {
  score: 0,
  level: 0,
  retry: 0,
  username: "test",
};

/* Randomize array in-place using Durstenfeld shuffle algorithm */
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

export default class GameClass {
  constructor() {
    this.data = configJson["data"];
    this.sounds = new SoundService(this);
    this.allQuestions = Object.keys(this.data["QUESTIONS_LEVEL_1"]);
    shuffleArray(this.allQuestions);
    this.status = status;
    this.showResult = false;
    this.result = "";
  }

  getRandomIndex(family) {
    const length = Object.keys(this.data[family]).length;
    const urlSoundIndex = Math.floor(Math.random() * length);
    return urlSoundIndex;
  }

  getRandomProperty(family) {
    var keys = Object.keys(this.data[family]);
    return keys[Math.floor(Math.random() * keys.length)];
  }

  setQuestion() {
    let currentQuestionKey = this.allQuestions.shift();
    this["currentQuestion"] = this.data["QUESTIONS_LEVEL_1"][
      currentQuestionKey
    ];
    this.status.retry = 0;
  }
  startGame() {
    this.setQuestion();
    this.sounds.playGreeting();
  }
  checkAnswer(self, answer) {
    self.response = "█";
    console.log("answer is:", answer);
    console.log("current question is:", this.currentQuestion["text"]);
    if (
      answer ===
      this.currentQuestion.text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    ) {
      this.askNextQuestion();
      this.status.score++;
    } else {
      this.status.retry = this.status.retry + 1;
      this.sounds.playWrongAnswer();
    }
    console.log("answer is : ", answer);
  }
  repeatQuestion() {
    this.sounds.playCurrentQuestion();
  }
  askNextQuestion() {
    console.log(this.allQuestions.length);
    if (this.allQuestions.length < 1) {
      console.log("FINISHED !");
      this.sounds.playWin();
    } else {
      this.setQuestion();
      this.sounds.playNextQuestion();
    }
  }

  getRandomGreetingSound() {
    let key = this.getRandomProperty("GREETINGS");
    console.log("key :", key);
  }

  playQuestion() {}
}
