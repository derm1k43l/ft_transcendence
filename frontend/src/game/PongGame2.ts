import { getUserGameSettings } from '../services/UserService.js';
import { currentUser } from '../main.js';
import { MatchRecord } from '../types/index.js';
import { addMatchRecord } from '../services/UserService.js';

const WIN_CONDITION = 5;
const BASE_SPEED = 200;
const CENTER_X = 475;
const CENTER_Y = 295;
const PADDLE_SPEED = 500;
const PADDLE_HEIGHT = 95;
const HALF_PADDLE = PADDLE_HEIGHT / 2;
const BOARD_WIDTH = 950;
const BOARD_HEIGHT = 590;
const POWERUP_FACTOR_X = 2.2;
const POWERUP_FACTOR_Y = 1.3;
const POWERUP_FACTOR_PADDLE = 1.55;

export class PongGame2 {
    // DOM elements used in the game
    private container: HTMLElement;
    private ball: HTMLElement;
    private paddleLeft: HTMLElement;
    private paddleRight: HTMLElement;
    private scoreDisplay: HTMLElement;
    private leftScoreElement: HTMLElement;
    private rightScoreElement: HTMLElement;
    private leftPowerup: HTMLElement;
    private rightPowerup: HTMLElement;

    // Ball position and speed
    private ballX = CENTER_X;
    private ballY = CENTER_Y;
    private ballSpeedX = BASE_SPEED;
    private ballSpeedY = BASE_SPEED;

    // Paddle positions and scores
    private leftPaddleY = CENTER_Y;
    private rightPaddleY = CENTER_Y;
    private leftScore = 0;
    private rightScore = 0;

    // Game mode and key tracking
    private nrPlayers = 0;
    private keyState: Record<string, boolean> = {};
    private intervalId: number | null = null;

    private player3Name: string = 'Player3';
    private player4Name: string = 'Player4';

    private powerup: boolean = true;
    private leftPowerAvailable: boolean = false;
    private rightPowerAvailable: boolean = false;
    private leftPowerActive: boolean = false;
    private rightPowerActive: boolean = false;
    private paddleSpeed: number = PADDLE_SPEED;

    private gameSettings: { ball_color: string; paddle_color: string; score_color: string; board_color: string } | undefined;
    private onGameEnd: ((score: { leftScore: number; rightScore: number }) => void) | null = null;

    // Add a property to track the last update time
    private lastUpdateTime: number | null = null;

    constructor(container: HTMLElement, onGameEnd?: (score: { leftScore: number; rightScore: number }) => void) {
        this.container = container;
        if (onGameEnd)
            this.onGameEnd = onGameEnd;
        this.container.innerHTML = this.getTemplate();

        // Get references to the game elements
        this.ball = this.container.querySelector('.ball')!;
        this.paddleLeft = this.container.querySelector('.paddle__left')!;
        this.paddleRight = this.container.querySelector('.paddle__right')!;
        this.scoreDisplay = this.container.querySelector('.score')!;
        this.leftScoreElement = this.container.querySelector('#leftScore')!;
        this.rightScoreElement = this.container.querySelector('#rightScore')!;
        this.leftPowerup = this.container.querySelector('.powerup__left')!;
        this.rightPowerup = this.container.querySelector('.powerup__right')!;
        const gameContainer = this.container.querySelector('.game__container') as HTMLElement;
        
        // Apply settings from gameSettings
        // getUserGameSettings(this.currentUserId).then(settings => {
        getUserGameSettings(currentUser?.id || 1).then(settings => {
            if (settings) {
                this.gameSettings = settings;
                this.ball.style.backgroundColor = settings.ball_color;
                this.paddleLeft.style.backgroundColor = settings.paddle_color;
                this.paddleRight.style.backgroundColor = settings.paddle_color;
                this.leftScoreElement.style.color = settings.score_color;
                this.rightScoreElement.style.color = settings.score_color;
                gameContainer.style.backgroundColor = settings.board_color;
            }
        }).catch(error => {
            console.error('Failed to load game settings:', error);
        });

        // Listen for key press and release events
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }

    // Start the game loop and optionally enable single-player mode
    start(nrPlayers = 1, player3Name?: string, player4Name?: string) {
        this.nrPlayers = nrPlayers;
        this.player3Name = player3Name ?? (nrPlayers === 1 ? currentUser?.display_name ?? 'Player 3' : 'Player 3');
        this.player4Name = player4Name ?? (nrPlayers === 1 ? 'Player 4' : 'Player 4');

        // update player names in html
        const player1Element = this.container.querySelector('#player3');
        const player2Element = this.container.querySelector('#player4');
        if (player1Element)
            player1Element.textContent = this.player3Name;
        if (player2Element)
            player2Element.textContent = this.player4Name;

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
    
    // Track when a key is pressed
    private onKeyDown = (e: KeyboardEvent) => this.keyState[e.key] = true;
    // Track when a key is released
    private onKeyUp = (e: KeyboardEvent) => this.keyState[e.key] = false;

    // Main game loop: update positions, handle collisions, and refresh UI
    private updateGame() {
        const currentTime = performance.now();
        const deltaTime = this.lastUpdateTime ? (currentTime - this.lastUpdateTime) / 1000 : 0; // Convert to seconds
        this.lastUpdateTime = currentTime;

        // Move the ball
        this.ballX += this.ballSpeedX * deltaTime;
        this.ballY += this.ballSpeedY * deltaTime;

        // Bounce off the top and bottom walls
        if ((this.ballY <= 9 && this.ballSpeedY < 0) || (this.ballY >= BOARD_HEIGHT - 9 && this.ballSpeedY > 0)) this.ballSpeedY *= -1;

        // Paddle collision
        if (this.ballX <= 26 &&
            this.ballY >= this.leftPaddleY - HALF_PADDLE - 9 &&
            this.ballY <= this.leftPaddleY + HALF_PADDLE + 9 &&
            this.ballSpeedX < 0
        ) {
            this.ballSpeedX *= -1;
            this.ballX = 26;
            // increase ball speed after each paddle collision, slightly changing angle by random
            this.ballSpeedX += Math.sign(this.ballSpeedX) * (BASE_SPEED / 4 * Math.random());
            this.ballSpeedY += Math.sign(this.ballSpeedY) * (BASE_SPEED / 4 * Math.random());
             // powerup
             if (this.leftPowerActive === true) {
                this.ballSpeedX *= POWERUP_FACTOR_X;
                this.ballSpeedY *= POWERUP_FACTOR_Y;
                this.paddleSpeed *= POWERUP_FACTOR_PADDLE;
                this.leftPowerActive = false;
            }
        }
        if (this.ballX >= BOARD_WIDTH - 26 && 
            this.ballY >= this.rightPaddleY - HALF_PADDLE - 9 &&
            this.ballY <= this.rightPaddleY + HALF_PADDLE + 9 &&
            this.ballSpeedX > 0
        ) {
            this.ballSpeedX *= -1;
            this.ballX = BOARD_WIDTH - 26;
            // increase ball speed after each paddle collision, slightly changing angle by random
            this.ballSpeedX += Math.sign(this.ballSpeedX) * (BASE_SPEED / 4 * Math.random());
            this.ballSpeedY += Math.sign(this.ballSpeedY) * (BASE_SPEED / 4 * Math.random());
            // powerup
            if (this.rightPowerActive === true) {
                this.ballSpeedX *= POWERUP_FACTOR_X;
                this.ballSpeedY *= POWERUP_FACTOR_Y;
                this.paddleSpeed *= POWERUP_FACTOR_PADDLE;
                this.rightPowerActive = false;
            }
        }

        // Player scores
        if (this.ballX <= 0) {
            this.rightScore++;
            this.resetBall();
        }
        if (this.ballX >= 940) {
            this.leftScore++;
            this.resetBall();
        }

        if (this.rightScore >= WIN_CONDITION || this.leftScore >= WIN_CONDITION) {
            if (this.onGameEnd) {
                this.onGameEnd({ leftScore: this.leftScore, rightScore: this.rightScore });
            }
            this.destroy();
        }

        // Paddle movement
        const paddleSpeed = PADDLE_SPEED * deltaTime;
        if (this.keyState['t']) 
            this.leftPaddleY = Math.max(this.leftPaddleY - paddleSpeed,            0 + HALF_PADDLE + 5);
        if (this.keyState['g']) 
            this.leftPaddleY = Math.min(this.leftPaddleY + paddleSpeed, BOARD_HEIGHT - HALF_PADDLE - 5);
        if (this.keyState['h'] && this.leftPowerAvailable === true) {
            this.leftPowerActive = true;
            this.leftPowerAvailable = false;
        }
        if (this.keyState['8']) 
            this.rightPaddleY = Math.max(this.rightPaddleY - paddleSpeed,            0 + HALF_PADDLE + 5);
        if (this.keyState['5']) 
            this.rightPaddleY = Math.min(this.rightPaddleY + paddleSpeed, BOARD_HEIGHT - HALF_PADDLE - 5);
        if (this.keyState['4'] && this.rightPowerAvailable === true) {
            this.rightPowerActive = true;
            this.rightPowerAvailable = false;
        }
        // Update visual positions
        this.updateUI();
    }

    // Reset ball to center and reverse direction after scoring
    private resetBall() {
        this.ballX = CENTER_X;
        this.ballY = CENTER_Y;
        this.ballSpeedX *= -1;
        this.ballSpeedX = this.ballSpeedX < 0 ? -BASE_SPEED : BASE_SPEED;
        this.ballSpeedY = BASE_SPEED * Math.random() * 2 - BASE_SPEED;
        this.paddleSpeed = PADDLE_SPEED;
        if (this.powerup) {
            this.leftPowerAvailable = true;
            this.rightPowerAvailable = true;
        }
        this.leftPowerActive = false;
        this.rightPowerActive = false;
    }

    // Update DOM elements to reflect current game state
    private updateUI() {
        this.ball.style.left = `${this.ballX}px`;
        this.ball.style.top = `${this.ballY}px`;
        this.paddleLeft.style.top = `${this.leftPaddleY}px`;
        this.paddleRight.style.top = `${this.rightPaddleY}px`;
        this.leftScoreElement.textContent = `${this.leftScore}`;
        this.rightScoreElement.textContent = `${this.rightScore}`;
        if (this.powerup) {
            if (this.leftPowerActive) this.leftPowerup.style.color = '#7c0e0e';
            else if (this.leftPowerAvailable) this.leftPowerup.style.color = '#d1bd51';
            else this.leftPowerup.style.color = '#212121';
            if (this.rightPowerActive) this.rightPowerup.style.color = '#7c0e0e';
            else if (this.rightPowerAvailable) this.rightPowerup.style.color = '#d1bd51';
            else this.rightPowerup.style.color = '#212121';
        }
    }

    // Return the HTML layout for the game
    private getTemplate(): string {
        return `
        <div class="score">
            <div class="score__left">
                <span id="leftScore">0</span><span id="player3">${this.player3Name}</span>
            </div>
            <div class="score__right">
                <span id="player4">${this.player4Name}</span><span id="rightScore">0</span>
            </div>
        </div>
        <div class="game__container">
            <div class="ball"></div>
            <div class="paddle paddle__left"></div>
            <div class="paddle paddle__right"></div>
            <div class="middle__line"></div>
        </div>
        <div class="score">
            <div class="score">
                <div class="score__left">
                    <i class="fas fa-angles-right powerup powerup__left"></i>
                </div>
                <div class="score__right">
                    <i class="fas fa-angles-left powerup powerup__right"></i>
                </div>
            </div>
        </div>
        `;
    }
}
