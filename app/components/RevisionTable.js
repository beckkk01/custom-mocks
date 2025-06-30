// components/RevisionTable.jsx
import React from "react";

const RevisionTable = ({ revisions, sets, onStartRevision }) => {
  const getTotalQuestions = (questions) => {
    return Array.isArray(questions) ? questions.length : 0;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Set Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subject
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Topic
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Questions
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Revision Dates
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {revisions.map((revision) => {
            const questionSet = sets.find(
              (set) => set.id === revision.questionSetId
            );
            return (
              <tr
                key={revision.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {questionSet?.name || "Unknown"}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {questionSet?.subject || "Unknown"}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {questionSet?.topic || "-"}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {questionSet ? getTotalQuestions(questionSet.questions) : 0}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {revision.validDates.length > 0
                    ? revision.validDates.join(", ")
                    : "-"}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {revision.isTodayRevision ? (
                    <button
                      onClick={() =>
                        onStartRevision(revision.id, revision.questionSetId)
                      }
                      className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
                    >
                      Start Revision
                    </button>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RevisionTable;
