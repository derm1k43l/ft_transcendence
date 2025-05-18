export class SquareGame {
    private container: HTMLElement;
    private paddleLeft: HTMLElement;
    private paddleRight: HTMLElement;
    private paddleTop: HTMLElement;
    private paddleBottom: HTMLElement;
    private ball: HTMLElement;
  
    private ballX = 400;
    private ballY = 300;
    private ballSpeedX = 5;
    private ballSpeedY = 3;
  
    private leftPaddleY = 300;
    private rightPaddleY = 300;
    private topPaddleX = 400;
    private bottomPaddleX = 400;
  
    private keyState: { [key: string]: boolean } = {};
  
    private leftScore = 0;
    private rightScore = 0;
    private topScore = 0;
    private bottomScore = 0;
  
    private animationFrame: number | null = null;
  
    constructor(container: HTMLElement) {
      this.container = container;
      this.container.innerHTML = this.getTemplate();
  
      this.paddleLeft = this.container.querySelector('.paddle__left')!;
      this.paddleRight = this.container.querySelector('.paddle__right')!;
      this.paddleTop = this.container.querySelector('.paddle__top')!;
      this.paddleBottom = this.container.querySelector('.paddle__bottom')!;
      this.ball = this.container.querySelector('.ball')!;
  
      document.addEventListener('keydown', (e) => this.keyState[e.key] = true);
      document.addEventListener('keyup', (e) => this.keyState[e.key] = false);
  
      this.update();
    }
  
    private getTemplate() {
      return `
        <div class="pong">
          <div class="paddle paddle__left"></div>
          <div class="paddle paddle__right"></div>
          <div class="paddle paddle__top"></div>
          <div class="paddle paddle__bottom"></div>
          <div class="ball"></div>
        </div>
      `;
    }
  
    private update = () => {
      this.movePaddles();
      this.moveBall();
      this.draw();
      this.animationFrame = requestAnimationFrame(this.update);
    }
  
    private movePaddles() {
      const speed = 5;
      const paddleHalf = 50;
  
      if (this.keyState['w']) this.leftPaddleY = Math.max(this.leftPaddleY - speed, paddleHalf);
      if (this.keyState['s']) this.leftPaddleY = Math.min(this.leftPaddleY + speed, 600 - paddleHalf);
      if (this.keyState['ArrowUp']) this.rightPaddleY = Math.max(this.rightPaddleY - speed, paddleHalf);
      if (this.keyState['ArrowDown']) this.rightPaddleY = Math.min(this.rightPaddleY + speed, 600 - paddleHalf);
  
      if (this.keyState['j']) this.topPaddleX = Math.max(this.topPaddleX - speed, paddleHalf);
      if (this.keyState['l']) this.topPaddleX = Math.min(this.topPaddleX + speed, 800 - paddleHalf);
      if (this.keyState['n']) this.bottomPaddleX = Math.max(this.bottomPaddleX - speed, paddleHalf);
      if (this.keyState['.']) this.bottomPaddleX = Math.min(this.bottomPaddleX + speed, 800 - paddleHalf);
    }
  
    private moveBall() {
      this.ballX += this.ballSpeedX;
      this.ballY += this.ballSpeedY;
  
      const hitPaddle = (ballCoord: number, paddleCoord: number, range: number, isVertical: boolean) => {
        return isVertical
          ? Math.abs(ballCoord - paddleCoord) <= 10 && Math.abs(this.ballY - range) <= 10
          : Math.abs(ballCoord - paddleCoord) <= 10 && Math.abs(this.ballX - range) <= 10;
      };
  
      // Left paddle
      if (hitPaddle(this.ballY, this.leftPaddleY, 10, true)) this.ballSpeedX *= -1;
      // Right paddle
      if (hitPaddle(this.ballY, this.rightPaddleY, 790, true)) this.ballSpeedX *= -1;
      // Top paddle
      if (hitPaddle(this.ballX, this.topPaddleX, 10, false)) this.ballSpeedY *= -1;
      // Bottom paddle
      if (hitPaddle(this.ballX, this.bottomPaddleX, 590, false)) this.ballSpeedY *= -1;
  
      // Score conditions
      if (this.ballX < 0) { this.rightScore++; this.resetBall(); }
      if (this.ballX > 800) { this.leftScore++; this.resetBall(); }
      if (this.ballY < 0) { this.bottomScore++; this.resetBall(); }
      if (this.ballY > 600) { this.topScore++; this.resetBall(); }
    }
  
    private resetBall() {
      this.ballX = 400;
      this.ballY = 300;
      this.ballSpeedX = 5 * (Math.random() > 0.5 ? 1 : -1);
      this.ballSpeedY = 3 * (Math.random() > 0.5 ? 1 : -1);
    }
  
    private draw() {
      this.ball.style.transform = `translate(${this.ballX}px, ${this.ballY}px)`;
      this.paddleLeft.style.transform = `translateY(${this.leftPaddleY}px)`;
      this.paddleRight.style.transform = `translateY(${this.rightPaddleY}px)`;
      this.paddleTop.style.transform = `translateX(${this.topPaddleX}px)`;
      this.paddleBottom.style.transform = `translateX(${this.bottomPaddleX}px)`;
    }
  
    public destroy() {
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    }
  }
  