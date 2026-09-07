import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface Props {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/** Wraps horizontally-scrollable content (e.g. a wide table) with fading edge
 * shadows that only appear when there's more content to scroll to — so
 * content clipped by a narrow viewport reads as "scroll for more" instead of
 * a broken/cut-off layout. */
export function ScrollShadowContainer({ className, style, children }: Readonly<Props>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shadow, setShadow] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      setShadow({
        left: el.scrollLeft > 2,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
      });
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    // Content width can change without the container resizing (e.g. a table
    // column group expanding), so watch the scrolled content itself too.
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    for (const child of Array.from(el.children)) resizeObserver.observe(child);

    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative">
      <div ref={scrollRef} className={className} style={style}>
        {children}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 bottom-0 left-0 transition-opacity duration-150"
        style={{
          width: 28,
          opacity: shadow.left ? 1 : 0,
          background: "linear-gradient(to right, rgba(15,23,42,0.12), rgba(15,23,42,0))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 bottom-0 right-0 transition-opacity duration-150"
        style={{
          width: 28,
          opacity: shadow.right ? 1 : 0,
          background: "linear-gradient(to left, rgba(15,23,42,0.12), rgba(15,23,42,0))",
        }}
      />
    </div>
  );
}
