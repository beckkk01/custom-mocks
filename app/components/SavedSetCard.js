import React from "react";

const SavedSetCard = ({ set, onStart }) => {
  return (
    <div className="p-4 border rounded shadow bg-white">
      <p>
        <strong>Name:</strong> {set.name}
      </p>
      <p>
        <strong>Subject:</strong> {set.subject}
      </p>
      <p>
        <strong>Topic:</strong> {set.topic || "-"}
      </p>
      <p>
        <strong>Remark:</strong> {set.remark}
      </p>
      <button
        onClick={() => onStart(set)}
        className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Start Test
      </button>
    </div>
  );
};

export default SavedSetCard;
