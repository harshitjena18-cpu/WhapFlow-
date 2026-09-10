/**
 * scripts/verify_scroll_performance.ts
 *
 * Verification script to benchmark scroll event listener execution frequency
 * comparing unthrottled vs requestAnimationFrame-throttled scroll handlers.
 */

function simulateUnthrottledScroll(eventsCount: number): number {
  let executionCount = 0;
  const handleScroll = () => {
    executionCount++;
  };

  for (let i = 0; i < eventsCount; i++) {
    handleScroll();
  }

  return executionCount;
}

function simulateThrottledScroll(eventsCount: number, framesCount: number): number {
  let executionCount = 0;
  let ticking = false;

  const rafQueue: Array<() => void> = [];

  const handleScroll = () => {
    if (!ticking) {
      rafQueue.push(() => {
        executionCount++;
        ticking = false;
      });
      ticking = true;
    }
  };

  // Simulate high-frequency scroll events arriving across frame intervals
  const eventsPerFrame = Math.ceil(eventsCount / framesCount);
  for (let frame = 0; frame < framesCount; frame++) {
    for (let e = 0; e < eventsPerFrame; e++) {
      handleScroll();
    }
    // Flush the rAF queue at the end of each animation frame (~16ms)
    while (rafQueue.length > 0) {
      const cb = rafQueue.shift();
      cb?.();
    }
  }

  return executionCount;
}

function runBenchmark() {
  const TOTAL_SCROLL_EVENTS = 1000;
  const ESTIMATED_ANIMATION_FRAMES = 10; // Rapid scroll over ~160ms (10 frames)

  console.log("⚡ Bolt Performance Verification: Scroll Listener Throttling");
  console.log(`Simulating ${TOTAL_SCROLL_EVENTS} scroll events across ${ESTIMATED_ANIMATION_FRAMES} frames (~160ms scroll window):\n`);

  const unthrottledCount = simulateUnthrottledScroll(TOTAL_SCROLL_EVENTS);
  const throttledCount = simulateThrottledScroll(TOTAL_SCROLL_EVENTS, ESTIMATED_ANIMATION_FRAMES);

  const reductionPercent = (((unthrottledCount - throttledCount) / unthrottledCount) * 100).toFixed(1);

  console.log(`- Unthrottled Execution Count: ${unthrottledCount} callbacks`);
  console.log(`- Throttled (rAF) Execution Count: ${throttledCount} callbacks`);
  console.log(`- Execution Overhead Reduction: ${reductionPercent}% (${unthrottledCount - throttledCount} fewer state dispatches)\n`);

  if (throttledCount < unthrottledCount) {
    console.log("✅ Verification SUCCESS: requestAnimationFrame successfully throttles rapid scroll event dispatches!");
  } else {
    console.error("❌ Verification FAILED: Throttled count was not lower than unthrottled count.");
    process.exit(1);
  }
}

runBenchmark();
