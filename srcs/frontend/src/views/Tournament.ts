export class TournamentView {
    render(element: HTMLElement) {
        element.innerHTML = `<h2>TournamentView</h2><p>tournament...</p>`;
    }
    destroy(): void {
        console.log('TournamentView destroyed');
    }
}
