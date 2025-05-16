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
                <label for="playerCount">Enter number of players:</label>
                <input type="number" id="playerCount" min="2" max="4" value="2" />
                <button id="startGameButton">Start Game</button>
            </div>
            <div id="game-container"></div>
            `;
            
        // Querying DOM elements
        const modeContainer = container.querySelector('#modeContainer') as HTMLElement;
        const singleplayerButton = container.querySelector('#singleplayerButton') as HTMLButtonElement;
        const multiplayerButton = container.querySelector('#multiplayerButton') as HTMLButtonElement;
        const gameContainer = container.querySelector('#game-container') as HTMLElement;
        const playerInputModal = container.querySelector('#playerInputModal') as HTMLElement;
        const confirmButton = container.querySelector('#startGameButton') as HTMLButtonElement;
        const playerCountInput = container.querySelector('#playerCount') as HTMLInputElement;
    
        // Singleplayer
        singleplayerButton.addEventListener('click', () => {
            modeContainer.style.display = 'none';
            this.startGame(modeContainer, gameContainer, 1);
        });
    
        // Multiplayer
        multiplayerButton.addEventListener('click', () => {
            modeContainer.style.display = 'none';
            playerInputModal.style.display = 'block';
        });
    
        // Confirm player count and start game
        confirmButton.addEventListener('click', () => {
            const playerCount = parseInt(playerCountInput.value);    
            playerInputModal.style.display = 'none';
            this.startGame(modeContainer, gameContainer, playerCount);
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
