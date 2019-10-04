const TextInput = require('../PIXI.TextInput')


export function getInput() {
    const input = new TextInput({
        input: {
            fontFamily: 'VT323',
            fontSize: '48px',
            padding: '0px',
            width: '500px',
            color: 'transparent',
            outline: 'none'
        },
        box: {
            default: { fill: 'black', rounded: 12, stroke: { color: 'black', width: 0 } },
            focused: { fill: 'black', rounded: 12, stroke: { color: 'black', width: 0 } },
            disabled: { fill: 'black', rounded: 12 }
        }
    })
    input.placeholder = '';
    input.setInputStyle('color', "transparent");

   

    //input.pivot.x = 0;//input.width
    //input.pivot.y = input.height / 2
    input.restrict = ">abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ▌";
    input.maxLength = 20;
    input.text = ">";

    return input;
}



