import React, { useState, useEffect } from "react";

const Question = ({ question, options, handleAnswer }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const optionLabels = ["A", "B", "C", "D"]; // Define the labels

  useEffect(() => {
    handleAnswer(selectedOption);
  }, [selectedOption, handleAnswer]);

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h2 className="text-xl text-gray-800 mb-6">{question}</h2>
      <div className="space-y-4">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => setSelectedOption(option)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
              selectedOption === option
                ? "p-3 rounded border bg-green-200 text-green-800 border-green-400"
                : "bg-gray-100 text-gray-800 hover:bg-green-200"
            }`}
          >
            <span className="mr-2">{optionLabels[index]}.</span>{" "}
            {/* Add label */}
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Question;
