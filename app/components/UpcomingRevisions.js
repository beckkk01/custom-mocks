// components/UpcomingRevisions.jsx
import React from "react";
import RevisionTable from "./RevisionTable";

const UpcomingRevisions = ({ revisions, sets, onStartRevision }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDateLabel = (dateStr) => {
    // Validate date string
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return null;
    target.setHours(0, 0, 0, 0);
    const diff = (target - today) / (1000 * 60 * 60 * 24);

    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff > 1 && diff <= 7) {
      return target.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
    }
    return null; // Exclude dates beyond 7 days
  };

  const isWithin7Days = (dateStr) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return false;
    target.setHours(0, 0, 0, 0);
    const diff = (target - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  const isToday = (dateStr) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return false;
    target.setHours(0, 0, 0, 0);
    return target.getTime() === today.getTime();
  };

  // Filter and prepare revisions for display
  const filteredRevisions = revisions
    .map((rev) => {
      const validDates = (rev.revisionDates || [])
        .map((date) => formatDateLabel(date))
        .filter((date) => date !== null)
        .sort((a, b) => {
          const order = ["Today", "Tomorrow"];
          const getOrder = (label) =>
            order.indexOf(label) !== -1
              ? order.indexOf(label)
              : new Date(label + ", 2025");
          return getOrder(a) - getOrder(b);
        });
      return {
        ...rev,
        validDates,
        isTodayRevision: (rev.revisionDates || []).some(isToday),
      };
    })
    .filter((rev) => rev.validDates.length > 0)
    .sort((a, b) => {
      const aDate = a.validDates[0] || "";
      const bDate = b.validDates[0] || "";
      const order = ["Today", "Tomorrow"];
      const getOrder = (label) =>
        order.indexOf(label) !== -1
          ? order.indexOf(label)
          : new Date(label + ", 2025");
      const dateDiff = getOrder(aDate) - getOrder(bDate);
      return dateDiff || a.questionSetId.localeCompare(b.questionSetId);
    });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Upcoming Revisions
      </h2>
      {filteredRevisions.length === 0 ? (
        <p className="text-sm text-gray-600">
          No revisions scheduled in the next 7 days.
        </p>
      ) : (
        <RevisionTable
          revisions={filteredRevisions}
          sets={sets}
          onStartRevision={onStartRevision}
        />
      )}
    </div>
  );
};

export default UpcomingRevisions;
