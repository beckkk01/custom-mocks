// components/JsonUpload.jsx
import React, { useState } from "react";

const JsonUpload = ({ onTextUpload }) => {
  const [jsonText, setJsonText] = useState("");

  const handleTextUpload = () => {
    try {
      const questions = JSON.parse(jsonText);
      onTextUpload(questions);
    } catch (error) {
      alert("Invalid JSON format. Please check your input.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
      <textarea
        rows={4}
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder="Paste JSON questions here..."
        className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-y"
      />
      <button
        onClick={handleTextUpload}
        className="mt-4 w-full sm:w-auto px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
      >
        Start Test
      </button>
    </div>
  );
};

export default JsonUpload;
