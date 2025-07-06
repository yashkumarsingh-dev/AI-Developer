import React, { useState, useEffect, useContext, useRef } from "react";
import { UserContext } from "../context/user.context";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../config/axios";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
} from "../config/socket";
import Markdown from "markdown-to-jsx";
import { getWebContainer } from "../config/webContainer";
import "highlight.js/styles/github.css"; // Optional: Include highlight.js theme
import { format } from "date-fns";
import { FiUser, FiCheck, FiCopy } from "react-icons/fi";
import { FaRobot } from "react-icons/fa";
import MonacoEditor from "@monaco-editor/react";

const mockFiles = [
  { name: "app.js", path: "app.js" },
  { name: "server.js", path: "server.js" },
  {
    name: "routes/",
    path: "routes",
    children: [
      { name: "user.routes.js", path: "routes/user.routes.js" },
      { name: "project.routes.js", path: "routes/project.routes.js" },
    ],
  },
  { name: "README.md", path: "README.md" },
];

function SyntaxHighlightedCode({ className, children, ...props }) {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (ref.current && className?.includes("lang-") && window.hljs) {
      window.hljs.highlightElement(ref.current);
      ref.current.removeAttribute("data-highlighted");
    }
  }, [className, children]);

  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="relative group">
      <code
        ref={ref}
        className={
          className +
          " block p-2 rounded bg-slate-900 text-white overflow-x-auto"
        }
        {...props}>
        {children}
      </code>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 bg-slate-800 text-white p-1 rounded hover:bg-blue-600 transition opacity-70 group-hover:opacity-100"
        title={copied ? "Copied!" : "Copy"}>
        <FiCopy size={16} />
      </button>
      {copied && (
        <span className="absolute top-2 right-10 text-xs text-green-400">
          Copied!
        </span>
      )}
    </div>
  );
}

const getInitials = (email) => (email ? email[0].toUpperCase() : "U");

// Helper to convert fileTree object to a file list for rendering
function fileTreeToList(tree, parentPath = "") {
  return Object.entries(tree).map(([name, value]) => {
    const path = parentPath ? `${parentPath}/${name}` : name;
    if (value.file) {
      return { name, path };
    } else if (typeof value === "object") {
      return {
        name: name + "/",
        path,
        children: fileTreeToList(value, path),
      };
    } else {
      return { name, path };
    }
  });
}

const Project = () => {
  const location = useLocation();
  const { user } = useContext(UserContext);
  const messageBox = useRef(null);
  const navigate = useNavigate();

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(new Set());
  const [project, setProject] = useState(location.state.project);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [fileTree, setFileTree] = useState({});
  const [webContainer, setWebContainer] = useState(null);
  const [fileContents, setFileContents] = useState({
    "app.js":
      "import express from 'express';\nconst app = express();\napp.get('/', (req, res) => { res.send('Hello World!'); });\napp.listen(3000);",
    "server.js": "import http from 'http';\n// ... server code ...",
    "routes/user.routes.js": "// user routes code",
    "routes/project.routes.js": "// project routes code",
    "README.md": "# Project README\nThis is a mock readme file.",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [runOutput, setRunOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runnerMode, setRunnerMode] = useState("script"); // 'script' or 'api'
  const [apiEndpoint, setApiEndpoint] = useState("/api/ai/run");
  const [apiMethod, setApiMethod] = useState("POST");
  const [apiBody, setApiBody] = useState("");
  const [apiHeaders, setApiHeaders] = useState("");

  // List of available endpoints (customize as needed)
  const apiEndpoints = [
    { label: "AI Run", value: "/api/ai/run" },
    { label: "Project List", value: "/api/project" },
    { label: "User List", value: "/api/user" },
    // Add more as needed
  ];

  const handleUserClick = (id) => {
    setSelectedUserId((prev) => {
      const updated = new Set(prev);
      updated.has(id) ? updated.delete(id) : updated.add(id);
      return updated;
    });
  };

  const addCollaborators = () => {
    axios
      .put("/projects/add-user", {
        projectId: project._id,
        users: Array.from(selectedUserId),
      })
      .then(() => setIsModalOpen(false))
      .catch(console.error);
  };

  const send = () => {
    const now = new Date().toISOString();
    const msgData = {
      message,
      sender: {
        _id: user._id,
        email: user.email,
      },
      timestamp: now,
    };
    setMessages((prev) => {
      // Prefer deduplication by _id if present
      if (msgData._id && prev.some((msg) => msg._id === msgData._id))
        return prev;
      // Fallback: deduplicate by sender/message/timestamp
      const isDuplicate = prev.some((msg) => {
        const msgId = msg.sender?._id || msg.sender?.email;
        const dataId = msgData.sender?._id || msgData.sender?.email;
        return (
          msgId === dataId &&
          msg.message === msgData.message &&
          msg.timestamp === msgData.timestamp
        );
      });
      if (isDuplicate) return prev;
      return [...prev, msgData];
    });
    sendMessage("project-message", msgData);
    setMessage("");
  };

  const WriteAiMessage = (msg) => {
    let parsed;
    try {
      parsed = typeof msg === "string" ? JSON.parse(msg) : msg;
    } catch {
      parsed = { text: msg };
    }

    // Always display the 'text' field if present, otherwise fallback to the raw message
    const displayText = parsed.text || msg;

    return (
      <div className="overflow-auto bg-slate-950 text-white rounded-sm p-2">
        <Markdown
          options={{
            overrides: {
              code: SyntaxHighlightedCode,
            },
          }}>
          {displayText}
        </Markdown>
      </div>
    );
  };

  const scrollToBottom = () => {
    if (messageBox.current) {
      messageBox.current.scrollTop = messageBox.current.scrollHeight;
    }
  };

  useEffect(() => {
    initializeSocket(project._id);

    getWebContainer().then(setWebContainer);

    // Fetch chat history only once on initial load
    axios.get(`/projects/${project._id}/messages`).then((res) => {
      setMessages(res.data || []);
      // Debug: log loaded messages
      console.log("Loaded messages:", res.data);
    });

    // Only update messages via socket after initial load
    receiveMessage("project-message", (data) => {
      if (!data.timestamp) data.timestamp = new Date().toISOString();
      const isAI = data.sender._id === "ai";

      if (isAI) {
        let parsed;
        try {
          parsed =
            typeof data.message === "string"
              ? JSON.parse(data.message)
              : data.message;
        } catch {
          parsed = { text: data.message };
        }
        // If AI response has fileTree, update fileTree and fileContents
        if (parsed.fileTree) {
          setFileTree(parsed.fileTree || {});
          // Update fileContents from fileTree
          const newFileContents = {};
          function extractFiles(tree, parentPath = "") {
            Object.entries(tree).forEach(([name, value]) => {
              const path = parentPath ? `${parentPath}/${name}` : name;
              if (value.file && value.file.contents) {
                newFileContents[path] = value.file.contents;
              } else if (typeof value === "object") {
                extractFiles(value, path);
              }
            });
          }
          extractFiles(parsed.fileTree);
          setFileContents((prev) => ({ ...prev, ...newFileContents }));
          // If the selected file is in the new fileContents, update the editor
          if (newFileContents[selectedFile]) {
            setFileContent(newFileContents[selectedFile]);
          }
        }
        // Look for a code block and filename in the AI message
        const codeBlockMatch =
          parsed.text && parsed.text.match(/```[\w\d]*\n([\s\S]*?)```/);
        const filenameMatch =
          parsed.text && parsed.text.match(/([\w\d_\-/]+\.\w+)/);
        if (codeBlockMatch) {
          const code = codeBlockMatch[1];
          if (filenameMatch) {
            const filename = filenameMatch[1];
            setFileContents((prev) => {
              const updated = { ...prev, [filename]: code };
              if (selectedFile === filename) setFileContent(code);
              return updated;
            });
          } else {
            setFileContents((prev) => {
              const updated = { ...prev, [selectedFile]: code };
              setFileContent(code);
              return updated;
            });
          }
        }
        try {
          const msgObj = JSON.parse(data.message);
          if (msgObj.fileTree) {
            webContainer?.mount(msgObj.fileTree);
            setFileTree(msgObj.fileTree || {});
          }
        } catch (err) {
          // ignore
        }
      }

      setMessages((prev) => {
        // Prefer deduplication by _id if present
        if (data._id && prev.some((msg) => msg._id === data._id)) return prev;
        // Fallback: deduplicate by sender/message/timestamp
        const isDuplicate = prev.some((msg) => {
          const msgId = msg.sender?._id || msg.sender?.email;
          const dataId = data.sender?._id || data.sender?.email;
          return (
            msgId === dataId &&
            msg.message === data.message &&
            msg.timestamp === data.timestamp
          );
        });
        if (isDuplicate) return prev;
        return [...prev, data];
      });
    });

    axios.get(`/projects/get-project/${project._id}`).then((res) => {
      setProject(res.data.project);
      setFileTree(res.data.project.fileTree || {});
    });

    axios.get("/users/all").then((res) => setUsers(res.data.users));
  }, []);

  useEffect(scrollToBottom, [messages]);

  const saveFileTree = (ft) => {
    axios
      .put("/projects/update-file-tree", {
        projectId: project._id,
        fileTree: ft,
      })
      .then(console.log)
      .catch(console.error);
  };

  // Persist fileTree to backend whenever it changes (and is not empty)
  useEffect(() => {
    if (
      project &&
      project._id &&
      fileTree &&
      Object.keys(fileTree).length > 0
    ) {
      saveFileTree(fileTree);
    }
    // eslint-disable-next-line
  }, [fileTree]);

  // When fileTree changes and no file is selected, auto-select the first file
  useEffect(() => {
    if (!selectedFile && fileTree && Object.keys(fileTree).length > 0) {
      // Find the first file in the fileTree
      function findFirstFile(tree, parentPath = "") {
        for (const [name, value] of Object.entries(tree)) {
          const path = parentPath ? `${parentPath}/${name}` : name;
          if (value.file) return path;
          if (typeof value === "object") {
            const child = findFirstFile(value, path);
            if (child) return child;
          }
        }
        return null;
      }
      const firstFile = findFirstFile(fileTree);
      if (firstFile) {
        setSelectedFile(firstFile);
        setFileContent(fileContents[firstFile] || "");
      }
    }
    // eslint-disable-next-line
  }, [fileTree]);

  function renderFileTree(files) {
    return (
      <ul className="pl-2">
        {files.map((file) =>
          file.children ? (
            <li key={file.path} className="mb-1">
              <span className="font-semibold text-blue-800">{file.name}</span>
              {renderFileTree(file.children)}
            </li>
          ) : (
            <li
              key={file.path}
              className={`cursor-pointer px-2 py-1 rounded hover:bg-blue-900/30 transition-all text-blue-100 ${
                selectedFile === file.path
                  ? "bg-blue-800/80 font-bold text-white"
                  : ""
              }`}
              onClick={() => {
                setSelectedFile(file.path);
                setFileContent(fileContents[file.path] || "");
              }}>
              {file.name}
            </li>
          )
        )}
      </ul>
    );
  }

  // Run the current file
  const runCurrentFile = async () => {
    if (!selectedFile) return;
    setIsRunning(true);
    setRunOutput("");
    try {
      const res = await axios.post(`/projects/${project._id}/run`, {
        filename: selectedFile,
      });
      setRunOutput(
        (res.data.output ? `Output:\n${res.data.output}` : "") +
          (res.data.error ? `\nError:\n${res.data.error}` : "")
      );
    } catch (err) {
      setRunOutput(
        (err.response?.data?.output
          ? `Output:\n${err.response.data.output}\n`
          : "") +
          (err.response?.data?.error
            ? `Error:\n${err.response.data.error}`
            : err.message)
      );
    }
    setIsRunning(false);
  };

  // Function to run API endpoint
  const runApiEndpoint = async () => {
    setIsRunning(true);
    setRunOutput("");
    try {
      const headers = apiHeaders
        ? JSON.parse(apiHeaders)
        : { "Content-Type": "application/json" };
      const config = { headers };
      let res;
      if (apiMethod === "GET" || apiMethod === "DELETE") {
        res = await axios[apiMethod.toLowerCase()](apiEndpoint, config);
      } else {
        res = await axios[apiMethod.toLowerCase()](
          apiEndpoint,
          apiBody ? JSON.parse(apiBody) : {},
          config
        );
      }
      setRunOutput(
        JSON.stringify(res.data, null, 2) +
          (res.status ? `\nStatus: ${res.status}` : "")
      );
    } catch (err) {
      setRunOutput(err.response?.data?.error || err.message);
    }
    setIsRunning(false);
  };

  return (
    <main className="h-screen w-screen flex font-['Inter','Segoe UI',sans-serif'] overflow-hidden min-w-0">
      {/* File Tree Left */}
      <aside className="w-72 bg-black/20 backdrop-blur-2xl shadow-2xl border-r border-white/10 flex flex-col rounded-tr-3xl rounded-br-3xl m-4 ml-0 mb-4 min-w-0 flex-shrink-0">
        <div className="p-6 border-b border-white/10 font-extrabold text-blue-100 text-xl tracking-wide flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full mr-2"></span>
          Files
        </div>
        <nav className="flex-1 overflow-auto p-4 text-base text-blue-100 min-w-0">
          {renderFileTree(fileTreeToList(fileTree))}
        </nav>
      </aside>
      {/* Editor Center */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 py-8 min-w-0 overflow-hidden">
        <div className="w-full h-full bg-black/20 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 p-0.5 flex flex-col overflow-hidden min-w-0">
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/30 min-w-0">
            <span className="font-semibold text-blue-100 text-lg tracking-wide truncate min-w-0">
              {selectedFile}
            </span>
            <span className="text-xs text-blue-100 font-mono">
              Monaco Editor
            </span>
          </div>
          <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
            {selectedFile && Object.keys(fileTree).length > 0 ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  {/* Runner mode toggle */}
                  <div className="flex gap-2 items-center">
                    <label className="text-blue-100 font-semibold">
                      <input
                        type="radio"
                        name="runnerMode"
                        value="script"
                        checked={runnerMode === "script"}
                        onChange={() => setRunnerMode("script")}
                        className="mr-1"
                      />
                      Run Script
                    </label>
                    <label className="text-blue-100 font-semibold">
                      <input
                        type="radio"
                        name="runnerMode"
                        value="api"
                        checked={runnerMode === "api"}
                        onChange={() => setRunnerMode("api")}
                        className="mr-1"
                      />
                      Run API Endpoint
                    </label>
                  </div>
                  <button
                    onClick={
                      runnerMode === "script" ? runCurrentFile : runApiEndpoint
                    }
                    disabled={
                      isRunning || (runnerMode === "script" && !selectedFile)
                    }
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-6 rounded shadow transition disabled:opacity-60">
                    {isRunning
                      ? "Running..."
                      : runnerMode === "script"
                      ? `Run ${selectedFile}`
                      : "Run API"}
                  </button>
                </div>
                {/* API Runner UI */}
                {runnerMode === "api" && (
                  <div className="mb-2 p-2 bg-black/30 rounded-lg flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <label className="text-blue-100">Endpoint:</label>
                      <select
                        value={apiEndpoint}
                        onChange={(e) => setApiEndpoint(e.target.value)}
                        className="bg-black text-white rounded px-2 py-1">
                        {apiEndpoints.map((ep) => (
                          <option key={ep.value} value={ep.value}>
                            {ep.label} ({ep.value})
                          </option>
                        ))}
                      </select>
                      <select
                        value={apiMethod}
                        onChange={(e) => setApiMethod(e.target.value)}
                        className="bg-black text-white rounded px-2 py-1">
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>
                    {(apiMethod === "POST" || apiMethod === "PUT") && (
                      <textarea
                        value={apiBody}
                        onChange={(e) => setApiBody(e.target.value)}
                        placeholder="Request body (JSON)"
                        className="bg-black text-white rounded px-2 py-1 font-mono min-h-[60px]"
                      />
                    )}
                    <textarea
                      value={apiHeaders}
                      onChange={(e) => setApiHeaders(e.target.value)}
                      placeholder='Headers (JSON, e.g. { "Authorization": "Bearer ..." })'
                      className="bg-black text-white rounded px-2 py-1 font-mono min-h-[30px]"
                    />
                  </div>
                )}
                <MonacoEditor
                  height="calc(60vh)"
                  defaultLanguage="javascript"
                  language={
                    selectedFile.endsWith(".md") ? "markdown" : "javascript"
                  }
                  value={fileContent}
                  theme="vs-dark"
                  options={{
                    fontSize: 16,
                    minimap: { enabled: false },
                    fontFamily: "Fira Mono, monospace",
                    fontLigatures: true,
                    smoothScrolling: true,
                    scrollbar: { vertical: "auto", horizontal: "hidden" },
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    lineNumbers: "on",
                    renderLineHighlight: "all",
                    cursorSmoothCaretAnimation: true,
                    overviewRulerLanes: 0,
                    renderWhitespace: "boundary",
                  }}
                  onChange={(val) => {
                    setFileContent(val);
                    setFileContents((prev) => ({
                      ...prev,
                      [selectedFile]: val,
                    }));
                  }}
                />
                {/* Output Console */}
                <div className="mt-3 bg-black text-green-300 font-mono text-sm rounded-lg p-3 min-h-[60px] max-h-40 overflow-auto shadow-inner">
                  {runOutput ? (
                    runOutput
                  ) : (
                    <span className="opacity-40">
                      Output will appear here...
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-blue-200 text-lg opacity-60 select-none">
                {/* Placeholder message */}
                <span>Ask AI to create a file or project to get started!</span>
              </div>
            )}
          </div>
        </div>
      </section>
      {/* Chat Right */}
      <aside className="w-[420px] max-w-full flex flex-col h-screen bg-black/20 backdrop-blur-2xl shadow-2xl border-l border-white/10 rounded-tl-3xl rounded-bl-3xl m-4 mr-0 mb-4 min-w-0 flex-shrink-0 overflow-hidden">
        <header className="flex justify-between items-center p-4 w-full bg-black/30 shadow-md rounded-b-xl z-10 top-0 border-b border-white/10 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              className="text-blue-300 hover:text-blue-100 text-2xl font-bold px-2 py-1 rounded-full focus:outline-none transition-all duration-150 bg-black/20 hover:bg-black/40 shadow"
              onClick={() => navigate("/")}
              title="Back to Home">
              &#8592;
            </button>
            <button
              className="flex gap-2 items-center text-blue-200 hover:text-blue-100 font-semibold bg-black/20 px-3 py-1 rounded-lg shadow hover:shadow-lg transition-all duration-150 border border-white/10"
              onClick={() => setIsModalOpen(true)}>
              <i className="ri-add-fill mr-1"></i>
              <p>Add collaborator</p>
            </button>
          </div>
          <button
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="p-2 text-blue-300 hover:text-blue-100 bg-black/20 rounded-full shadow hover:shadow-lg transition-all duration-150 border border-white/10">
            <i className="ri-group-fill"></i>
          </button>
        </header>
        <div className="conversation-area pt-16 pb-10 flex-grow flex flex-col relative bg-black/10 rounded-b-3xl min-w-0 overflow-hidden">
          <div
            ref={messageBox}
            className="message-box p-2 flex-grow flex flex-col gap-4 overflow-auto max-h-full scrollbar-hide min-w-0">
            {messages.map((msg, index) => {
              // Robustly check for user and sender
              const isCurrentUser = (() => {
                if (!msg.sender || !user) return false;
                if (
                  msg.sender._id &&
                  user._id &&
                  msg.sender._id === user._id.toString()
                )
                  return true;
                if (
                  msg.sender.email &&
                  user.email &&
                  msg.sender.email === user.email
                )
                  return true;
                return false;
              })();
              const isAI = msg.sender && msg.sender._id === "ai";

              let aiMessage = null;
              if (isAI) {
                try {
                  aiMessage = JSON.parse(msg.message);
                } catch (e) {
                  aiMessage = { text: msg.message };
                }
              }

              // Timestamp
              const timestamp = msg.timestamp
                ? format(new Date(msg.timestamp), "p")
                : "";

              // Avatar
              const avatar = isAI ? (
                <span className="bg-blue-100 text-blue-700 rounded-full p-2 flex items-center justify-center mr-2">
                  <FaRobot size={20} />
                </span>
              ) : (
                <span className="bg-gray-200 text-gray-700 rounded-full p-2 flex items-center justify-center mr-2 font-bold">
                  {getInitials(msg.sender?.email)}
                </span>
              );

              // Message status (sent)
              const status = isCurrentUser ? (
                <span className="ml-2 text-xs text-green-500 flex items-center gap-1">
                  <FiCheck />
                  sent
                </span>
              ) : null;

              return (
                <div
                  key={index}
                  className={`message flex items-end gap-2 w-fit max-w-[50vw] my-2
                    ${
                      isAI
                        ? "bg-blue-800 text-white border-4 border-black shadow-2xl"
                        : "bg-white text-black border-4 border-black shadow-2xl"
                    }
                    ${isCurrentUser ? "ml-auto flex-row-reverse" : ""}
                  `}
                  style={{
                    fontSize: "1.05rem",
                    lineHeight: "1.5",
                    minWidth: "120px",
                    maxWidth: "340px",
                    wordBreak: "break-word",
                    fontWeight: 600,
                    padding: "0.75rem 1.1rem",
                    borderRadius: "1.2rem",
                    textShadow: "0 1px 4px #000, 0 1px 0 #fff",
                  }}>
                  {avatar}
                  <div>
                    <small className="opacity-90 text-xs flex flex-col items-start gap-0.5 font-semibold">
                      <span className="truncate max-w-[120px] block">
                        {msg.sender?.email || "AI"}
                      </span>
                      {timestamp && (
                        <span style={{ color: "#111" }}>{timestamp}</span>
                      )}
                    </small>
                    <div className="text-base mt-1">
                      {isAI ? (
                        WriteAiMessage(msg.message)
                      ) : (
                        <p>{msg.message}</p>
                      )}
                    </div>
                    {status}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="inputField w-full flex absolute bottom-0 bg-white/20 rounded-t-xl shadow-md p-2 min-w-0">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="p-3 px-4 border-none outline-none flex-grow bg-white/20 text-white placeholder:text-blue-200 focus:ring-2 focus:ring-blue-700 rounded-l-xl text-base min-w-0"
              type="text"
              placeholder="Enter message"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              onClick={send}
              className="px-6 bg-gradient-to-br from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white rounded-r-xl shadow transition-all duration-150 text-xl">
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </div>
        {/* Collaborator Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md relative border border-blue-200">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-2xl font-bold"
                onClick={() => setIsModalOpen(false)}
                title="Close">
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-4 text-blue-900">
                Add Collaborators
              </h2>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto mb-4">
                {users.filter((u) => u._id !== user._id).length === 0 ? (
                  <div className="text-gray-500">No other users found.</div>
                ) : (
                  users
                    .filter((u) => u._id !== user._id)
                    .map((u) => (
                      <label
                        key={u._id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition-all">
                        <input
                          type="checkbox"
                          checked={selectedUserId.has(u._id)}
                          onChange={() => handleUserClick(u._id)}
                          className="accent-blue-600"
                        />
                        <span className="text-gray-800">{u.email}</span>
                      </label>
                    ))
                )}
              </div>
              <button
                className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg font-semibold disabled:opacity-60 shadow-md transition-all"
                onClick={addCollaborators}
                disabled={selectedUserId.size === 0}>
                Add Selected
              </button>
            </div>
          </div>
        )}
      </aside>
    </main>
  );
};

export default Project;
