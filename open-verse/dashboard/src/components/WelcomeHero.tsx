import React, { useEffect, useRef } from "react";

export const WelcomeHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animId: number;
    let targetEyeX = 0;
    let targetEyeY = 0;
    let currentEyeX = 0;
    let currentEyeY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const dist = Math.hypot(deltaX, deltaY);

      const maxEyeTravel = 7;
      const falloff = 350;
      const strength = Math.min(dist / falloff, 1) * maxEyeTravel;

      targetEyeX = dist === 0 ? 0 : (deltaX / dist) * strength;
      targetEyeY = dist === 0 ? 0 : (deltaY / dist) * strength;

      // Update grid spotlight
      const gridX = `${(((e.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`;
      const gridY = `${(e.clientY - rect.top).toFixed(0)}px`;
      containerRef.current.style.setProperty("--welcome-grid-x", gridX);
      containerRef.current.style.setProperty("--welcome-grid-y", gridY);
    };

    const updateLoop = () => {
      currentEyeX += (targetEyeX - currentEyeX) * 0.18;
      currentEyeY += (targetEyeY - currentEyeY) * 0.18;

      if (containerRef.current) {
        containerRef.current.style.setProperty("--welcome-eye-x", `${currentEyeX.toFixed(2)}px`);
        containerRef.current.style.setProperty("--welcome-eye-y", `${currentEyeY.toFixed(2)}px`);
      }

      animId = requestAnimationFrame(updateLoop);
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    animId = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div ref={containerRef} className="welcome-hero-container">
      {/* Perspective Grid Background */}
      <div className="welcome-hero-grid">
        <div className="welcome-hero-grid-lines" />
      </div>

      {/* Mascot Bot */}
      <div className="welcome-bot-wrapper">
        <svg
          viewBox="0 0 205 193"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="welcome-bot-svg"
        >
          {/* Main Bot Body Contour */}
          <path
            d="M102.222 11.625C92.5893 11.6251 85.0497 19.1063 85.0497 28.2461L85.0546 28.6631C85.1002 30.7847 85.4871 33.4739 86.2128 36.6533L87.7655 43.4531H49.1747C40.5283 43.4532 33.5187 50.4628 33.5185 59.1094V87.6895L12.8251 111.831L12.5468 112.156L12.8251 112.481L33.5185 136.621V165.203C33.5185 173.85 40.528 180.859 49.1747 180.859H155.269C163.915 180.859 170.925 173.85 170.925 165.203V136.621L191.616 112.481L191.895 112.156L191.616 111.831L170.925 87.6895V59.1094L170.92 58.7051C170.705 50.2454 163.78 43.4533 155.269 43.4531H116.678L118.229 36.6533C119.004 33.262 119.394 30.4282 119.394 28.2461L119.388 27.8193C119.157 18.8746 111.704 11.6251 102.222 11.625Z"
            fill="#151720"
            stroke="#53468b"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Subtle Accent Glow Stroke */}
          <path
            d="M49.1747 43.4531H155.269C163.915 43.4531 170.925 50.4628 170.925 59.1094V165.203C170.925 173.85 163.915 180.859 155.269 180.859H49.1747C40.528 180.859 33.5185 173.85 33.5185 165.203V59.1094C33.5185 50.4628 40.528 43.4531 49.1747 43.4531Z"
            fill="rgba(110, 86, 207, 0.08)"
          />
        </svg>

        {/* Dynamic Tracking Eyes */}
        <div className="welcome-bot-eye left" />
        <div className="welcome-bot-eye right" />
      </div>
    </div>
  );
};
