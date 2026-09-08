function GridpatternBg() {
  const gridSize = 8; // 1/8 inch = 8 pixels (assuming 96 DPI)
  const dotSize = 1;
  return (
    // z-0, not z-50: this is a background, and at z-50 it painted over the
    // navbar and every card on the page. Positioned with z-0 it still sits
    // above the non-positioned page content it is meant to texture, while the
    // navbar and floating menu stay above it. See Layout for the full story.
    <div className="fixed inset-0 pointer-events-none z-0">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="grid"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
              fill="none"
              stroke="rgba(0, 0, 0, 0.1)"
              strokeWidth="0.5"
            />
            <circle
              cx={gridSize / 2}
              cy={gridSize / 2}
              r={dotSize / 2}
              fill="rgba(0, 0, 0, 0.2)"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

export default GridpatternBg;
