function GridpatternBg() {
  const gridSize = 8; // 1/8 inch = 8 pixels (assuming 96 DPI)
  const dotSize = 1;
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
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
