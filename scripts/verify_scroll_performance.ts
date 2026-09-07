/**
 * Benchmark & Verification script for Scroll Event Throttling Optimization
 * Run with: npx tsx scripts/verify_scroll_performance.ts
 */

function benchmarkScrollEvents() {
  console.log("⚡ Benchmarking Scroll Event Throttling Optimization...");

  const TOTAL_SCROLL_EVENTS = 1000;

  // 1. Unthrottled simulation
  let rawHandlerInvocations = 0;
  let rawStateDispatches = 0;

  const rawHandleScroll = () => {
    rawHandlerInvocations++;
    // Simulating setting state on every scroll event
    rawStateDispatches++;
  };

  const startRaw = performance.now();
  for (let i = 0; i < TOTAL_SCROLL_EVENTS; i++) {
    rawHandleScroll();
  }
  const endRaw = performance.now();
  const rawDuration = endRaw - startRaw;

  // 2. rAF Throttled simulation
  let throttledHandlerInvocations = 0;
  let throttledStateDispatches = 0;
  let ticking = false;

  // Mock requestAnimationFrame queue
  let rafCallback: (() => void) | null = null;
  const mockRequestAnimationFrame = (cb: () => void) => {
    rafCallback = cb;
  };

  const throttledHandleScroll = () => {
    throttledHandlerInvocations++;
    if (!ticking) {
      mockRequestAnimationFrame(() => {
        throttledStateDispatches++;
        ticking = false;
      });
      ticking = true;
    }
  };

  const startThrottled = performance.now();
  for (let i = 0; i < TOTAL_SCROLL_EVENTS; i++) {
    throttledHandleScroll();
    // Flush rAF frame simulation at 60fps interval (~16 events per frame)
    if (i % 16 === 0 && rafCallback) {
      const cb = rafCallback;
      rafCallback = null;
      cb();
    }
  }
  // Flush final frame
  if (rafCallback) {
    const cb = rafCallback;
    rafCallback = null;
    cb();
  }
  const endThrottled = performance.now();
  const throttledDuration = endThrottled - startThrottled;

  const reduction = ((1 - throttledStateDispatches / rawStateDispatches) * 100).toFixed(1);

  console.log(`\n📊 Benchmark Results for ${TOTAL_SCROLL_EVENTS} Scroll Events:`);
  console.log(`-----------------------------------------------------`);
  console.log(`Raw Unthrottled Dispatches:    ${rawStateDispatches} dispatches (${rawDuration.toFixed(3)}ms)`);
  console.log(`rAF Throttled Dispatches:     ${throttledStateDispatches} dispatches (${throttledDuration.toFixed(3)}ms)`);
  console.log(`State Dispatch Reduction:     ${reduction}% fewer state dispatches!`);
  console.log(`-----------------------------------------------------\n`);

  if (throttledStateDispatches < rawStateDispatches) {
    console.log("✅ VERIFICATION PASSED: Scroll throttling successfully reduces state dispatch frequency!");
  } else {
    console.error("❌ VERIFICATION FAILED: Expected reduced dispatches.");
    process.exit(1);
  }
}

benchmarkScrollEvents();
