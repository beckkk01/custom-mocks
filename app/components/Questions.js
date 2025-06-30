import React, { useState, useEffect } from "react";
import Latex from "react-latex-next";
import "katex/dist/katex.min.css";
import { sanitizeLatexString } from "../../utils/sanitizeLatexString";

const Question = ({ question, options, handleAnswer }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const optionLabels = ["a", "b", "c", "d"];

  // Shuffle utility
  const shuffleArray = (array) =>
    [...array]
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

  // Shuffle on question change
  useEffect(() => {
    if (options && Array.isArray(options)) {
      setShuffledOptions(shuffleArray(options));
      setSelectedOption(null);
    }
  }, [question, options]);

  // Notify parent
  useEffect(() => {
    handleAnswer(selectedOption);
  }, [selectedOption]);

  if (!options || !Array.isArray(options)) {
    return (
      <div className="text-red-600 text-center p-3">
        Invalid question data. Options missing or malformed.
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-3 sm:p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md border border-gray-200">
        {/* Question */}
        <div className="mb-4 sm:mb-5">
          <p className="text-base sm:text-lg font-medium text-gray-900 leading-relaxed">
            <Latex>{sanitizeLatexString(question)}</Latex>
          </p>
        </div>

        {/* Options */}
        <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
          {shuffledOptions.map((option, index) => {
            const isSelected = selectedOption === option;
            return (
              <button
                key={index}
                onClick={() => setSelectedOption(option)}
                className={`
                  flex items-start gap-2 p-3 sm:p-4 text-left rounded-md border transition-all duration-200
                  w-full
                  ${
                    isSelected
                      ? "bg-green-100 border-green-500 text-green-900 font-semibold shadow-sm"
                      : "bg-gray-50 border-gray-200 hover:bg-green-50"
                  }
                `}
              >
                <span className="text-sm sm:text-base font-bold">
                  {optionLabels[index]}.
                </span>
                <span className="text-sm sm:text-base">
                  <Latex>{sanitizeLatexString(option)}</Latex>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Question;
