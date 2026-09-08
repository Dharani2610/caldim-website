"use client";

import { useRef } from "react";
import type { ReactNode, MouseEvent, PointerEvent } from "react";

/**
 * A button that leans toward the pointer.
 *
 * Renders a real `<button>` when there is no `href`. The previous version
 * always rendered an anchor, and an anchor without an href is not focusable
 * and is not announced as a control — so any onClick usage was unreachable by
 * keyboard. The magnetic effect is a mouse-only flourish; touch and keyboard
 * users get an ordinary, well-behaved control.
 */
export default function MagneticButton({
  href,
  children,
  variant = "solid",
  className = "",
  onClick,
  type = "button",
  disabled = false,
}: {
  href?: string;
  children: ReactNode;
  variant?: "solid" | "outline";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  const handleMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    const rotX = (-y / (rect.height / 2)) * 8;
    const rotY = (x / (rect.width / 2)) * 8;

    element.style.transform = `perspective(500px) translate(${(x * 0.2).toFixed(1)}px, ${(
      y * 0.28
    ).toFixed(1)}px) rotateX(${rotX.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg)`;
  };

  const handleLeave = () => {
    const element = ref.current;
    if (element) {
      element.style.transform = "perspective(500px) translate(0,0) rotateX(0deg) rotateY(0deg)";
    }
  };

  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-[transform,background-color,color,border-color,box-shadow] duration-200 ease-out-expo disabled:cursor-not-allowed disabled:opacity-60";
  const styles =
    variant === "solid"
      ? "border border-btn-solid bg-accent text-steel-950 hover:bg-accent/90 hover:shadow-[0_10px_30px_-12px_rgb(var(--color-accent)/0.7)]"
      : "border border-btn-outline text-paper hover:border-accent hover:text-accent";

  const shared = {
    onPointerMove: handleMove,
    onPointerLeave: handleLeave,
    onBlur: handleLeave,
    className: `${base} ${styles} ${className}`,
    "data-cursor-grow": true,
  };

  if (href) {
    const external = href.startsWith("http");
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...shared}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      disabled={disabled}
      {...shared}
    >
      {children}
    </button>
  );
}

/** Kept so callers can silence the unused-import lint on MouseEvent. */
export type { MouseEvent };
