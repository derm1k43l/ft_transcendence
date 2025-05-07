export class TournamentView {
    private element: HTMLElement | null = null;

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
					        <div class="tournament-size-buttons">
					            <button type="button" data-size="4">4</button>
					            <button type="button" data-size="8">8</button>
					            <button type="button" data-size="16">16</button>
					        </div>
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
		const sizeButtons = this.element.querySelectorAll<HTMLButtonElement>('.tournament-size-buttons button');

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
					this.buildTournament(size);
				}
			});
		});
	}

	private getRounds(size: number): string[] {
		if (size === 4) return ['Semifinals', 'Final'];
		if (size === 8) return ['Quarterfinals', 'Semifinals', 'Final'];
		if (size === 16) return ['Round of 16', 'Quarterfinals', 'Semifinals', 'Final'];
		return [];
	}
	
	private buildTournament(size: number): void {
		const bracketContainer = this.element?.querySelector('#tournament-bracket');
		if (!bracketContainer) return;
	
		bracketContainer.innerHTML = ''; // Clear previous
	
		const rounds = this.getRounds(size);
		let matchId = 1;
	
		for (let i = 0; i < rounds.length; i++) {
			const roundName = rounds[i];
			const numMatches = size / Math.pow(2, i + 1);
	
			const roundDiv = document.createElement('div');
			roundDiv.className = 'round';
			roundDiv.id = roundName.toLowerCase().replace(/\s/g, '');
	
			const header = document.createElement('h2');
			header.textContent = roundName;
			roundDiv.appendChild(header);
	
			for (let j = 0; j < numMatches; j++) {
				const matchDiv = document.createElement('div');
				matchDiv.className = 'match';
				matchDiv.id = `${roundName.toLowerCase()}_match${j + 1}`;
	
				const player1 = document.createElement('div');
				player1.className = 'player';
				player1.textContent = `Player ${matchId++} `;
				player1.innerHTML += `<span class="player_score">0</span>`;
	
				const player2 = document.createElement('div');
				player2.className = 'player';
				player2.textContent = `Player ${matchId++} `;
				player2.innerHTML += `<span class="player_score">0</span>`;
	
				matchDiv.appendChild(player1);
				matchDiv.appendChild(player2);
				roundDiv.appendChild(matchDiv);
			}
	
			bracketContainer.appendChild(roundDiv);
		}
	
		console.log(`Generated a ${size}-player tournament.`);
	}
	
	
    destroy(): void {
        this.element = null;
    }
}
