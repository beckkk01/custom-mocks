// components/FrequencyModal.jsx
import React from "react";

const FrequencyModal = ({
  frequency,
  onFrequencyChange,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Select Revision Frequency
        </h3>
        <form onSubmit={onSubmit}>
          <select
            value={frequency}
            onChange={(e) => onFrequencyChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="1,3,5,7,21">1,3,5,7,21 days</option>
            <option value="1,5,11,21">1,5,11,21 days</option>
            <option value="0,1">0,1 days</option>
          </select>
          <div className="mt-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FrequencyModal;
