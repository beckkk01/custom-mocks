import React from "react";

const QuestionLoader = ({ onJsonUpload }) => {
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        onJsonUpload(data);
      } catch {
        alert("Invalid JSON file.");
      }
    };
    if (file) reader.readAsText(file);
  };

  return (
    <div className="my-4">
      <input type="file" accept=".json" onChange={handleFileUpload} />
    </div>
  );
};

export default QuestionLoader;
