import { Router } from "../core/router";
import { PongGame } from "../game/PongGame.js";
import { PongGame2 } from "../game/PongGame2.js";
import { NotificationManager } from '../components/Notification.js';

// The GameView class is responsible for rendering the game view and handling user input to start the game
export class GameView {
    // Game instance (initially null) and Router instance, passed through constructor
    private board1: PongGame | null = null;
    private board2: PongGame2 | null = null;
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
            <div id="game-container">
                <div id="board1" class="game-board" style="display: none;"></div>
                <div id="board2" class="game-board" style="display: none; margin-top: 20px;"></div>
            </div>
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
        modeContainer.style.display = 'none';
        const gameContainer1 = document.getElementById('board1')!;
        const gameContainer2 = document.getElementById('board2')!;
        
        if (nrPlayers === 4) {
            gameContainer1.style.display = "block";
            gameContainer2.style.display = "block";
            gameContainer.style.display = "block"; // Outer wrapper
        } else {
            gameContainer1.style.display = "none";
            gameContainer2.style.display = "none";
            gameContainer.style.display = "block"; // still needed for 1 or 2 player
        }
    
        if (nrPlayers === 4) {
            let gameFinished = 0;
            this.board1 = new PongGame(gameContainer1, (score) => {
                console.log("Game 1 ended:", score);
                NotificationManager.show({
                    title: 'Game 1 ended',
                    message: `Score: ${score.leftScore} - ${score.rightScore}`,
                    type: 'info',
                    duration: 3000
                });
                gameFinished++;
                if(gameFinished === 2)
                    modeContainer.style.display = 'flex';
            });
            
            this.board2 = new PongGame2(gameContainer2, (score) => {
                console.log("Game 2 ended:", score);
                NotificationManager.show({
                    title: 'Game 2 ended',
                    message: `Score: ${score.leftScore} - ${score.rightScore}`,
                    type: 'info',
                    duration: 3000
                });
                gameFinished++;
                if(gameFinished === 2)
                    modeContainer.style.display = 'flex';
            });
            
            this.board1.start(2); // Each game still uses 2 players
            this.board2.start(2);
        } else {
            this.board1 = new PongGame(gameContainer, (score) => {
                console.log("Game ended with score:", score);
                NotificationManager.show({
                    title: 'Game ended',
                    message: `The score was: ${score.leftScore} - ${score.rightScore}`,
                    type: 'success',
                    duration: 3000
                });
                modeContainer.style.display = 'flex';
            });
    
            this.board1.start(nrPlayers);
        }
    }

    // Destroys the game instance if its not null
    destroy() {
        if (this.board1) {
            this.board1.destroy();
            this.board1 = null;
            console.log("Game 1 destroyed");
        }
    
        if (this.board2) {
            this.board2.destroy();
            this.board2 = null;
            console.log("Game 2 destroyed");
        }
    }    
}
