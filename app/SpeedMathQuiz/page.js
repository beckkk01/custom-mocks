// pages/SpeedMathQuiz.jsx
"use client";
import React, { useState, useEffect } from "react";
import Latex from "react-latex-next";
import "katex/dist/katex.min.css";
import { useRouter } from "next/navigation";

const SpeedMathQuiz = () => {
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [selectedCategories, setSelectedCategories] = useState({
    add: true,
    subtract: true,
    fraction: true,
    decimal: true,
    percentage: true,
    root: true,
    square: true,
    mixedFraction: true,
    exponent: true,
    absolute: true,
  });
  const [useBrackets, setUseBrackets] = useState(false); // New state for brackets
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [timer, setTimer] = useState(30);
  const [quizStarted, setQuizStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const router = useRouter();

  // GCD function for fraction simplification
  const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));

  // Function to generate a random simplification question
  const generateQuestion = () => {
    const difficulties = {
      easy: { maxNum: 20, terms: [1, 3] },
      medium: { maxNum: 50, terms: [3, 4] },
      hard: { maxNum: 100, terms: [5, 6] },
    };

    const config = difficulties[difficulty];
    const termCount =
      Math.floor(Math.random() * (config.terms[1] - config.terms[0] + 1)) +
      config.terms[0];
    const activeCategories = Object.keys(selectedCategories).filter(
      (cat) => selectedCategories[cat]
    );
    if (activeCategories.length === 0) {
      return {
        question: "Error: No categories selected",
        latexQuestion: "Error",
        options: ["N/A"],
        correctAnswer: "N/A",
      };
    }
    const operation =
      activeCategories[Math.floor(Math.random() * activeCategories.length)];

    let question, correctAnswer, latexQuestion;

    try {
      switch (operation) {
        case "add":
        case "subtract": {
          const terms = Array.from(
            { length: termCount },
            () => Math.floor(Math.random() * config.maxNum) + 1
          );
          const operations = Array.from({ length: termCount - 1 }, () =>
            operation === "add" || Math.random() > 0.5 ? "+" : "-"
          );
          let expression = terms[0];
          for (let i = 0; i < operations.length; i++) {
            expression += ` ${operations[i]} ${terms[i + 1]}`;
          }
          if (useBrackets && termCount > 2) {
            const bracketPos = Math.floor(Math.random() * (termCount - 1));
            expression = `${expression.slice(
              0,
              bracketPos * 4
            )}(${expression.slice(
              bracketPos * 4,
              (bracketPos + 2) * 4
            )}) ${expression.slice((bracketPos + 2) * 4)}`;
          }
          latexQuestion = expression;
          correctAnswer = terms.reduce((acc, term, i) =>
            i === 0 ? term : operations[i - 1] === "+" ? acc + term : acc - term
          );
          question = `Simplify: ${expression}`;
          break;
        }
        case "fraction": {
          const terms = Array.from({ length: termCount }, () => ({
            num: Math.floor(Math.random() * config.maxNum) + 1,
            den: Math.floor(Math.random() * (config.maxNum - 1)) + 2,
          }));
          const operations = Array.from({ length: termCount - 1 }, () =>
            Math.random() > 0.5 ? "+" : "-"
          );
          let numResult = terms[0].num;
          let denResult = terms[0].den;
          for (let i = 0; i < operations.length; i++) {
            const commonDen = denResult * terms[i + 1].den;
            numResult =
              operations[i] === "+"
                ? numResult * terms[i + 1].den + terms[i + 1].num * denResult
                : numResult * terms[i + 1].den - terms[i + 1].num * denResult;
            denResult = commonDen;
          }
          const divisor = gcd(Math.abs(numResult), denResult);
          latexQuestion = `\\frac{${terms[0].num}}{${terms[0].den}}`;
          for (let i = 0; i < operations.length; i++) {
            latexQuestion += ` ${operations[i]} \\frac{${terms[i + 1].num}}{${
              terms[i + 1].den
            }}`;
          }
          if (useBrackets && termCount > 2) {
            const bracketPos = Math.floor(Math.random() * (termCount - 1));
            latexQuestion = `${latexQuestion.slice(
              0,
              bracketPos * 14
            )}(${latexQuestion.slice(
              bracketPos * 14,
              (bracketPos + 2) * 14
            )}) ${latexQuestion.slice((bracketPos + 2) * 14)}`;
          }
          correctAnswer =
            numResult === 0
              ? "0"
              : `${numResult / divisor}/${denResult / divisor}`;
          question = `Simplify: ${terms
            .map((t) => `${t.num}/${t.den}`)
            .join(` ${operations.join(" ")} `)}`;
          break;
        }
        case "decimal": {
          const terms = Array.from({ length: termCount }, () =>
            Number((Math.random() * config.maxNum).toFixed(2))
          );
          const operations = Array.from({ length: termCount - 1 }, () =>
            Math.random() > 0.5 ? "+" : "-"
          );
          let expression = terms[0];
          for (let i = 0; i < operations.length; i++) {
            expression += ` ${operations[i]} ${terms[i + 1]}`;
          }
          if (useBrackets && termCount > 2) {
            const bracketPos = Math.floor(Math.random() * (termCount - 1));
            expression = `${expression.slice(
              0,
              bracketPos * 6
            )}(${expression.slice(
              bracketPos * 6,
              (bracketPos + 2) * 6
            )}) ${expression.slice((bracketPos + 2) * 6)}`;
          }
          latexQuestion = expression;
          correctAnswer = Number(
            terms
              .reduce((acc, term, i) =>
                i === 0
                  ? term
                  : operations[i - 1] === "+"
                  ? acc + term
                  : acc - term
              )
              .toFixed(2)
          );
          question = `Simplify: ${expression}`;
          break;
        }
        case "percentage": {
          const num = Math.floor(Math.random() * config.maxNum) + 1;
          const percentage = Math.floor(Math.random() * 100) + 1;
          latexQuestion = `${percentage}\\% \\text{ of } ${num}`;
          correctAnswer = Number(((percentage / 100) * num).toFixed(2));
          question = `Find: ${percentage}% of ${num}`;
          break;
        }
        case "root": {
          const perfectSquares = [4, 9, 16, 25, 36, 49, 64, 81, 100].filter(
            (n) => n <= config.maxNum
          );
          const square =
            perfectSquares[Math.floor(Math.random() * perfectSquares.length)] ||
            16;
          latexQuestion = `\\sqrt{${square}}`;
          correctAnswer = Math.sqrt(square);
          question = `Simplify: √${square}`;
          break;
        }
        case "square": {
          const num = Math.floor(Math.random() * config.maxNum) + 1;
          latexQuestion = `${num}^2`;
          correctAnswer = num * num;
          question = `Simplify: ${num}^2`;
          break;
        }
        case "mixedFraction": {
          const whole = Math.floor(Math.random() * 10) + 1;
          const num = Math.floor(Math.random() * (config.maxNum - 1)) + 1;
          const den = Math.floor(Math.random() * (config.maxNum - 1)) + 2;
          latexQuestion = `${whole} \\frac{${num}}{${den}}`;
          const improperNum = whole * den + num;
          const divisor = gcd(improperNum, den);
          correctAnswer =
            improperNum === 0
              ? "0"
              : `${improperNum / divisor}/${den / divisor}`;
          question = `Convert to improper fraction: ${whole} ${num}/${den}`;
          break;
        }
        case "exponent": {
          const base = Math.floor(Math.random() * 10) + 1;
          const exp = Math.floor(Math.random() * 3) + 2;
          latexQuestion = `${base}^{${exp}}`;
          correctAnswer = Math.pow(base, exp);
          question = `Simplify: ${base}^${exp}`;
          break;
        }
        case "absolute": {
          const num =
            Math.floor(Math.random() * config.maxNum * 2) - config.maxNum;
          latexQuestion = `|${num}|`;
          correctAnswer = Math.abs(num);
          question = `Simplify: |${num}|`;
          break;
        }
        default:
          latexQuestion = "Error";
          correctAnswer = "0";
          question = "Error";
      }

      // Generate incorrect answers (type-appropriate and close)
      const incorrectAnswers = [];
      const maxAttempts = 10;
      let attempts = 0;
      while (incorrectAnswers.length < 3 && attempts < maxAttempts) {
        let wrongAnswer;
        if (operation === "fraction" || operation === "mixedFraction") {
          const offset = Math.round(
            (Math.random() * 2 - 1) *
              (difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3)
          );
          const num =
            (Number(correctAnswer.split("/")[0]) || correctAnswer) + offset;
          const den = correctAnswer.split("/")[1] || 1;
          wrongAnswer = num === 0 ? "0" : `${num}/${den}`;
        } else if (operation === "decimal") {
          const offset =
            (Math.random() * 2 - 1) *
            (difficulty === "easy" ? 0.1 : difficulty === "medium" ? 0.5 : 1);
          wrongAnswer = Number((correctAnswer + offset).toFixed(2));
        } else {
          const offset = Math.round(
            (Math.random() * 2 - 1) *
              (difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3)
          );
          wrongAnswer = correctAnswer + offset;
        }
        if (
          wrongAnswer !== correctAnswer &&
          !incorrectAnswers.includes(wrongAnswer) &&
          (typeof wrongAnswer === "string"
            ? wrongAnswer !== "0/1" && wrongAnswer !== "0/0"
            : wrongAnswer >= 0)
        ) {
          incorrectAnswers.push(wrongAnswer);
        }
        attempts++;
      }

      // Fallback incorrect answers
      while (incorrectAnswers.length < 3) {
        const offset = incorrectAnswers.length + 1;
        const fallbackAnswer =
          operation === "fraction" || operation === "mixedFraction"
            ? `${
                (Number(correctAnswer.split("/")[0]) || correctAnswer) + offset
              }/${correctAnswer.split("/")[1] || 1}`
            : operation === "decimal"
            ? Number(
                (
                  correctAnswer +
                  offset * (difficulty === "easy" ? 0.1 : 0.5)
                ).toFixed(2)
              )
            : correctAnswer + offset;
        if (
          !incorrectAnswers.includes(fallbackAnswer) &&
          fallbackAnswer !== correctAnswer
        ) {
          incorrectAnswers.push(fallbackAnswer);
        }
      }

      return {
        question,
        latexQuestion,
        options: [correctAnswer, ...incorrectAnswers].sort(
          () => Math.random() - 0.5
        ),
        correctAnswer,
      };
    } catch (error) {
      console.error(`Error generating ${operation} question:`, error);
      return {
        question: "Error generating question",
        latexQuestion: "Error",
        options: ["N/A"],
        correctAnswer: "N/A",
      };
    }
  };

  // Handle category checkbox changes
  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Generate questions
  const handleGenerateQuestions = async (e) => {
    e.preventDefault();
    if (!Object.values(selectedCategories).some((val) => val)) {
      alert("Please select at least one category.");
      return;
    }
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 0)); // Yield to event loop
    try {
      const generatedQuestions = [];
      for (let i = 0; i < numQuestions; i++) {
        const question = generateQuestion();
        if (question.latexQuestion === "Error") {
          throw new Error("Failed to generate valid question");
        }
        generatedQuestions.push(question);
      }
      setQuestions(generatedQuestions);
      setQuizStarted(true);
      setTimer(30);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setScore(0);
      setTotalTime(0);
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("Failed to generate questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Timer logic
  useEffect(() => {
    let interval;
    if (quizStarted && timer > 0 && !isLoading) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleNextQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizStarted, timer, isLoading]);

  // Handle answer selection
  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    const correct = answer === questions[currentQuestionIndex].correctAnswer;
    setIsCorrect(correct);
    if (correct) {
      setScore((prev) => prev + 1);
    }
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    setTotalTime((prev) => prev + timeTaken);
  };

  // Move to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setTimer(30);
      setQuestionStartTime(Date.now());
    } else {
      setQuizStarted(false);
    }
  };

  // Back to dashboard
  const handleBackToDashboard = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Speed Math Quiz
        </h1>
        {!quizStarted ? (
          questions.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Set Up Your Quiz
              </h2>
              <form onSubmit={handleGenerateQuestions} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={numQuestions}
                    onChange={(e) =>
                      setNumQuestions(
                        Math.max(1, Math.min(50, Number(e.target.value)))
                      )
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    <option value="easy">Easy (1-3 terms)</option>
                    <option value="medium">Medium (3-4 terms)</option>
                    <option value="hard">Hard (5-6 terms)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Categories
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.keys(selectedCategories).map((category) => (
                      <label
                        key={category}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories[category]}
                          onChange={() => handleCategoryChange(category)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          disabled={isLoading}
                        />
                        <span className="text-sm text-gray-700">
                          {category.charAt(0).toUpperCase() +
                            category.slice(1).replace(/([A-Z])/g, " $1")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={useBrackets}
                      onChange={() => setUseBrackets((prev) => !prev)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Use Brackets
                    </span>
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Generating..." : "Start Quiz"}
                </button>
              </form>
              <button
                onClick={handleBackToDashboard}
                className="mt-4 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isLoading}
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Quiz Results
              </h2>
              <div className="text-center space-y-4">
                <p className="text-lg font-medium text-gray-700">
                  Score: {score} / {numQuestions}
                </p>
                <p className="text-lg font-medium text-gray-700">
                  Total Time: {totalTime.toFixed(2)} seconds
                </p>
                <p className="text-lg font-medium text-gray-700">
                  Average Time per Question:{" "}
                  {(totalTime / numQuestions).toFixed(2)} seconds
                </p>
                <button
                  onClick={() => {
                    setQuestions([]);
                    setScore(0);
                    setTotalTime(0);
                  }}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Start New Quiz
                </button>
                <button
                  onClick={handleBackToDashboard}
                  className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Question {currentQuestionIndex + 1} of {questions.length}
              </h2>
              <div className="text-lg font-medium text-gray-700">
                Time: {timer}s
              </div>
            </div>
            <div className="mb-6 text-center">
              <Latex>{`$${questions[currentQuestionIndex].latexQuestion}$`}</Latex>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {questions[currentQuestionIndex].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={selectedAnswer !== null}
                  className={`w-full px-4 py-2 text-sm font-medium rounded-md ${
                    selectedAnswer === null
                      ? "bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      : selectedAnswer === option
                      ? isCorrect
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {typeof option === "string" && option.includes("/") ? (
                    <Latex>{`$${option}$`}</Latex>
                  ) : (
                    option
                  )}
                </button>
              ))}
            </div>
            {selectedAnswer !== null && (
              <div className="mt-4 text-center">
                <p
                  className={`text-lg font-semibold ${
                    isCorrect ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isCorrect ? "Correct!" : "Incorrect! Correct answer: "}
                  {!isCorrect && (
                    <Latex>{`$${questions[currentQuestionIndex].correctAnswer}$`}</Latex>
                  )}
                </p>
                <button
                  onClick={handleNextQuestion}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currentQuestionIndex + 1 < questions.length
                    ? "Next Question"
                    : "Finish Quiz"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeedMathQuiz;
