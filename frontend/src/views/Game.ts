import { Router } from "../core/router";
import { PongGame } from "../game/PongGame.js";
import { SquareGame } from "../game/SquareGame.js";
import { NotificationManager } from '../components/Notification.js';
import { applyTranslations } from './Translate.js';
import { getCurrentUser } from "../services/auth.js";

// The GameView class is responsible for rendering the game view and handling user input to start the game
export class GameView {
    // Game instance (initially null) and Router instance, passed through constructor
    private standardBoard: PongGame | null = null;
    private squareBoard: SquareGame | null = null;
    private router: Router;

    constructor(router: Router) {
        this.router = router;
    }
    
    async render(container: HTMLElement) {
        container.innerHTML = `
            <div id="modeContainer">
                <button id="singleplayerButton" data-i18n="playAgainstAI">Play Against AI</button>
                <button id="multiplayerButton" data-i18n="multiplayer">Multiplayer</button>
            </div>
            <div id="playerInputModal" style="display: none;">
                <div id="playerCountSelection" style="display: none;">
                    <p data-i18n="selectPlayers">Select number of players:</p>
                    <button id="twoPlayerButton" data-i18n="twoPlayers">2 Players</button>
                    <button id="fourPlayerButton" data-i18n="fourPlayers">4 Players</button>
                </div>
            </div>
            <div id="game-container"></div>
        `;
        
        const user = await getCurrentUser();
        if (user) applyTranslations(user.language);
        
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
        modeContainer.style.display = 'none';
        gameContainer.style.display = "block";

        if (nrPlayers === 4) {
            this.squareBoard = new SquareGame(gameContainer, (score) => {
                console.log("4-player game ended with score:", score);
                NotificationManager.show({
                    title: '4-player game ended',
                    message: `Score: ${score.leftScore} - ${score.rightScore} - ${score.topScore} - ${score.bottomScore}`,
                    type: 'success',
                    duration: 3000
                });
				modeContainer.style.display = 'flex';
            });
            this.squareBoard.start();
        } else {
            this.standardBoard = new PongGame(gameContainer, (score) => {
                console.log("Game ended with score:", score);
                NotificationManager.show({
                    title: 'Game ended',
                    message: `The score was: ${score.leftScore} - ${score.rightScore}`,
                    type: 'success',
                    duration: 3000
                });
                modeContainer.style.display = 'flex';
            });
            this.standardBoard.start(nrPlayers);
        }
    }

    // Destroys the game instance if its not null
    destroy() {
        if (this.standardBoard) {
            this.standardBoard.destroy();
            this.standardBoard = null;
            console.log("Game destroyed");
        }
		if (this.squareBoard) {
            this.squareBoard.destroy();
            this.squareBoard = null;
            console.log("Game destroyed");
        }
    }
}
