<script>
import Game from "./GameClass";
//let
export default {
  data() {
    return {
      soundRoot: "../assets/sounds",
      game: new Game(),
    };
  },
  methods: {
    playList(soundList) {
      var audio = new Audio(),
        i = 0;
      /*  var playlist = new Array(
        "http://www.w3schools.com/htmL/horse.mp3",
        "http://demos.w3avenue.com/html5-unleashed-tips-tricks-and-techniques/demo-audio.mp3",
        "http://www.w3schools.com/htmL/horse.mp3"
      ); */

      audio.addEventListener(
        "ended",
        function () {
          i = ++i < soundList.length ? i : 0;
          console.log(i);
          audio.src = soundList[i];
          audio.play();
        },
        true
      );
      audio.volume = 0.9;
      audio.loop = false;
      audio.src = soundList[0];
      audio.play();
    },
  },

  created() {
    console.log("this.game.config :", this.game.playGreeting());
  },
};
</script>