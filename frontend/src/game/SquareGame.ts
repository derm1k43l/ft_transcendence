import { getUserGameSettings } from '../services/UserService.js';
import { currentUser } from '../main.js';

const WIN_CONDITION = 5;
const BASE_SPEED = 200;
const CENTER_X = 400;
const CENTER_Y = 400;
const PADDLE_SPEED = 500;
const PADDLE_HEIGHT = 95;
const PADDLE_WIDTH = 95;
const HALF_PADDLE_HEIGHT = PADDLE_HEIGHT / 2;
const HALF_PADDLE_WIDTH = PADDLE_WIDTH / 2;
const BOARD_HEIGHT = 800;
const BOARD_WIDTH = 800;

export class SquareGame {
    // DOM elements used in the game
    private container: HTMLElement;
    private ball: HTMLElement;
    private paddleLeft: HTMLElement;
    private paddleRight: HTMLElement;
    private paddleTop: HTMLElement;
    private paddleBottom: HTMLElement;
    private scoreDisplay: HTMLElement;
    private leftScoreElement: HTMLElement;
    private rightScoreElement: HTMLElement;
    private topScoreElement: HTMLElement;
    private bottomScoreElement: HTMLElement;

    // Ball position and speed
    private ballX = CENTER_X;
    private ballY = CENTER_Y;
    private ballSpeedX = BASE_SPEED;
    private ballSpeedY = BASE_SPEED;
    private paddleSpeed: number = PADDLE_SPEED;

    // Paddle positions and scores
    private leftPaddleY = CENTER_Y;
    private rightPaddleY = CENTER_Y;
    private topPaddleX = CENTER_X;
    private bottomPaddleX = CENTER_X;
    private leftScore = WIN_CONDITION;
    private rightScore = WIN_CONDITION;
    private topScore = WIN_CONDITION;
    private bottomScore = WIN_CONDITION;
    private leftRScore = 1;
    private rightRScore = 1;
    private topRScore = 1;
    private bottomRScore = 1;

    // Game mode and key tracking
    private playersRemaining = 4;
    private keyState: Record<string, boolean> = {};
    private intervalId: number | null = null;

    private gameSettings: { ball_color: string; paddle_color: string; score_color: string; board_color: string } | undefined;
    private onGameEnd: ((score: { leftScore: number; rightScore: number; topScore: number; bottomScore: number }) => void) | null = null;

    // Add a property to track the last update time
    private lastUpdateTime: number | null = null;

    constructor(container: HTMLElement, onGameEnd?: (score: { leftScore: number; rightScore: number; topScore: number; bottomScore: number }) => void) {
        this.container = container;
        if (onGameEnd)
            this.onGameEnd = onGameEnd;
        this.container.innerHTML = this.getTemplate();

        // Get references to the game elements
        this.ball = this.container.querySelector('.ball')!;
        this.paddleLeft = this.container.querySelector('.paddle__left')!;
        this.paddleRight = this.container.querySelector('.paddle__right')!;
        this.paddleTop = this.container.querySelector('.paddle__top')!;
        this.paddleBottom = this.container.querySelector('.paddle__bottom')!;
        this.scoreDisplay = this.container.querySelector('.score')!;
        this.leftScoreElement = this.container.querySelector('#leftScore')!;
        this.rightScoreElement = this.container.querySelector('#rightScore')!;
        this.topScoreElement = this.container.querySelector('#topScore')!;
        this.bottomScoreElement = this.container.querySelector('#bottomScore')!;
        const gameContainer = this.container.querySelector('.game__container') as HTMLElement;

        gameContainer.style.width = '800px';
        gameContainer.style.height = '800px';
        this.scoreDisplay.style.width = '800px';
        this.scoreDisplay.style.margin = '0 auto';

        // Apply settings from gameSettings
        getUserGameSettings(currentUser?.id || 1).then(settings => {
            if (settings) {
                this.gameSettings = settings;
                this.ball.style.backgroundColor = settings.ball_color;
                this.paddleLeft.style.backgroundColor = settings.paddle_color;
                this.paddleRight.style.backgroundColor = settings.paddle_color;
                this.paddleTop.style.backgroundColor = settings.paddle_color;
                this.paddleBottom.style.backgroundColor = settings.paddle_color;
                this.leftScoreElement.style.color = settings.score_color;
                this.rightScoreElement.style.color = settings.score_color;
                this.topScoreElement.style.color = settings.score_color;
                this.bottomScoreElement.style.color = settings.score_color;
                gameContainer.style.backgroundColor = settings.board_color;
            }
        }).catch(error => {
            console.error('Failed to load game settings:', error);
        });

        // Listen for key press and release events
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }

    // Start the game loop
    start() {
        // update player names in html
        const player1Element = this.container.querySelector('#player1') as HTMLElement;
        const player2Element = this.container.querySelector('#player2') as HTMLElement;
        const player3Element = this.container.querySelector('#player3') as HTMLElement;
        const player4Element = this.container.querySelector('#player4') as HTMLElement;

        player1Element.textContent = 'left';
        player2Element.textContent = 'right';
        player3Element.textContent = 'top';
        player4Element.textContent = 'bottom';

        this.intervalId = window.setInterval(() => this.updateGame(), 1);
    }

    // Stop the game and clean up
    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        this.container.innerHTML = '';
    }

    // Track when a key is pressed/released
    private onKeyDown = (e: KeyboardEvent) => this.keyState[e.key] = true;
    private onKeyUp = (e: KeyboardEvent) => this.keyState[e.key] = false;

    private solidWalls: { [key in 'left' | 'right' | 'top' | 'bottom']: boolean } = {
        left: false,
        right: false,
        top: false,
        bottom: false,
    };

    private eliminatePlayer(side: 'left' | 'right' | 'top' | 'bottom') {
        switch (side) {
            case 'left':
                this.paddleLeft.style.display = 'none';
                this.leftScore = 0;
                this.leftRScore = this.playersRemaining;
                break;
            case 'right':
                this.paddleRight.style.display = 'none';
                this.rightScore = 0;
                this.rightRScore = this.playersRemaining;
                break;
            case 'top':
                this.paddleTop.style.display = 'none';
                this.topScore = 0;
                this.topRScore = this.playersRemaining;
                break;
            case 'bottom':
                this.paddleBottom.style.display = 'none';
                this.bottomScore = 0;
                this.bottomRScore = this.playersRemaining;
                break;
        }
        // make that wall solid by inverting ball direction on collision
        this.solidWalls[side] = true;
        this.playersRemaining--;
    }

    // Main game loop: update positions, handle collisions, and refresh UI
    private updateGame() {
        const currentTime = performance.now();
        const deltaTime = this.lastUpdateTime ? (currentTime - this.lastUpdateTime) / 1000 : 0; // Convert to seconds
        this.lastUpdateTime = currentTime;

        // Move the ball
        this.ballX += this.ballSpeedX * deltaTime;
        this.ballY += this.ballSpeedY * deltaTime;

        // Handle paddle collisions
        this.handlePaddleCollisions();

        // Check if any player scores
        this.checkScoring();

        // Check for game end condition
        if (this.leftScore === 0 && this.paddleLeft.style.display !== 'none') {
            this.eliminatePlayer('left');
        } else if (this.rightScore === 0 && this.paddleRight.style.display !== 'none') {
            this.eliminatePlayer('right');
        } else if (this.topScore === 0 && this.paddleTop.style.display !== 'none') {
            this.eliminatePlayer('top');
        } else if (this.bottomScore === 0 && this.paddleBottom.style.display !== 'none') {
            this.eliminatePlayer('bottom');
        }

        if (this.playersRemaining === 1)
            this.handleGameEnd();

        // Handle paddle movement
        this.handlePaddleMovement(deltaTime);

        // Update visual positions
        this.updateUI();
    }

    // Handle collision between ball and paddles
    private handlePaddleCollisions() {
        // Left paddle collision
        if (this.ballX <= 26 &&
            this.ballY >= this.leftPaddleY - HALF_PADDLE_HEIGHT - 9 &&
            this.ballY <= this.leftPaddleY + HALF_PADDLE_HEIGHT + 9 &&
            this.ballSpeedX < 0
        ) {
            if (this.paddleLeft.style.display == 'none')
                return ;
            this.ballSpeedX *= -1;
            this.ballX = 26;
            this.accelerateBall();
        }

        // Right paddle collision
        if (this.ballX >= BOARD_WIDTH - 26 && 
            this.ballY >= this.rightPaddleY - HALF_PADDLE_HEIGHT - 9 &&
            this.ballY <= this.rightPaddleY + HALF_PADDLE_HEIGHT + 9 &&
            this.ballSpeedX > 0
        ) {
            if (this.paddleRight.style.display == 'none')
                return ;
            this.ballSpeedX *= -1;
            this.ballX = BOARD_WIDTH - 26;
            this.accelerateBall();
        }

        // Top paddle collision
        if (this.ballY <= 26 &&
            this.ballX >= this.topPaddleX - HALF_PADDLE_WIDTH - 9 &&
            this.ballX <= this.topPaddleX + HALF_PADDLE_WIDTH + 9 &&
            this.ballSpeedY < 0
        ) {
            if (this.paddleTop.style.display == 'none')
                return ;
            this.ballSpeedY *= -1;
            this.ballY = 26;
            this.accelerateBall();
        }

        // Bottom paddle collision
        if (this.ballY >= BOARD_HEIGHT - 26 && 
            this.ballX >= this.bottomPaddleX - HALF_PADDLE_WIDTH - 9 &&
            this.ballX <= this.bottomPaddleX + HALF_PADDLE_WIDTH + 9 &&
            this.ballSpeedY > 0
        ) {
            if (this.paddleBottom.style.display == 'none')
                return ;
            this.ballSpeedY *= -1;
            this.ballY = BOARD_HEIGHT - 26;
            this.accelerateBall();
        }
    }

    // Increase ball speed after each paddle collision, slightly changing angle by random
    private accelerateBall() {
        this.ballSpeedX += Math.sign(this.ballSpeedX) * (BASE_SPEED / 4 * Math.random());
        this.ballSpeedY += Math.sign(this.ballSpeedY) * (BASE_SPEED / 4 * Math.random());
    }
    
    // Check if any player scores
    private checkScoring() {
        // Ball hits left wall
        if (this.ballX <= 9) {
            if (this.solidWalls.left) {
                this.ballSpeedX *= -1;
                this.ballX = 9;
				this.accelerateBall();
            } else {
                this.leftScore--;
                this.resetBall();
            }
        }

        // Ball hits right wall
        if (this.ballX >= BOARD_WIDTH - 9) {
            if (this.solidWalls.right) {
                this.ballSpeedX *= -1;
                this.ballX = BOARD_WIDTH - 9;
				this.accelerateBall();
            } else {
                this.rightScore--;
                this.resetBall();
            }
        }

        // Ball hits top wall
        if (this.ballY <= 9) {
            if (this.solidWalls.top) {
                this.ballSpeedY *= -1;
                this.ballY = 9;
				this.accelerateBall();
            } else {
                this.topScore--;
                this.resetBall();
            }
        }

        // Ball hits bottom wall
        if (this.ballY >= BOARD_HEIGHT - 9) {
            if (this.solidWalls.bottom) {
                this.ballSpeedY *= -1;
                this.ballY = BOARD_HEIGHT - 9;
				this.accelerateBall();
            } else {
                this.bottomScore--;
                this.resetBall();
            }
        }

    }

    // Handle game end
    private handleGameEnd() {
        if (this.onGameEnd) {
            this.onGameEnd({ 
                leftScore: this.leftRScore,
                rightScore: this.rightRScore,
                topScore: this.topRScore,
                bottomScore: this.bottomRScore
            });
        } 
        this.destroy();
    }

    // Handle paddle movement based on key presses
    private handlePaddleMovement(deltaTime: number) {
        const paddleSpeed = this.paddleSpeed * deltaTime;

        if (this.keyState['w']) 
            this.leftPaddleY = Math.max(this.leftPaddleY - paddleSpeed, 0 + HALF_PADDLE_HEIGHT + 5);
        if (this.keyState['s']) 
            this.leftPaddleY = Math.min(this.leftPaddleY + paddleSpeed, BOARD_HEIGHT - HALF_PADDLE_HEIGHT - 5);

        if (this.keyState['ArrowUp']) 
            this.rightPaddleY = Math.max(this.rightPaddleY - paddleSpeed, 0 + HALF_PADDLE_HEIGHT + 5);
        if (this.keyState['ArrowDown']) 
            this.rightPaddleY = Math.min(this.rightPaddleY + paddleSpeed, BOARD_HEIGHT - HALF_PADDLE_HEIGHT - 5);

        if (this.keyState['h']) 
            this.topPaddleX = Math.max(this.topPaddleX - paddleSpeed, 0 + HALF_PADDLE_WIDTH + 5);
        if (this.keyState['j']) 
            this.topPaddleX = Math.min(this.topPaddleX + paddleSpeed, BOARD_WIDTH - HALF_PADDLE_WIDTH - 5);

        if (this.keyState['1']) 
            this.bottomPaddleX = Math.max(this.bottomPaddleX - paddleSpeed, 0 + HALF_PADDLE_WIDTH + 5);
        if (this.keyState['2']) 
            this.bottomPaddleX = Math.min(this.bottomPaddleX + paddleSpeed, BOARD_WIDTH - HALF_PADDLE_WIDTH - 5);
    }

    // Reset ball to center and reverse direction after scoring
    private resetBall() {
        this.ballX = CENTER_X;
        this.ballY = CENTER_Y;

        // Randomize ball direction
        const angle = Math.random() * Math.PI * 2; // Random angle between 0 and 2π
        this.ballSpeedX = Math.cos(angle) * BASE_SPEED;
        this.ballSpeedY = Math.sin(angle) * BASE_SPEED;

        this.paddleSpeed = PADDLE_SPEED;
    }

    // Update DOM elements to reflect current game state
    private updateUI() {
        this.ball.style.left = `${this.ballX}px`;
        this.ball.style.top = `${this.ballY}px`;

        this.paddleLeft.style.top = `${this.leftPaddleY}px`;
        this.paddleRight.style.top = `${this.rightPaddleY}px`;
        this.paddleTop.style.left = `${this.topPaddleX}px`;
        this.paddleBottom.style.left = `${this.bottomPaddleX}px`;

        this.leftScoreElement.textContent = `${this.leftScore}`;
        this.rightScoreElement.textContent = `${this.rightScore}`;
        this.topScoreElement.textContent = `${this.topScore}`;
        this.bottomScoreElement.textContent = `${this.bottomScore}`;
    }

    // Return the HTML layout for the game
    private getTemplate(): string {
        return `
        <div class="score">
            <div class="score__left">
                <span id="player1">Left</span><span id="leftScore">0</span>
            </div>
            <div class="score__right">
                <span id="player2">Right</span><span id="rightScore">0</span>
            </div>
            <div class="score__top">
                <span id="player3">Top</span><span id="topScore">0</span>
            </div>
            <div class="score__bottom">
                <span id="player4">Bottom</span><span id="bottomScore">0</span>
            </div>
        </div>
        <div class="game__container">
            <div class="ball"></div>
            <div class="paddle paddle__left"></div>
            <div class="paddle paddle__right"></div>
            <div class="paddle paddle__top"></div>
            <div class="paddle paddle__bottom"></div>
        </div>
        `;
    }
}
