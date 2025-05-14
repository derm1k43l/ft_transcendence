import { Router } from '../core/router.js';
import { NotificationManager } from '../components/Notification.js';
import { currentUser } from '../main.js';
import { Tournament, TournamentMatch } from '../types/index.js';
import { addTournament } from '../services/UserService.js';

export class TournamentView {
    private element: HTMLElement | null = null;
	private router: Router;

	constructor(router: Router, userId?: string) {
        this.router = router;
    }

    render(rootElement: HTMLElement): void {
        this.element = document.createElement('div');
        this.element.className = 'tournament-view';

        // Create the UI with layout matching Settings style
        this.element.innerHTML = `
			<div class="tournament-header">
			    <h2>Tournament</h2>
			    <p>Manage and participate in tournaments</p>
			</div>

			<div class="tournament-container">
			    <div class="tournament-sidebar">
			        <ul class="tournament-nav">
			            <li><a href="#my-tournaments" class="active" data-tab="my-tournaments">My Tournaments</a></li>
			            <li><a href="#create-tournament" data-tab="create-tournament">Create Tournament</a></li>
			            <li><a href="#join-tournament" data-tab="join-tournament">Join Tournament</a></li>
			            <li><a href="#tournament-history" data-tab="tournament-history">Tournament History</a></li>
			        </ul>
			    </div>

			    <div class="tournament-content">
			        <div id="my-tournaments" class="tournament-panel active">
			            <h3>My Tournaments</h3>
			            <div class="my-tournament-list">
			                <div class="center-content">You don't participate in any tournaments right now</div>
			            </div>
			        </div>


					<div id="create-tournament" class="tournament-panel">
					    <h3>Create Tournament</h3>
					    <div class="create-tournament-form">
					        <div class="center-content">Create a tournament!</div>
					        <div class="tournament-buttons">
					            <button type="button" data-size="4">4</button>
					            <button type="button" data-size="8">8</button>
					        </div>

							<div id="user-input"></div>
							<div id="tournament-bracket" class="tournament"></div>
					    </div>
					</div>


			        <div id="join-tournament" class="tournament-panel">
			            <h3>Join Tournament</h3>
			            <div class="join-tournament-section">
			                <div class="center-content">No tournaments available to join right now</div>
			            </div>
			        </div>

			        <div id="tournament-history" class="tournament-panel">
			            <h3>Tournament History</h3>
			            <div class="tournament-history-list" id="tournament-history-list">
			                <div class="center-content">???</div>
			            </div>
			        </div>
			    </div>
			</div>
		</div>
		`;

    	rootElement.appendChild(this.element);

		this.setupEventListeners();
    }

	private setupEventListeners(): void {
		if (!this.element) return;

		const navLinks = this.element.querySelectorAll('.tournament-nav a');
		const panels = this.element.querySelectorAll('.tournament-panel');
		const sizeButtons = this.element.querySelectorAll<HTMLButtonElement>('.tournament-buttons button');

		navLinks.forEach(link => {
			link.addEventListener('click', (e) => {
				e.preventDefault();
				const tabId = link.getAttribute('data-tab');

				navLinks.forEach(l => l.classList.remove('active'));
				link.classList.add('active');

				panels.forEach(panel => {
				if (panel.id === tabId)
					panel.classList.add('active');
				else
					panel.classList.remove('active');
				});
			});
		});

		sizeButtons.forEach(button => {
			button.addEventListener('click', () => {
				const size = parseInt(button.getAttribute('data-size') || '0', 10);
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

	private addInputFields(size:number): void {
		const userInput = this.element?.querySelector('#user-input');
		if (!userInput) return;

		userInput.innerHTML = ''; // Clear previous

		const userInputDiv = document.createElement('div');
		userInputDiv.className = 'inputfields';

		// create input fields
		let inputAmount: number;
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
			inputAmount = i + 1;
		}

		// creates button
		const buttonWrapper = document.createElement('div');
		buttonWrapper.className = 'tournament-buttons';

		const collectButton = document.createElement('button');
		collectButton.type = 'button';
		collectButton.id = 'collectDataButton';
		collectButton.textContent = 'Create Bracket';
		collectButton.addEventListener('click', () => {
			if (!this.element) return;
			const inputFields = this.element.querySelectorAll<HTMLInputElement>('.inputfields input');
			let playerNames: string[] = [];
			inputFields.forEach(async input => {
				const name = input.value.trim();
				// also check for duplicates, maybe in seperate function with !name
				if (!name) {
					console.warn('All fields must be filled.');
					return; // Exit if any input is empty
				}
				playerNames.push(name);
				if (inputAmount == playerNames.length) {
					userInputDiv.remove();
					console.log("Player names:", playerNames);
					playerNames = this.shuffleArray(playerNames);
					console.log("Shuffeld player names:", playerNames);

					const newTournament = await addTournament({
						id: 1,
						tournament_name: "Tournament 1",
						creator_id: 42,
						player_amount: size,
						status: "pending",
						winner_name: null,
						players: playerNames,
						matches: [],
					});
					if (newTournament) {
						console.log(newTournament);
						this.buildTournament(newTournament);
					} else
						console.error("Tournament creation failed.");
				}
			});
		});

		buttonWrapper.appendChild(collectButton);
		userInputDiv.appendChild(buttonWrapper);
		userInput.appendChild(userInputDiv);
	}

	private getRounds(size: number): string[] {
		if (size === 4) return ['Semifinals', 'Final'];
		if (size === 8) return ['Quarterfinals', 'Semifinals', 'Final'];
		return [];
	}

	private buildTournament(tournament: Tournament): void {
		const bracketContainer = this.element?.querySelector('#tournament-bracket');
		if (!bracketContainer) return;
	
		bracketContainer.innerHTML = ''; // Clear previous
	
		const rounds = this.getRounds(tournament.player_amount);
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
	
		for (let i = 0; i < tournament.matches.length; i++) {	
			const matchDiv = document.createElement('div');
			matchDiv.className = 'match';
			matchDiv.id = `${tournament.matches[i].id}`;
	
			let score1 = '0';
			let score2 = '0';
			const score = tournament.matches[i].score;
			if (score)
				[score1, score2] = score.split('-');

			const player1 = document.createElement('div');
			player1.className = 'player';
			if (tournament.matches[i].player1_name) {
				player1.textContent = `${tournament.matches[i].player1_name}`;
				player1.innerHTML += `<span class="player-score">${score1}</span>`;
			} else {
				player1.textContent = `tbd`;
				player1.innerHTML += `<span class="player-score">-</span>`;
			}
	
			const player2 = document.createElement('div');
			player2.className = 'player';
			if (tournament.matches[i].player2_name) {
				player2.textContent = `${tournament.matches[i].player2_name}`;
				player2.innerHTML += `<span class="player-score">${score2}</span>`;
			} else {
				player2.textContent = `tbd`;
				player2.innerHTML += `<span class="player-score">-</span>`;
			}
	
			matchDiv.appendChild(player1);
			matchDiv.appendChild(player2);

			const roundName = rounds[tournament.matches[i].round - 1];
			const roundId = roundName.toLowerCase().replace(/\s/g, '');
			const roundDiv = document.getElementById(roundId);

			if (roundDiv) {
				roundDiv.appendChild(matchDiv);
			} else {
				console.warn(`No round div found for round number: ${tournament.matches[i].round}`);
			}
		}
		console.log(`Generated a ${tournament.player_amount}-player tournament.`);
	}
	
    destroy(): void {
        this.element = null;
    }
}
