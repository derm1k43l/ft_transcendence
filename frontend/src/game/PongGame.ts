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
    private ballX = 400;
    private ballY = 250;
    private ballSpeedX = 4;
    private ballSpeedY = 4;

    // Paddle positions and scores
    private leftPaddleY = 0;
    private rightPaddleY = 0;
    private leftScore = 0;
    private rightScore = 0;

    // Paddle settings
    private readonly paddleSpeed = 10;
    private readonly paddleHeight = 80;

    // Game mode and key tracking
    private isSinglePlayer = false;
    private keyState: Record<string, boolean> = {};
    private intervalId: number | null = null;

    // Initialize game container and insert HTML template
    constructor(container: HTMLElement) {
        this.container = container;
        this.container.innerHTML = this.getTemplate();

        // Get references to the game elements
        this.ball = this.container.querySelector('.ball')!;
        this.paddleLeft = this.container.querySelector('.paddle__left')!;
        this.paddleRight = this.container.querySelector('.paddle__right')!;
        this.scoreDisplay = this.container.querySelector('.score')!;
        this.leftScoreElement = this.container.querySelector('#leftScore')!;
        this.rightScoreElement = this.container.querySelector('#rightScore')!;

        // Listen for key press and release events
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }

    // Start the game loop and optionally enable single-player mode
    start(isSinglePlayer = false) {
        this.isSinglePlayer = isSinglePlayer;
        this.intervalId = window.setInterval(() => this.updateGame(), 16);
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
        // Move the ball
        this.ballX += this.ballSpeedX;
        this.ballY += this.ballSpeedY;

        // Bounce off the top and bottom walls
        if (this.ballY <= 10 || this.ballY >= 570) this.ballSpeedY *= -1;

        // Paddle collision
        if (this.ballX <= 30 &&
            this.ballY + 10 >= this.leftPaddleY &&
            this.ballY <= this.leftPaddleY + this.paddleHeight
        ) {
            this.ballSpeedX *= -1;
            this.ballX = 40; // Prevent sticking to the paddle
        }
        if (this.ballX >= 895 && 
            this.ballY + 10 >= this.rightPaddleY &&
            this.ballY <= this.rightPaddleY + this.paddleHeight
        ) {
            this.ballSpeedX *= -1;
            this.ballX = 895;
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
        // Paddle movement
        if (this.keyState['w']) this.leftPaddleY = Math.max(this.leftPaddleY - this.paddleSpeed, 0);
        if (this.keyState['s']) this.leftPaddleY = Math.min(this.leftPaddleY + this.paddleSpeed, 480);
        if (this.isSinglePlayer) {
            this.rightPaddleY = Math.max(Math.min(this.ballY - this.paddleHeight / 2, 480), 0);
        } else {
            if (this.keyState['ArrowUp']) this.rightPaddleY = Math.max(this.rightPaddleY - this.paddleSpeed, 0);
            if (this.keyState['ArrowDown']) this.rightPaddleY = Math.min(this.rightPaddleY + this.paddleSpeed, 480);
        }
        // Update visual positions
        this.updateUI();
    }
    // Reset ball to center and reverse direction after scoring
    private resetBall() {
        this.ballX = 400;
        this.ballY = 250;
        this.ballSpeedX *= -1;
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
            <span id="leftScore">0</span> &lt; - &gt; <span id="rightScore">0</span>
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
