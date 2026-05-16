# Co-Mind API Quick Reference

Fast lookup for all endpoints, request/response formats, and status codes.

---

## **Authentication** 🔐

```
POST /auth/signup
{
  "name": "John",
  "email": "john@example.com",
  "password": "Pass123"
}
→ 201: { token, user }

POST /auth/login
{
  "email": "john@example.com",
  "password": "Pass123"
}
→ 200: { token, user }
```

All other endpoints require: `Authorization: Bearer <token>`

---

## **Notes CRUD** 📝

```
POST /notes
{
  "title": "...",
  "content": "...",
  "tags": ["tag1", "tag2"]
}
→ 201: { message, note }

GET /notes
Query: ?tag=work&archived=false
→ 200: { message, count, notes }

GET /notes/:id
→ 200: { message, note }
  403: No permission
  404: Not found

PATCH /notes/:id
{
  "content": "...",
  "tags": [...],
  "isArchived": true
}
→ 200: { message, note }

DELETE /notes/:id
→ 200: { message, deletedNoteId }
```

---

## **Search** 🔍

```
GET /notes/search?q=keyword
→ 200: { message, query, count, notes }
  400: Missing query parameter
```

---

## **AI Integration** 🤖

```
POST /notes/:id/generate-summary
→ 200: { 
    message,
    aiMetadata: {
      summary: "...",
      action_items: [...],
      suggested_title: "..."
    },
    note
  }
  400: Content too short (<50 chars)
  403: No permission
  404: Not found
```

---

## **Public Sharing** 🌐

```
GET /shared/:shareId
(PUBLIC - no auth needed)
→ 200: { message, note }
  404: Not found or not public

PATCH /shared/:id/visibility
(Requires auth)
{
  "isPublic": true
}
→ 200: { message, shareId, note }
  403: No permission
```

---

## **Dashboard & Analytics** 📊

```
GET /dashboard/insights
→ 200: {
    message,
    dashboard: {
      summary: {
        totalNotes: 42,
        activeNotes: 38,
        archivedNotes: 4
      },
      recentlyUpdated: [...],
      topTags: [{ name, usage }, ...],
      aiUsage: { totalRequests, byOperation },
      weeklyActivity: [{ date, noteCount }, ...]
    }
  }
```

---

## **Status Codes**

| Code | Meaning | Common Endpoint |
|------|---------|-----------------|
| 200 | ✅ Success | GET, PATCH |
| 201 | ✅ Created | POST (create) |
| 400 | ❌ Bad Request | Invalid data |
| 401 | ❌ Unauthorized | Missing token |
| 403 | ❌ Forbidden | Wrong owner |
| 404 | ❌ Not Found | Resource missing |
| 500 | ❌ Server Error | Server issue |

---

## **Error Messages**

```json
{
  "message": "Email already registered"
}
```

Common errors:
- "Name, email, and password are required"
- "Invalid email address"
- "Password must be at least 6 characters"
- "Title must be a non-empty string"
- "Tags must be an array"
- "No token provided. Please authenticate."
- "Invalid token. Please authenticate."
- "You do not have permission to access this note"
- "Content must be at least 50 characters to generate AI metadata"

---

## **Postman Setup**

### **Environment Variables**
```
base_url: http://localhost:8000
token: <paste-from-login-response>
note_id: <paste-from-create-response>
share_id: <paste-from-visibility-response>
```

### **Headers (Most Requests)**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

---

## **Query Parameters**

```
GET /notes
  ?tag=work          Filter by tag
  ?archived=true     Include archived (default: false)

GET /notes/search
  ?q=keyword         Search term (REQUIRED)
```

---

## **Field Constraints**

| Field | Type | Rules |
|-------|------|-------|
| name | string | 2+ chars |
| email | string | Valid format |
| password | string | 6+ chars |
| title | string | 1+ chars, non-empty |
| content | string | Any length |
| tags | array | Strings only |
| isPublic | boolean | true/false |
| isArchived | boolean | true/false |

---

## **Workflow Example**

```
1. POST /auth/signup
   → Get token

2. POST /notes
   → Create note, get _id

3. PATCH /notes/:id
   → Update content (auto-save)

4. POST /notes/:id/generate-summary
   → Generate AI metadata

5. PATCH /shared/:id/visibility
   → Make public, get shareId

6. GET /shared/:shareId
   → Share with anyone (no auth)

7. GET /dashboard/insights
   → View stats
```

---

## **Data Shapes**

### **User Object**
```json
{
  "_id": "64a1b2c3...",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2026-05-16T10:00:00Z"
}
```

### **Note Object**
```json
{
  "_id": "NOTE_001",
  "userId": "USR_001",
  "title": "Project Planning",
  "content": "...",
  "tags": ["work", "meeting"],
  "shareId": "550e8400-e29b-41d4-a716-446655440000",
  "isPublic": false,
  "isArchived": false,
  "aiMetadata": {
    "summary": "...",
    "action_items": ["...", "..."],
    "suggested_title": "..."
  },
  "createdAt": "2026-05-16T10:00:00Z",
  "updatedAt": "2026-05-16T12:00:00Z"
}
```

### **AI Metadata Object**
```json
{
  "summary": "2-3 sentence overview",
  "action_items": ["task1", "task2"],
  "suggested_title": "Improved title"
}
```

---

## **Environment (.env)**

```env
PORT=8000
NODE_ENV=development
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your_random_secret_key
GEMINI_API_KEY=... (optional)

# Keep real credentials only in your local .env file; never commit them.
```

---

## **Common Postman Tests**

### **Auto-set token after login**
```javascript
pm.environment.set("token", pm.response.json().token);
```

### **Auto-set note ID after creation**
```javascript
pm.environment.set("note_id", pm.response.json().note._id);
```

### **Check response status**
```javascript
pm.test("Status is 200", function () {
  pm.response.to.have.status(200);
});
```

---

## **Rate Limits**

None enforced by default. Consider adding in production:
- Auth: 5 requests/minute per IP
- API: 100 requests/minute per user
- AI: 10 requests/minute per user

---

## **CORS Headers**

If using with frontend on different domain, add to server:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

---

## **Deployment Checklist**

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure `MONGO_URI` for production
- [ ] Add `GEMINI_API_KEY` for AI features
- [ ] Enable HTTPS
- [ ] Set up CORS for frontend domain
- [ ] Add rate limiting
- [ ] Configure logging
- [ ] Set up error monitoring (Sentry)
- [ ] Test all endpoints

---

## **File Reference**

- `API_DOCUMENTATION.md` - Full endpoint documentation
- `SETUP_GUIDE.md` - Installation & configuration
- `API_QUICK_REFERENCE.md` - This file
