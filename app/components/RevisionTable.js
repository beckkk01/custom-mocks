import React from "react";

const RevisionTable = ({ revisions, sets, onStartRevision }) => {
  const getTotalQuestions = (questions) =>
    Array.isArray(questions) ? questions.length : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {revisions.map((revision) => {
        const questionSet = sets.find(
          (set) => set.id === revision.questionSetId
        );

        if (!questionSet) return null;

        return (
          <div
            key={revision.id}
            className="border border-gray-200 rounded-md p-4 bg-white flex flex-col justify-between"
          >
            {/* Header */}
            <div className="mb-2">
              <h3 className="font-semibold text-gray-800 text-base leading-tight">
                {questionSet.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {questionSet.subject} &middot;{" "}
                <span className="underline">
                  {getTotalQuestions(questionSet.questions)} Ques
                </span>
              </p>
              {/* Bottom section */}
              <div className=" flex flex-col gap-1 text-sm">
                <div className="text-gray-500">
                  Dates:{" "}
                  <span className="text-gray-800 font-medium">
                    {revision.validDates.length > 0
                      ? revision.validDates.join(", ")
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() =>
                  onStartRevision(revision.id, revision.questionSetId)
                }
                disabled={!revision.isTodayRevision}
                className={`px-4 py-1.5 rounded text-sm font-medium ${
                  revision.isTodayRevision
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {revision.isTodayRevision ? "Revise" : "Not Today"}
              </button>
              <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                Revision: {questionSet.revisionCycleCount || 0}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RevisionTable;
