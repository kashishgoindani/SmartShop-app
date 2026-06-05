# ShopSmart AI 🛒

A full-stack AI-powered shop management system that helps shopkeepers manage their business efficiently.

## Project Description

ShopSmart AI is a smart shop management web application built with React, Node.js, MongoDB, and Groq AI. It allows shop owners to track sales, manage inventory, handle loans (udhaar), manage staff, and get real-time AI-powered insights — all in one place.

---

## Features

- 🔐 User Authentication (Register / Login with JWT)
- 📊 Real-time Sales & Inventory Tracking
- 🤝 Udhaar (Loan) Management with records
- 👥 Staff Management & Access Control
- 🤖 AI Chat Assistant (powered by Groq AI)
- 📱 Responsive Design for all screen sizes
- 🔄 Full CRUD operations on all modules

---

## Technologies Used

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

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Backend Setup

```bash
cd backend
npm install
npm run dev
```

---

## Database Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Add it to your `.env` file as `MONGO_URI`

---

## Environment Variables

Create a `.env` file in the `backend` folder with the following:

```
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
GROQ_API_KEY=your_groq_api_key
```

Create a `.env` file in the `frontend` folder with the following:

```
VITE_API_URL=http://localhost:5000/api
```

See `.env.example` files in both folders for reference.

---

## Step-by-Step Instructions to Run the Project

1. Clone the repository:
```bash
git clone https://github.com/kashishgoindani/shopsmart-ai.git
cd shopsmart-ai
```

2. Setup Backend:
```bash
cd backend
npm install
# Create .env file and add your environment variables
npm run dev
```

3. Setup Frontend:
```bash
cd frontend
npm install
# Create .env file and add VITE_API_URL
npm run dev
```

4. Open browser and go to `http://localhost:5173`

---

## Deployment

- **Frontend:** Deployed on [Vercel](https://shopsmart-ai-app.vercel.app)
- **Backend:** Deployed on [Vercel](https://shopsmart-ai-5kga.vercel.app)
- **Database:** MongoDB Atlas

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| GET | /api/products | Get all products |
| POST | /api/products | Add new product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |
| GET | /api/sales | Get all sales |
| POST | /api/sales | Add new sale |
| GET | /api/staff | Get all staff |
| POST | /api/staff | Add new staff |
| GET | /api/udhaar | Get all udhaar records |
| POST | /api/udhaar | Add new udhaar |

---

## Git Repository

[https://github.com/kashishgoindani/shopsmart-ai](https://github.com/kashishgoindani/shopsmart-ai)
