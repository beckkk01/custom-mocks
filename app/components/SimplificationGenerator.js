// pages/SimplificationGenerator.jsx
"use client";
import React, { useState } from "react";
import Latex from "react-latex-next";
import "katex/dist/katex.min.css";
import { create, all } from "mathjs";

const math = create(all);
math.config({ number: "Fraction" });

const getRandomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const generateTerm = (type, maxNum) => {
  switch (type) {
    case "percentage":
      return `${getRandomInt(1, 100)}\\% \\text{ of } ${getRandomInt(
        10,
        maxNum
      )}`;
    case "root":
      const perfectSquares = [4, 9, 16, 25, 36, 49, 64, 81, 100].filter(
        (n) => n <= maxNum
      );
      return `\\sqrt{${
        perfectSquares[Math.floor(Math.random() * perfectSquares.length)] || 16
      }}`;
    case "square":
      const base = getRandomInt(1, Math.min(20, maxNum));
      return `${base}^2`;
    case "decimal":
      return (Math.random() * maxNum).toFixed(2).toString();
    case "fraction":
      const numerator = getRandomInt(1, maxNum);
      const den = getRandomInt(2, maxNum);
      return `\\frac{${numerator}}{${den}}`;
    case "exponent":
      const baseExp = getRandomInt(2, 10);
      const exp = getRandomInt(2, 4);
      return `${baseExp}^{${exp}}`;
    case "absolute":
      const value = getRandomInt(-maxNum, maxNum);
      return `|${value}|`;
    case "arithmetic":
      return getRandomInt(1, maxNum).toString();
    case "algebra":
      const coef = getRandomInt(1, maxNum);
      const variable = ["x", "y", "z"][Math.floor(Math.random() * 3)];
      return `${coef}${variable}`;
    default:
      return getRandomInt(1, maxNum).toString();
  }
};

const generateExpression = (
  termCount,
  maxNum,
  selectedCategories,
  useBrackets
) => {
  const activeCategories = Object.keys(selectedCategories).filter(
    (cat) => selectedCategories[cat]
  );
  if (activeCategories.length === 0)
    return { expr: "Error", plainExpr: "Error", operation: "arithmetic" };

  const terms = [];
  const plainTerms = [];
  const operations = [];
  const ops = ["+", "-", "\\times", "\\div"];

  // Ensure consistent operation type for algebraic terms
  const isAlgebraOnly =
    activeCategories.length === 1 && activeCategories[0] === "algebra";
  const operation = isAlgebraOnly
    ? "algebra"
    : activeCategories[Math.floor(Math.random() * activeCategories.length)];

  for (let i = 0; i < termCount; i++) {
    const type = isAlgebraOnly
      ? "algebra"
      : activeCategories[Math.floor(Math.random() * activeCategories.length)];
    const term = generateTerm(type, maxNum);
    const plainTerm = String(term)
      .replace(/\\sqrt\{(\d+)\}/, "sqrt($1)")
      .replace(/\\frac\{(\d+)\}\{(\d+)\}/, "$1/$2")
      .replace(/\\times/, "*")
      .replace(/\\div/, "/")
      .replace(/\\% \\text{ of }/, "% of ");
    terms.push(term);
    plainTerms.push(plainTerm);
    if (i < termCount - 1) {
      // Restrict operations for algebra to + and - only
      const validOps = operation === "algebra" ? ["+", "-"] : ops;
      operations.push(validOps[Math.floor(Math.random() * validOps.length)]);
    }
  }

  let expr = terms[0];
  let plainExpr = plainTerms[0];
  for (let i = 0; i < operations.length; i++) {
    expr += ` ${operations[i]} ${terms[i + 1]}`;
    plainExpr += ` ${
      operations[i] === "\\times"
        ? "*"
        : operations[i] === "\\div"
        ? "/"
        : operations[i]
    } ${plainTerms[i + 1]}`;
  }

  if (useBrackets && termCount > 2) {
    const bracketPos = Math.floor(Math.random() * (termCount - 1));
    expr = `${expr
      .split(" ")
      .slice(0, bracketPos * 2)
      .join(" ")}(${expr
      .split(" ")
      .slice(bracketPos * 2, (bracketPos + 2) * 2)
      .join(" ")}) ${expr
      .split(" ")
      .slice((bracketPos + 2) * 2)
      .join(" ")}`;
    plainExpr = `${plainExpr
      .split(" ")
      .slice(0, bracketPos * 2)
      .join(" ")}(${plainExpr
      .split(" ")
      .slice(bracketPos * 2, (bracketPos + 2) * 2)
      .join(" ")}) ${plainExpr
      .split(" ")
      .slice((bracketPos + 2) * 2)
      .join(" ")}`;
  }

  return { expr: `(${expr})`, plainExpr: `(${plainExpr})`, operation };
};

const formatToLatex = (expr) => {
  try {
    return `Simplify: $${math
      .parse(expr)
      .toTex({ parenthesis: "keep", implicit: "show" })
      .replace(/\\cdot/g, "\\times")}$`;
  } catch {
    return `Simplify: $${expr}$`;
  }
};

const generateOptions = (correct, operation) => {
  const isInteger = [
    "arithmetic",
    "root",
    "square",
    "exponent",
    "absolute",
  ].includes(operation);
  const isFraction = operation === "fraction";
  const isAlgebra = operation === "algebra";
  const correctVal = isFraction
    ? correct
    : isInteger
    ? Math.round(correct)
    : isAlgebra
    ? correct
    : Number(correct.toFixed(2));
  const correctStr =
    isFraction || isAlgebra ? `$${correctVal}$` : `$${correctVal}$`;

  const distractors = [];
  const allOptions = new Set();
  const maxAttempts = 15;
  let attempts = 0;

  while (allOptions.size < 10 && attempts < maxAttempts) {
    let fake;
    if (isFraction) {
      const [num, den] = correctVal.split("/").map(Number);
      const offset = getRandomInt(-5, 5);
      fake = num + offset === 0 ? "0" : `${num + offset}/${den || 1}`;
    } else if (isAlgebra) {
      const coef =
        Number(correctVal.replace(/[a-z]/g, "")) + getRandomInt(-5, 5);
      fake = `${coef}${correctVal.match(/[a-z]/) || "x"}`;
    } else if (isInteger) {
      fake = correctVal + getRandomInt(-5, 5);
    } else {
      fake = Number((correctVal + (Math.random() * 2 - 1) * 0.5).toFixed(2));
    }
    const fakeStr =
      isFraction || isAlgebra
        ? `$${fake}$`
        : `$${isInteger ? Math.round(fake) : fake.toFixed(2)}$`;

    if (fake !== correctVal && fake !== 0 && !allOptions.has(fakeStr)) {
      allOptions.add(fakeStr);
      if (
        isFraction
          ? fake.includes("/")
          : isAlgebra
          ? fake.match(/[a-z]/)
          : isInteger
          ? Number.isInteger(fake)
          : true
      ) {
        distractors.push(fakeStr);
      }
    }
    attempts++;
  }

  const selected = new Set([correctStr]);
  while (selected.size < 3 && distractors.length > 0) {
    const idx = Math.floor(Math.random() * distractors.length);
    selected.add(distractors.splice(idx, 1)[0]);
  }

  const remaining = [...allOptions].filter((opt) => !selected.has(opt));
  while (selected.size < 4 && remaining.length > 0) {
    const idx = Math.floor(Math.random() * remaining.length);
    selected.add(remaining.splice(idx, 1)[0]);
  }

  return Array.from(selected).sort(() => Math.random() - 0.5);
};

const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));

export default function SimplificationGenerator() {
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [selectedCategories, setSelectedCategories] = useState({
    arithmetic: true,
    percentage: true,
    root: true,
    square: true,
    decimal: true,
    fraction: true,
    exponent: true,
    absolute: true,
    algebra: true,
  });
  const [useBrackets, setUseBrackets] = useState(true);
  const [variableTerms, setVariableTerms] = useState({
    easy: [2, 3],
    medium: [3, 4],
    hard: [4, 5],
  });
  const [jsonOutput, setJsonOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleTermChange = (level, index, value) => {
    setVariableTerms((prev) => ({
      ...prev,
      [level]: prev[level].map((v, i) =>
        i === index ? Math.max(1, Number(value)) : v
      ),
    }));
  };

  const generateQuestions = async () => {
    if (!Object.values(selectedCategories).some((val) => val)) {
      alert("Please select at least one category.");
      return;
    }
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      const difficulties = {
        easy: { maxNum: 20, terms: variableTerms.easy },
        medium: { maxNum: 50, terms: variableTerms.medium },
        hard: { maxNum: 100, terms: variableTerms.hard },
      };
      const config = difficulties[difficulty];
      const results = [];
      const maxAttempts = questionCount * 10; // Increased attempts for robustness
      let attempts = 0;
      let count = 1;

      while (results.length < questionCount && attempts < maxAttempts) {
        attempts++;
        const termCount =
          Math.floor(Math.random() * (config.terms[1] - config.terms[0] + 1)) +
          config.terms[0];
        const { expr, plainExpr, operation } = generateExpression(
          termCount,
          config.maxNum,
          selectedCategories,
          useBrackets
        );

        if (expr === "Error") continue;

        let answer = null;
        try {
          const raw = math.evaluate(plainExpr);
          answer = typeof raw?.valueOf === "function" ? raw.valueOf() : raw;
          if (operation === "fraction") {
            const num = Math.round(answer.n * answer.d);
            const den = answer.d;
            const divisor = gcd(Math.abs(num), den);
            answer = num === 0 ? "0" : `${num / divisor}/${den / divisor}`;
          } else if (operation === "algebra") {
            // Check if all terms have the same variable
            const variables = plainExpr.match(/[a-z]/g) || ["x"];
            const uniqueVars = new Set(variables);
            if (uniqueVars.size > 1) continue; // Skip if mixed variables
            const coef = Math.round(answer);
            answer = `${coef}${variables[0]}`;
          } else {
            answer = Number.isInteger(answer)
              ? answer
              : Number(answer.toFixed(2));
          }
        } catch {
          continue;
        }

        if (answer === null || isNaN(answer) || answer === Infinity) continue;

        const question = {
          id: count++,
          question: formatToLatex(expr),
          options: generateOptions(answer, operation),
          answer:
            operation === "fraction" || operation === "algebra"
              ? `$${answer}$`
              : `$${answer}$`,
        };

        results.push(question);
      }

      if (results.length < questionCount) {
        throw new Error("Failed to generate enough valid questions");
      }

      setJsonOutput(JSON.stringify(results, null, 2));
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("Failed to generate questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-left">
          Simplification Question Generator
        </h1>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Configure Your Question Set
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              generateQuestions();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Number of Questions
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                {[5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Term Ranges
              </label>
              {["easy", "medium", "hard"].map((level) => (
                <div key={level} className="flex items-center space-x-2 mb-2">
                  <span className="text-sm text-gray-700 capitalize">
                    {level}:
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={variableTerms[level][0]}
                    onChange={(e) => handleTermChange(level, 0, e.target.value)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-700">to</span>
                  <input
                    type="number"
                    min="1"
                    value={variableTerms[level][1]}
                    onChange={(e) => handleTermChange(level, 1, e.target.value)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Question Types
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.keys(selectedCategories).map((category) => (
                  <label key={category} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCategories[category]}
                      onChange={() => handleCategoryChange(category)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      disabled={isLoading}
                    />
                    <span className="text-sm text-gray-700">
                      {category.charAt(0).toUpperCase() +
                        category.slice(1).replace(/([A-Z])/g, " $1")}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useBrackets}
                  onChange={() => setUseBrackets((prev) => !prev)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  disabled={isLoading}
                />
                <span className="text-sm font-medium text-gray-700">
                  Use Brackets
                </span>
              </label>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-indigo-300"
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate Questions"}
            </button>
          </form>
        </div>
        {jsonOutput && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Generated Questions (JSON)
            </h2>
            <textarea
              value={jsonOutput}
              readOnly
              rows="20"
              className="w-full font-mono text-sm p-4 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
        )}
      </div>
    </div>
  );
}
