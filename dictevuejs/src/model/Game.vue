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
  methods: {},

  created() {
    console.log("this.game.config :");
  },
};
</script>