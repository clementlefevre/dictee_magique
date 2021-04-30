const levenshtein = require("js-levenshtein");
import textContent from "@/assets/text/text_content.json";
import SoundService from "./SoundService";

import Prenoms from "@/assets/text/prenoms.json";

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

function getLevelsCount(game) {
  let levels = Object.keys(game.data).filter((x) =>
    x.includes("QUESTIONS_LEVEL_")
  );
  return levels.length;
}

export default class GameClass {
  constructor() {
    this.data = textContent;
    this.levelsCount = getLevelsCount(this);

    this.sounds = new SoundService(this);
    this.setNewGame(0);
  }

  startGame() {
    this.sounds.askForPlayerName();
  }

  setNewGame(level) {
    console.log("coucou");
    this.allQuestions = Object.keys(
      this.data["QUESTIONS_LEVEL_" + level.toString()]
    );
    shuffleArray(this.allQuestions);

    this.status = status;
    this.status.level = level;
    this.showResult = false;
    this.result = "";
    this.playerName = "";
  }

  getPlayerName(inputName) {
    let prenoms = Object.values(Prenoms);

    let nearestName = "";
    let minDistance = 10;
    prenoms.map((x) => {
      let levDist = levenshtein(x.toLowerCase(), inputName.toLowerCase());

      if (levDist < minDistance) {
        minDistance = levDist;
        nearestName = x;
        console.log("found nearest name ", x, levDist);
      }
    });
    console.log(nearestName);
    this.playerName = nearestName;
    this.sounds.addPlayerNameSound(this);
    this.setQuestion();
    this.sounds.playGreeting();
  }

  changeLevel() {
    if (this.status.level < this.levelsCount - 1) {
      this.setNewGame(this.status.level + 1);
    } else {
      this.setNewGame(0);
    }

    this.startGame();
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

  getRandomNumber(max) {
    return Math.floor(Math.random() * max);
  }

  setQuestion() {
    let currentQuestionKey = this.allQuestions.shift();
    this["currentQuestion"] = this.data[
      "QUESTIONS_LEVEL_" + this.status.level.toString()
    ][currentQuestionKey];
    this.status.retry = 0;
    console.log("this.status.level : ", this.status.level);
    console.log("setQuestion - --this.currentQuestion :", this.currentQuestion);
  }

  checkAnswer(self, answer) {
    self.response = "█";

    if (this.playerName == "") {
      this.getPlayerName(answer);
      return;
    }
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
    if (this.allQuestions.length < 1) {
      console.log("FINISHED !");
      this.sounds.playWin();
    } else {
      this.setQuestion();
      this.sounds.playNextQuestion();
    }
  }
}
