# Co-Mind API Documentation

Complete REST API for the Co-Mind MERN stack note-taking application with AI integration, public sharing, and productivity insights.

---

## **Authentication Endpoints**

### **1. User Signup**
```
POST /auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "_id": "64a1b2c3...",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-05-16T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### **2. User Login**
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "_id": "64a1b2c3...",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-05-16T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**All subsequent endpoints require:** `Authorization: Bearer <token>`

---

## **Notes Management Endpoints**

### **3. Get All Notes (with Filtering)**
```
GET /notes
GET /notes?tag=work
GET /notes?archived=true
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Notes retrieved successfully",
  "count": 5,
  "notes": [
    {
      "_id": "NOTE_001",
      "userId": "USR_001",
      "title": "Project Planning",
      "content": "Meeting discussion about Q3 roadmap...",
      "tags": ["work", "meeting"],
      "isPublic": false,
      "isArchived": false,
      "shareId": "550e8400-e29b-41d4-a716-446655440000",
      "aiMetadata": {
        "summary": "Discussed Q3 projects...",
        "actionItems": ["Review designs", "Update timeline"],
        "suggestedTitle": "Q3 Planning Meeting"
      },
      "createdAt": "2026-05-16T10:00:00Z",
      "updatedAt": "2026-05-16T12:00:00Z"
    }
  ]
}
```

---

### **4. Create a Note**
```
POST /notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My First Note",
  "content": "This is the note content",
  "tags": ["work", "important"]
}
```

**Response (201):**
```json
{
  "message": "Note created successfully",
  "note": {
    "_id": "NOTE_001",
    "userId": "USR_001",
    "title": "My First Note",
    "content": "This is the note content",
    "tags": ["work", "important"],
    "shareId": "550e8400-e29b-41d4-a716-446655440000",
    "isPublic": false,
    "isArchived": false,
    "aiMetadata": null,
    "createdAt": "2026-05-16T10:00:00Z",
    "updatedAt": "2026-05-16T10:00:00Z"
  }
}
```

---

### **5. Get a Single Note**
```
GET /notes/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Note retrieved successfully",
  "note": { /* note object */ }
}
```

---

### **6. Update Note (Auto-save Optimized)**
```
PATCH /notes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated content - auto-saved"
}
```

**Partial Update Examples:**
```json
{ "title": "New Title" }
{ "tags": ["updated", "tags"] }
{ "isArchived": true }
{ "title": "...", "content": "...", "tags": [...] }
```

**Response (200):**
```json
{
  "message": "Note updated successfully",
  "note": { /* updated note object */ }
}
```

---

### **7. Delete Note**
```
DELETE /notes/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Note deleted successfully",
  "deletedNoteId": "NOTE_001"
}
```

---

### **8. Search Notes by Keyword**
```
GET /notes/search?q=project
Authorization: Bearer <token>
```

Searches across title and content fields (case-insensitive).

**Response (200):**
```json
{
  "message": "Search results retrieved successfully",
  "query": "project",
  "count": 3,
  "notes": [ /* matching notes */ ]
}
```

---

## **AI Integration Endpoints**

### **9. Generate AI Summary & Metadata**
```
POST /notes/:id/generate-summary
Authorization: Bearer <token>
```

Generates:
- **Summary**: Concise overview of note content
- **Action Items**: Extracted tasks from note
- **Suggested Title**: AI-improved title

**Response (200):**
```json
{
  "message": "AI summary generated successfully",
  "aiMetadata": {
    "summary": "Weekly project planning discussion covering Q3 roadmap and team updates...",
    "action_items": [
      "Prepare UI mockups by Friday",
      "Review API architecture",
      "Schedule design review"
    ],
    "suggested_title": "Q3 Sprint Planning & Roadmap Review"
  },
  "note": { /* updated note with aiMetadata */ }
}
```

**Requirements:**
- Content must be at least 50 characters
- Requires `GEMINI_API_KEY` in `.env` for full AI features
- Returns placeholder metadata if API key not configured

---

## **Public Sharing Endpoints**

### **10. Get Public Shared Note (No Auth Required)**
```
GET /shared/:shareId
```

Returns note only if `isPublic: true`. Hides userId for privacy.

**Response (200):**
```json
{
  "message": "Shared note retrieved successfully",
  "note": {
    "_id": "NOTE_001",
    "title": "Project Planning",
    "content": "Meeting discussion...",
    "tags": ["work"],
    "aiMetadata": { /* AI metadata if available */ },
    "createdAt": "2026-05-16T10:00:00Z",
    "updatedAt": "2026-05-16T12:00:00Z",
    "shareId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

### **11. Update Note Visibility (Make Public/Private)**
```
PATCH /shared/:id/visibility
Authorization: Bearer <token>
Content-Type: application/json

{
  "isPublic": true
}
```

**Response (200):**
```json
{
  "message": "Note is now public",
  "shareId": "550e8400-e29b-41d4-a716-446655440000",
  "note": { /* updated note */ }
}
```

**Share Link Format:**
```
https://yourdomain.com/shared/550e8400-e29b-41d4-a716-446655440000
```

---

## **Productivity Insights Endpoints**

### **12. Get Dashboard Insights**
```
GET /dashboard/insights
Authorization: Bearer <token>
```

Aggregates:
- Total, active, and archived notes
- Recently updated notes (last 5)
- Most-used tags (top 10)
- AI usage statistics (last 7 days)
- Weekly activity summary

**Response (200):**
```json
{
  "message": "Insights retrieved successfully",
  "dashboard": {
    "summary": {
      "totalNotes": 42,
      "activeNotes": 38,
      "archivedNotes": 4
    },
    "recentlyUpdated": [
      {
        "id": "NOTE_001",
        "title": "Project Planning",
        "updatedAt": "2026-05-16T14:30:00Z",
        "tags": ["work", "meeting"]
      }
    ],
    "topTags": [
      { "name": "work", "usage": 15 },
      { "name": "personal", "usage": 12 },
      { "name": "meeting", "usage": 8 }
    ],
    "aiUsage": {
      "totalRequests": 23,
      "byOperation": [
        { "operation": "generate-summary", "count": 23 }
      ]
    },
    "weeklyActivity": [
      { "date": "2026-05-10", "noteCount": 5 },
      { "date": "2026-05-11", "noteCount": 8 },
      { "date": "2026-05-12", "noteCount": 3 },
      { "date": "2026-05-13", "noteCount": 7 }
    ]
  }
}
```

---

## **Error Handling**

All endpoints return consistent error responses:

```json
{
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Access denied (note belongs to another user)
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## **Environment Setup**

### **.env Configuration**

```env
# Server
PORT=8000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/comind

# Authentication
JWT_SECRET=your_long_random_secret_key_here_at_least_32_characters

# AI Integration (Optional)
GEMINI_API_KEY=...your-gemini-key...
```

### **Installation & Setup**

```bash
# Install dependencies
cd Server
npm install

# Start server
npm run dev          # Development with nodemon
npm start            # Production

# Server runs on http://localhost:8000
```

---

## **API Summary Table**

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/auth/signup` | ❌ | User registration |
| POST | `/auth/login` | ❌ | User authentication |
| GET | `/notes` | ✅ | Fetch all notes |
| GET | `/notes?tag=x` | ✅ | Filter by tag |
| GET | `/notes/search?q=x` | ✅ | Search notes |
| POST | `/notes` | ✅ | Create note |
| GET | `/notes/:id` | ✅ | Get single note |
| PATCH | `/notes/:id` | ✅ | Update note |
| DELETE | `/notes/:id` | ✅ | Delete note |
| POST | `/notes/:id/generate-summary` | ✅ | AI summary generation |
| GET | `/shared/:shareId` | ❌ | Public shared note |
| PATCH | `/shared/:id/visibility` | ✅ | Toggle note visibility |
| GET | `/dashboard/insights` | ✅ | Dashboard analytics |

---

## **Data Isolation & Security**

✅ **CRITICAL:** Every endpoint (except public sharing) verifies `note.userId === req.user.id`  
✅ **Field Whitelisting:** Only `title`, `content`, `tags`, `isPublic`, `isArchived` can be updated  
✅ **Input Validation:** All inputs validated for type and length  
✅ **JWT Protection:** All authenticated endpoints require valid Bearer token  
✅ **Password Hashing:** bcryptjs with salt rounds of 10  

---

## **Postman Collection Ready**

All endpoints documented with:
- Request examples with dummy data
- Response schemas
- Error scenarios
- Query parameters
- Headers required

Test all endpoints using the provided payload examples above!
