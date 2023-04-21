import { useState, useEffect } from "react";

const StatInput = ({
  stat,
  name,
  statPoints,
  setStatPoints,
  onStatChange, // Add this prop
  showButtons = true,
}) => {
  const [input, setInput] = useState(stat);

  useEffect(() => {
    setInput(stat);
  }, [stat]);

  const handleDecrement = () => {
    if (input > stat) {
      const newInput = input - 1;
      setInput(newInput);
      setStatPoints((prevStatPoints) => prevStatPoints + (input - newInput));
      onStatChange(name, newInput);
    }
  };

  const handleIncrement = () => {
    if (statPoints > 0) {
      const newInput = input + 1;
      setInput(newInput);
      setStatPoints((prevStatPoints) => prevStatPoints - 1);
      onStatChange(name, newInput);
    }
  };

  return (
    <div className="w-[129px] h-[80px] flex flex-col items-center justify-center">
      <div>
        <label className="mx-2">{name}</label>
      </div>
      {showButtons && (
        <div className="flex flex-row space-x-1">
          <button
            onClick={handleDecrement}
            className="w-[30px] h-[30px] bg-transparent hover:bg-siteViolet text-siteViolet  font-semibold hover:text-white py-2 px-4 border border-siteViolet hover:border-transparent rounded-full flex items-center justify-center"
          >
            -
          </button>
          <div className="mx-auto w-7 flex items-center justify-center">
            {input}
          </div>
          <button
            onClick={handleIncrement}
            className="w-[30px] h-[30px] bg-transparent hover:bg-siteViolet text-siteViolet  font-semibold hover:text-white py-2 px-4 border border-siteViolet  hover:border-transparent rounded-full flex items-center justify-center"
          >
            +
          </button>
        </div>
      )}
      {!showButtons && (
        <div className="mx-auto w-7 flex items-center justify-center">
          {input}
        </div>
      )}
    </div>
  );
};

export default StatInput;
