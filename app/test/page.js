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
      <div className="p-10 text-center">
        <h2 className="text-2xl mb-4">Ready to Start?</h2>
        <label className="mr-4">
          <input
            type="checkbox"
            checked={shuffle}
            onChange={() => setShuffle(!shuffle)}
          />
          Shuffle Questions
        </label>
        <br />
        <button
          onClick={() => setReady(true)}
          className="mt-4 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Start Test
        </button>
      </div>
    );
  }

  if (isFinished) return <p className="text-center mt-10">Test Completed.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between text-sm text-gray-600 mb-4">
        <div>Total Time: {mainTimer}s</div>
        <div>Question Time: {questionTimer}s</div>
        <div>
          Question: {current + 1}/{questions.length}
        </div>
      </div>

      <Question
        question={questions[current]?.question}
        options={questions[current]?.options}
        handleAnswer={handleAnswer}
        selected={selectedAnswers[current]?.answer}
      />

      <div className="mt-6 flex justify-between items-center">
        {current + 1 < questions.length ? (
          <button
            onClick={nextQuestion}
            className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Submit & Next
          </button>
        ) : (
          <button
            onClick={finishTest}
            className="px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Finish Test
          </button>
        )}

        {/* Always-visible finish button */}
        <button
          onClick={finishTest}
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Finish Anytime
        </button>
      </div>
    </div>
  );
};

export default TestPage;
