# Co-Mind Setup Guide

Complete setup instructions for the Co-Mind backend server.

---

## **System Requirements**

- **Node.js**: v16 or higher
- **MongoDB**: Atlas cluster (free tier available)
- **npm**: Bundled with Node.js
- **Google Gemini API Key** (optional, for AI features)

---

## **1. Environment Setup**

Create a `.env` file in the `Server/` directory:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# MongoDB Atlas
MONGO_URI=mongodb+srv://co-minds_db_user:CKBWsGhErHRo2yeS@cluster0.9ds4z5i.mongodb.net/co-mind

# JWT Secret (Generate a strong random string)
JWT_SECRET=pHkxxR61ZiKFSkP4nR144dQXa0vR0kaunyG9AiRmED7

# Google Gemini API Key (Optional - for AI summary generation)
# Get your API key from https://makersuite.google.com/app/apikey
GEMINI_API_KEY=...
```

### **Generate JWT_SECRET**
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows PowerShell
$bytes = [byte[]] (1..32 | ForEach-Object { Get-Random -Maximum 256 })
[Convert]::ToBase64String($bytes)
```

### **Get Google Gemini API Key**
1. Visit https://makersuite.google.com/app/apikey
2. Create new API key (free tier available)
3. Copy and paste into `.env`
4. No billing required for free tier (limited requests)

---

## **2. Install Dependencies**

```bash
cd Server
npm install
```

**Key packages installed:**
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `dotenv` - Environment variables
- `morgan` - Request logging

---

## **3. Start the Server**

### **Development Mode** (with auto-reload)
```bash
npm run dev
```

### **Production Mode**
```bash
npm start
```

**Expected startup output:**
```
MongoDB Connected: cluster0.9ds4z5i.mongodb.net
Server is running on port 8000
```

---

## **4. Verify Installation**

### **Test Base Endpoint**
```bash
curl http://localhost:8000/
# Response: "Hello World! from Co-Mind Server"
```

### **Test Authentication**
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

---

## **5. Postman Testing**

### **Create Postman Collection**

**Step 1: Create Environment**
1. Click "Environments" → "Create Environment"
2. Add variables:
   ```
   {
     "base_url": "http://localhost:8000",
     "token": ""
   }
   ```

**Step 2: Test Signup**
```
POST {{base_url}}/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```
- Copy the `token` from response
- In "Tests" tab:
  ```javascript
  pm.environment.set("token", pm.response.json().token);
  ```

**Step 3: Create Test Note**
```
POST {{base_url}}/notes
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "Meeting Notes",
  "content": "Discussed project timeline, requirements, and team structure for the upcoming sprint.",
  "tags": ["work", "meeting"]
}
```

**Step 4: Generate AI Summary**
```
POST {{base_url}}/notes/{{note_id}}/generate-summary
Authorization: Bearer {{token}}
```

**Step 5: Get All Notes**
```
GET {{base_url}}/notes
Authorization: Bearer {{token}}
```

**Step 6: Search Notes**
```
GET {{base_url}}/notes/search?q=meeting
Authorization: Bearer {{token}}
```

**Step 7: Make Note Public**
```
PATCH {{base_url}}/shared/{{note_id}}/visibility
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "isPublic": true
}
```

**Step 8: Access Public Share**
```
GET {{base_url}}/shared/{{shareId}}
# No auth required!
```

**Step 9: Get Dashboard Insights**
```
GET {{base_url}}/dashboard/insights
Authorization: Bearer {{token}}
```

---

## **Complete Test Workflow**

### **Dummy Test Data**

```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "AlicePass123"
}
```

### **Quick Test Sequence**

```bash
# 1. Signup
TOKEN=$(curl -s -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test'$(date +%s)'@example.com",
    "password": "TestPass123"
  }' | jq -r '.token')

# 2. Create Note
NOTE_ID=$(curl -s -X POST http://localhost:8000/notes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Project Planning",
    "content": "This week we discussed the project roadmap, architecture design, team assignments, and sprint timeline. Key decisions: use React for frontend, implement GraphQL API, 2-week sprint cycle.",
    "tags": ["work", "planning"]
  }' | jq -r '.note._id')

# 3. Generate AI Summary
curl -X POST http://localhost:8000/notes/$NOTE_ID/generate-summary \
  -H "Authorization: Bearer $TOKEN"

# 4. Get Dashboard
curl -X GET http://localhost:8000/dashboard/insights \
  -H "Authorization: Bearer $TOKEN"
```

---

## **Project Structure**

```
Server/
├── server.js                      # Entry point
├── .env                          # Environment variables (CREATE THIS)
├── package.json
├── package-lock.json
├── API_DOCUMENTATION.md          # Complete API reference
├── SETUP_GUIDE.md               # This file
│
├── src/
│   ├── config/
│   │   └── database.js           # MongoDB connection
│   │
│   ├── models/
│   │   ├── user.model.js         # User schema
│   │   ├── notes.model.js        # Notes schema
│   │   └── aiUsage.model.js      # AI usage tracking
│   │
│   ├── controllers/
│   │   ├── auth.controller.js    # Auth logic (signup, login)
│   │   ├── notes.controller.js   # Notes CRUD + AI summary
│   │   ├── shared.controller.js  # Public sharing
│   │   └── dashboard.controller.js # Insights & search
│   │
│   ├── routes/
│   │   ├── auth.routes.js        # /auth endpoints
│   │   ├── notes.routes.js       # /notes endpoints
│   │   ├── shared.routes.js      # /shared endpoints
│   │   └── dashboard.routes.js   # /dashboard endpoints
│   │
│   ├── middlewares/
│   │   └── auth.middleware.js    # JWT verification
│   │
│   └── services/
│       └── ai.service.js         # AI integration (Google Gemini)
```

---

## **Troubleshooting**

### **Issue: "MongoNetworkError"**
**Solution:**
1. Check MongoDB URI in `.env`
2. Add your IP to MongoDB Atlas Network Access
3. Verify username/password are correct

### **Issue: "JWT_SECRET is not defined"**
**Solution:**
1. Create `.env` file with `JWT_SECRET=...`
2. Restart server

### **Issue: "GEMINI_API_KEY not set" (warnings only)**
**Solution:**
- AI features return placeholder metadata
- To enable: add `GEMINI_API_KEY` to `.env`
- Get key from https://makersuite.google.com/app/apikey (free tier available)

### **Issue: "Port already in use"**
**Solution:**
```bash
# Change PORT in .env or:
PORT=3001 npm run dev
```

### **Issue: "Content too short for analysis"**
**Solution:**
- AI summary requires minimum 50 characters
- Add more content to note before calling generate-summary

---

## **Next Steps**

1. ✅ Start server with `npm run dev`
2. ✅ Test endpoints with provided Postman payloads
3. ✅ Generate JWT token and save to Postman environment
4. ✅ Create, edit, delete, and search notes
5. ✅ Try AI summary generation
6. ✅ Test public sharing
7. ✅ View dashboard insights

---

## **Additional Commands**

```bash
# Install new package
npm install package-name

# Check for vulnerabilities
npm audit

# Clean install
rm -rf node_modules package-lock.json
npm install

# View current Node version
node --version

# Test specific endpoint
curl -v http://localhost:8000/
```

---

## **API Response Examples**

### **Success Response** (201 Created)
```json
{
  "message": "Note created successfully",
  "note": { /* note object */ }
}
```

### **Error Response** (400 Bad Request)
```json
{
  "message": "Title must be a non-empty string"
}
```

### **Error Response** (401 Unauthorized)
```json
{
  "message": "No token provided. Please authenticate."
}
```

### **Error Response** (403 Forbidden)
```json
{
  "message": "You do not have permission to update this note"
}
```

---

## **Support**

For issues or questions, check:
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete endpoint reference
- Error messages in Postman response
- Server console logs (`npm run dev` shows all requests)
