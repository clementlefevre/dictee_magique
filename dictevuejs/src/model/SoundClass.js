export default class SoundClass {
    constructor(category, item_id) {
        this.text = text
        this.filename = category + "/" + name + ".mp3"
        this.audio = this.setAudio(filename)
    }

    setAudio(filename) {

        var audio = new Audio()
        audio.volume = 0.9;
        audio.loop = false;

        // https://stackoverflow.com/a/37228426/3209276
        console.log("playing : " + "@/assets/sounds/" + filename)
        audio.src = require("@/assets/sounds/" + filename);
        return (audio)

    }
}