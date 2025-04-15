export class ProfileView {
    render(element: HTMLElement) {
        element.innerHTML = `<h2>Profile</h2><p>User profile details will go here. this is page after log in</p>`;
    }
    destroy() { console.log('ProfileView destroyed'); }
}