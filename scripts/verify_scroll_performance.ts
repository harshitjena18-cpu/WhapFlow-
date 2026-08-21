/**
 * scripts/verify_scroll_performance.ts
 *
 * Benchmarks unthrottled scroll handler vs requestAnimationFrame throttled scroll handler
 * across 10,000 simulated scroll events.
 */

function benchmarkScrollHandlers() {
  const TOTAL_EVENTS = 10000;
  let unthrottledStateCalls = 0;
  let throttledStateCalls = 0;

  // 1. Unthrottled handler (simulates original Header.tsx behavior)
  const unthrottledHandler = (_scrollY: number) => {
    unthrottledStateCalls++;
  };

  // 2. Throttled handler with requestAnimationFrame simulation (simulates optimized Header.tsx)
  let ticking = false;
  let pendingFrameCallback: (() => void) | null = null;

  const mockRequestAnimationFrame = (cb: () => void) => {
    pendingFrameCallback = cb;
  };

  const throttledHandler = (_scrollY: number) => {
    if (!ticking) {
      mockRequestAnimationFrame(() => {
        throttledStateCalls++;
        ticking = false;
      });
      ticking = true;
    }
  };

  const startUnthrottled = performance.now();
  for (let i = 0; i < TOTAL_EVENTS; i++) {
    unthrottledHandler(i);
  }
  const endUnthrottled = performance.now();

  const startThrottled = performance.now();
  for (let i = 0; i < TOTAL_EVENTS; i++) {
    throttledHandler(i);
    // Simulate animation frame flush every 60 events (representing 60fps frame boundary)
    if (i % 60 === 0 && pendingFrameCallback) {
      pendingFrameCallback();
      pendingFrameCallback = null;
    }
  }
  if (pendingFrameCallback) {
    pendingFrameCallback();
  }
  const endThrottled = performance.now();

  console.log(`⚡ Scroll Handler Performance Benchmark (${TOTAL_EVENTS} scroll events)`);
  console.log(`- Unthrottled State Dispatches: ${unthrottledStateCalls}`);
  console.log(`- Throttled State Dispatches:   ${throttledStateCalls}`);
  console.log(`- Dispatch Reduction:          ${((1 - throttledStateCalls / unthrottledStateCalls) * 100).toFixed(1)}% fewer state updates`);
  console.log(`- Time Unthrottled:            ${(endUnthrottled - startUnthrottled).toFixed(3)}ms`);
  console.log(`- Time Throttled:              ${(endThrottled - startThrottled).toFixed(3)}ms`);
}

benchmarkScrollHandlers();
