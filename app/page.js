"use client";
import React, { useState, useEffect } from "react";
import Question from "../app/components/Questions";

const Home = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [mainTimer, setMainTimer] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [questionTimes, setQuestionTimes] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [formattedTime, setFormattedTime] = useState("00:00");
  const [fileName, setFileName] = useState(null);

  const shuffleArray = (array) => {
    return array
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    if (file) {
      setFileName(file.name);
    }

    reader.onload = (e) => {
      try {
        const uploadedQuestions = JSON.parse(e.target.result);
        setQuestions(shuffleArray(uploadedQuestions));
        localStorage.setItem(
          "uploadedQuestions",
          JSON.stringify(uploadedQuestions)
        );
      } catch (error) {
        console.error("Invalid JSON file:", error);
      }
    };

    if (file) {
      reader.readAsText(file);
    }
  };

  const goFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(); // Safari support
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen(); // Firefox support
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen(); // IE/Edge support
    }
  };

  const startTest = () => {
    setTestStarted(true);
    setQuestionStartTime(0);
    setQuestionTimer(0);
    setMainTimer(0);
    setFormattedTime("00:00");
    goFullscreen(); // Enter fullscreen mode

    const timerInterval = setInterval(() => {
      setMainTimer((prevTime) => {
        const newTime = prevTime + 1;
        const hours = Math.floor(newTime / 3600);
        const minutes = Math.floor((newTime % 3600) / 60);
        const seconds = newTime % 60;

        const formattedTime = `${hours > 0 ? `${hours}:` : ""}${
          minutes < 10 ? "0" : ""
        }${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

        setFormattedTime(formattedTime);
        return newTime;
      });
    }, 1000);

    window.timerInterval = timerInterval;
  };

  const submitAndNext = () => {
    const timeSpent = questionTimer;
    const currentQuestionData = questions[currentQuestion];

    const updatedAnswers = [
      ...selectedAnswers,
      {
        questionId: currentQuestionData.id,
        answer: currentAnswer,
      },
    ];

    setSelectedAnswers(updatedAnswers);
    setQuestionTimes([...questionTimes, timeSpent]);

    // Save answers to localStorage
    localStorage.setItem("selectedAnswers", JSON.stringify(updatedAnswers));

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setQuestionStartTime(mainTimer);
      setCurrentAnswer(null);
      setQuestionTimer(0);
    } else {
      setIsFinished(true);
      clearInterval(window.timerInterval);
    }
  };

  const skipQuestion = () => {
    const timeSpent = questionTimer;
    const updatedAnswers = [
      ...selectedAnswers,
      {
        questionId: questions[currentQuestion].id,
        answer: null,
      },
    ];

    setSelectedAnswers(updatedAnswers);
    setQuestionTimes([...questionTimes, timeSpent]);

    // Save answers to localStorage
    localStorage.setItem("selectedAnswers", JSON.stringify(updatedAnswers));

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setQuestionStartTime(mainTimer);
      setCurrentAnswer(null);
      setQuestionTimer(0);
    } else {
      setIsFinished(true);
      clearInterval(window.timerInterval);
    }
  };

  const handleFinish = () => {
    clearInterval(window.timerInterval);

    // Save final answers to localStorage
    localStorage.setItem("selectedAnswers", JSON.stringify(selectedAnswers));
    localStorage.setItem("questionTimes", JSON.stringify(questionTimes));
    localStorage.setItem("totalTime", mainTimer);

    window.location.href = `/result`;
  };

  const handleQuestionTimer = () => {
    setQuestionTimer((prev) => prev + 1);
  };

  useEffect(() => {
    if (testStarted && !isFinished) {
      const questionTimerInterval = setInterval(handleQuestionTimer, 1000);
      return () => clearInterval(questionTimerInterval);
    }
  }, [testStarted, isFinished]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-4xl">
        {!testStarted ? (
          <div className="bg-white shadow-2xl rounded-3xl overflow-hidden max-w-xl mx-auto">
            <div className="bg-green-700 p-10 text-center relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="100%"
                  height="100%"
                  viewBox="0 0 800 600"
                  preserveAspectRatio="none"
                >
                  <pattern
                    id="pattern"
                    patternUnits="userSpaceOnUse"
                    width="100"
                    height="100"
                  >
                    <path d="M0 0 L100 0 L50 50 Z" fill="white" opacity="0.2" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#pattern)" />
                </svg>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">
                  Custom Mock Test
                </h1>
                <p className="text-white/80 text-xl font-light tracking-wide">
                  Prepare, Practice, Perform
                </p>
              </div>
            </div>

            <div className="p-10 space-y-6">
              <div className="text-center">
                <div className="relative border-2 border-dashed border-green-300 rounded-2xl p-8 mb-6 transition-all hover:border-green-500 group">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mx-auto h-16 w-16 text-green-400 group-hover:text-green-600 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {fileName ? (
                      <p className="mt-4 text-gray-600 group-hover:text-green-700 transition-colors">
                        {fileName}
                      </p>
                    ) : (
                      <p className="mt-4 text-gray-600 group-hover:text-green-700 transition-colors">
                        Drag and drop your JSON file or click to upload
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      File type: .json
                    </p>
                  </div>
                </div>

                {questions.length > 0 && (
                  <button
                    onClick={startTest}
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-700 to-emerald-800 text-white rounded-xl font-bold 
                    hover:from-green-700 hover:to-emerald-800 transition-all transform 
                    hover:scale-105 shadow-xl hover:shadow-2xl active:scale-95"
                  >
                    Begin Test
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : !isFinished ? (
          <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-700 to-green-800 p-4 flex justify-between items-center text-white">
              <div>
                <span className="font-medium">Total Time: </span>
                <span className="text-xl font-bold">{formattedTime}</span>
              </div>
              <div>
                <span className="font-medium">Question </span>
                <span className="text-xl font-bold">
                  {currentQuestion + 1}/{questions.length}
                </span>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="text-center mb-4">
                <p className="text-gray-600">
                  Question Time: {questionTimer} seconds
                </p>
              </div>

              {questions.length > 0 && (
                <>
                  <div className="mb-8">
                    <Question
                      question={questions[currentQuestion]?.question}
                      options={questions[currentQuestion]?.options}
                      handleAnswer={setCurrentAnswer}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={skipQuestion}
                      className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-all transform hover:scale-105 shadow-md"
                    >
                      Skip
                    </button>

                    <button
                      onClick={submitAndNext}
                      disabled={!currentAnswer}
                      className={`px-6 py-3 rounded-lg text-white font-semibold transition-all transform hover:scale-105 shadow-md ${
                        currentAnswer
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}
                    >
                      Submit & Next
                    </button>

                    <button
                      onClick={handleFinish}
                      className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all transform hover:scale-105 shadow-md"
                    >
                      Finish Test
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="p-10 text-center">
            <h2 className="text-3xl font-bold text-green-600 mb-6">
              Test Completed Successfully
            </h2>
            <button
              onClick={handleFinish}
              className="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
            >
              View Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
