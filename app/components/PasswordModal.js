// components/PasswordModal.jsx
import React from "react";

const PasswordModal = ({
  passwordInput,
  passwordError,
  onPasswordChange,
  onPasswordError,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Enter Password
        </h3>
        <form onSubmit={onSubmit}>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => {
              onPasswordChange(e.target.value);
              onPasswordError("");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter password"
          />
          {passwordError && (
            <p className="text-red-600 text-sm mt-2">{passwordError}</p>
          )}
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
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
