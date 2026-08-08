import { useId } from "react";

interface ThumbprintButtonProps {
  onClick: () => void;
  text: string;
  isSubmitButton?: boolean;
}

export default function ThumbprintButton({
  onClick,
  text,
  isSubmitButton = false,
}: ThumbprintButtonProps) {
  const uniqueId = useId();

  const LINE_HEIGHT = 17;



  const buttonClasses =
    "w-20 h-26 bg-black rounded-full shadow-lg cursor-pointer flex items-center justify-center focus:outline-none transition-all duration-300 ease-in-out hover:scale-105 relative overflow-hidden";

  const gridBackground = (
    <div className="absolute inset-0 pointer-events-none opacity-30">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id={`whiteGrid-${uniqueId}`}
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 8 0 L 0 0 0 8"
              fill="none"
              stroke="rgba(255, 255, 255, 1)"
              strokeWidth="0.3"
            />
            <circle cx="4" cy="4" r="0.5" fill="rgba(255, 255, 255, 1)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#whiteGrid-${uniqueId})`} />
      </svg>
    </div>
  );

  // Calculate font size based on word length
  const getFontSize = (word: string) => {
    if (word.length <= 6) return "14px";
    if (word.length <= 12) return "13px";
    return "10px";
  };

  // Calculate y position for multi-word text to keep it centered
  const getYPos = (index: number, total: number) => {
    const centerY = 70;
    const startY = centerY - ((total - 1) * LINE_HEIGHT) / 2;

    return startY + index * LINE_HEIGHT;
  };
  if (isSubmitButton) {
    return (
      <button onClick={onClick} className={buttonClasses}>
        {gridBackground}
        <div className="relative z-10">
          <svg
            viewBox="0 0 100 140"
            className="w-20 h-28 sm:w-24 sm:h-32 fill-none"
            strokeWidth="1.5"
          >
            <text
              x="50"
              y="60"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white font-bold tracking-[0.1em] cursor-pointer "
              style={{ fontSize: getFontSize("SUBMIT") }}
            >
              SUBMIT
            </text>
            <text
              x="50"
              y="80"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white font-bold tracking-[0.1em] cursor-pointer"
              style={{ fontSize: getFontSize("PROJECT") }}
            >
              PROJECT
            </text>
          </svg>
        </div>
      </button>
    );
  }

  const words = text.split(" ");

  return (
    <div>
      <button onClick={onClick} className={buttonClasses}>
        {gridBackground}
        <div className="relative z-10">
          <svg
            viewBox="0 0 100 140"
            className="w-20 h-28 sm:w-24 sm:h-32 fill-none"
            strokeWidth="1.5"
          >
            {words.map((word, i) => (
              <text
                key={i}
                x="50"
                y={getYPos(i, words.length)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white font-bold tracking-[0.1em]  cursor-pointer uppercase"
                style={{ fontSize: getFontSize(word) }}
              >
                {word}
              </text>
            ))}
          </svg>
        </div>
      </button>
    </div>
  );
}
