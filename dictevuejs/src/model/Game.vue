<script>
import json from "../assets/config.json";
//let
export default {
  data() {
    return {
      config: json,
      soundRoot: "../assets/sounds",
    };
  },
  methods: {
    playsound(soundList) {
      function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
      function getPath(sound) {
        return require("../assets/sounds" +
          "/" +
          sound.family +
          "/" +
          sound.name +
          ".mp3");
      }
      var index = 1;

      var audio = new Audio(getPath(soundList[0]));
      audio.play();

      audio.onended = async function () {
        await sleep(500);
        if (index < soundList.length) {
          audio = new Audio(getPath(soundList[index]));

          audio.play();
          index++;
        }
      };
    },
  },
  created() {
    console.log(this.config);
  },
};
</script>