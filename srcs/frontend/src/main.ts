// DOM loaded event listener
document.addEventListener('DOMContentLoaded', () => {
    console.log('ft_transcendence frontend loaded');
    
    // Get the main heading element
    const heading = document.querySelector('h1');
    
    if (heading) {
        heading.textContent = 'Welcome to ft_transcendence!';
    }
});