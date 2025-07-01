// app/components/BulkUploader.jsx
"use client";

import { useState } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function BulkUploader({ onClose }) {
  const [bulkQuestions, setBulkQuestions] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [error, setError] = useState("");

  const correctPassword = process.env.NEXT_PUBLIC_UPLOAD_PASSWORD;
  const topicOptions = ["Vocab", "Idioms & Phrases"];

  const handleUploadClick = () => {
    if (!category || !topic) {
      setError("Please provide both category and topic");
      return;
    }
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (password === correctPassword) {
      try {
        const parsedQuestions = JSON.parse(bulkQuestions);
        for (const q of parsedQuestions) {
          if (!q.id || !q.question || !q.options || !q.answer) {
            throw new Error(
              "Each question must have id, question, options, and answer"
            );
          }
          await addDoc(collection(db, "questions"), {
            id: q.id,
            question: q.question,
            options: q.options,
            answer: q.answer,
            category: category,
            topic: topic,
            nextReview: Date.now(),
            stability: 1,
            difficulty: 5,
            repetitions: 0,
            interval: 1,
            active: false,
          });
        }
        setBulkQuestions("");
        setCategory("");
        setTopic("");
        setError("");
        setShowPasswordModal(false);
        alert("Questions uploaded successfully");
        onClose();
      } catch (err) {
        setError("Invalid JSON or missing required fields");
        console.error("Error uploading questions:", err);
      }
    } else {
      setError("Incorrect password");
    }
  };

  return (
    <>
      {showPasswordModal ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Enter Password</h2>
            <input
              type="password"
              className="w-full p-2 border rounded mb-4"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handlePasswordSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl w-full p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Bulk Upload Questions</h2>
          <div className="flex space-x-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Category</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Enter category"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Topic</label>
              <select
                className="w-full p-2 border rounded"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              >
                <option value="">Select Topic</option>
                {topicOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <textarea
            className="w-full p-2 border rounded mb-4"
            rows={6}
            value={bulkQuestions}
            onChange={(e) => setBulkQuestions(e.target.value)}
            placeholder='Paste JSON questions here: [{"id": 1, "question": "All Greek", "options": ["strange", "incomprehensible", "inaudible", "uninteresting"], "answer": "incomprehensible"}]'
          />
          {error && <p className="text-red-600 mb-4">{error}</p>}
          <div className="flex justify-end space-x-2">
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={handleUploadClick}
            >
              Upload Questions
            </button>
          </div>
        </div>
      )}
    </>
  );
}
