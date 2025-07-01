// app/components/Quiz.jsx
"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

// FSRS Algorithm Implementation
const FSRS = {
  w: [
    0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05,
    0.34, 1.26, 0.29, 2.61,
  ],
  requestRetention: 0.9,
  maximumInterval: 36500,
  easyBonus: 1.3,
  hardFactor: 0.85,
  decay: -0.5,

  initStability(rating) {
    return Math.max(1, this.w[rating - 1]);
  },

  nextInterval(stability, retention = this.requestRetention) {
    return Math.min(
      Math.max(1, Math.round(stability * (1 / retention - 1))),
      this.maximumInterval
    );
  },

  nextStability(lastStability, rating, interval) {
    const difficulty = this.nextDifficulty(lastStability, rating);
    let stability;
    if (rating === 1) {
      stability = this.w[6] * Math.pow(lastStability, this.decay);
    } else if (rating === 2) {
      stability = lastStability * this.hardFactor;
    } else if (rating === 3) {
      stability =
        lastStability *
        (1 +
          Math.exp(this.w[8]) *
            (11 - difficulty) *
            Math.pow(lastStability, this.w[9]));
    } else {
      stability =
        lastStability *
        this.easyBonus *
        (1 +
          Math.exp(this.w[8]) *
            (11 - difficulty) *
            Math.pow(lastStability, this.w[9]));
    }
    return Math.max(1, stability);
  },

  nextDifficulty(lastStability, rating) {
    const meanReversion = this.w[4] * Math.pow(lastStability, -this.w[5]);
    let difficulty;
    if (rating === 1) {
      difficulty = this.w[10] + meanReversion + this.w[11] * rating;
    } else if (rating === 2) {
      difficulty = this.w[12] + meanReversion + this.w[13] * rating;
    } else if (rating === 3) {
      difficulty = this.w[14] + meanReversion + this.w[15] * rating;
    } else {
      difficulty = this.w[16] + meanReversion;
    }
    return Math.min(10, Math.max(1, difficulty));
  },

  schedule(card, rating, now) {
    const due = new Date(now);
    let stability = card.stability || this.initStability(rating);
    let difficulty = card.difficulty || 5;
    let repetitions = card.repetitions || 0;
    let interval = card.interval || 1;

    if (rating > 0) {
      repetitions += 1;
      stability = this.nextStability(stability, rating, interval);
      difficulty = this.nextDifficulty(stability, rating);
      interval = this.nextInterval(stability);
      due.setDate(due.getDate() + interval);
    } else {
      repetitions = 0;
      stability = this.initStability(1);
      difficulty = this.nextDifficulty(stability, 1);
      interval = 1;
      due.setDate(due.getDate() + interval);
    }

    return {
      due: due.getTime(),
      stability,
      difficulty,
      repetitions,
      interval,
    };
  },
};

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [questionLimit, setQuestionLimit] = useState(5);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [rating, setRating] = useState(0);

  // Fetch questions from Firebase
  useEffect(() => {
    const fetchQuestions = async () => {
      const querySnapshot = await getDocs(collection(db, "questions"));
      const questionsData = querySnapshot.docs.map((doc) => ({
        id: doc.data().id,
        question: doc.data().question,
        options: doc.data().options,
        answer: doc.data().answer,
        category: doc.data().category,
        topic: doc.data().topic,
        nextReview: doc.data().nextReview || Date.now(),
        stability: doc.data().stability || 1,
        difficulty: doc.data().difficulty || 5,
        repetitions: doc.data().repetitions || 0,
        interval: doc.data().interval || 1,
        active: doc.data().active || false,
      }));
      setQuestions(questionsData);
      const active = questionsData
        .filter((q) => q.active)
        .slice(0, questionLimit);
      setActiveQuestions(active);
      selectNextQuestion(active);
    };
    fetchQuestions();
  }, [questionLimit]);

  // Select next question based on due date
  const selectNextQuestion = (questionsData) => {
    const now = Date.now();
    let filteredQuestions = questionsData;
    if (categoryFilter) {
      filteredQuestions = filteredQuestions.filter(
        (q) => q.category === categoryFilter
      );
    }
    if (topicFilter) {
      filteredQuestions = filteredQuestions.filter(
        (q) => q.topic === topicFilter
      );
    }
    const dueQuestions = filteredQuestions.filter((q) => q.nextReview <= now);
    if (dueQuestions.length > 0) {
      const next =
        dueQuestions[Math.floor(Math.random() * dueQuestions.length)];
      setCurrentQuestion(next);
    } else {
      setCurrentQuestion(null);
    }
  };

  // Handle answer submission
  const handleSubmit = async () => {
    if (!currentQuestion || !userAnswer) return;

    const correct = userAnswer === currentQuestion.answer;
    setIsCorrect(correct);
    setShowResult(true);

    const cardRating = rating || (correct ? 3 : 1);
    const card = {
      stability: currentQuestion.stability,
      difficulty: currentQuestion.difficulty,
      repetitions: currentQuestion.repetitions,
      interval: currentQuestion.interval,
    };
    const now = Date.now();
    const updatedCard = FSRS.schedule(card, cardRating, now);

    // Update question in Firebase
    await addDoc(collection(db, "questions"), {
      ...currentQuestion,
      nextReview: updatedCard.due,
      stability: updatedCard.stability,
      difficulty: updatedCard.difficulty,
      repetitions: updatedCard.repetitions,
      interval: updatedCard.interval,
    });

    // Update local state
    const updatedQuestions = questions.map((q) =>
      q.id === currentQuestion.id
        ? {
            ...q,
            nextReview: updatedCard.due,
            stability: updatedCard.stability,
            difficulty: updatedCard.difficulty,
            repetitions: updatedCard.repetitions,
            interval: updatedCard.interval,
          }
        : q
    );
    setQuestions(updatedQuestions);
    setActiveQuestions(
      activeQuestions.map((q) =>
        q.id === currentQuestion.id
          ? {
              ...q,
              nextReview: updatedCard.due,
              stability: updatedCard.stability,
              difficulty: updatedCard.difficulty,
              repetitions: updatedCard.repetitions,
              interval: updatedCard.interval,
            }
          : q
      )
    );
  };

  // Handle next question
  const handleNext = () => {
    setShowResult(false);
    setUserAnswer("");
    setRating(0);
    selectNextQuestion(activeQuestions);
  };

  // Add questions to active deck
  const handleAddQuestions = async () => {
    const inactiveQuestions = questions.filter((q) => !q.active);
    const filteredQuestions = inactiveQuestions.filter(
      (q) =>
        (!categoryFilter || q.category === categoryFilter) &&
        (!topicFilter || q.topic === topicFilter)
    );
    const questionsToAdd = filteredQuestions.slice(
      0,
      questionLimit - activeQuestions.length
    );
    const updatedQuestions = questions.map((q) => {
      if (questionsToAdd.some((newQ) => newQ.id === q.id)) {
        return { ...q, active: true };
      }
      return q;
    });

    // Update Firebase
    for (const q of questionsToAdd) {
      await addDoc(collection(db, "questions"), { ...q, active: true });
    }

    setQuestions(updatedQuestions);
    const newActiveQuestions = [...activeQuestions, ...questionsToAdd];
    setActiveQuestions(newActiveQuestions);
    selectNextQuestion(newActiveQuestions);
  };

  // Get unique categories and topics
  const categories = [...new Set(questions.map((q) => q.category))].filter(
    Boolean
  );
  const topics = [...new Set(questions.map((q) => q.topic))].filter(Boolean);

  return (
    <div className="max-w-2xl w-full p-6 bg-white rounded-lg shadow-lg">
      {currentQuestion ? (
        <>
          <h2 className="text-2xl font-bold mb-2">
            {currentQuestion.question}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Category: {currentQuestion.category} | Topic:{" "}
            {currentQuestion.topic}
          </p>
          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`w-full p-2 text-left rounded ${
                  showResult
                    ? option === currentQuestion.answer
                      ? "bg-green-200"
                      : userAnswer === option
                      ? "bg-red-200"
                      : "bg-gray-100"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => setUserAnswer(option)}
                disabled={showResult}
              >
                {option}
              </button>
            ))}
          </div>
          {showResult ? (
            <div className="mt-4">
              <p className={isCorrect ? "text-green-600" : "text-red-600"}>
                {isCorrect
                  ? "Correct!"
                  : `Incorrect. The answer is ${currentQuestion.answer}.`}
              </p>
              <div className="mt-2">
                <p>Rate this question:</p>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4].map((r) => (
                    <button
                      key={r}
                      className={`px-2 py-1 rounded ${
                        rating === r ? "bg-blue-500 text-white" : "bg-gray-200"
                      }`}
                      onClick={() => setRating(r)}
                    >
                      {r === 1
                        ? "Again"
                        : r === 2
                        ? "Hard"
                        : r === 3
                        ? "Good"
                        : "Easy"}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleNext}
              >
                Next Question
              </button>
            </div>
          ) : (
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleSubmit}
              disabled={!userAnswer}
            >
              Submit
            </button>
          )}
        </>
      ) : (
        <p>No questions due for review in the active deck.</p>
      )}
      <div className="mt-6">
        <h3 className="text-lg font-semibold">Manage Deck</h3>
        <p className="mb-2">
          Cards in deck: {activeQuestions.length}/{questionLimit}
        </p>
        <div className="flex space-x-4 mb-4">
          <div>
            <label className="block text-sm">Category</label>
            <select
              className="p-2 border rounded"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm">Topic</label>
            <select
              className="p-2 border rounded"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
            >
              <option value="">All Topics</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm">Questions in Deck</label>
            <input
              type="number"
              className="p-2 border rounded"
              value={questionLimit}
              onChange={(e) =>
                setQuestionLimit(Math.max(1, parseInt(e.target.value)))
              }
              min="1"
            />
          </div>
        </div>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={handleAddQuestions}
          disabled={activeQuestions.length >= questionLimit}
        >
          Add Questions to Deck
        </button>
      </div>
    </div>
  );
}
