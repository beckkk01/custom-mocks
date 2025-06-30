// components/Home.jsx
"use client";
import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useRouter } from "next/navigation";
import JsonUpload from "@/app/components/JsonUpload";
import UpcomingRevisions from "@/app/components/UpcomingRevisions";
import QuestionSets from "@/app/components/QuestionSets";
import FrequencyModal from "@/app/components/FrequencyModal";
import PasswordModal from "@/app/components/PasswordModal";

const Home = () => {
  const router = useRouter();
  const [sets, setSets] = useState([]);
  const [filter, setFilter] = useState({
    name: "",
    subject: "",
    topic: "",
    remark: "",
    sortBy: "newest", // Default sort by newest
  });
  const [filteredSets, setFilteredSets] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [upcomingRevisions, setUpcomingRevisions] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [deleteSetId, setDeleteSetId] = useState(null);
  const [spacedRevisionSetId, setSpacedRevisionSetId] = useState(null);
  const [stopRevisionId, setStopRevisionId] = useState(null);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [spacedRevisionFrequency, setSpacedRevisionFrequency] =
    useState("1,3,5,7,21");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch saved question sets
        const snapshot = await getDocs(collection(db, "savedQuestions"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          revisionCycleCount: doc.data().revisionCycleCount || 0,
          createdAt: doc.data().createdAt
            ? doc.data().createdAt.toDate()
            : new Date(), // Convert Firestore timestamp to JS Date
        }));
        // Sort by newest first by default
        const sortedData = data.sort((a, b) => b.createdAt - a.createdAt);
        setSets(sortedData);
        setFilteredSets(sortedData);

        const uniqueSubjects = [
          ...new Set(sortedData.map((set) => set.subject)),
        ].filter(Boolean);
        setSubjects(uniqueSubjects);

        updateTopics(sortedData, filter.subject);

        // Fetch spaced revisions and filter out expired ones
        const revisionSnapshot = await getDocs(
          collection(db, "SpacedRevision")
        );
        const revisionData = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const doc of revisionSnapshot.docs) {
          const revision = { id: doc.id, ...doc.data() };
          const hasValidDates = revision.revisionDates.some(
            (date) => new Date(date) >= today
          );
          if (hasValidDates) {
            revisionData.push(revision);
          } else {
            await deleteDoc(doc(db, "SpacedRevision", doc.id));
          }
        }
        setUpcomingRevisions(revisionData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const updateTopics = (data, selectedSubject) => {
    const filteredTopics = [
      ...new Set(
        data
          .filter((set) => !selectedSubject || set.subject === selectedSubject)
          .map((set) => set.topic)
          .filter(Boolean)
      ),
    ];
    setTopics(filteredTopics);
    if (selectedSubject && !filteredTopics.includes(filter.topic)) {
      setFilter((prev) => ({ ...prev, topic: "" }));
    }
  };

  const startTestWithQuestions = (questions) => {
    localStorage.setItem("uploadedQuestions", JSON.stringify(questions));
    router.push("/test");
  };

  const handleDelete = (id) => {
    setDeleteSetId(id);
    setShowPasswordModal(true);
    setPasswordInput("");
    setPasswordError("");
  };

  const handleSpacedRevision = (id) => {
    setSpacedRevisionSetId(id);
    setShowFrequencyModal(true);
    setPasswordInput("");
    setPasswordError("");
  };

  const handleStopRevision = (revisionId) => {
    setStopRevisionId(revisionId);
    setShowPasswordModal(true);
    setPasswordInput("");
    setPasswordError("");
  };

  const handleFrequencySubmit = (e) => {
    e.preventDefault();
    setShowFrequencyModal(false);
    setShowPasswordModal(true);
    setPasswordInput("");
    setPasswordError("");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordInput !== process.env.NEXT_PUBLIC_FIREBASE_ACTION_PASSWORD) {
      setPasswordError("Incorrect password");
      return;
    }

    try {
      if (deleteSetId) {
        await deleteDoc(doc(db, "savedQuestions", deleteSetId));
        const updatedSets = sets.filter((set) => set.id !== deleteSetId);
        const sortedUpdatedSets = updatedSets.sort((a, b) =>
          filter.sortBy === "newest"
            ? b.createdAt - a.createdAt
            : a.createdAt - b.createdAt
        );
        setSets(sortedUpdatedSets);
        setFilteredSets(sortedUpdatedSets);
        updateTopics(sortedUpdatedSets, filter.subject);
      } else if (spacedRevisionSetId) {
        const set = sets.find((s) => s.id === spacedRevisionSetId);
        if (set) {
          const frequencyDays = spacedRevisionFrequency.split(",").map(Number);
          const today = new Date();
          const revisionDates = frequencyDays.map((day) => {
            const date = new Date(today);
            date.setDate(today.getDate() + day);
            return date.toISOString().split("T")[0];
          });

          const docRef = await addDoc(collection(db, "SpacedRevision"), {
            questionSetId: spacedRevisionSetId,
            revisionDates,
            createdAt: new Date(),
          });

          setUpcomingRevisions((prev) => [
            ...prev,
            {
              id: docRef.id,
              questionSetId: spacedRevisionSetId,
              revisionDates,
              createdAt: new Date(),
            },
          ]);

          alert("Spaced Revision scheduled successfully!");
        }
      } else if (stopRevisionId) {
        await deleteDoc(doc(db, "SpacedRevision", stopRevisionId));
        setUpcomingRevisions((prev) =>
          prev.filter((rev) => rev.id !== stopRevisionId)
        );
        alert("Spaced Revision stopped successfully!");
      }
      setShowPasswordModal(false);
      setPasswordInput("");
      setPasswordError("");
      setDeleteSetId(null);
      setSpacedRevisionSetId(null);
      setStopRevisionId(null);
    } catch (error) {
      console.error("Error performing action:", error);
      alert("Failed to perform action.");
    }
  };

  const handleStartRevision = async (revisionId, questionSetId) => {
    try {
      const questionSetDoc = await getDocs(collection(db, "savedQuestions"));
      const questionSet = questionSetDoc.docs
        .find((doc) => doc.id === questionSetId)
        ?.data();
      if (questionSet?.questions) {
        // Increment revisionCycleCount
        const setRef = doc(db, "savedQuestions", questionSetId);
        const currentCount = questionSet.revisionCycleCount || 0;
        await updateDoc(setRef, {
          revisionCycleCount: currentCount + 1,
        });

        // Update local state
        const updatedSets = sets.map((set) =>
          set.id === questionSetId
            ? { ...set, revisionCycleCount: currentCount + 1 }
            : set
        );
        setSets(
          updatedSets.sort((a, b) =>
            filter.sortBy === "newest"
              ? b.createdAt - a.createdAt
              : a.createdAt - b.createdAt
          )
        );
        setFilteredSets((prev) =>
          prev
            .map((set) =>
              set.id === questionSetId
                ? { ...set, revisionCycleCount: currentCount + 1 }
                : set
            )
            .sort((a, b) =>
              filter.sortBy === "newest"
                ? b.createdAt - a.createdAt
                : a.createdAt - b.createdAt
            )
        );

        startTestWithQuestions(questionSet.questions);
      } else {
        alert("Question set not found.");
      }
    } catch (error) {
      console.error("Error fetching questions for revision:", error);
      alert("Failed to start revision.");
    }
  };

  return (
    <div className="min-h-screen py-8 px-1 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Beckkk's Dashboard
        </h1>
        <JsonUpload onTextUpload={startTestWithQuestions} />

        <UpcomingRevisions
          revisions={upcomingRevisions}
          sets={sets}
          onStartRevision={handleStartRevision}
        />
        <QuestionSets
          sets={sets}
          filteredSets={filteredSets}
          subjects={subjects}
          topics={topics}
          filter={filter}
          onStartTest={startTestWithQuestions}
          onScheduleRevision={handleSpacedRevision}
          onDelete={handleDelete}
          onStopRevision={handleStopRevision}
          upcomingRevisions={upcomingRevisions}
        />
        {showFrequencyModal && (
          <FrequencyModal
            frequency={spacedRevisionFrequency}
            onFrequencyChange={setSpacedRevisionFrequency}
            onSubmit={handleFrequencySubmit}
            onClose={() => setShowFrequencyModal(false)}
          />
        )}
        {showPasswordModal && (
          <PasswordModal
            passwordInput={passwordInput}
            passwordError={passwordError}
            onPasswordChange={setPasswordInput}
            onPasswordError={setPasswordError}
            onSubmit={handlePasswordSubmit}
            onClose={() => {
              setShowPasswordModal(false);
              setPasswordInput("");
              setPasswordError("");
              setDeleteSetId(null);
              setSpacedRevisionSetId(null);
              setStopRevisionId(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Home;
