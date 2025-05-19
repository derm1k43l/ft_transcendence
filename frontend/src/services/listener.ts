// Event Listener management
export interface Listener {
  element: EventTarget | null | undefined;
  event: string;
  handler: EventListener;
}

export function addListener(l: Listener, target: Listener[]) {
	if (!l.element)
		return ;
	l.element.addEventListener(l.event, l.handler);
	target.push(l);
}

export function removeListener(l: Listener) {
	l.element?.removeEventListener(l.event, l.handler);
}

export function removeListeners(listeners: Listener[]) {
	listeners.forEach(removeListener);
	listeners.length = 0;
}
