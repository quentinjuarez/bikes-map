import { computed, reactive, ref } from 'vue';

// Swipe-down-to-dismiss for mobile bottom sheets / cards. Attach `handlers` to a
// non-scrolling drag zone (a grab handle or the sheet header) and bind `style`
// to the sheet root. Gesture is mobile-only; on desktop the handlers no-op so
// drawer/modal layouts are untouched.
const DISMISS_PX = 90; // drag far enough → close
const FLICK_VELOCITY = 0.5; // px/ms → a fast flick also closes
const SETTLE_MS = 200;

export function useSwipeDismiss(onDismiss: () => void) {
  const dragY = ref(0);
  const dragging = ref(false);
  const settling = ref(false);
  let startY = 0;
  let startT = 0;

  const isMobile = () => window.innerWidth < 768;

  function touchstart(e: TouchEvent) {
    if (!isMobile() || e.touches.length !== 1) return;
    dragging.value = true;
    settling.value = false;
    startY = e.touches[0]!.clientY;
    startT = e.timeStamp;
    dragY.value = 0;
  }

  function touchmove(e: TouchEvent) {
    if (!dragging.value) return;
    dragY.value = Math.max(0, e.touches[0]!.clientY - startY);
  }

  function touchend(e: TouchEvent) {
    if (!dragging.value) return;
    dragging.value = false;
    settling.value = true;
    const dist = dragY.value;
    const flick = dist / Math.max(1, e.timeStamp - startT) > FLICK_VELOCITY;

    if (dist > DISMISS_PX || (flick && dist > 20)) {
      // Animate the rest of the way down, then close.
      dragY.value = window.innerHeight;
      setTimeout(() => {
        settling.value = false;
        dragY.value = 0;
        onDismiss();
      }, SETTLE_MS);
    } else {
      // Snap back.
      dragY.value = 0;
      setTimeout(() => (settling.value = false), SETTLE_MS);
    }
  }

  // While idle (no drag, no settle) return {} so the component's enter/leave
  // <Transition> fully controls the transform; otherwise drive it inline.
  const style = computed(() => {
    if (!dragging.value && !settling.value && dragY.value === 0) return {};
    return {
      transform: `translateY(${dragY.value}px)`,
      transition: dragging.value ? 'none' : `transform ${SETTLE_MS}ms ease`,
      willChange: 'transform',
    };
  });

  // reactive() so nested refs unwrap when read as `drag.style` in templates
  // (a ref nested in a plain object would not auto-unwrap).
  return reactive({ style, handlers: { touchstart, touchmove, touchend } });
}
