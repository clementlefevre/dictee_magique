<template>
  <div id="app" class="container-fluid pt-3 pr-3 pl-3" style="height: 80%">
    <div
      v-if="showBootText"
      style="
        white-space: pre;
        font-size: 18px;
        border-style: solid;
        border-width: 0.5px;
        padding: 2%;
        margin: 100px;
        border-color: #0f0;
        text-align: center;
      "
      class="intro"
    >
      {{ ibm }}
    </div>
    <input
      v-if="showStart"
      class="intro"
      ref="start"
      v-on:keypress.enter="startGame"
      value="START"
    />

    <vue-typed-js
      v-if="showBootText"
      class="intro"
      :showCursor="false"
      style="white-space: pre-line; font-size: 18px"
      :strings="[
        '4096 KB OK ^2000\n `C>PATH C:\\C:\\DOS;` ^3000\n `C>KEYB US 437 C:\\DOS\\KEYBOARD.SYS` ^3000\n `IBM Personal Computer DOS Version 3.30` ^3000\n\n ` `',
      ]"
      @onStart="playBoot()"
      ><div class="typing"></div>
    </vue-typed-js>

    <div class="row" style="margin-left: 100px" v-if="showInput">
      <span style="color: #0f0"> C:\></span>
      <span>
        <input
          type="text"
          id="inputText"
          class="intro"
          style="
            white-space: pre-line;
            font-size: 18px;
            padding: 0px;
            margin: 0px;
          "
          @input="addBar($event)"
          v-model="response"
          v-on:keypress="isLetter($event)"
          v-on:keyup.backspace="test"
          ref="ta"
          spellcheck="false"
        />
      </span>
    </div>
  </div>
</template>

<script>
import Game from "./model/Game";

const restrictions = ">abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ▌";

export default {
  name: "App",
  data: function () {
    return {
      introText: "",
      ibm:
        "██╗██████╗ ███╗   ███╗\n ██║██╔══██╗████╗ ████║\n ██║██████╔╝██╔████╔██║\n ██║██╔══██╗██║╚██╔╝██║\n ██║██████╔╝██║ ╚═╝ ██║\n  ╚═╝╚═════╝ ╚═╝     ╚═╝",
      response: "█",
      lastKey: "",
      status: "",
      textarea: null,
      cursorPosition: 0,
      showStart: true,
      showInput: false,
      showBootText: false,
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
      console.log("startGame");
      this.playBoot();
      //this.openFullscreen();
      this.showBootText = true;
      this.showStart = false;
    },
    playBoot() {
      console.log("playBoot");
      var audio = new Audio(require("@/assets/sounds/ALPHABET/x.mp3"));
      audio.play();
      audio.addEventListener("ended", this.handleEnded);
    },
    handleEnded() {
      console.log("handleEnded");
      this.showInput = true;
      this.$nextTick(() => this.$refs.ta.focus());
      this.game.playGreeting();
    },

    addBar: function () {
      this.response = this.response.replace("█", "").concat("█").toUpperCase();
    },
    test: function () {
      this.response = this.response.slice(0, -2).concat("█");
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

  color: #2c3e50;
  margin-top: 60px;
  margin-left: 100px;
  background-color: black;
}
.intro {
  font-family: "Px437", sans-serif !important;
  font-size: 18px;
  color: #0f0;
  background-color: black;
  caret-color: black;
  border-width: 0px;
  border-color: black;
  text-align: left;

  margin-top: 60px;
  margin-left: 100px;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
}
</style>
