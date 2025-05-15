export class AboutView {
    private element: HTMLElement | null = null;

    render(rootElement: HTMLElement): void {
        this.element = document.createElement('div');
        this.element.classList.add('about-content-container');
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
                </div>
                    
                    <!-- Team Member 2 -->
                    <div class="team-member">
                        <div class="member-image">
                            <img src="https://cdn.intra.42.fr/users/c42696b98cd04a190704d34532d2d49e/rhorvath.jpg" alt="Richard Horvath">
                        </div>
                        <h3>Richard Horvath</h3>
                        <p class="member-role">Backend Developer</p>
                    </div>

                    <!-- Team Member 3 -->
                    <div class="team-member">
                        <div class="member-image">
                            <img src="https://cdn.intra.42.fr/users/39a5f284770463b7fb780a9e1c8ed663/cstoia.jpg" alt="Cosmin Stoia">
                        </div>
                        <h3>Cosmin Stoia</h3>
                        <p class="member-role">Game development</p>
                    </div>

                    <!-- Team Member 4 -->
                    <div class="team-member">
                        <div class="member-image">
                            <img src="https://cdn.intra.42.fr/users/eb9f45c7ec8c0eae8fa3506ff1091a33/sgeiger.jpg" alt="Sören Geiger">
                        </div>
                        <h3>Sören Geiger</h3>
                        <p class="member-role">Tournament development</p>
                    </div>

                    <!-- Team Member 5 -->
                    <div class="team-member">
                        <div class="member-image">
                            <img src="https://cdn.intra.42.fr/users/a4c23a26fdf7a9023fcd43e8942158af/bwerner.jpg" alt="Benjamin Werner">
                        </div>
                        <h3>Benjamin Werner</h3>
                        <p class="member-role">Security development</p>
                    </div>
            </div>
        `;
        rootElement.appendChild(this.element);
    }

    destroy(): void {
        console.log('AboutView destroyed');
    }
}
