"use client";
import React, { useEffect, useState } from "react";
import Latex from "react-latex-next";
import "katex/dist/katex.min.css";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

const Result = () => {
  const [questionsData, setQuestionsData] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [totalTime, setTotalTime] = useState(0);
  const [questionTimes, setQuestionTimes] = useState([]);
  const [filter, setFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    topic: "",
    remark: "",
  });
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [showSubjectInput, setShowSubjectInput] = useState(false);
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const fetchSubjectsAndTopics = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "savedQuestions"));
        const uniqueSubjects = new Set();
        const uniqueTopics = new Set();
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.subject) uniqueSubjects.add(data.subject);
          if (data.topic) uniqueTopics.add(data.topic);
        });
        setSubjects([...uniqueSubjects]);
        setTopics([...uniqueTopics]);
      } catch (error) {
        console.error("Error fetching subjects and topics:", error);
      }
    };

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

    setQuestionsData(storedQuestions);
    setAnswers(storedAnswers);
    setTotalTime(storedTotalTime);
    setQuestionTimes(storedQuestionTimes);

    fetchSubjectsAndTopics();
  }, []);

  const attemptedQuestions = answers.filter((answer) => answer.answer !== null);
  const totalAttempted = attemptedQuestions.length;
  const score = attemptedQuestions.reduce((acc, answerObj) => {
    const question = questionsData.find((q) => q.id === answerObj.questionId);
    return question && question.answer === answerObj.answer ? acc + 1 : acc;
  }, 0);
  const totalIncorrect = totalAttempted - score;

  const incorrectQuestions = attemptedQuestions
    .filter((answerObj) => {
      const question = questionsData.find((q) => q.id === answerObj.questionId);
      return question && question.answer !== answerObj.answer;
    })
    .map((answerObj, index) => {
      const question = questionsData.find((q) => q.id === answerObj.questionId);
      return {
        ...question,
        userAnswer: answerObj.answer,
        time: questionTimes[answers.indexOf(answerObj)] || 0,
      };
    });

  const timeConsumingQuestions = attemptedQuestions
    .map((answerObj, index) => {
      const question = questionsData.find((q) => q.id === answerObj.questionId);
      return {
        ...question,
        userAnswer: answerObj.answer,
        time: questionTimes[answers.indexOf(answerObj)] || 0,
      };
    })
    .filter((q) => q.time > 90);

  const filteredQuestions =
    filter === "incorrect"
      ? incorrectQuestions
      : filter === "time"
      ? timeConsumingQuestions
      : attemptedQuestions.map((a, i) => {
          const q = questionsData.find((q) => q.id === a.questionId);
          return { ...q, userAnswer: a.answer, time: questionTimes[i] || 0 };
        });

  const exportToJSON = async (data, filename = "export.json") => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: "JSON Files",
            accept: { "application/json": [".json"] },
          },
        ],
      });
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

  const handleSaveToFirebase = async () => {
    if (passwordInput !== process.env.NEXT_PUBLIC_FIREBASE_SAVE_PASSWORD) {
      setPasswordError("Incorrect password");
      return;
    }

    try {
      const { name, subject, remark, topic } = formData;
      const docRef = await addDoc(collection(db, "savedQuestions"), {
        name,
        subject,
        remark,
        topic,
        questions: questionsData,
        timestamp: new Date(),
      });
      if (subject && !subjects.includes(subject))
        setSubjects([...subjects, subject]);
      if (topic && !topics.includes(topic)) setTopics([...topics, topic]);
      alert("Questions saved to Firebase with ID: " + docRef.id);
      setShowSaveForm(false);
      setShowPasswordModal(false);
      setPasswordInput("");
      setPasswordError("");
      setFormData({ name: "", subject: "", topic: "", remark: "" });
      setNewSubject("");
      setNewTopic("");
      setShowSubjectInput(false);
      setShowTopicInput(false);
    } catch (error) {
      console.error("Error saving questions to Firebase:", error);
      alert("Failed to save questions to Firebase.");
    }
  };

  const convertSeconds = (totalTime) => {
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleAddNewSubject = () => {
    if (newSubject && !subjects.includes(newSubject)) {
      setSubjects([...subjects, newSubject]);
      setFormData({ ...formData, subject: newSubject });
      setNewSubject("");
      setShowSubjectInput(false);
    }
  };

  const handleAddNewTopic = () => {
    if (newTopic && !topics.includes(newTopic)) {
      setTopics([...topics, newTopic]);
      setFormData({ ...formData, topic: newTopic });
      setNewTopic("");
      setShowTopicInput(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    handleSaveToFirebase();
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-3 sm:p-4">
      <div className="mb-4 bg-white shadow-md rounded-lg p-3 sm:p-4 border border-gray-200">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 text-center">
          Test Results
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            {
              label: "Total Time",
              value: convertSeconds(totalTime),
              color: "text-gray-900",
            },
            { label: "Correct", value: score, color: "text-green-600" },
            {
              label: "Incorrect",
              value: totalIncorrect,
              color: "text-red-600",
            },
            {
              label: "Avg Time",
              value:
                totalAttempted > 0
                  ? `${Math.floor(totalTime / totalAttempted)}s`
                  : "0s",
              color: "text-gray-900",
            },
            {
              label: "Attempted",
              value: totalAttempted,
              color: "text-blue-600",
            },
            {
              label: "Total",
              value: questionsData.length,
              color: "text-gray-900",
            },
          ].map((item, index) => (
            <div key={index} className="p-2 bg-gray-50 rounded-md text-center">
              <p className="text-xs sm:text-sm text-gray-600">{item.label}</p>
              <p className={`text-sm sm:text-base font-medium ${item.color}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-center mb-4">
        {[
          {
            label: "All",
            value: "all",
            bg: "bg-gray-200",
            hover: "hover:bg-gray-300",
          },
          {
            label: "Incorrect",
            value: "incorrect",
            bg: "bg-red-200",
            hover: "hover:bg-red-300",
          },
          {
            label: "Time > 90s",
            value: "time",
            bg: "bg-yellow-200",
            hover: "hover:bg-yellow-300",
          },
        ].map((btn) => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            className={`px-3 sm:px-4 py-1 rounded text-xs sm:text-sm font-medium transition-all duration-200 ${
              filter === btn.value
                ? btn.bg.replace("200", "300")
                : `${btn.bg} ${btn.hover}`
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex justify-center">
        <button
          onClick={() => setShowSaveForm(!showSaveForm)}
          className="px-3 sm:px-4 py-1 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition-all duration-200 text-xs sm:text-sm"
        >
          {showSaveForm ? "Close" : "Save to Firebase"}
        </button>
      </div>

      {showSaveForm && (
        <div className="mb-4 bg-white shadow-md rounded-lg p-3 sm:p-4 border border-gray-200">
          <h3 className="text-base font-semibold mb-2 text-gray-900">
            Save Test Data
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {["name", "subject", "topic", "remark"].map((key) => (
              <div key={key} className="flex flex-col">
                {key === "subject" || key === "topic" ? (
                  <>
                    <select
                      value={formData[key]}
                      onChange={(e) => {
                        if (e.target.value === "add-new") {
                          key === "subject"
                            ? setShowSubjectInput(true)
                            : setShowTopicInput(true);
                        } else {
                          setFormData({ ...formData, [key]: e.target.value });
                        }
                      }}
                      className="px-2 py-1 border rounded-md w-full text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-green-300"
                    >
                      <option value="">
                        Select {key.charAt(0).toUpperCase() + key.slice(1)}
                      </option>
                      {(key === "subject" ? subjects : topics).map(
                        (item, index) => (
                          <option key={index} value={item}>
                            {item}
                          </option>
                        )
                      )}
                      <option value="add-new">Add New</option>
                    </select>
                    {key === "subject" && showSubjectInput && (
                      <div className="mt-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="Add new subject"
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          className="px-2 py-1 border rounded-md w-full text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-green-300"
                        />
                        <button
                          onClick={handleAddNewSubject}
                          className="px-2 py-1 bg-green-600 text-white rounded-md text-xs sm:text-sm hover:bg-green-700"
                        >
                          Add
                        </button>
                      </div>
                    )}
                    {key === "topic" && showTopicInput && (
                      <div className="mt-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="Add new topic"
                          value={newTopic}
                          onChange={(e) => setNewTopic(e.target.value)}
                          className="px-2 py-1 border rounded-md w-full text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-green-300"
                        />
                        <button
                          onClick={handleAddNewTopic}
                          className="px-2 py-1 bg-green-600 text-white rounded-md text-xs sm:text-sm hover:bg-green-700"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                    value={formData[key]}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    className="px-2 py-1 border rounded-md w-full text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-green-300"
                  />
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="mt-2 px-4 py-1 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition-all duration-200 text-xs sm:text-sm"
          >
            Save
          </button>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-5 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold mb-3 text-gray-900">
              Enter Password
            </h3>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError("");
                }}
                className="w-full px-2 py-1 border rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-green-300"
                placeholder="Enter password"
              />
              {passwordError && (
                <p className="text-red-600 text-xs mt-1">{passwordError}</p>
              )}
              <div className="mt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput("");
                    setPasswordError("");
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-xs sm:text-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-green-600 text-white rounded-md text-xs sm:text-sm hover:bg-green-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filteredQuestions.length === 0 ? (
        <p className="text-center text-xs sm:text-sm text-gray-600 py-4">
          No questions match the selected filter.
        </p>
      ) : (
        filteredQuestions.map((q, index) => (
          <div
            key={q.id}
            className="mb-4 bg-white shadow-md rounded-lg p-3 sm:p-4 border border-gray-200"
          >
            <p className="text-sm sm:text-base font-medium text-gray-900 mb-2">
              {index + 1}. <Latex>{q.question}</Latex>
            </p>
            <div className="flex justify-between items-center mb-2">
              <p
                className={`text-xs sm:text-sm font-medium ${
                  q.answer === q.userAnswer ? "text-green-600" : "text-red-600"
                }`}
              >
                {q.answer === q.userAnswer ? "Correct ✓" : "Incorrect ✗"}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Time:{" "}
                <span
                  className={q.time > 90 ? "text-red-500" : "text-green-500"}
                >
                  {q.time}s
                </span>
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {q.options.map((option, optionIndex) => (
                <div
                  key={optionIndex}
                  className={`p-2 rounded-md border text-xs sm:text-sm ${
                    q.userAnswer === option && q.answer !== option
                      ? "bg-red-100 text-red-800 border-red-400"
                      : option === q.answer
                      ? "bg-green-100 text-green-800 border-green-400"
                      : "bg-white text-gray-800 border-gray-200"
                  }`}
                >
                  {String.fromCharCode(97 + optionIndex)}.{" "}
                  <Latex>{option}</Latex>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <div className="flex gap-2 justify-center mt-4">
        <button
          onClick={() =>
            exportToJSON(incorrectQuestions, "incorrect_questions.json")
          }
          className="px-3 sm:px-4 py-1 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-all duration-200 text-xs sm:text-sm"
        >
          Export Incorrect
        </button>
        <button
          onClick={() => exportToJSON(questionsData, "all_questions.json")}
          className="px-3 sm:px-4 py-1 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition-all duration-200 text-xs sm:text-sm"
        >
          Export All
        </button>
      </div>
    </div>
  );
};

export default Result;
