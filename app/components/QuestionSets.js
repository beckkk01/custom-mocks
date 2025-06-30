// components/QuestionSets.jsx
import React from "react";

const QuestionSets = ({
  sets,
  filteredSets,
  subjects,
  topics,
  filter,
  onFilterChange,
  onStartTest,
  onScheduleRevision,
  onDelete,
  onStopRevision,
  upcomingRevisions,
}) => {
  const getTotalQuestions = (questions) => {
    return Array.isArray(questions) ? questions.length : 0;
  };

  // Check if a question set has scheduled revisions
  const hasScheduledRevision = (setId) => {
    return upcomingRevisions.some((rev) => rev.questionSetId === setId);
  };

  // Get the revision ID for stopping (assuming one revision per set)
  const getRevisionId = (setId) => {
    const revision = upcomingRevisions.find(
      (rev) => rev.questionSetId === setId
    );
    return revision ? revision.id : null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Question Sets
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            placeholder="Filter by name"
            value={filter.name}
            onChange={(e) => onFilterChange("name", e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Subject
          </label>
          <select
            value={filter.subject}
            onChange={(e) => onFilterChange("subject", e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Topic
          </label>
          <select
            value={filter.topic}
            onChange={(e) => onFilterChange("topic", e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!filter.subject}
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
          <label className="block text-sm font-medium text-gray-700">
            Remark
          </label>
          <input
            type="text"
            placeholder="Filter by remark"
            value={filter.remark}
            onChange={(e) => onFilterChange("remark", e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Topic
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remark
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Questions
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSets.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-4 text-center text-sm text-gray-500"
                >
                  No question sets found.
                </td>
              </tr>
            ) : (
              filteredSets.map((set) => (
                <tr key={set.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {set.name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {set.subject}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {set.topic || "-"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {set.remark}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getTotalQuestions(set.questions)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap flex gap-3">
                    <button
                      onClick={() => onStartTest(set.questions)}
                      className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
                    >
                      Start
                    </button>
                    {hasScheduledRevision(set.id) ? (
                      <button
                        onClick={() => onStopRevision(getRevisionId(set.id))}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-sm"
                      >
                        Stop Revision
                      </button>
                    ) : (
                      <button
                        onClick={() => onScheduleRevision(set.id)}
                        className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-sm"
                      >
                        Schedule Revision
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(set.id)}
                      className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuestionSets;
