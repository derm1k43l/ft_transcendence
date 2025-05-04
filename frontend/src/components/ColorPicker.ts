// Optional: Create a reusable component for color pickers with value display
export class ColorPicker {
    private container: HTMLElement;
    private input: HTMLInputElement;
    private valueDisplay: HTMLElement;
    
    constructor(
        containerId: string, 
        initialValue: string = '#000000', 
        onChange?: (value: string) => void
    ) {
        const container = document.getElementById(containerId);
        if (!container) throw new Error(`Container ${containerId} not found`);
        
        this.container = container;
        
        // Create the elements
        this.input = document.createElement('input');
        this.input.type = 'color';
        this.input.value = initialValue;
        
        this.valueDisplay = document.createElement('span');
        this.valueDisplay.className = 'color-value';
        this.valueDisplay.textContent = initialValue;
        
        // Create the preview container
        const previewContainer = document.createElement('div');
        previewContainer.className = 'color-preview';
        previewContainer.appendChild(this.input);
        previewContainer.appendChild(this.valueDisplay);
        
        // Add to container
        this.container.appendChild(previewContainer);
        
        // Set up event listener
        this.input.addEventListener('input', () => {
            this.valueDisplay.textContent = this.input.value;
            if (onChange) onChange(this.input.value);
        });
    }
    
    getValue(): string {
        return this.input.value;
    }
    
    setValue(value: string): void {
        this.input.value = value;
        this.valueDisplay.textContent = value;
    }
    
    disable(): void {
        this.input.disabled = true;
    }
    
    enable(): void {
        this.input.disabled = false;
    }
}