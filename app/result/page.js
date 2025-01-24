"use client";
import React, { useEffect, useState } from "react";

const Result = () => {
  const [questionsData, setQuestionsData] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [totalTime, setTotalTime] = useState(0);
  const [questionTimes, setQuestionTimes] = useState([]);

  useEffect(() => {
    // Retrieve test data from localStorage
    const storedQuestions = JSON.parse(
      localStorage.getItem("uploadedQuestions") || "[]"
    );
    const storedAnswers = JSON.parse(
      localStorage.getItem("selectedAnswers") || "[]"
    );
    const storedTotalTime = JSON.parse(
      localStorage.getItem("totalTime") || "0"
    );
    const storedQuestionTimes = JSON.parse(
      localStorage.getItem("questionTimes") || "[]"
    );

    // Update state with retrieved data
    setQuestionsData(storedQuestions);
    setAnswers(storedAnswers);
    setTotalTime(storedTotalTime);
    setQuestionTimes(storedQuestionTimes);
  }, []);

  // if (!questionsData.length) {
  //   return <p>Error: Unable to fetch questions. Please restart the test.</p>;
  // }

  // Filter only attempted questions
  const attemptedQuestions = answers.filter((answer) => answer.answer !== null);

  // Calculate statistics
  const totalAttempted = attemptedQuestions.length;
  const score = attemptedQuestions.reduce((acc, answerObj) => {
    const question = questionsData.find((q) => q.id === answerObj.questionId);
    return question && question.answer === answerObj.answer ? acc + 1 : acc;
  }, 0);
  const totalIncorrect = totalAttempted - score;

  // Get incorrect questions
  const incorrectQuestions = attemptedQuestions
    .filter((answerObj) => {
      const question = questionsData.find((q) => q.id === answerObj.questionId);
      return question && question.answer !== answerObj.answer;
    })
    .map((answerObj) => {
      const question = questionsData.find((q) => q.id === answerObj.questionId);
      return {
        id: question.id,
        question: question.question,
        options: question.options,
        answer: question.answer,
      };
    });

  // Function to export incorrect questions with Save As dialog
  const exportToJSON = async () => {
    try {
      // Create a JSON string from the incorrect questions
      const jsonString = JSON.stringify(incorrectQuestions, null, 2);

      // Use the File System Access API
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: "incorrect_questions.json",
        types: [
          {
            description: "JSON Files",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      });

      // Create a writable stream and write the JSON data to the file
      const writableStream = await fileHandle.createWritable();
      await writableStream.write(jsonString);
      await writableStream.close();

      alert("File saved successfully!");
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error saving file:", error);
        alert("Failed to save file. Please try again.");
      }
    }
  };

  const convertSeconds = (totalTime) => {
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds} Sec`;
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      {/* Summary Statistics */}
      <div className="mb-6 bg-white shadow-md rounded-lg p-4 border border-gray-200 max-w-xl mx-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">
          Test Summary
        </h2>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Total Time</p>
            <p className="text-xl font-bold text-gray-900">
              {convertSeconds(totalTime)}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Average Time</p>
            <p className="text-xl font-bold text-gray-900">
              {totalAttempted > 0
                ? `${Math.floor(totalTime / totalAttempted)} Sec`
                : "0 Sec"}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">
              Questions Attempted
            </p>
            <p className="text-xl font-bold text-blue-600">{totalAttempted}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Total Questions</p>
            <p className="text-xl font-bold text-gray-900">
              {questionsData.length}
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Correct Answers</p>
            <p className="text-xl font-bold text-green-600">{score}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">
              Incorrect Answers
            </p>
            <p className="text-xl font-bold text-red-600">{totalIncorrect}</p>
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold mb-4">Attempted Questions:</h3>

      {attemptedQuestions.map((userAnswer, index) => {
        const q = questionsData.find((q) => q.id === userAnswer.questionId);
        if (!q) return null;

        const isCorrect = userAnswer.answer === q.answer;
        const timeTaken = questionTimes[index];

        return (
          <div
            key={q.id}
            className="mb-6 p-4 border rounded-lg shadow-sm bg-gray-50"
          >
            <p className="text-lg mb-4">
              {q.id}. {q.question}
            </p>
            <div className="flex justify-between items-center mb-4">
              <p
                className={`font-semibold ${
                  isCorrect ? "text-green-600" : "text-red-600"
                }`}
              >
                {isCorrect ? "Correct ✓" : "Incorrect ✗"}
              </p>
              <p className="text-lg">
                Time:{" "}
                <span
                  className={timeTaken > 15 ? "text-red-500" : "text-green-500"}
                >
                  {timeTaken} Sec
                </span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {q.options.map((option, optionIndex) => (
                <div
                  key={optionIndex}
                  className={`p-3 rounded border ${
                    userAnswer.answer === option && !isCorrect
                      ? "bg-red-100 text-red-800 border-red-400"
                      : option === q.answer
                      ? "bg-green-100 text-green-800 border-green-400"
                      : "bg-white text-gray-800"
                  }`}
                >
                  {String.fromCharCode(65 + optionIndex)}. {option}
                  {userAnswer.answer === option && option !== q.answer && (
                    <span className="text-sm font-semibold ml-2">(✗)</span>
                  )}
                  {option === q.answer && (
                    <span className="text-sm font-semibold ml-2">(✓)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Export Incorrect Questions Button */}
      <div className="mt-6 text-center">
        <button
          onClick={exportToJSON}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
        >
          Export Incorrect Questions
        </button>
      </div>
    </div>
  );
};

export default Result;
