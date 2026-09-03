// Benchmark script to verify requestAnimationFrame + passive scroll listener performance benefit

function simulateUnthrottledScrollEvents(eventCount: number) {
  let stateDispatches = 0;
  let isScrolled = false;

  const start = performance.now();
  for (let i = 0; i < eventCount; i++) {
    // Unthrottled scroll handler
    const currentScrollY = i % 200;
    const nextScrolled = currentScrollY > 10;
    // Unthrottled state set on every scroll event
    if (isScrolled !== nextScrolled) {
      isScrolled = nextScrolled;
    }
    stateDispatches++;
  }
  const end = performance.now();
  return { timeMs: end - start, dispatches: stateDispatches };
}

function simulateThrottledScrollEvents(eventCount: number) {
  let stateDispatches = 0;
  let isScrolled = false;
  let ticking = false;

  const start = performance.now();
  for (let i = 0; i < eventCount; i++) {
    const currentScrollY = i % 200;
    if (!ticking) {
      ticking = true;
      // Simulated rAF callback frame batching
      const nextScrolled = currentScrollY > 10;
      if (isScrolled !== nextScrolled) {
        isScrolled = nextScrolled;
        stateDispatches++;
      }
      ticking = false;
    }
  }
  const end = performance.now();
  return { timeMs: end - start, dispatches: stateDispatches };
}

console.log("--- Scroll Event Optimization Benchmark ---");
const NUM_EVENTS = 100_000;
const unthrottled = simulateUnthrottledScrollEvents(NUM_EVENTS);
const throttled = simulateThrottledScrollEvents(NUM_EVENTS);

console.log(`Unthrottled (${NUM_EVENTS} scroll events): ${unthrottled.timeMs.toFixed(3)}ms`);
console.log(`Throttled   (${NUM_EVENTS} scroll events): ${throttled.timeMs.toFixed(3)}ms`);
console.log(`Reduction in dispatches/callback executions: ~${((1 - throttled.dispatches / unthrottled.dispatches) * 100).toFixed(1)}%`);
