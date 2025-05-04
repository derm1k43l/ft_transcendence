export function createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.classList.add('button'); // Use the CSS class
    button.addEventListener('click', onClick);
    return button;
}
