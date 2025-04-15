export class ChatView {
    render(element: HTMLElement) {
        element.innerHTML = `<h2>Chat</h2><p>Live chat interface will go here.</p>`;
    }
     destroy() { console.log('ChatView destroyed'); }
}