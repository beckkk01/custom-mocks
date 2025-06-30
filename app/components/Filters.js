import React from "react";

const Filters = ({ filter, onChange }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {Object.entries(filter).map(([key, value]) => (
        <input
          key={key}
          type="text"
          placeholder={`Filter by ${key}`}
          value={value}
          onChange={(e) => onChange(key, e.target.value)}
          className="px-3 py-2 border rounded"
        />
      ))}
    </div>
  );
};

export default Filters;
