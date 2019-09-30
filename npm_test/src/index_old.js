import { Application } from 'pixi.js'

import {  testFunction } from './service.js';

const app = new Application({
    width: 100,
    height: 100
})




document.body.appendChild(app.view)

testFunction();
