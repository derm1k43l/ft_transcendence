export interface NotificationOptions {
  title?: string;
  message: string;
  duration?: number; // in milliseconds
  type?: 'info' | 'success' | 'warning' | 'error';
}

export class NotificationManager {
  private static container: HTMLElement | null = null;

  static initialize(): void {
      this.container = document.getElementById('notification-container');
      if (!this.container) {
          this.container = document.createElement('div');
          this.container.id = 'notification-container';
          document.body.appendChild(this.container);
      }
  }

  static show(options: NotificationOptions): void {
      if (!this.container) this.initialize();

      const defaults = {
          title: '',
          duration: 3000,
          type: 'info' as const
      };

      const settings = { ...defaults, ...options };

      // Create toast element
      const toast = document.createElement('div');
      toast.className = `toast ${settings.type}`;

      // Create container for icon
      const container1 = document.createElement('div');
      container1.className = 'container-1';
      const icon = document.createElement('i');
      icon.className = settings.type === 'success' ? 'fas fa-check-circle success' :
                      settings.type === 'error' ? 'fas fa-exclamation-circle error' :
                      settings.type === 'info' ? 'fas fa-info-circle info' :
                      'fas fa-exclamation-triangle warning'; // Default to warning icon
      container1.appendChild(icon);

      // Create container for text
      const container2 = document.createElement('div');
      container2.className = 'container-2';
      const titleEl = document.createElement('p');
      titleEl.textContent = settings.title || capitalize(settings.type);
      const messageEl = document.createElement('p');
      messageEl.textContent = settings.message;
      container2.appendChild(titleEl);
      container2.appendChild(messageEl);

      // Create close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', () => {
          toast.remove();
      });

      // Assemble toast
      toast.appendChild(container1);
      toast.appendChild(container2);
      toast.appendChild(closeBtn);

      // Add to container
      this.container?.appendChild(toast);

      // Remove after duration
      setTimeout(() => {
          toast.remove();
      }, settings.duration);
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}