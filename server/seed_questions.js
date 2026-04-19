import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from './models/Question.js';
import User from './models/User.js';

dotenv.config();

const sampleQuestions = [
  // --- React & Frontend ---
  {
    text: "What is the primary purpose of React's useMemo hook?",
    category: "React",
    difficulty: "intermediate",
    type: "mcq",
    options: [
      "To cache the result of a calculation between renders",
      "To memoize a component to prevent re-renders",
      "To execute side effects when dependencies change",
      "To store mutable state without triggering re-renders"
    ],
    correctAnswer: "To cache the result of a calculation between renders",
    explanation: "useMemo caches the result of a computationally expensive function, recalculating it only when its dependencies change, optimizing performance."
  },
  {
    text: "Explain the Virtual DOM and how React uses it to optimize performance.",
    category: "React",
    difficulty: "advanced",
    type: "voice",
    explanation: "The candidate should mention that the Virtual DOM is a lightweight memory representation of the actual DOM. React compares the new Virtual DOM with the previous one (diffing) and updates only the changed parts in the real DOM (reconciliation)."
  },
  {
    text: "Which CSS property is used to create a flex container?",
    category: "CSS",
    difficulty: "beginner",
    type: "mcq",
    options: ["align-items", "display", "position", "flex-direction"],
    correctAnswer: "display",
    explanation: "Setting 'display: flex' on an element turns it into a flex container."
  },

  // --- Node.js & Backend ---
  {
    text: "In Node.js, how does the event loop handle asynchronous operations?",
    category: "Node.js",
    difficulty: "intermediate",
    type: "voice",
    explanation: "The candidate should explain that Node uses a single thread but delegates blocking operations (like I/O) to the system kernel (libuv worker threads). When complete, callbacks are pushed to the event queue and processed by the event loop."
  },
  {
    text: "What is a prominent vulnerability mitigated by returning HTTP 401 instead of 403 on failed logins?",
    category: "Security",
    difficulty: "advanced",
    type: "mcq",
    options: [
      "Cross-Site Scripting (XSS)",
      "User Enumeration",
      "SQL Injection",
      "Cross-Site Request Forgery (CSRF)"
    ],
    correctAnswer: "User Enumeration",
    explanation: "Returning different status codes or messages for unknown usernames vs incorrect passwords can allow attackers to guess valid usernames (User Enumeration)."
  },
  {
    text: "Select the operator used to query an array for an exact subset of elements in MongoDB.",
    category: "MongoDB",
    difficulty: "intermediate",
    type: "mcq",
    options: ["$in", "$all", "$elemMatch", "$set"],
    correctAnswer: "$all",
    explanation: "The $all operator selects the documents where the value of a field is an array that contains all the specified elements."
  },

  // --- Computer Science & Data Structures ---
  {
    text: "What is the time complexity of searching for an element in a balanced Binary Search Tree (BST)?",
    category: "Algorithms",
    difficulty: "intermediate",
    type: "mcq",
    options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
    correctAnswer: "O(log n)",
    explanation: "In a balanced BST, every comparison eliminates half of the remaining tree, making the search time proportional to the height of the tree, which is O(log n)."
  },
  {
    text: "Describe the differences between an Array and a Linked List, and when you would use each.",
    category: "Data Structures",
    difficulty: "intermediate",
    type: "voice",
    explanation: "Candidate should mention Arrays have contiguous memory and O(1) index access but slow O(n) insertions/deletions. Linked Lists have non-contiguous nodes pointing to each other, allowing O(1) insertions/deletions if the node is known, but O(n) access."
  },

  // --- HR / Behavioral ---
  {
    text: "Tell me about a time you had to pivot quickly due to a changing project requirement.",
    category: "Behavioral",
    difficulty: "intermediate",
    type: "voice",
    explanation: "Look for the STAR method (Situation, Task, Action, Result). The candidate should demonstrate adaptability, clear communication with the team, and a focus on delivering value despite setbacks."
  },
  {
    text: "Which of the following describes the Agile methodology principle of 'iterative development'?",
    category: "Project Management",
    difficulty: "beginner",
    type: "mcq",
    options: [
      "Delivering the entire project only when it is 100% complete",
      "Assigning all tasks to a single developer to ensure consistency",
      "Building the project in small, incremental releases and adapting to feedback",
      "Creating strict documentation that cannot be changed"
    ],
    correctAnswer: "Building the project in small, incremental releases and adapting to feedback",
    explanation: "Iterative development breaks the project down into smaller, functional chunks (sprints) that are continuously reviewed and improved based on feedback."
  }
];

async function seedQuestions() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB!");

    // Find any admin user to associate with the questions
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      throw new Error("No admin user found. Please register an admin first.");
    }

    console.log(`Found admin: ${admin.email}`);

    // Clear existing questions generated by this user or just all of them (optional)
    await Question.deleteMany({});
    console.log("Cleared existing question bank.");

    const questionsWithAdmin = sampleQuestions.map(q => ({
      ...q,
      adminId: admin._id
    }));

    await Question.insertMany(questionsWithAdmin);
    console.log(`✅ Successfully inserted ${questionsWithAdmin.length} questions into the bank.`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedQuestions();
