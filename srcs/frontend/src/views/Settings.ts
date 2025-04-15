export class SettingsView {
    render(element: HTMLElement) {
       element.innerHTML = `<h2>Settings</h2><p>User settings will go here.</p>`;
   }
    destroy() { console.log('SettingsView destroyed'); }
}