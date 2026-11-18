import { useEffect, useRef } from "react";

/**
 * On Vega, hasTVPreferredFocus takes focus again on every re-render while
 * it's true, not only when the element first appears. That pulled focus
 * back to the first card or menu item whenever anything redrew. Pass this
 * hook's result instead: it's the requested value on the first render and
 * false after that, so an element only grabs focus when it appears.
 */
export function useInitialFocus(requested?: boolean): boolean {
  const first = useRef(true);
  useEffect(() => {
    first.current = false;
  }, []);
  return first.current ? !!requested : false;
}
