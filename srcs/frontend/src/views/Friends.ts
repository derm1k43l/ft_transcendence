export class FriendsView {

    render(element: HTMLElement) {
        element.innerHTML = `
            <h2>Friends</h2>
            <p>Friend list and requests will go here.</p>
            `;
        console.log('FriendsView rendered');
    }

    destroy() {
        console.log('FriendsView destroyed');
    }
}
