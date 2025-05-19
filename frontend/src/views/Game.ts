import { Router } from "../core/router";
import { PongGame } from "../game/PongGame.js";
import { NotificationManager } from '../components/Notification.js';

// The GameView class is responsible for rendering the game view and handling user input to start the game
export class GameView {
    // Game instance (initially null) and Router instance, passed through constructor
    private game: PongGame | null = null;
    private router: Router;

    constructor(router: Router) {
        this.router = router;
    }
    
    render(container: HTMLElement) {
        container.innerHTML = `
            <div id="modeContainer">
                <button id="singleplayerButton">Play Against AI</button>
                <button id="multiplayerButton">Multiplayer</button>
            </div>
            <div id="playerInputModal" style="display: none;">
                <div id="playerCountSelection" style="display: none;">
                    <p>Select number of players:</p>
                    <button id="twoPlayerButton">2 Players</button>
                    <button id="fourPlayerButton">4 Players</button>
                </div>
            </div>
            <div id="game-container" style="display: block"></div>
        `;
    
        // Querying DOM elements
        const modeContainer = container.querySelector('#modeContainer') as HTMLElement;
        const singleplayerButton = container.querySelector('#singleplayerButton') as HTMLButtonElement;
        const multiplayerButton = container.querySelector('#multiplayerButton') as HTMLButtonElement;
        const gameContainer = container.querySelector('#game-container') as HTMLElement;
        const playerInputModal = container.querySelector('#playerInputModal') as HTMLElement;
        const playerCountSelection = container.querySelector('#playerCountSelection') as HTMLElement;
        const twoPlayerButton = container.querySelector('#twoPlayerButton') as HTMLButtonElement;
        const fourPlayerButton = container.querySelector('#fourPlayerButton') as HTMLButtonElement;
    
        // Singleplayer
        singleplayerButton.addEventListener('click', () => {
            modeContainer.style.display = 'none';
            this.startGame(modeContainer, gameContainer, 1);
        });
    
        // Multiplayer
        multiplayerButton.addEventListener('click', () => {
            modeContainer.style.display = 'none';
            playerInputModal.style.display = 'block';
            playerCountSelection.style.display = 'block';
        });
    
        // 2-player mode
        twoPlayerButton.addEventListener('click', () => {
            playerInputModal.style.display = 'none';
            this.startGame(modeContainer, gameContainer, 2);
        });
    
        // 4-player mode
        fourPlayerButton.addEventListener('click', () => {
            playerInputModal.style.display = 'none';
            this.startGame(modeContainer, gameContainer, 4);
        });
    }       

    // Starts the Pong game, passing the container and the mode (single player or multiplayer)
    private startGame(modeContainer: HTMLElement, gameContainer: HTMLElement, nrPlayers: number) {
        this.game = new PongGame(gameContainer, (score) => {
            console.log("Game ended with score:", score);
            NotificationManager.show({
                title: 'Game ended',
                message: `The score was: ${score.leftScore} - ${score.rightScore}`,
                type: 'success',
                duration: 3000
            });
            modeContainer.style.display = 'flex';
        });
        this.game.start(nrPlayers);
    }

    // Destroys the game instance if its not null
    destroy() {
        this.game?.destroy();
        this.game = null;
        console.log("Game destroyed");
    }
}
