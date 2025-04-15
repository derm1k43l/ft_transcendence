// import { PongGame } from "../game/PongGame.js"; in this dir the game logic
import { Router } from "../core/router";

export class GameView {
    render(element: HTMLElement) {
        element.innerHTML = `<h2>Pong Game</h2><p>User details...</p>`;
    }

    destroy() {
        console.log('GameView destroyed');
    }
}