import { Router } from "../core/router";
import { PongGame } from "../game/PongGame.js";

export class GameView {
    private game: PongGame | null = null;
    private router: Router;

    constructor(router: Router) {
        this.router = router;
    }

    render(container: HTMLElement) {
        container.innerHTML = `
            <div id="modeContainer">
                <button id="singleplayerButton">Single Player</button>
                <button id="multiplayerButton">Multiplayer</button>
            </div>
            <div id="game-container"></div>
        `;

        const modeContainer = container.querySelector('#modeContainer') as HTMLElement;
        const singleplayerButton = container.querySelector('#singleplayerButton') as HTMLButtonElement;
        const multiplayerButton = container.querySelector('#multiplayerButton') as HTMLButtonElement;
        const gameContainer = container.querySelector('#game-container') as HTMLElement;

        singleplayerButton.addEventListener('click', () => {
            modeContainer.style.display = 'none';
            this.startGame(gameContainer, true);
        });

        multiplayerButton.addEventListener('click', () => {
            modeContainer.style.display = 'none';
            this.startGame(gameContainer, false);
        });
    }

    private startGame(container: HTMLElement, isSinglePlayer: boolean) {
        this.game = new PongGame(container);
        this.game.start(isSinglePlayer);
    }

    destroy() {
        this.game?.destroy();
        this.game = null;
        console.log("Game destroyed");
    }
}
