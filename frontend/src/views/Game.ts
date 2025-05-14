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
    
    // The render method creates the HTML structure for the game mode selection and renders it to the provided container
    render(container: HTMLElement) {
        container.innerHTML = `
            <div id="modeContainer">
                <button id="singleplayerButton">Play Against AI</button>
                <button id="multiplayerKeyboardButton">Local 2-Player</button>
                <button id="multiplayerRemoteButton">Remote Play</button>
            </div>
            <div id="game-container"></div>
        `;

        // Querying DOM elements for buttons and game container
        const modeContainer = container.querySelector('#modeContainer') as HTMLElement;
        const singleplayerButton = container.querySelector('#singleplayerButton') as HTMLButtonElement;
        const multiplayerKeyboardButton = container.querySelector('#multiplayerKeyboardButton') as HTMLButtonElement;
        const multiplayerRemoteButton = container.querySelector('#multiplayerRemoteButton') as HTMLButtonElement;
        const gameContainer = container.querySelector('#game-container') as HTMLElement;

        // Event listener for single-player and multiplayer mode button
        singleplayerButton.addEventListener('click', () => {
            modeContainer.style.display = 'none';
            this.startGame(modeContainer, gameContainer, true);
        });

        multiplayerKeyboardButton.addEventListener('click', () => {
            modeContainer.style.display = 'none';
            this.startGame(modeContainer, gameContainer, false);
        });

        multiplayerRemoteButton.addEventListener('click', () => {
            modeContainer.style.display = 'none';
            this.router.navigate('/friends');
        });
    }

    // Starts the Pong game, passing the container and the mode (single player or multiplayer)
    private startGame(modeContainer: HTMLElement, gameContainer: HTMLElement, isSinglePlayer: boolean) {
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
        this.game.start(isSinglePlayer);
    }

    // Destroys the game instance if its not null
    destroy() {
        this.game?.destroy();
        this.game = null;
        console.log("Game destroyed");
    }
}
