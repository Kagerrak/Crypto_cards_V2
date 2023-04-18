import { useState, useEffect } from "react";

const StatInput = ({
  stat,
  name,
  statPoints,
  setStatPoints,
  setStatChanges,
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
      setStatChanges((prevStatChanges) => prevStatChanges + (input - newInput));
    }
  };

  const handleIncrement = () => {
    if (statPoints > 0) {
      setInput(input + 1);
      setStatPoints((prevStatPoints) => prevStatPoints - 1);
      setStatChanges((prevStatChanges) => prevStatChanges + 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-1">
      <div>
        <label className="mx-2">{name}</label>
      </div>
      {showButtons && (
        <div className="flex flex-row">
          <button
            onClick={handleDecrement}
            className="w-[30px] h-[30px] bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded-full flex items-center justify-center"
          >
            -
          </button>
          <div className="mx-auto w-7 flex items-center justify-center">
            {input}
          </div>
          <button
            onClick={handleIncrement}
            className="w-[30px] h-[30px] bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded-full flex items-center justify-center"
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
