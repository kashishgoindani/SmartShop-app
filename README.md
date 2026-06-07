---
title: Shopsmart AI Backend
emoji: 🛒
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# ShopSmart AI 🛒

ShopSmart AI is a smart shop management web application built with React, Node.js, Express, MongoDB, and Groq AI. It allows shop owners to track sales, manage inventory, handle loans (udhaar), manage staff, and get real-time AI-powered insights — all in one place.

---

## ✨ Features

- 🔐 **User Authentication** — Secure register/login with JWT
- 📊 **Sales & Inventory Tracking** — Real-time dashboard for stock and sales
- 🤝 **Udhaar (Loan) Management** — Keep records of all credit transactions
- 👥 **Staff Management** — Add staff and control access levels
- 🤖 **AI Chat Assistant** — Powered by Groq AI (LLaMA) for instant business insights
- 📱 **Responsive Design** — Works seamlessly across all screen sizes
- 🔄 **Full CRUD** — Complete create, read, update, delete on all modules

---

## 🛠️ Technologies Used

**Frontend:**
- React JS (Vite)
- React Router DOM
- Axios
- Context API
- Tailwind CSS

**Backend:**
- Node.js
- Express JS
- JWT Authentication
- bcryptjs
- Mongoose

**Database:**
- MongoDB Atlas

**AI:**
- Groq SDK (LLaMA model)

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend` folder:

```env
MONGO_URI=mongodb://localhost:27017/your_db_name
JWT_SECRET=your_jwt_secret_key
PORT=5000
GROQ_API_KEY=your_groq_api_key
```

Create a `.env` file in the `frontend` folder:

```env
VITE_API_URL=http://localhost:5000/api
```

> See `.env.example` files in both folders for reference.

---

## 🗄️ Database Setup

1. Download and install [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. Open Compass and connect using: `mongodb://localhost:27017`
3. Create a new database
4. Add your connection string to `backend/.env` as `MONGO_URI`

---

## 🚀 Step-by-Step Instructions to Run the Project

### 1. Clone the Repository

```bash
git clone https://github.com/kashishgoindani/SmartShop-app.git
cd SmartShop-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file and add your environment variables, then:

```bash
node server.js
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file and add your environment variables, then:

```bash
npm run dev
```

### 4. Open your browser and go to `http://localhost:5173`

---

## 🌐 Live Demo

[https://smart-shop-app.vercel.app](https://smart-shop-app.vercel.app)
