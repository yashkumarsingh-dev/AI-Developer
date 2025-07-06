import projectModel from "../models/project.model.js";
import * as projectService from "../services/project.service.js";
import userModel from "../models/user.model.js";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import Message from "../models/message.model.js";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

export const createProject = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name } = req.body;
    const loggedInUser = await userModel.findOne({ email: req.user.email });
    const userId = loggedInUser._id;

    const newProject = await projectService.createProject({ name, userId });

    res.status(201).json(newProject);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
};

export const getAllProject = async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({
      email: req.user.email,
    });

    const allUserProjects = await projectService.getAllProjectByUserId({
      userId: loggedInUser._id,
    });

    return res.status(200).json({
      projects: allUserProjects,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

export const addUserToProject = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { projectId, users } = req.body;

    const loggedInUser = await userModel.findOne({
      email: req.user.email,
    });

    const project = await projectService.addUsersToProject({
      projectId,
      users,
      userId: loggedInUser._id,
    });

    return res.status(200).json({
      project,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

export const getProjectById = async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await projectService.getProjectById({ projectId });

    return res.status(200).json({
      project,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

export const updateFileTree = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { projectId, fileTree } = req.body;

    const project = await projectService.updateFileTree({
      projectId,
      fileTree,
    });

    return res.status(200).json({
      project,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Delete request for project id:", id, typeof id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid project id" });
    }
    const objectId = new mongoose.Types.ObjectId(id);
    const loggedInUser = await userModel.findOne({ email: req.user.email });
    const userId = loggedInUser._id;

    const project = await projectModel.findById(objectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (String(project.createdBy) !== String(userId)) {
      return res
        .status(403)
        .json({ error: "Only the creator can delete this project" });
    }
    await projectModel.findByIdAndDelete(objectId);
    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

// Save a chat message
export const saveMessage = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { sender, message, timestamp } = req.body;
    const msg = await Message.create({
      projectId,
      sender,
      message,
      timestamp: timestamp || new Date(),
    });
    res.status(201).json(msg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all chat messages for a project
export const getMessages = async (req, res) => {
  try {
    const { projectId } = req.params;
    const messages = await Message.find({ projectId }).sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Run a script for a project (basic Node.js execution)
export const runScript = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { filename } = req.body;
    console.log(
      "runScript called with projectId:",
      projectId,
      "filename:",
      filename
    );
    if (!filename || !filename.endsWith(".js")) {
      return res.status(400).json({ error: "Only .js files can be run." });
    }
    // Find the project and get the fileTree
    const project = await projectModel.findById(projectId);
    console.log(
      "Fetched project:",
      !!project,
      "fileTree keys:",
      project?.fileTree ? Object.keys(project.fileTree) : []
    );
    if (!project || !project.fileTree) {
      return res.status(404).json({ error: "Project or fileTree not found." });
    }
    // Recursively find the file contents in the fileTree by full path
    function findFileByPath(tree, targetPath, parentPath = "") {
      for (const [name, value] of Object.entries(tree)) {
        const currentPath = parentPath ? `${parentPath}/${name}` : name;
        if (currentPath === targetPath && value.file && value.file.contents) {
          return value.file.contents;
        }
        if (typeof value === "object") {
          const found = findFileByPath(value, targetPath, currentPath);
          if (found) return found;
        }
      }
      return null;
    }
    let code = findFileByPath(project.fileTree, filename);
    // Fallback: search by filename only
    if (!code) {
      function findFileByName(tree, target) {
        for (const [name, value] of Object.entries(tree)) {
          if (name === target && value.file && value.file.contents) {
            return value.file.contents;
          }
          if (typeof value === "object") {
            const found = findFileByName(value, target);
            if (found) return found;
          }
        }
        return null;
      }
      code = findFileByName(project.fileTree, filename.split("/").pop());
    }
    console.log("File found in fileTree?", !!code);
    if (!code) {
      return res.status(404).json({ error: "File not found in project." });
    }
    // Replace any app.listen(...) with app.listen(3000) to avoid port conflicts
    code = code.replace(/app\.listen\([^)]*\)/g, "app.listen(3000)");
    // Write code to a temp file
    const tempPath = path.join("./", `temp_run_${Date.now()}.cjs`);
    fs.writeFileSync(tempPath, code);
    // Run the script using Node.js
    exec(`node "${tempPath}"`, { timeout: 5000 }, (err, stdout, stderr) => {
      // Clean up temp file
      fs.unlinkSync(tempPath);
      if (err) {
        return res
          .status(200)
          .json({ output: stdout, error: stderr || err.message });
      }
      res.status(200).json({ output: stdout, error: stderr });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
