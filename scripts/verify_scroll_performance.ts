// Benchmark scroll event listener performance (unthrottled vs. requestAnimationFrame throttled)

function runBenchmark() {
  const TOTAL_SCROLL_EVENTS = 1000;
  let unthrottledExecutions = 0;
  let throttledExecutions = 0;

  // Simulate unthrottled scroll handler
  const unthrottledHandler = () => {
    unthrottledExecutions++;
  };

  // Simulate rAF-throttled scroll handler
  let ticking = false;
  const pendingCallbacks: Array<() => void> = [];

  const mockRequestAnimationFrame = (cb: () => void) => {
    pendingCallbacks.push(cb);
  };

  const throttledHandler = () => {
    if (!ticking) {
      mockRequestAnimationFrame(() => {
        throttledExecutions++;
        ticking = false;
      });
      ticking = true;
    }
  };

  // Simulate firing 1,000 rapid scroll events during a single frame animation window
  for (let i = 0; i < TOTAL_SCROLL_EVENTS; i++) {
    unthrottledHandler();
    throttledHandler();
  }

  // Flush frame callbacks (e.g. at 60fps frame boundary)
  while (pendingCallbacks.length > 0) {
    const cb = pendingCallbacks.shift();
    if (cb) cb();
  }

  console.log("⚡ Bolt Performance Verification: Scroll Handler Throttling");
  console.log(`Total Scroll Events Fired: ${TOTAL_SCROLL_EVENTS}`);
  console.log(`Unthrottled Executions:  ${unthrottledExecutions}`);
  console.log(`Throttled Executions:    ${throttledExecutions}`);
  console.log(`Reduction in Executions: ${((1 - throttledExecutions / unthrottledExecutions) * 100).toFixed(2)}%`);

  if (throttledExecutions === 1 && unthrottledExecutions === TOTAL_SCROLL_EVENTS) {
    console.log("✅ Verification successful! Throttling prevents main thread event spam.");
  } else {
    throw new Error("Verification failed!");
  }
}

runBenchmark();
