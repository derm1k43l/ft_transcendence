import { Router } from '../core/router.js';
import { getUserById, getTopPlayers } from '../data/UserService.js';

export class DashboardView {
    private element: HTMLElement | null = null;
    private router: Router;
    private currentUserId: number = 1; //changeme
    private charts: any[] = [];
    
    constructor(router: Router) {
        this.router = router;
    }

    render(rootElement: HTMLElement): void {
        this.element = document.createElement('div');
        this.element.className = 'dashboard-view';
        
        const user = getUserById(this.currentUserId);
        if (!user) {
            this.element.innerHTML = '<p>User not found</p>';
            rootElement.appendChild(this.element);
            return;
        }
        
        // Calculate stats
        const totalGames = (user.stats?.wins || 0) + (user.stats?.losses || 0);
        const winRate = totalGames > 0 ? ((user.stats?.wins || 0) / totalGames * 100) : 0;
        const formattedWinRate = winRate.toFixed(1);
        
        this.element.innerHTML = `
            <div class="dashboard-header">
                <h2>Welcome back, ${user.displayName}!</h2>
                <p class="last-login">Last login: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
            
            <div class="dashboard-content">
                <!-- Quick Stats in single row -->
                <div class="quick-stats card">
                    <div class="quick-stat">
                        <div class="stat-icon rank">
                            <i class="fas fa-medal"></i>
                        </div>
                        <div class="stat-info">
                            <h4>Rank</h4>
                            <div class="stat-value">${user.stats?.rank || '-'}</div>
                        </div>
                    </div>
                    <div class="quick-stat">
                        <div class="stat-icon wins">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="stat-info">
                            <h4>Wins</h4>
                            <div class="stat-value">${user.stats?.wins || 0}</div>
                        </div>
                    </div>
                    <div class="quick-stat">
                        <div class="stat-icon losses">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="stat-info">
                            <h4>Losses</h4>
                            <div class="stat-value">${user.stats?.losses || 0}</div>
                        </div>
                    </div>
                    <div class="quick-stat">
                        <div class="stat-icon winrate">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="stat-info">
                            <h4>Win Rate</h4>
                            <div class="stat-value">${formattedWinRate}%</div>
                        </div>
                    </div>
                </div>
                
                <!-- Game Statistics with Pie Chart -->
                <div class="game-stats card">
                    <h3>Game Statistics</h3>
                    <div class="stats-charts-container">
                        <div class="donut-chart-container">
                            <h4>Game Results</h4>
                            <canvas id="results-chart" width="100" height="100"></canvas>
                            <div class="chart-legend">
                                <span class="legend-item"><span class="color-box win"></span> Wins (${user.stats?.wins || 0})</span>
                                <span class="legend-item"><span class="color-box loss"></span> Losses (${user.stats?.losses || 0})</span>
                            </div>
                        </div>
                        <div class="progress-chart-container">
                            <h4>Win Rate</h4>
                            <div class="progress-container">
                                <div class="progress-bar" style="width: ${formattedWinRate}%">
                                    <span class="progress-text">${formattedWinRate}%</span>
                                </div>
                            </div>
                            <p class="progress-label">Based on ${totalGames} games played</p>
                        </div>
                    </div>
                </div>
                
                <!-- Performance Overview with Bar Chart -->
                <div class="activity-chart card">
                    <h3>Performance Overview</h3>
                    <div class="chart-container">
                        <canvas id="performance-chart" width="100%" height="250"></canvas>
                    </div>
                    <div class="stat-cards">
                                <div class="stat-card">
                                    <div class="stat-card-value">${user.stats?.level || 1}</div>
                                    <div class="stat-card-label">Level</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-card-value">${totalGames}</div>
                                    <div class="stat-card-label">Total Games</div>
                                </div>
                            </div>
                </div>
                
                <!-- Recent Activity -->
                <div class="recent-activity card">
                    <h3>Recent Activity</h3>
                    <div class="activity-list">
                        ${user.matchHistory && user.matchHistory.length > 0 ? 
                            user.matchHistory.slice(0, 5).map(match => `
                                <div class="activity-item ${match.result}">
                                    <div class="activity-icon">
                                        <i class="fas fa-${match.result === 'win' ? 'trophy' : 'times-circle'}"></i>
                                    </div>
                                    <div class="activity-details">
                                        <div class="activity-primary">
                                            <span class="game-result">${match.result === 'win' ? 'Won' : 'Lost'} against ${match.opponent}</span>
                                            <span class="game-score">${match.score}</span>
                                        </div>
                                        <div class="activity-meta">
                                            <span class="game-date">${match.date}</span>
                                            ${match.gameMode ? `<span class="game-mode">${match.gameMode}</span>` : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('') : 
                            '<p class="no-activity">No recent matches</p>'
                        }
                    </div>
                    <a href="#/profile" class="view-all-link">View all activity</a>
                </div>
                
                <!-- Top Players -->
                <div class="top-players card">
                    <h3>Top Players</h3>
                    <div class="tabs">
                        <button class="tab active" data-tab="wins">By Wins</button>
                        <button class="tab" data-tab="winrate">By Win Rate</button>
                    </div>
                    <div class="tab-content" id="leaderboard-tab-content">
                        <div class="tab-pane active" id="wins-leaderboard">
                            <div class="leaderboard-loading">Loading leaderboard...</div>
                        </div>
                        <div class="tab-pane" id="winrate-leaderboard">
                            <div class="leaderboard-loading">Loading leaderboard...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        rootElement.appendChild(this.element);
        
        // Load Chart.js and initialize charts
        this.loadChartJS().then(() => {
            this.initializeCharts(user);
            this.loadLeaderboards();
            this.setupEventListeners();
        });
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
    
private initializeCharts(user: any): void {
    if (!window.Chart) return;
    
    // Results Donut Chart
    const resultsChartCanvas = document.getElementById('results-chart') as HTMLCanvasElement;
    if (resultsChartCanvas) {
        const resultsChart = new window.Chart(resultsChartCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Wins', 'Losses'],
                datasets: [{
                    data: [user.stats?.wins || 0, user.stats?.losses || 0],
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
    if (performanceChartCanvas && user.matchHistory && user.matchHistory.length > 0) {
        // Process match history data
        const matchData = [...user.matchHistory].reverse().slice(0, 10).reverse();
        const labels = matchData.map((_, index) => `Match ${index + 1}`);
        
        const matchResults = [1, 0, 1, 1, 0]; // Example array
        
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
            const winPercentage = (winsSoFar / gamesSoFar.length) * 100;
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
                        label: 'Match Result (Win/Loss)',
                        data: matchResults,
                        backgroundColor: 'rgba(124, 92, 255, 0.2)',
                        borderColor: 'rgba(124, 92, 255, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: matchResults.map(result => result === 1 ? '#4CAF50' : '#F44336'),
                        pointBorderColor: '#fff',
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        tension: 0.1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Win Rate %',
                        data: winRates,
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderColor: 'rgba(76, 175, 80, 0.8)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(76, 175, 80, 0.8)',
                        pointBorderColor: '#fff',
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        tension: 0.4,
                        yAxisID: 'y1',
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
                                if (context.datasetIndex === 0) {
                                    return context.raw === 1 ? 'Win' : 'Loss';
                                } else if (context.datasetIndex === 1) {
                                    return `Win Rate: ${context.raw.toFixed(1)}%`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: -0.5,
                        max: 1.5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value: number) {
                                if (value === 0) return 'Loss';
                                if (value === 1) return 'Win';
                                return '';
                            },
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Win Rate %',
                            color: 'rgba(76, 175, 80, 0.8)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            drawOnChartArea: false
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
    
private loadLeaderboards(): void {
    // Load top 10 by wins
    const topPlayersByWins = getTopPlayers('wins', 10);
    this.renderLeaderboard('wins-leaderboard', topPlayersByWins, 'wins');
        
    // Load top 10 by win rate
    const topPlayersByWinRate = getTopPlayers('winrate', 10);
    this.renderLeaderboard('winrate-leaderboard', topPlayersByWinRate, 'winrate');
}
    
private renderLeaderboard(containerId: string, players: any[], type: 'wins' | 'winrate'): void {
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
        
        players.forEach((player, index) => {
            const totalGames = (player.stats?.wins || 0) + (player.stats?.losses || 0);
            const winRate = totalGames > 0 ? ((player.stats?.wins || 0) / totalGames * 100).toFixed(1) : '0.0';
            
            const isCurrentUser = player.id === this.currentUserId;
            
            html += `
                <tr class="${isCurrentUser ? 'current-user' : ''}">
                    <td class="rank">${index + 1}</td>
                    <td class="player">
                        <a href="#/profile/${player.id}" class="player-link">
                            <img src="${player.avatarUrl || 'https://placehold.co/30x30/1d1f21/ffffff?text=User'}" alt="${player.displayName}" class="player-avatar">
                            <span>${player.displayName}</span>
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
        this.charts.forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = [];
        this.element = null;
    }
}