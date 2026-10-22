/**
 * scripts/verify_scroll_performance.ts
 *
 * Simulates rapid scroll event bursts (1000 events across 16 animation frames)
 * comparing unthrottled scroll handlers with requestAnimationFrame throttled handlers.
 */

function runScrollBenchmark() {
  const TOTAL_SCROLL_EVENTS = 1000;
  const FRAMES = 16; // ~16ms frames (60fps)
  const EVENTS_PER_FRAME = Math.floor(TOTAL_SCROLL_EVENTS / FRAMES);

  // Unthrottled simulation
  let unthrottledExecutions = 0;
  const unthrottledHandler = () => {
    unthrottledExecutions++;
  };

  const startUnthrottled = performance.now();
  for (let i = 0; i < TOTAL_SCROLL_EVENTS; i++) {
    unthrottledHandler();
  }
  const unthrottledTime = performance.now() - startUnthrottled;

  // Throttled simulation with requestAnimationFrame ticking pattern
  let throttledExecutions = 0;
  let ticking = false;

  const rAFCallbacks: Array<() => void> = [];
  const requestAnimationFrameMock = (cb: () => void) => {
    rAFCallbacks.push(cb);
  };

  const throttledHandler = () => {
    if (!ticking) {
      requestAnimationFrameMock(() => {
        throttledExecutions++;
        ticking = false;
      });
      ticking = true;
    }
  };

  const startThrottled = performance.now();
  for (let f = 0; f < FRAMES; f++) {
    for (let e = 0; e < EVENTS_PER_FRAME; e++) {
      throttledHandler();
    }
    // End of frame tick: trigger queued rAF callbacks
    while (rAFCallbacks.length > 0) {
      const cb = rAFCallbacks.shift();
      cb?.();
    }
  }
  const throttledTime = performance.now() - startThrottled;

  const reduction = ((unthrottledExecutions - throttledExecutions) / unthrottledExecutions) * 100;

  console.log('⚡ Bolt Performance Benchmark: Scroll Event Listener Throttling');
  console.log(`Rapid Scroll Burst: ${TOTAL_SCROLL_EVENTS} scroll events across ${FRAMES} frames`);
  console.log(`- Unthrottled Executions: ${unthrottledExecutions} calls (${unthrottledTime.toFixed(3)}ms)`);
  console.log(`- Throttled Executions:   ${throttledExecutions} calls (${throttledTime.toFixed(3)}ms)`);
  console.log(`- Execution Reduction:    ${reduction.toFixed(1)}%`);
}

runScrollBenchmark();
