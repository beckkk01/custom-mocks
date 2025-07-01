// components/QuestionSets.jsx
import React, { useState } from "react";
import QuestionSetCard from "./QuestionSetCard";

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
  const [isFilterOpen, setIsFilterOpen] = useState(false); // State to manage filter collapse

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Maths & Reasoning Question Bank
      </h2>
      {/* Filter Toggle Button for Mobile */}
      <div className="sm:hidden mb-4">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isFilterOpen ? "Hide Filters" : "Show Filters"}
        </button>
      </div>
      {/* Filters */}
      <div
        className={`grid grid-cols-1 gap-4 mb-6 sm:flex sm:flex-row sm:gap-4 sm:items-end ${
          isFilterOpen ? "block" : "hidden sm:flex"
        }`}
      >
        <div className="sm:flex-1">
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
        <div className="sm:flex-1">
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
        <div className="sm:flex-1">
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
        <div className="sm:flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Remark
          </label>
          <input
            type="text"
            placeholder="Filter by remark"
            value={filter.remarkable}
            onChange={(e) => onFilterChange("remarkable", e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="sm:flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Sort By
          </label>
          <select
            value={filter.sortBy}
            onChange={(e) => onFilterChange("sortBy", e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>
      {/* Cards */}
      {filteredSets.length === 0 ? (
        <p className="text-sm text-gray-600 text-center">
          No question sets found.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSets.map((set) => (
            <QuestionSetCard
              key={set.id}
              set={set}
              onStartTest={onStartTest}
              onScheduleRevision={onScheduleRevision}
              onDelete={onDelete}
              onStopRevision={onStopRevision}
              upcomingRevisions={upcomingRevisions}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionSets;
