/** Start optional UI work near the viewport, without returning a navigation promise. */
export function deferUntilVisible(
	element: HTMLElement,
	callback: () => void,
	idle = false,
): () => void {
	let cancelled = false;
	let observer: IntersectionObserver | undefined;
	let cancelScheduled = () => {};
	const start = () => {
		observer?.disconnect();
		const run = () => {
			if (!cancelled && element.isConnected) callback();
		};
		if (idle && "requestIdleCallback" in window) {
			const handle = window.requestIdleCallback(run, { timeout: 1200 });
			cancelScheduled = () => window.cancelIdleCallback(handle);
		} else {
			const handle = window.setTimeout(run, 0);
			cancelScheduled = () => window.clearTimeout(handle);
		}
	};
	if ("IntersectionObserver" in window) {
		observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) start();
			},
			{ rootMargin: "200px" },
		);
		observer.observe(element);
	} else {
		start();
	}
	return () => {
		cancelled = true;
		observer?.disconnect();
		cancelScheduled();
	};
}
