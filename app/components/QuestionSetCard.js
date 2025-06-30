import React from "react";

const QuestionSetCard = ({
  set,
  onStartTest,
  onScheduleRevision,
  onDelete,
  onStopRevision,
  upcomingRevisions,
}) => {
  const getTotalQuestions = (questions) =>
    Array.isArray(questions) ? questions.length : 0;

  const hasScheduledRevision = (setId) =>
    upcomingRevisions.some((rev) => rev.questionSetId === setId);

  const getRevisionId = (setId) => {
    const revision = upcomingRevisions.find(
      (rev) => rev.questionSetId === setId
    );
    return revision ? revision.id : null;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 text-sm">
      {/* Top section */}
      <div className="flex justify-between items-start gap-4 flex-wrap mb-2">
        <div className="flex-1">
          {/* Badge and title */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900">
              {set.name || "Untitled Question Set"}
            </h3>
          </div>
          {/* Metadata */}
          <div className="text-gray-600 mt-1">
            <p className="underline">
              {set.subject} {set.topic} &middot;{" "}
              {getTotalQuestions(set.questions)} Ques
            </p>
            <p className="text-gray-500 mt-1  line-clamp-2">
              {set.remark || "No remarks available."}
            </p>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mt-2 sm:mt-0">
        <button
          onClick={() => onStartTest(set.questions)}
          className="px-4 py-1.5 text-white bg-cyan-500 hover:bg-cyan-600 rounded text-sm font-medium"
        >
          Start Test
        </button>

        {hasScheduledRevision(set.id) ? (
          <button
            onClick={() => onStopRevision(getRevisionId(set.id))}
            className="px-4 py-1.5 text-black border border-red-500 rounded hover:bg-cyan-50 text-sm font-medium"
          >
            Stop Revision
          </button>
        ) : (
          <button
            onClick={() => onScheduleRevision(set.id)}
            className="px-4 py-1.5 text-white bg-blue-500 hover:bg-blue-600 rounded text-sm font-medium"
          >
            Start Revision
          </button>
        )}
      </div>

      {/* Bottom footer */}
      <div className="border-t mt-4 pt-2 text-xs text-gray-500 flex flex-wrap justify-between items-center">
        <div>
          <button
            onClick={() => onDelete(set.id)}
            className="text-gray-500 hover:text-red-500 hover:underline"
          >
            Delete
          </button>
        </div>

        <div>
          <span className="text-blue-600 hover:underline cursor-pointer">
            Revision: {set.revisionCycleCount || 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuestionSetCard;
