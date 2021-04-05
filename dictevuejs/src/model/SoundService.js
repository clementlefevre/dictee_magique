import { Howl } from "howler";

export default class SoundService {
  constructor(gameClass) {
    this.initSoundUrls(gameClass);
    this.game = gameClass;
  }

  addAlphabetSounds(gameClass) {
    let allLetters = "abcdefghijklmnopqrstuvwxyz".split("");
    gameClass.data["ALPHABET"] = {};
    console.log("gameClass.data : ", gameClass.data);

    allLetters.forEach((letter) => {
      gameClass.data["ALPHABET"][letter] = {
        text: letter,
        url: "ALPHABET" + "/" + letter,
      };
    });
  }

  initSoundUrls(gameClass) {
    const configGame = gameClass["data"];
    Object.keys(configGame).forEach((category) => {
      Object.keys(configGame[category]).forEach((item) => {
        let text_content = configGame[category][item];

        configGame[category][item] = {
          text: text_content,
          url: category + "/" + item,
        };
      });
    });
    this.addAlphabetSounds(gameClass);
  }

  playList(soundList) {
    let gamos = this.game;

    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function play_audio(file_names) {
      if (gamos.showResult && file_names[0].url.includes("ALPHABET/")) {
        gamos.result = gamos.result + file_names[0].text;
      }
      if (gamos.showResult && file_names[0].url.includes("INTRO/")) {
        await sleep(5000);
        gamos.result = "";
        gamos.showResult = false;
      }

      let sound = new Howl({
        src: [require("@/assets/sounds/" + file_names[0].url + ".mp3")],
        volume: 1,
        onend: async function() {
          file_names.shift();
          if (file_names.length > 0) {
            play_audio(file_names);
          }
        },
      });
      sound.play();
    }
    play_audio(soundList);
  }

  playLetter(letter) {
    this.playList([
      { text: "click", url: "SOUNDS/s_3" },
      { text: letter, url: "ALPHABET/" + letter },
    ]);
  }

  setSound(category) {
    let item = this.game.getRandomProperty(category);
    return this.game.data[category][item];
  }

  playGreeting() {
    let sound1 = this.setSound("GREETINGS");
    let sound2 = this.setSound("INTRO");
    let sound3 = this.game["currentQuestion"];
    let sounds = [sound1, sound2, sound3];
    this.playList(sounds);
  }

  playCurrentQuestion() {
    this.playList(this.game.currentQuestion["sounds"]);
  }

  playNextQuestion() {
    let soundBeepOk = { text: "beepOK", url: "SOUNDS/s_1" };
    let soundOK = this.setSound("ANSWERS_OK");
    let soundIntro = this.setSound("INTRO");
    let soundQuestion = this.game["currentQuestion"];
    let sounds = [soundBeepOk, soundOK, soundIntro, soundQuestion];
    this.game.currentQuestion["sounds"] = sounds;
    this.playList(sounds);
  }

  playWin() {
    let soundWin = this.setSound("SCORE_INFOS_2");
    this.playList([soundWin]);
  }

  async playWrongAnswer() {
    let soundBeepNOK = { text: "beepOK", url: "SOUNDS/s_2" };
    let soundWrong = this.setSound("ANSWERS_NOK");

    if (this.game.status.retry == 1) {
      let soundCorrectAnswer = this.playCorrectAnswer();
      let soundQuestionText = this.game["currentQuestion"];

      this.game.setQuestion();

      let lista = [
        ...[soundBeepNOK, soundWrong],
        ...soundCorrectAnswer,
        ...[
          soundQuestionText,
          this.setSound("INTRO"),
          this.game["currentQuestion"],
        ],
      ];
      this.playList(lista);
    } else {
      this.playList([
        soundBeepNOK,
        soundWrong,
        this.setSound("INTRO"),
        this.game["currentQuestion"],
      ]);
    }
  }

  playCorrectAnswer() {
    this.game.showResult = true;
    let sounds = [
      this.game.data["ANSWER_EXPLANATION"]["answer_1"],
      this.game["currentQuestion"],
    ];
    sounds.push(this.game.data["ANSWER_EXPLANATION"]["answer_2"]);
    let spelling_letters = this.getCorrectSpelling();
    spelling_letters.forEach((item) => sounds.push(item));

    return sounds;
  }

  getCorrectSpelling() {
    let sound_correct_spelling = this.game["currentQuestion"].text.split("");
    let sound_list = [];
    sound_correct_spelling.map((x) => {
      sound_list.push({ text: x, url: "ALPHABET/" + x });
    });

    return sound_list;
  }
}
