import { Router } from '../core/router.js';
import { getAllUsers } from '../services/UserService.js';
// import { user } from '../main.js';
import { UserProfile } from '../types/index.js';
import { getCurrentUser } from '../services/auth.js';
import { DEFAULT_ACHIEVEMENTS, DEFAULT_STATS } from '../constants/defaults.js';
import { applyTranslations } from './Translate.js';

export class DashboardView {
    private element: HTMLElement | null = null;
    private router: Router;
    private charts: any[] = [];
    private currentUserID = -1;
    
    constructor(router: Router) {
        console.log("--- CONSTRUCTING DASHBOARD VIEW ---");
        this.router = router;
    }

    async render(rootElement: HTMLElement): Promise<void> {
        try {
            this.element = document.createElement('div');
            this.element.className = 'dashboard-view';
            // Show loading state
            this.element.innerHTML = '<div class="loading-spinner">Loading dashboard...</div>';
            rootElement.appendChild(this.element);

            const user = await getCurrentUser();
            if (!user) { window.location.reload(); return; }
            if (!this.element) return;
            this.currentUserID = user.id;

            if (!this.element || !user.stats) return;


            this.element.innerHTML = `
                <div class="dashboard-header">
                    <h2 data-i18n="welcomeBack">Welcome back, ${user.display_name}!</h2>
                    <p class="last-login" data-i18n="lastLogin">Last login: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                </div>
                
                <div class="dashboard-content">
                    <!-- Quick Stats in single row -->
                    <div class="quick-stats card">
                        <div class="quick-stat">
                            <div class="stat-icon rank" style="color: ${
                                    user.stats.rank === 'Bronze'  ? `#cd7f32` : `` +
                                    user.stats.rank === 'Silver'  ? `#dadada` : `` +
                                    user.stats.rank === 'Gold'    ? `#f3a50f` : `` +
                                    user.stats.rank === 'Diamond' ? `#1eb8dc` : ``
                                }; background-color: ${
                                    user.stats.rank === 'Bronze'  ? `#cd7f3233` : `` +
                                    user.stats.rank === 'Silver'  ? `#dadada33` : `` +
                                    user.stats.rank === 'Gold'    ? `#f3a50f33` : `` +
                                    user.stats.rank === 'Diamond' ? `#1eb8dc33` : ``
                                }"
                                >
                                <i class="fas fa-medal"></i>
                            </div>
                            <div class="stat-info">
                                <h4 data-i18n="rank">Rank</h4>
                                <div class="stat-value">${user.stats.rank}</div>
                            </div>
                        </div>
                        <div class="quick-stat">
                            <div class="stat-icon wins">
                                <i class="fas fa-trophy"></i>
                            </div>
                            <div class="stat-info">
                                <h4 data-i18n="wins">Wins</h4>
                                <div class="stat-value">${user.stats.wins}</div>
                            </div>
                        </div>
                        <div class="quick-stat">
                            <div class="stat-icon losses">
                                <i class="fas fa-times-circle"></i>
                            </div>
                            <div class="stat-info">
                                <h4 data-i18n="losses">Losses</h4>
                                <div class="stat-value">${user.stats.losses}</div>
                            </div>
                        </div>
                        <div class="quick-stat">
                            <div class="stat-icon winrate">
                                <i class="fas fa-percentage"></i>
                            </div>
                            <div class="stat-info">
                                <h4 data-i18n="winrate">Win Rate</h4>
                                <div class="stat-value">${user.stats.winrate}%</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Game Statistics with Pie Chart -->
                    <div class="game-stats card">
                        <h3 data-i18n="gameStatistics">Game Statistics</h3>
                        ${user.stats.wins + user.stats.losses > 0 ? `
                        <div class="stats-charts-container">
                            <div class="donut-chart-container">
                                <h4 data-i18n="gameResults">Game Results</h4>
                                <canvas id="results-chart" width="100" height="100"></canvas>
                                <div class="chart-legend">
                                    <span class="legend-item"><span class="color-box win"></span> Wins (${user.stats?.wins || 0})</span>
                                    <span class="legend-item"><span class="color-box loss"></span> Losses (${user.stats?.losses || 0})</span>
                                </div>
                            </div>
                            <div class="progress-chart-container">
                                <h4 data-i18n="winRate">Win Rate</h4>
                                <div class="progress-container">
                                    <div class="progress-bar" style="width: ${user.stats.winrate}%">
                                        <span class="progress-text">${user.stats.winrate}%</span>
                                    </div>
                                </div>
                                <p class="progress-label" data-i18n="basedOn">Based on ${user.stats.played} games played</p>
                            </div>
                        </div>
                        ` : '<p class="no-activity" data-i18n="noActivity">No matches played yet</p>'}
                    </div>
                    
                    <!-- Performance Overview with Bar Chart -->
                    <div class="activity-chart card">
                        <h3 data-i18n="performanceOverview">Performance Overview</h3>
                        ${user.stats.wins + user.stats.losses > 0 ? `
                        <div class="chart-container">
                            <canvas id="performance-chart" width="100%" height="250"></canvas>
                        </div>
                        <div class="stat-cards">
                            <div class="stat-card">
                                <div class="stat-card-value">${user.stats.level}</div>
                                <div class="stat-card-label" data-i18n="level">Level</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-card-value">${user.stats.played}</div>
                                <div class="stat-card-label" data-i18n="totalGames">Total Games</div>
                            </div>
                        </div>
                        ` : '<p class="no-activity" data-i18n="noActivity">No matches played yet</p>'}
                    </div>
                    
                    <!-- Recent Activity -->
                    <div class="recent-activity card">
                        <h3 data-i18n="recentActivity">Recent Activity</h3>
                        <div class="activity-list">
                            ${user.match_history && user.match_history.length > 0 ? 
                                user.match_history.slice(0, 5).map(match => `
                                    <div class="activity-item ${match.result}">
                                        <div class="activity-icon">
                                            <i class="fas fa-${match.result === 'win' ? 'trophy' : 'times-circle'}"></i>
                                        </div>
                                        <div class="activity-details">
                                            <div class="activity-primary">
                                                <span class="game-result" data-i18n="${match.result === 'win' ? 'won' : 'lost'}">${match.result === 'win' ? 'Won' : 'Lost'} against ${match.opponent_name}</span>
                                                <span class="game-score">${match.score}</span>
                                            </div>
                                            <div class="activity-meta">
                                                <span class="game-date">${match.date}</span>
                                                ${match.game_mode ? `<span class="game-mode">${match.game_mode}</span>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `).join('') : 
                                '<p class="no-activity" data-i18n="noActivity">No recent matches</p>'
                            }
                        </div>
                        <a href="#/profile" class="view-all-link" data-i18n="viewAllActivity">View all activity</a>
                    </div>
                    
                    <!-- Top Players -->
                    <div class="top-players card">
                        <h3 data-i18n="topPlayers">Top Players</h3>
                        <div class="tabs">
                            <button class="tab active" data-tab="wins" data-i18n="byWins">By Wins</button>
                            <button class="tab" data-tab="winrate" data-i18n="byWinrate">By Win Rate</button>
                        </div>
                        <div class="tab-content" id="leaderboard-tab-content">
                            <div class="tab-pane active" id="wins-leaderboard">
                                <div class="leaderboard-loading" data-i18n="loadingLeaderboard">Loading leaderboard...</div>
                            </div>
                            <div class="tab-pane" id="winrate-leaderboard">
                                <div class="leaderboard-loading" data-i18n="loadingLeaderboard">Loading leaderboard...</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            rootElement.appendChild(this.element);
            applyTranslations(window.currentLanguage || "english");
            // Load Chart.js and initialize charts
            this.loadChartJS().then(() => {
                this.initializeCharts(user);
                this.loadLeaderboards();
                this.setupEventListeners();
            });
        } catch (error) {
            console.error("Error rendering dashboard:", error);
            if (this.element)
                this.element.innerHTML = '<div class="dashboard-error"><h2>Error Loading Dashboard</h2><p>There was an error loading this dashboard. Please try again later.</p></div>';
        }
    }
    
    private async loadChartJS(): Promise<void> {
        return new Promise((resolve) => {
            // Check if Chart.js is already loaded
            if (window.Chart) {
                resolve();
                return;
            }
            
            // Load Chart.js
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
            script.onload = () => resolve();
            document.head.appendChild(script);
        });
    }
    
private initializeCharts(user: UserProfile): void {
    if (!window.Chart || !user || !user.stats) return;
    
    // Results Donut Chart
    const resultsChartCanvas = document.getElementById('results-chart') as HTMLCanvasElement;
    if (resultsChartCanvas) {
        const resultsChart = new window.Chart(resultsChartCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Wins', 'Losses'],
                datasets: [{
                    data: [user.stats.wins, user.stats.losses],
                    backgroundColor: ['#4CAF50', '#F44336'],
                    borderColor: '#1d1f21',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        displayColors: false
                    }
                },
                cutout: '70%'
            }
        });

        this.charts.push(resultsChart);
    }

    const performanceChartCanvas = document.getElementById('performance-chart') as HTMLCanvasElement;
    if (performanceChartCanvas && user.match_history && user.match_history.length > 0) {
        // Process match history data
        const matchData = [...user.match_history];
        const labels = matchData.map((_, index) => `${index + 1}`);


        // const matchResults = [1, 0, 1, 1, 0]; // Example array
        let matchResults: number[] = [];
        for (const match of user.match_history) {
            if (match.result === 'loss')
                matchResults.push(0);
            if (match.result === 'win')
                matchResults.push(1);
        }

        // Extract scores from match data and calculate performance metrics
        const scores = matchData.map(match => {
            const [playerScore, opponentScore] = match.score.split('-').map(Number);
            return {
                playerScore,
                opponentScore,
                pointDifference: playerScore - opponentScore,
                pointRatio: playerScore / (playerScore + opponentScore)
            };
        });

        // Calculate win rate over time
        const winRates = matchResults.map((_, index) => {
            // Get games played so far from index 0 to index (inclusive)
            const gamesSoFar = matchResults.slice(0, index + 1);
            const winsSoFar = gamesSoFar.reduce((sum, result) => sum + result, 0);
            const winPercentage = Math.round((winsSoFar / gamesSoFar.length) * 100);
            return winPercentage;
          });

        // Calculate point difference percentage
        const pointPerformance = scores.map(score => score.pointRatio * 100);

        const performanceChart = new window.Chart(performanceChartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Win Rate %',
                        data: winRates,
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderColor: 'rgba(76, 175, 80, 0.8)',
                        borderWidth: 2,
                        pointBackgroundColor: matchResults.map(result => result === 1 ? '#4CAF50' : '#F44336'), // Green for wins, red for losses
                        pointBorderColor: '#fff',
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context: any) {
                                return `Win Rate: ${context.raw}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 0,
                        max: 100,
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });

        this.charts.push(performanceChart);
    }
}
    
private async loadLeaderboards(): Promise<void> {
    const allPlayers = await getAllUsers();
    const topPlayersByWins = allPlayers.sort((a, b) => (b.stats?.wins || 0) - (a.stats?.wins || 0));
    this.renderLeaderboard('wins-leaderboard', topPlayersByWins, 'wins');

    const topPlayersByWinRate = allPlayers.sort((a, b) => (b.stats?.winrate || 0) - (a.stats?.winrate || 0));
    this.renderLeaderboard('winrate-leaderboard', topPlayersByWinRate, 'winrate');
}
    
private renderLeaderboard(containerId: string, players: UserProfile[], type: 'wins' | 'winrate'): void {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (players.length === 0) {
            container.innerHTML = '<p class="no-data">No player data available</p>';
            return;
        }

        let html = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>${type === 'wins' ? 'Wins' : 'Win Rate'}</th>
                        <th>Total Games</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // only display top 10 players at most
        players.slice(0, 10).forEach((player, index) => {
            const totalGames = (player.stats?.wins || 0) + (player.stats?.losses || 0);
            const winRate = player.stats?.winrate;
            
            const isCurrentUser = player.id === this.currentUserID;

			let avatarUrl = player.avatar_url 
			? (() => {
				try {
					const urlObj = new URL(player.avatar_url);
					// Only rewrite if hostname is localhost or 127.0.0.1
					if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
						// Return path only, so browser loads from your HTTPS domain + path
						return urlObj.pathname;
					} else {
						// External URLs, keep as-is
						return player.avatar_url;
					}
				} catch {
					return player.avatar_url;  // fallback
				}
			})()
			: 'https://placehold.co/30x30/1d1f21/ffffff?text=User';

			// <a href="#/profile/${player.id}" class="player-link">
			// 	<img src="${player.avatar_url || 'https://placehold.co/30x30/1d1f21/ffffff?text=User'}" alt="${player.display_name}" class="player-avatar">
			// 	<span>${player.display_name}</span>
			// </a>
            html += `
                <tr class="${isCurrentUser ? 'current-user' : ''}">
                    <td class="rank">${index + 1}</td>
                    <td class="player">
                        <a href="#/profile/${player.id}" class="player-link">
                            <img src="${avatarUrl}" alt="${player.display_name}" class="player-avatar">
                            <span>${player.display_name}</span>
                        </a>
                    </td>
                    <td class="stat">${type === 'wins' ? player.stats?.wins : winRate + '%'}</td>
                    <td class="total">${totalGames}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

    container.innerHTML = html;
}
    
private setupEventListeners(): void {
        if (!this.element) return;

        // Tab navigation for leaderboard
        const tabs = this.element.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show corresponding tab content
                const tabPanes = this.element?.querySelectorAll('.tab-pane');
                tabPanes?.forEach(pane => {
                    if (pane.id === `${tabId}-leaderboard`) {
                        pane.classList.add('active');
                    } else {
                        pane.classList.remove('active');
                    }
                });
            });
        });
    }
    
    destroy(): void {
        console.log("--- DESTROYING DASHBOARD VIEW ---");
        this.charts.forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = [];
        this.element?.remove();
        this.element = null;
    }
}
