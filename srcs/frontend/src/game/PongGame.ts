export class PongGame {
  private container: HTMLElement;
  private ball: HTMLElement;
  private paddleLeft: HTMLElement;
  private paddleRight: HTMLElement;
  private scoreDisplay: HTMLElement;

  private ballX = 400;
  private ballY = 250;
  private ballSpeedX = 4;
  private ballSpeedY = 4;

  private leftPaddleY = 0;
  private rightPaddleY = 0;
  private leftScore = 0;
  private rightScore = 0;

  private readonly paddleSpeed = 10;
  private readonly paddleHeight = 80;

  private isSinglePlayer = false;
  private keyState: Record<string, boolean> = {};
  private intervalId: number | null = null;

  constructor(container: HTMLElement) {
      this.container = container;
      this.container.innerHTML = this.getTemplate();

      this.ball = this.container.querySelector('.ball')!;
      this.paddleLeft = this.container.querySelector('.paddle__left')!;
      this.paddleRight = this.container.querySelector('.paddle__right')!;
      this.scoreDisplay = this.container.querySelector('.score')!;

      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
  }

  start(isSinglePlayer = false) {
      this.isSinglePlayer = isSinglePlayer;
      this.intervalId = window.setInterval(() => this.updateGame(), 16);
  }

  destroy() {
      if (this.intervalId) {
          clearInterval(this.intervalId);
      }
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      this.container.innerHTML = '';
  }

  private onKeyDown = (e: KeyboardEvent) => this.keyState[e.key] = true;
  private onKeyUp = (e: KeyboardEvent) => this.keyState[e.key] = false;

  private updateGame() {
      this.ballX += this.ballSpeedX;
      this.ballY += this.ballSpeedY;

      if (this.ballY <= 10 || this.ballY >= 480) this.ballSpeedY *= -1;

      if (this.ballX <= 30 &&
          this.ballY + 10 >= this.leftPaddleY &&
          this.ballY <= this.leftPaddleY + this.paddleHeight
      ) {
          this.ballSpeedX *= -1;
          this.ballX = 31;
      }

      if (this.ballX >= 760 &&
          this.ballY + 10 >= this.rightPaddleY &&
          this.ballY <= this.rightPaddleY + this.paddleHeight
      ) {
          this.ballSpeedX *= -1;
          this.ballX = 759;
      }

      if (this.ballX <= 0) {
          this.rightScore++;
          this.resetBall();
      }

      if (this.ballX >= 800) {
          this.leftScore++;
          this.resetBall();
      }

      if (this.keyState['w']) this.leftPaddleY = Math.max(this.leftPaddleY - this.paddleSpeed, 0);
      if (this.keyState['s']) this.leftPaddleY = Math.min(this.leftPaddleY + this.paddleSpeed, 410);
      if (this.isSinglePlayer) {
          this.rightPaddleY = Math.max(Math.min(this.ballY - this.paddleHeight / 2, 410), 0);
      } else {
          if (this.keyState['ArrowUp']) this.rightPaddleY = Math.max(this.rightPaddleY - this.paddleSpeed, 0);
          if (this.keyState['ArrowDown']) this.rightPaddleY = Math.min(this.rightPaddleY + this.paddleSpeed, 410);
      }

      this.updateUI();
  }

  private resetBall() {
      this.ballX = 400;
      this.ballY = 250;
      this.ballSpeedX *= -1;
  }

  private updateUI() {
      this.ball.style.left = `${this.ballX}px`;
      this.ball.style.top = `${this.ballY}px`;
      this.paddleLeft.style.top = `${this.leftPaddleY}px`;
      this.paddleRight.style.top = `${this.rightPaddleY}px`;
      this.scoreDisplay.textContent = `${this.leftScore}  ${this.rightScore}`;
  }

  private getTemplate(): string {
      return `
          <div class="score">0 0</div>
          <div class="ball"></div>
          <div class="paddle__left"></div>
          <div class="paddle__right"></div>
      `;
  }
}
