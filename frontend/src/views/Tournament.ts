import { Router } from '../core/router.js';
import { NotificationManager } from '../components/Notification.js';
import { currentUser } from '../main.js';
import { Tournament, TournamentMatch } from '../types/index.js';
import { addTournament, deleteTournament, getAllTournaments, updateTournament } from '../services/UserService.js';
import { GameView } from './Game.js';
import { PongGame } from "../game/PongGame.js";

export class TournamentView {
    private element: HTMLElement | null = null;
	private router: Router;
	private game: PongGame | null = null;
	private tournament: Tournament | null = null;

	constructor(router: Router, userId?: string) {
        this.router = router;
    }

    async render(rootElement: HTMLElement): Promise<void> {
        this.element = document.createElement('div');
        this.element.className = 'tournament-page';
		this.element.id = 'tournament-view';

        this.element.innerHTML = `
			<div class="tournament-header">
			    <h2>Tournament</h2>
			    <p>Create and play a tournament!</p>
			</div>

			<div class="tournament-container">
			    <div class="tournament-content">

					<div id="header-info" class="center-content">
						Create a tournament<br>
						Choose how many players you want to play with
					</div>
					<div class="create-tournament">
					    <div id="tournament-create-buttons" class="tournament-buttons">
					        <button type="button" tournament-size="4">4 players</button>
					        <button type="button" tournament-size="8">8 players</button>
					    </div>
						<div id="userinput-container"></div>
					</div>

					<div class="play-tournament">
						<div id="tournament-bracket" class="tournament"></div>
						<div id="tournament-manage-buttons" class="tournament-buttons"></div>
					</div>
			    </div>
			</div>
		`;

		rootElement.appendChild(this.element);

		// append game-container
		const gameViewContainer = document.createElement('div');
		gameViewContainer.id = 'game-container';
		rootElement.appendChild(gameViewContainer);

		// show creation form or bracket
		const tournaments = await getAllTournaments();
		const buttonContainer = this.element?.querySelector<HTMLElement>('#tournament-create-buttons')!;
		
		if (!buttonContainer) {
			return ;
		} else if (tournaments.length === 0) {
			buttonContainer.style.display = 'flex';
		} else {
			buttonContainer.style.display = 'none';
			this.tournament = tournaments[0];
			this.buildTournament();
		}

		this.setupEventListeners();
	}

	private setupEventListeners(): void {
		if (!this.element) return ;

		const sizeButtons = this.element.querySelectorAll<HTMLButtonElement>('#tournament-create-buttons button');
		sizeButtons.forEach(button => {
			button.addEventListener('click', () => {
				const size = parseInt(button.getAttribute('tournament-size') || '0', 10);
				if (size) {
					this.addInputFields(size);
				}
			});
		});
	}

	private shuffleArray<T>(array: T[]): T[] {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	private async checkInput(): Promise<string[] | null | undefined> {
		if (!this.element) return ;

		const inputFields = this.element.querySelectorAll<HTMLInputElement>('.input-wrapper input');
		let playerNames: string[] = [];

		for (const input of inputFields) {
			const name = input.value.trim();

			if (!name) {
				NotificationManager.show({
					title: 'Invalid input',
					message: 'All fields must be filled.',
					type: 'warning',
					duration: 3000
				});
				return [];
			}
			if (playerNames.includes(name)) {
				NotificationManager.show({
					title: 'Invalid input',
					message: `Duplicate name detected: ${name}.`,
					type: 'warning',
					duration: 3000
				});
				return [];
			}
			playerNames.push(name);
		}
		return playerNames;
	}

	private async handleCreateButton(size: number, userInputDiv: HTMLElement): Promise<void> {
		const playerNames = await this.checkInput();
		if (!playerNames || playerNames.length === 0)
			return ;

		const createButtons = this.element?.querySelector<HTMLElement>('#tournament-create-buttons')!;
		createButtons.remove();
		userInputDiv.remove();
		const shuffledNames = this.shuffleArray(playerNames);

		this.tournament = await addTournament({
			id: 1,
			tournament_name: "Your amazing Tournament",
			creator_id: 42,
			player_amount: size,
			status: "pending",
			winner_name: null,
			players: shuffledNames,
			matches: [],
		});

		if (!this.tournament) return ;
		this.buildTournament();
	}

	private addInputFields(size: number): void {
		const userInput = this.element?.querySelector<HTMLElement>('#userinput-container')!;
		if (!userInput) return ;

		userInput.innerHTML = ''; // Clear previous

		const userInputDiv = document.createElement('div');
		userInputDiv.className = 'input-wrapper';

		// create input fields
		for (let i = 0; i < size; i++) {
			const inputWrapper = document.createElement('div');
			inputWrapper.className = 'input-structure';

			const nameLabel = document.createElement('label');
    		nameLabel.setAttribute('for', `input_${i + 1}`);

    		const nameInput = document.createElement('input');
    		nameInput.type = 'text';
    		nameInput.id = `input_${i + 1}`;
    		nameInput.placeholder = `Player ${i + 1}`;

			inputWrapper.appendChild(nameLabel);
			inputWrapper.appendChild(nameInput);
			userInputDiv.appendChild(inputWrapper);
		}

		// create button
		const buttonWrapper = document.createElement('div');
		buttonWrapper.id = 'create-bracket-button';
		buttonWrapper.className = 'tournament-buttons';

		const collectButton = document.createElement('button');
		collectButton.type = 'button';
		collectButton.id = 'collectDataButton';
		collectButton.textContent = 'Create Bracket';
		collectButton.addEventListener('click', () => {
			this.handleCreateButton(size, userInputDiv);
		});

		// append everything
		buttonWrapper.appendChild(collectButton);
		userInputDiv.appendChild(buttonWrapper);
		userInput.appendChild(userInputDiv);
	}

	private getRounds(size: number): string[] {
		if (size === 4) return ['Semifinals', 'Final'];
		if (size === 8) return ['Quarterfinals', 'Semifinals', 'Final'];
		return [];
	}

	private async startGameButton(index: number): Promise<void> {
		if (!this.tournament) return ;

		const matches = this.tournament.matches;
		const gameContainer = document.getElementById('game-container') as HTMLElement;
		const pageContainer = document.getElementById('tournament-view') as HTMLElement;
		pageContainer.style.display = 'none';
		gameContainer.style.display = 'block';
		this.game = new PongGame(gameContainer, async (score) => {
			if (!this.tournament) return ;

			// use result to set tournament values
			matches[index].status = 'finished';

			const scoreString = `${score.leftScore}-${score.rightScore}`;
			matches[index].score = scoreString;

			if (score.leftScore > score.rightScore)
				matches[index].winner_name = matches[index].player1_name;
			else
				matches[index].winner_name = matches[index].player2_name;

			await updateTournament(this.tournament.id, this.tournament);
			pageContainer.style.display = 'block';
			this.tournament = null;
			this.router.reload();
		});
		if (matches[index].player1_name !== null && matches[index].player2_name !== null)
			this.game.start(2, matches[index].player1_name, matches[index].player2_name);
	}

	private async deleteTournamentButton(): Promise<void> {
		if (!this.tournament) return ;
		
		await deleteTournament(this.tournament.id);
		this.tournament = null;
		this.router.reload();
	}

	private createPlayerElement(name: string | null | undefined, isWinner: boolean, score?: string): HTMLDivElement {
		const player = document.createElement('div');
		player.className = 'player';
		if (isWinner)
			player.id = 'winner';

		const displayName = name ?? 'tbd';
		player.textContent = displayName;

		const scoreSpan = document.createElement('span');
		scoreSpan.className = 'player-score';
		scoreSpan.textContent = score !== undefined ? `${score}` : '-';

		player.appendChild(scoreSpan);
		return player;
	}

	private createMatches(rounds: string[]): void {
		if (!this.tournament) return ;

		for (let i = 0; i < this.tournament.matches.length; i++) {	
			const matchDiv = document.createElement('div');
			matchDiv.className = 'match';
			matchDiv.id = `${this.tournament.matches[i].id}`;

			const [score1 = '0', score2 = '0'] = this.tournament.matches[i].score?.split('-') || [];

			const m = this.tournament.matches[i];
			const player1 = this.createPlayerElement(m.player1_name,
				m.winner_name != null && m.player1_name != null && m.winner_name === m.player1_name, m.score ? score1 : undefined);
			const player2 = this.createPlayerElement(m.player2_name,
				m.winner_name != null && m.player2_name != null && m.winner_name === m.player2_name, m.score ? score2 : undefined);

			matchDiv.appendChild(player1);
			matchDiv.appendChild(player2);

			const roundName = rounds[this.tournament.matches[i].round - 1];
			const roundId = roundName.toLowerCase().replace(/\s/g, '');
			const roundDiv = document.getElementById(roundId) as HTMLElement;
			roundDiv.appendChild(matchDiv);
		}
	}

	private createManageButtons(): void {
		if (!this.tournament) return ;

		const manageButtonsContainer = this.element?.querySelector<HTMLElement>('#tournament-manage-buttons')!;

		const matches = this.tournament.matches;
		const i = matches.findIndex(match => match.status === "pending");
		if (i === -1) {
			const contentHeader = this.element?.querySelector<HTMLElement>('#header-info')!;
			contentHeader.textContent = `Tournament Winner is: ${matches[matches.length - 1].winner_name}`;

			const finishButton = document.createElement('button');
			finishButton.type = 'button';
			finishButton.id = 'finishButton';
			finishButton.className = 'tournament-button';
			finishButton.textContent = 'Finish';
			finishButton.addEventListener('click', () => {
				this.deleteTournamentButton();
			});
			manageButtonsContainer.appendChild(finishButton);
			return ;
		}

		const contentHeader = this.element?.querySelector<HTMLElement>('#header-info')!;
		contentHeader.textContent = `Next Match: | ${matches[i].player1_name} vs ${matches[i].player2_name} |`;

		const startButton = document.createElement('button');
		startButton.type = 'button';
		startButton.id = 'startMatchButton';
		startButton.className = 'tournament-button';
		startButton.textContent = 'Start Match';
		startButton.addEventListener('click', () => {
			this.startGameButton(i);
		});
		manageButtonsContainer.appendChild(startButton);

		const deleteButton = document.createElement('button');
		deleteButton.type = 'button';
		deleteButton.id = 'deleteTournamentButton';
		deleteButton.className = 'delete-button';
		deleteButton.textContent = 'Delete Tournament';
		deleteButton.addEventListener('click', () => {
			this.deleteTournamentButton();
		});
		manageButtonsContainer.appendChild(deleteButton);
	}

	private buildTournament(): void {
		if (!this.tournament) return ;

		const bracketContainer = this.element?.querySelector<HTMLElement>('#tournament-bracket')!;
		bracketContainer.innerHTML = ''; // Clear previous

		// create rounds
		const rounds = this.getRounds(this.tournament.player_amount);
		for (let i = 0; i < rounds.length; i++) {
			const roundName = rounds[i];

			const roundDiv = document.createElement('div');
			roundDiv.className = 'round';
			roundDiv.id = roundName.toLowerCase().replace(/\s/g, '');

			const header = document.createElement('h2');
			header.textContent = roundName;
			roundDiv.appendChild(header);
			bracketContainer.appendChild(roundDiv);
		}

		this.createMatches(rounds);
		this.createManageButtons();
	}

    destroy(): void {
        this.element?.remove();
        this.element = null;
    }
}
