import { getUserGameSettings } from '../services/UserService.js';
import { currentUser } from '../main.js';
import { MatchRecord } from '../types/index.js';
import { addMatchRecord } from '../services/UserService.js';

const WIN_CONDITION = 5;
const BASE_SPEED = 1.3;
const CENTER_X = 475;
const CENTER_Y = 295;
const PADDLE_SPEED = 3.5;
const PADDLE_HEIGHT = 80;
const BOARD_WIDTH = 950;
const BOARD_HEIGHT = 590;

export class PongGame {
    // DOM elements used in the game
    private container: HTMLElement;
    private ball: HTMLElement;
    private paddleLeft: HTMLElement;
    private paddleRight: HTMLElement;
    private scoreDisplay: HTMLElement;
    private leftScoreElement: HTMLElement;
    private rightScoreElement: HTMLElement;

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
    private isSinglePlayer = false;
    private remotePlayer = false;
    private keyState: Record<string, boolean> = {};
    private aiTargetY: number = 250;
    private aiViewIntervalId: number | null = null;
    private intervalId: number | null = null;

    private player1Name: string = 'Player1';
    private player2Name: string = 'Player2';


    // --------------------------------------------------------------------------
    private gameSettings: { ball_color: string; paddle_color: string; score_color: string; board_color: string } | undefined;
    // --------------------------------------------------------------------------

    private onGameEnd: ((score: { leftScore: number; rightScore: number }) => void) | null = null;

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
    
    private startAI() {
        this.aiViewIntervalId = window.setInterval(() => this.updateAI(), 1000);
    }
    
    private updateAI() {
        const observedBallX = this.ballX;
        const observedBallY = this.ballY;
        const observedSpeedX = this.ballSpeedX;
        const observedSpeedY = this.ballSpeedY;
    
        const paddleX = 895;
        const distanceToPaddle = paddleX - observedBallX;
        const timeToPaddle = distanceToPaddle / observedSpeedX;
    
        let predictedY = observedBallY + observedSpeedY * timeToPaddle;
        const screenHeight = 580;
    
        // Bounce prediction
        while (predictedY < 0 || predictedY > screenHeight) {
            if (predictedY < 0) 
                predictedY = -predictedY;
            if (predictedY > screenHeight) 
                predictedY = 2 * screenHeight - predictedY;
        }
    
        this.aiTargetY = predictedY;
    
        console.log('AI sees ball at:', observedBallX, observedBallY, '-> predicting Y:', predictedY);
    }    

    // Start the game loop and optionally enable single-player mode
    start(isSinglePlayer = false, player1Name?: string, player2Name?: string) {
        this.isSinglePlayer = isSinglePlayer;
        this.player1Name = player1Name || isSinglePlayer ? currentUser?.display_name || 'Player 1' : 'Player 1';
        this.player2Name = player2Name || isSinglePlayer ? 'Computer' : this.player2Name;

        // update player names in html
        const player1Element = this.container.querySelector('#player1');
        const player2Element = this.container.querySelector('#player2');
        if (player1Element)
            player1Element.textContent = this.player1Name;
        if (player2Element)
            player2Element.textContent = this.player2Name;

        this.intervalId = window.setInterval(() => this.updateGame(), 1);
        if (this.isSinglePlayer) {
            this.startAI();
        }
    }

    // Stop the game and clean up
    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        if (this.aiViewIntervalId) {
            clearInterval(this.aiViewIntervalId);
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
        // Move the ball
        this.ballX += this.ballSpeedX;
        this.ballY += this.ballSpeedY;

        // Bounce off the top and bottom walls
        if (this.ballY <= 9 || this.ballY >= BOARD_HEIGHT - 9) this.ballSpeedY *= -1;

        // Paddle collision
        if (this.ballX <= 26 &&
            this.ballY + 10 >= this.leftPaddleY &&
            this.ballY <= this.leftPaddleY + PADDLE_HEIGHT
        ) {
            this.ballSpeedX *= -1;
            this.ballX = 26; // Prevent sticking to the paddle
            // increase ball speed after each paddle collision, slightly changing angle by random
            this.ballSpeedX += Math.sign(this.ballSpeedX) * (BASE_SPEED / 4 * Math.random());
            this.ballSpeedY += Math.sign(this.ballSpeedY) * (BASE_SPEED / 4 * Math.random());
        }
        if (this.ballX >= BOARD_WIDTH - 26 && 
            this.ballY + 10 >= this.rightPaddleY &&
            this.ballY <= this.rightPaddleY + PADDLE_HEIGHT
        ) {
            this.ballSpeedX *= -1;
            this.ballX = BOARD_WIDTH - 26;
            // increase ball speed after each paddle collision, slightly changing angle by random
            this.ballSpeedX += Math.sign(this.ballSpeedX) * (BASE_SPEED / 4 * Math.random());
            this.ballSpeedY += Math.sign(this.ballSpeedY) * (BASE_SPEED / 4 * Math.random());
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
            // add match history item (only singleplayer)
            if (this.isSinglePlayer && currentUser)
            {
                const record: MatchRecord = {
                    user_id: currentUser.id,
                    result: this.leftScore > this.rightScore ? 'win' : 'loss',
                    score: `${this.leftScore}-${this.rightScore}`,
                    date: new Date().toISOString(),
                    status: 'finished',
                    opponent_name: this.player2Name,
                };
                addMatchRecord(record);
            }
            this.destroy();
        }

        // Paddle movement
        if (this.keyState['w']) 
            this.leftPaddleY = Math.max(this.leftPaddleY - PADDLE_SPEED, 5);
        if (this.keyState['s']) 
            this.leftPaddleY = Math.min(this.leftPaddleY + PADDLE_SPEED, 495 - 5);
        if (this.isSinglePlayer) {
            const paddleCenter = this.rightPaddleY + PADDLE_HEIGHT / 2;
        
            if (paddleCenter < this.aiTargetY - 5) {
                this.keyState['ArrowDown'] = true;
                this.keyState['ArrowUp'] = false;
            } else if (paddleCenter > this.aiTargetY + 5) {
                this.keyState['ArrowUp'] = true;
                this.keyState['ArrowDown'] = false;
            } else {
                this.keyState['ArrowUp'] = false;
                this.keyState['ArrowDown'] = false;
            }
        
            // MOVE PADDLE BASED ON KEY STATE
            if (this.keyState['ArrowUp']) 
                this.rightPaddleY = Math.max(this.rightPaddleY - PADDLE_SPEED*0.71, 5);
            if (this.keyState['ArrowDown']) 
                this.rightPaddleY = Math.min(this.rightPaddleY + PADDLE_SPEED*0.71, 495 - 5);
        } else if (this.remotePlayer) {
            //implementing remote keys
        } else {
            if (this.keyState['ArrowUp']) 
                this.rightPaddleY = Math.max(this.rightPaddleY - PADDLE_SPEED, 5);
            if (this.keyState['ArrowDown']) 
                this.rightPaddleY = Math.min(this.rightPaddleY + PADDLE_SPEED, 495 - 5);
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
    }

    // Update DOM elements to reflect current game state
    private updateUI() {
        this.ball.style.left = `${this.ballX}px`;
        this.ball.style.top = `${this.ballY}px`;
        this.paddleLeft.style.top = `${this.leftPaddleY}px`;
        this.paddleRight.style.top = `${this.rightPaddleY}px`;
        this.leftScoreElement.textContent = `${this.leftScore}`;
        this.rightScoreElement.textContent = `${this.rightScore}`;
    }

    // Return the HTML layout for the game
    private getTemplate(): string {
        return `
        <div class="score">
            <div class="score">
                <div class="score__left">
                    <span id="leftScore">0</span><span id="player1">${this.player1Name}</span>
                </div>
                <div class="score__right">
                    <span id="player2">${this.player2Name}</span><span id="rightScore">0</span>
                </div>
            </div>
        </div>
        <div class="game__container">
            <div class="ball"></div>
            <div class="paddle paddle__left"></div>
            <div class="paddle paddle__right"></div>
            <div class="middle__line"></div>
        </div>
        `;
    }
}
