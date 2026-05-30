/**
 * useTVNavigation — D-pad / TV Remote keyboard navigation hook
 *
 * Enables spatial navigation for Smart TV, Android TV, and keyboard users.
 * Adds keyboard-nav class to body when user presses arrow keys, so CSS
 * focus-visible styles activate.
 *
 * Supports:
 * - Arrow keys (D-pad on Android TV / Smart TV)
 * - Enter (OK/Select button)
 * - Backspace / Back button
 * - Home key
 */
import { useEffect } from "react";

type TVNavigationOptions = {
  /** Called when Back/Backspace is pressed */
  onBack?: () => void;
  /** Called when Home key is pressed */
  onHome?: () => void;
};

export function useTVNavigation(options: TVNavigationOptions = {}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isArrow = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key);
      const isEnter = e.key === "Enter";
      const isBack = e.key === "Backspace" || e.key === "BrowserBack";
      const isHome = e.key === "Home";

      // Add keyboard-nav class to body for CSS focus visibility
      if (isArrow || isEnter) {
        document.body.classList.add("keyboard-nav");
      }

      // Handle Back button
      if (isBack && options.onBack) {
        options.onBack();
      }

      // Handle Home key
      if (isHome && options.onHome) {
        options.onHome();
      }

      // Spatial navigation: move focus between focusable elements
      if (isArrow) {
        const focusable = Array.from(
          document.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && !el.closest('[aria-hidden="true"]');
        });

        const current = document.activeElement as HTMLElement;
        if (!current || !focusable.includes(current)) {
          // Focus first visible element
          focusable[0]?.focus();
          return;
        }

        const currentRect = current.getBoundingClientRect();
        const cx = currentRect.left + currentRect.width / 2;
        const cy = currentRect.top + currentRect.height / 2;

        let best: HTMLElement | null = null;
        let bestScore = Infinity;

        for (const el of focusable) {
          if (el === current) continue;
          const rect = el.getBoundingClientRect();
          const ex = rect.left + rect.width / 2;
          const ey = rect.top + rect.height / 2;

          const dx = ex - cx;
          const dy = ey - cy;

          let inDirection = false;
          let primary = 0;
          let secondary = 0;

          switch (e.key) {
            case "ArrowRight": inDirection = dx > 10; primary = dx; secondary = Math.abs(dy); break;
            case "ArrowLeft":  inDirection = dx < -10; primary = -dx; secondary = Math.abs(dy); break;
            case "ArrowDown":  inDirection = dy > 10; primary = dy; secondary = Math.abs(dx); break;
            case "ArrowUp":    inDirection = dy < -10; primary = -dy; secondary = Math.abs(dx); break;
          }

          if (!inDirection) continue;

          // Score: prefer elements in the primary direction with minimal secondary offset
          const score = primary + secondary * 2;
          if (score < bestScore) {
            bestScore = score;
            best = el;
          }
        }

        if (best) {
          e.preventDefault();
          best.focus();
          // Scroll into view smoothly
          best.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }
      }
    };

    // Remove keyboard-nav class on mouse move (user switched to mouse)
    const handleMouseMove = () => {
      document.body.classList.remove("keyboard-nav");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [options.onBack, options.onHome]);
}

export default useTVNavigation;
