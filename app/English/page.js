// app/components/Quiz.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";

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
      Math.max(
        1,
        Math.round((stability * Math.log(retention)) / Math.log(0.9))
      ),
      this.maximumInterval
    );
  },

  nextStability(lastStability, rating, lastDifficulty) {
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
            (11 - lastDifficulty) *
            Math.pow(lastStability, this.w[9]));
    } else {
      stability =
        lastStability *
        this.easyBonus *
        (1 +
          Math.exp(this.w[8]) *
            (11 - lastDifficulty) *
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
      if (repetitions === 1) {
        stability = this.initStability(rating);
      } else {
        stability = this.nextStability(stability, rating, difficulty);
      }
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
  // State Variables
  const [allQuestions, setAllQuestions] = useState([]);
  const [activeDeckQuestions, setActiveDeckQuestions] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewCompleted, setReviewCompleted] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [completedTopics, setCompletedTopics] = useState(new Set());

  // Fetch questions from Firebase
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
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
          docId: doc.id,
        }));
        setAllQuestions(questionsData);
        setActiveDeckQuestions(questionsData.filter((q) => q.active));
      } catch (error) {
        console.error("Error fetching questions:", error);
        alert("Failed to load questions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // Select next question for review
  const moveToNextQuestion = useCallback(() => {
    setShowResult(false);
    setUserAnswer("");
    setIsCorrect(false);

    const updatedQueue = reviewQueue.slice(1);
    setReviewQueue(updatedQueue);

    if (updatedQueue.length > 0) {
      setCurrentQuestion(updatedQueue[0]);
      setReviewCompleted(false);
    } else {
      setCurrentQuestion(null);
      setIsReviewing(false);
      setReviewCompleted(true);
      // Mark topics as completed when review session is done
      const filteredQuestions = activeDeckQuestions.filter(
        (q) =>
          (!categoryFilter || q.category === categoryFilter) &&
          (!topicFilter || q.topic === topicFilter)
      );
      const topicsDue = new Set(
        filteredQuestions.map((q) => `${q.category}:${q.topic}`)
      );
      setCompletedTopics((prev) => new Set([...prev, ...topicsDue]));
    }
  }, [reviewQueue, activeDeckQuestions, categoryFilter, topicFilter]);

  // Handle answer submission
  const handleAnswerSubmission = () => {
    if (!currentQuestion || !userAnswer) return;

    const correct = userAnswer === currentQuestion.answer;
    setIsCorrect(correct);
    setShowResult(true);
  };

  // Handle rating and progress
  const handleRatingAndProgress = async (rating) => {
    if (!currentQuestion) return;

    const now = Date.now();
    const updatedCardFSRS = FSRS.schedule(
      {
        stability: currentQuestion.stability,
        difficulty: currentQuestion.difficulty,
        repetitions: currentQuestion.repetitions,
        interval: currentQuestion.interval,
      },
      rating,
      now
    );

    const updatedQuestionData = {
      ...currentQuestion,
      nextReview: updatedCardFSRS.due,
      stability: updatedCardFSRS.stability,
      difficulty: updatedCardFSRS.difficulty,
      repetitions: updatedCardFSRS.repetitions,
      interval: updatedCardFSRS.interval,
    };

    try {
      await setDoc(
        doc(db, "questions", currentQuestion.docId),
        updatedQuestionData
      );
      setAllQuestions((prev) =>
        prev.map((q) =>
          q.docId === currentQuestion.docId ? updatedQuestionData : q
        )
      );
      setActiveDeckQuestions((prev) =>
        prev.map((q) =>
          q.docId === currentQuestion.docId ? updatedQuestionData : q
        )
      );
      moveToNextQuestion();
    } catch (error) {
      console.error("Error updating question in Firebase:", error);
      alert("Failed to save review progress. Please try again.");
    }
  };

  // Start review session
  const startReview = useCallback(() => {
    const now = Date.now();
    const filteredQuestions = activeDeckQuestions.filter(
      (q) =>
        (!categoryFilter || q.category === categoryFilter) &&
        (!topicFilter || q.topic === topicFilter)
    );
    const dueQuestions = filteredQuestions
      .filter((q) => q.active && q.nextReview <= now)
      .sort((a, b) => a.nextReview - b.nextReview);

    if (dueQuestions.length > 0) {
      setReviewQueue(dueQuestions);
      setCurrentQuestion(dueQuestions[0]);
      setIsReviewing(true);
      setReviewCompleted(false);
    } else {
      setReviewQueue([]);
      setCurrentQuestion(null);
      setIsReviewing(false);
      setReviewCompleted(true);
      // Mark topics as completed if no cards are due
      const topicsDue = new Set(
        filteredQuestions.map((q) => `${q.category}:${q.topic}`)
      );
      setCompletedTopics((prev) => new Set([...prev, ...topicsDue]));
    }
  }, [activeDeckQuestions, categoryFilter, topicFilter]);

  // Toggle question active status
  const toggleQuestionActiveStatus = async (question) => {
    const updatedQuestion = { ...question, active: !question.active };
    try {
      await setDoc(doc(db, "questions", question.docId), updatedQuestion);
      setAllQuestions((prev) =>
        prev.map((q) => (q.docId === question.docId ? updatedQuestion : q))
      );
      if (updatedQuestion.active) {
        setActiveDeckQuestions((prev) => [...prev, updatedQuestion]);
      } else {
        setActiveDeckQuestions((prev) =>
          prev.filter((q) => q.docId !== question.docId)
        );
      }
    } catch (error) {
      console.error("Error toggling question status:", error);
      alert("Failed to update question status. Please try again.");
    }
  };

  // Add next 3 questions to deck
  const handleAddThreeQuestions = async () => {
    const inactiveQuestions = allQuestions
      .filter((q) => !q.active)
      .filter(
        (q) =>
          (!categoryFilter || q.category === categoryFilter) &&
          (!topicFilter || q.topic === topicFilter)
      );

    if (inactiveQuestions.length < 3) {
      alert(
        `Not enough inactive questions available. Only ${inactiveQuestions.length} question(s) can be added.`
      );
      return;
    }

    const questionsToAdd = inactiveQuestions.slice(0, 3).map((q) => ({
      ...q,
      active: true,
      nextReview: Date.now(),
    }));

    try {
      for (const q of questionsToAdd) {
        await setDoc(doc(db, "questions", q.docId), q);
      }
      setAllQuestions((prev) =>
        prev.map(
          (q) => questionsToAdd.find((newQ) => newQ.docId === q.docId) || q
        )
      );
      setActiveDeckQuestions((prev) => [...prev, ...questionsToAdd]);
      alert(
        `${questionsToAdd.length} questions added to active deck and are due for review!`
      );
    } catch (error) {
      console.error("Error adding questions to deck:", error);
      alert("Failed to add questions. Please try again.");
    }
  };

  // Get due today count
  const getDueTodayCount = () => {
    const now = Date.now();
    const filteredQuestions = activeDeckQuestions.filter(
      (q) =>
        (!categoryFilter || q.category === categoryFilter) &&
        (!topicFilter || q.topic === topicFilter)
    );
    return filteredQuestions.filter((q) => q.active && q.nextReview <= now)
      .length;
  };

  // Get today's due by category and topic
  const getTodaysDueByTopic = () => {
    const now = Date.now();
    const dueQuestions = activeDeckQuestions.filter(
      (q) =>
        q.active &&
        q.nextReview <= now &&
        (!categoryFilter || q.category === categoryFilter) &&
        (!topicFilter || q.topic === topicFilter)
    );

    const grouped = dueQuestions.reduce((acc, q) => {
      const key = `${q.category}:${q.topic}`;
      if (!acc[key]) {
        acc[key] = { category: q.category, topic: q.topic, count: 0 };
      }
      acc[key].count += 1;
      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a, b) =>
        a.category.localeCompare(b.category) || a.topic.localeCompare(b.topic)
    );
  };

  // Get filtered counts
  const getFilteredCounts = () => {
    const filteredQuestions = allQuestions.filter(
      (q) =>
        (!categoryFilter || q.category === categoryFilter) &&
        (!topicFilter || q.topic === topicFilter)
    );
    return {
      active: filteredQuestions.filter((q) => q.active).length,
      inactive: filteredQuestions.filter((q) => !q.active).length,
    };
  };

  // Get unique categories and topics
  const categories = [...new Set(allQuestions.map((q) => q.category))].filter(
    Boolean
  );
  const topics = [...new Set(allQuestions.map((q) => q.topic))].filter(Boolean);

  const todaysDue = getTodaysDueByTopic();
  const { active, inactive } = getFilteredCounts();

  if (isLoading) {
    return (
      <div className="max-w-3xl w-full p-6 bg-white rounded-lg shadow-lg text-center mx-auto my-8">
        Loading your knowledge base...
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full p-6 bg-white rounded-lg shadow-xl mx-auto my-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
        Spaced Repetition Study
      </h1>

      {/* Today's Due by Topic */}
      <section className="mb-10 p-6 border border-gray-200 rounded-lg bg-white shadow">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Today's Due
        </h2>
        {todaysDue.length > 0 ? (
          <ul className="space-y-3">
            {todaysDue.map(({ category, topic, count }) => (
              <li
                key={`${category}:${topic}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <p className="text-sm font-medium text-gray-800">
                  {category} - {topic}: {count} card{count !== 1 ? "s" : ""} due
                </p>
                <span
                  className={`text-sm font-semibold ${
                    completedTopics.has(`${category}:${topic}`)
                      ? "text-green-600"
                      : "text-gray-600"
                  }`}
                >
                  {completedTopics.has(`${category}:${topic}`)
                    ? "Done"
                    : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-lg text-gray-600">No cards due today.</p>
        )}
      </section>

      {/* Deck Management */}
      <section className="mb-10 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Deck Management
        </h2>
        <div className="flex justify-between items-center mb-6">
          <p className="text-xl text-gray-800">
            Total Active Cards:{" "}
            <span className="font-bold">
              {allQuestions.filter((q) => q.active).length}
            </span>{" "}
            | Total Inactive Cards:{" "}
            <span className="font-bold">
              {allQuestions.filter((q) => !q.active).length}
            </span>
          </p>
        </div>
        <div className="flex space-x-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600">
              Category Filter
            </label>
            <select
              className="p-2 border rounded w-full"
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
            <label className="block text-sm text-gray-600">Topic Filter</label>
            <select
              className="p-2 border rounded w-full"
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
        </div>
        {(categoryFilter || topicFilter) && (
          <p className="text-sm text-gray-600 mb-4">
            Filtered: Active Cards: <span className="font-bold">{active}</span>{" "}
            | Inactive Cards: <span className="font-bold">{inactive}</span>
          </p>
        )}
        <div className="mb-4 flex space-x-4">
          <button
            className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddThreeQuestions}
            disabled={inactive < 3}
          >
            +3 Questions
          </button>
        </div>

        {/* <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Available Questions</h3>
          <ul className="max-h-64 overflow-y-auto space-y-2">
            {allQuestions
              .filter(
                (q) =>
                  (!categoryFilter || q.category === categoryFilter) &&
                  (!topicFilter || q.topic === topicFilter)
              )
              .map((q) => (
                <li
                  key={q.docId}
                  className="flex items-center justify-between p-2 bg-gray-100 rounded"
                >
                  <span className="text-sm">
                    {q.question} ({q.category} - {q.topic})
                  </span>
                  <button
                    className={`px-3 py-1 rounded text-white ${
                      q.active
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                    onClick={() => toggleQuestionActiveStatus(q)}
                  >
                    {q.active ? "Remove" : "Add"}
                  </button>
                </li>
              ))}
          </ul>
        </div>
        <p className="text-sm text-gray-500">
          Select questions to add or remove from your active deck, or use +3 to
          add three at once. Active cards are included in review sessions.
        </p> */}
      </section>

      {/* Upcoming Reviews */}
      {/* <section className="mb-10 p-6 border border-gray-200 rounded-lg bg-white shadow">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Upcoming Reviews
        </h2>
        {upcomingReviews.length > 0 ? (
          <ul className="space-y-3">
            {upcomingReviews.map((q) => (
              <li
                key={q.docId}
                className="p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <p className="text-sm font-medium text-gray-800">
                  {q.question}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Due: {new Date(q.nextReview).toLocaleString()} | Category:{" "}
                  {q.category} | Topic: {q.topic}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-lg text-gray-600">
            No upcoming reviews scheduled.
          </p>
        )}
      </section> */}

      {/* Review Session */}
      <section className="p-6 border border-gray-200 rounded-lg bg-blue-50">
        <h2 className="text-2xl font-semibold mb-4 text-blue-800">
          Review Session
        </h2>
        {!isReviewing ? (
          <button
            className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={startReview}
            disabled={getDueTodayCount() === 0}
          >
            Start Review ({getDueTodayCount()} cards due)
          </button>
        ) : !reviewCompleted ? (
          currentQuestion ? (
            <>
              <h3 className="text-xl font-bold mb-2 text-gray-800">
                {currentQuestion.question}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Category: {currentQuestion.category} | Topic:{" "}
                {currentQuestion.topic}
              </p>
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className={`w-full p-3 text-left rounded-md transition-colors duration-200 text-lg
                      ${
                        showResult
                          ? option === currentQuestion.answer
                            ? "bg-green-200 border border-green-400"
                            : userAnswer === option
                            ? "bg-red-200 border border-red-400"
                            : "bg-gray-100"
                          : userAnswer === option
                          ? "bg-blue-100 border border-blue-300"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    onClick={() => setUserAnswer(option)}
                    disabled={showResult}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {!showResult ? (
                <button
                  className="mt-6 w-full px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAnswerSubmission}
                  disabled={!userAnswer}
                >
                  Submit Answer
                </button>
              ) : (
                <div className="mt-6 p-4 bg-white rounded-lg shadow-md">
                  <p
                    className={`text-lg font-semibold ${
                      isCorrect ? "text-green-700" : "text-red-700"
                    } mb-3`}
                  >
                    {isCorrect
                      ? "Correct!"
                      : `Incorrect. The answer was: "${currentQuestion.answer}".`}
                  </p>
                  <p className="font-medium mb-2 text-gray-700">
                    Rate difficulty:
                  </p>
                  <div className="flex space-x-3 mb-3">
                    {[1, 2, 3, 4].map((r) => (
                      <button
                        key={r}
                        className={`px-4 py-2 rounded-md transition-colors duration-200 text-base
                          ${
                            r === 1
                              ? "bg-red-500 hover:bg-red-600"
                              : r === 2
                              ? "bg-orange-500 hover:bg-orange-600"
                              : r === 3
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-blue-500 hover:bg-blue-600"
                          } text-white`}
                        onClick={() => handleRatingAndProgress(r)}
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
                  <p className="text-sm text-gray-600">
                    Remaining: {reviewQueue.length - 1} cards
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-lg text-gray-700 py-4">
              <p>No cards currently due for review.</p>
              <button
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={() => {
                  setIsReviewing(false);
                  setReviewCompleted(false);
                }}
              >
                Back to Dashboard
              </button>
            </div>
          )
        ) : (
          <div className="text-center text-lg text-gray-700 py-4">
            <p className="font-bold text-green-700 text-2xl">
              Review Session Complete!
            </p>
            <p className="mt-2">All due cards reviewed. Great work!</p>
            <button
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={() => {
                setIsReviewing(false);
                setReviewCompleted(false);
              }}
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
