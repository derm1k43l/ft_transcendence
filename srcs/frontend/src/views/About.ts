export class AboutView {
    private element: HTMLElement | null = null;

    render(rootElement: HTMLElement): void {
        this.element = document.createElement('div');
        this.element.classList.add('view', 'active');
        this.element.innerHTML = `
        <div class="about-container">
            <h2>About Our Team</h2>
            <p class="about-intro">
                Welcome to ft_transcendence, a modern web implementation of the classic Pong game.
            </p>
            
            <div class="team-grid">
                <!-- Team Member 1 -->
                <div class="team-member">
                    <div class="member-image">
                        <img src="https://mihai-rusu.com/blog/wp-content/uploads/mihairusuphoto.jpg" alt="Mihai Rusu">
                    </div>
                    <h3>
                        Mihai Rusu<br>
                        <a href="https://mihai-rusu.com" target="_blank" rel="noopener noreferrer" style="font-size: 0.8em; font-weight: normal;">
                            mihai-rusu.com
                        </a>
                    </h3>
                    <p class="member-role">Frontend Developer & Project Lead</p>
                    <p class="member-bio">
                        Focused on fast, minimal, and clean interfaces that just work. Handles both design and technical decisions across the app.
                    </p>
                </div>
                    
                    <!-- Team Member 2 -->
                    <div class="team-member">
                        <div class="member-image">
                            <img src="" alt="Richard Horvath">
                        </div>
                        <h3>Richard Horvath</h3>
                        <p class="member-role">Backend Developer</p>
                        <p class="member-bio">bioo.</p>
                    </div>

                    <!-- Team Member 3 -->
                    <div class="team-member">
                        <div class="member-image">
                            <img src="" alt="Team Member 3">
                        </div>
                        <h3>Jane Smith</h3>
                        <p class="member-role">role</p>
                        <p class="member-bio">bioo.</p>
                    </div>
            </div>
        `;
        rootElement.appendChild(this.element);
    }

    destroy(): void {
        console.log('AboutView destroyed');
    }
}