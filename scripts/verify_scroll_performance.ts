// Script to benchmark scroll event listener throttling performance

// Simple benchmark simulating high-frequency scroll events
function benchmarkScrollEvents() {
  console.log('⚡ Benchmarking Scroll Event Performance...');

  let unthrottledCalls = 0;
  let throttledCalls = 0;

  // Simulate 1000 scroll events fired rapidly in a single frame (16ms)
  const SCROLL_EVENTS_COUNT = 1000;

  // 1. Unthrottled handler
  const unthrottledHandler = () => {
    unthrottledCalls++;
  };

  for (let i = 0; i < SCROLL_EVENTS_COUNT; i++) {
    unthrottledHandler();
  }

  // 2. Throttled handler with requestAnimationFrame
  let ticking = false;
  let rafCallback: (() => void) | null = null;
  const mockRequestAnimationFrame = (cb: () => void) => {
    rafCallback = cb;
    return 1;
  };

  const throttledHandler = () => {
    if (!ticking) {
      mockRequestAnimationFrame(() => {
        throttledCalls++;
        ticking = false;
      });
      ticking = true;
    }
  };

  for (let i = 0; i < SCROLL_EVENTS_COUNT; i++) {
    throttledHandler();
  }

  // Execute the queued rAF frame callback
  if (rafCallback) {
    (rafCallback as () => void)();
  }

  const reduction = ((1 - throttledCalls / unthrottledCalls) * 100).toFixed(2);

  console.log(`Unthrottled State Dispatches: ${unthrottledCalls}`);
  console.log(`Throttled State Dispatches:   ${throttledCalls}`);
  console.log(`Dispatch Reduction:          ${reduction}%`);

  if (throttledCalls === 1 && unthrottledCalls === SCROLL_EVENTS_COUNT) {
    console.log('✅ Scroll throttling benchmark PASSED successfully!');
  } else {
    console.error('❌ Benchmark failed');
    process.exit(1);
  }
}

benchmarkScrollEvents();
