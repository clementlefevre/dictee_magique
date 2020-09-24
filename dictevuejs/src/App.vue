<template>
  <div id="app">
    <input
      v-if="start"
      type="text"
      id="inputText"
      @input="addBar($event)"
      v-model="response"
      v-on:keypress="isLetter($event)"
      v-on:keyup.backspace="test"
      ref="ta"
      spellcheck="false"
    />

    <input
      v-if="!start"
      v-on:keypress.enter="startGame"
      value="PRESS ENTER TO PLAY"
      ref="start"
    />
    {{ lastKey }}
    <p>STATUS : {{ response }}</p>
    <p>STATUS : {{ cursorPosition }}</p>
  </div>
</template>

<script>
import Game from "./model/Game";

const restrictions = ">abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ▌";

export default {
  name: "App",
  data: function () {
    return {
      start: false,
      response: "",
      lastKey: "",
      status: "",
      textarea: null,
      cursorPosition: 0,
    };
  },
  mixins: [Game],

  components: {},

  watch: {
    result: function () {},
  },
  computed: {},
  methods: {
    openFullscreen() {
      var elem = document.getElementById("app");
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        /* Firefox */
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        /* IE/Edge */
        elem.msRequestFullscreen();
      }
    },
    startGame: function () {
      this.openFullscreen();
      var audio = new Audio(require("./assets/sounds/GREETINGS/bonjour_1.mp3"));
      audio.play();
      this.start = true;
      this.$nextTick(() => {
        this.$refs.ta.focus();
      });
    },
    addBar: function () {
      this.response = this.response.replace("▌", "").concat("▌");
    },
    test: function () {
      this.response = this.response.slice(0, -2).concat("▌");
    },
    isLetter: function (e) {
      console.log("typed :", e.keyCode);
      if (e.keyCode == 13) {
        console.log("pressed enter");
        console.log("response", this.response);
        return;
      }
      let char = String.fromCharCode(e.keyCode); // Get the character

      if (restrictions.includes(char) | (e.keyCode == 8)) {
        e.keyCode != 8
          ? this.playsound([{ family: "ALPHABET", name: char }])
          : null;
        return true;
      } else e.preventDefault(); // If not match, don't add to input text
    },
  },
  created() {
    /* When the openFullscreen() function is executed, open the video in fullscreen.
Note that we must include prefixes for different browsers, as they don't support the requestFullscreen method yet */

    this.$nextTick(() => {
      this.$refs.start.focus();
    });
  },
  mounted() {},
};
</script>

<style>
@font-face {
  font-family: "Px437";
  src: local("Px437"), url(./assets/fonts/Px437_IBM_VGA8.ttf) format("truetype");
}

html,
body {
  width: 100%;
  height: 100%;
}
body {
  background-color: black;
  width: 100%;
  height: 100%;
  background-attachment: fixed;
}

#app {
  font-family: "Px437", sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  background-color: black;
}
input {
  font-family: "Px437", sans-serif !important;
  font-size: 200px;
  color: #0f0;
  background-color: black;
  caret-color: black;
  border-width: 0px;
  border-color: black;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
}
.blink {
  width: 200px;
  height: 50px;
  background-color: magenta;
  padding: 15px;
  text-align: center;
  line-height: 50px;
}
span {
  font-size: 25px;
  font-family: cursive;
  color: white;
  animation: blink 1s linear infinite;
}
@keyframes blink {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>
