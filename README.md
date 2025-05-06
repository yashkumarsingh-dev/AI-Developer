# 🤖 AI Developer: MERN Chat App

A real-time chat application built using the **MERN stack** (MongoDB, Express.js, React.js, Node.js) with integrated **Google Gemini AI** for intelligent messaging, code support, and smart communication between users.

---

## 📌 Project Overview

This project aims to enhance developer collaboration through a smart chat interface. It enables users to interact with each other in real time and also communicate with an AI assistant capable of answering coding questions, generating snippets, and more.

---

## 🔥 Features

- 🗨️ Real-time user-to-user chat via **Socket.io**
- 🤖 Integrated **Google Gemini AI** assistant for smart replies
- 🔐 Secure login system using **JWT Authentication**
- 👥 Role-based user interactions
- 📄 AI-assisted code and error explanation
- 📱 Responsive UI with intuitive design
- 🧠 Real-time AI suggestions based on context

---

## 🧰 Tech Stack

| Category        | Technology         | Description                                                  |
|----------------|--------------------|--------------------------------------------------------------|
| Frontend        | React.js           | Dynamic, responsive UI framework                             |
| Backend         | Node.js, Express   | RESTful APIs and server-side logic                           |
| Database        | MongoDB            | NoSQL database for storing users and messages                |
| AI Integration  | Google Gemini API  | Powers intelligent responses and code suggestions            |
| Communication   | Socket.io          | Enables real-time messaging via WebSockets                   |
| Authentication  | JWT / OAuth        | Secure login and token-based access                          |

---


## 🚀 How to Run Locally

### 🔧 Prerequisites:
- Node.js and npm or yarn
- MongoDB installed locally or use MongoDB Atlas
- Google Gemini API key

### 🔨 Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/your-username/AI-Developer.git
cd AI-Developer
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Set up environment variables**

Create a `.env` file inside `backend/` and add:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_google_gemini_api_key
```

5. **Run backend and frontend**
```bash
# In /backend (open new terminal)
cd backend
node server.js

# In /frontend (open new terminal)
cd frontend
npm run dev
```

---

## 📈 Results

* Efficient real-time communication between developers.
* Increased productivity through AI-assisted development.
* Seamless frontend-backend integration with robust database support.

---

## 🔮 Future Scope

* Deploy on cloud (e.g., Render, Vercel, or Heroku)
* Add file sharing and media support
* Enhance AI capabilities (e.g., debugging, explanations)
* Role-based dashboards for admins and developers

---

## 📝 References

* [React.js Docs](https://reactjs.org/)
* [Node.js Docs](https://nodejs.org/)
* [Express.js Docs](https://expressjs.com/)
* [MongoDB Docs](https://www.mongodb.com/docs/)
* [Socket.io Docs](https://socket.io/docs/)
* [Google Gemini API](https://ai.google.dev/)

---

## 👨‍💻 Developed by

**Yash Kumar Singh**  
*MCA Final Year Project*  
BIT Mesra

---

## 📜 License

This project is licensed under the MIT License.
