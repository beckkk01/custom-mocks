"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Question from "../components/Questions";

const TestPage = () => {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [mainTimer, setMainTimer] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [shuffle, setShuffle] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("uploadedQuestions");
    if (saved) {
      let q = JSON.parse(saved);
      if (shuffle) {
        q = q
          .map((v) => ({ v, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map((a) => a.v);
      }
      setQuestions(q);
    } else {
      alert("No questions loaded");
      router.push("/");
    }
  }, [shuffle]);

  useEffect(() => {
    if (ready && !isFinished) {
      const t = setInterval(() => setQuestionTimer((s) => s + 1), 1000);
      const mt = setInterval(() => setMainTimer((s) => s + 1), 1000);
      return () => {
        clearInterval(t);
        clearInterval(mt);
      };
    }
  }, [ready, isFinished]);

  const handleAnswer = (option) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[current] = { questionId: questions[current].id, answer: option };
    setSelectedAnswers(newAnswers);
  };

  const nextQuestion = () => {
    setCurrent((prev) => prev + 1);
    setQuestionTimer(0);
  };

  const finishTest = () => {
    setIsFinished(true);
    localStorage.setItem("selectedAnswers", JSON.stringify(selectedAnswers));
    localStorage.setItem("totalTime", mainTimer.toString());
    router.push("/result");
  };

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Ready to Begin the Test?
        </h2>
        <label className="inline-flex items-center mb-4 text-gray-700 text-sm">
          <input
            type="checkbox"
            checked={shuffle}
            onChange={() => setShuffle(!shuffle)}
            className="mr-2"
          />
          Shuffle Questions
        </label>
        <button
          onClick={() => setReady(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
        >
          Start Test
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="text-center mt-20 text-lg text-gray-700">
        Test Completed.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 mt-3">
      {/* Test Header */}
      <div className="flex justify-between items-center mb-4 text-sm text-gray-600 border-b pb-2">
        <span>
          Total Time:{" "}
          <span className="font-medium text-gray-800">{mainTimer}s</span>
        </span>
        <span>
          Question Time:{" "}
          <span className="font-medium text-gray-800">{questionTimer}s</span>
        </span>
        <span>
          Q: <span className="font-medium text-gray-800">{current + 1}</span> /{" "}
          {questions.length}
        </span>
      </div>

      {/* Question Component */}
      <Question
        question={questions[current]?.question}
        options={questions[current]?.options}
        handleAnswer={handleAnswer}
        selected={selectedAnswers[current]?.answer}
      />

      {/* Navigation Buttons */}
      <div className="mt-6 flex justify-between items-center gap-2">
        <button
          onClick={finishTest}
          className="px-5 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
        >
          Quit & Submit
        </button>

        {current + 1 < questions.length ? (
          <button
            onClick={nextQuestion}
            className="px-6 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Submit & Next
          </button>
        ) : (
          <button
            onClick={finishTest}
            className="px-6 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Finish Test
          </button>
        )}
      </div>
    </div>
  );
};

export default TestPage;
