
import SoundClass from "./SoundClass";
export default class SoundService {
    constructor() {
        this.extraSounds = {}
        this.initSoundUrls()
    }

    addAlphabetSounds(gameClass) {

        let allLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
        const key = 'ALPHABET'

        allLetters.forEach((x) => {
            gameClass.data[key][x] = { text: x, url: key + "/" + x }
        })
    }


    initTextSounds(gameClass) {
        Object.keys(gameClass.config).forEach((category) => {
            Object.keys(config[category]).forEach((item) => {
                let text_content = this.data[category][item]
                this.data[category][item] = { text: text_content, url: key + "/" + item }
                console.log("coucou")

            });

        });
        this.addAlphabetSound(gameClass)

    }
}