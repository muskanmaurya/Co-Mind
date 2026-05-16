# 🧪 Complete Postman API Testing Guide

## **Quick Start**

1. **Download Postman** → https://www.postman.com/downloads/
2. **Import Collection** → See "Create Collection" section below
3. **Set Environment** → Configure variables (base_url, token, note_id, etc.)
4. **Run Tests** → Follow the workflow in order

---

## **Step 1: Create Postman Environment**

### **Setup Variables**

1. Click **Environments** → **Create Environment**
2. Name it: `Co-Mind-Dev`
3. Add these variables:

```json
{
  "base_url": "http://localhost:8000",
  "token": "",
  "email": "testuser@example.com",
  "password": "TestPass123",
  "name": "Test User",
  "note_id": "",
  "share_id": ""
}
```

4. Click **Save**

---

## **Step 2: Authentication Tests**

### **Test 1️⃣: Signup**

```
Method: POST
URL: {{base_url}}/auth/signup
Headers:
  Content-Type: application/json

Body (raw JSON):
{
  "name": "{{name}}",
  "email": "{{email}}",
  "password": "{{password}}"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Test User",
    "email": "testuser@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save Token to Environment:**
- Click **Tests** tab (below request body)
- Paste this code:
```javascript
if (pm.response.code === 201) {
    pm.environment.set("token", pm.response.json().token);
    pm.environment.set("user_id", pm.response.json().user._id);
    console.log("✅ Token saved!");
}
```
- Click **Send**

---

### **Test 2️⃣: Login**

```
Method: POST
URL: {{base_url}}/auth/login
Headers:
  Content-Type: application/json

Body (raw JSON):
{
  "email": "{{email}}",
  "password": "{{password}}"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Test User",
    "email": "testuser@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Tests Tab:**
```javascript
if (pm.response.code === 200) {
    pm.environment.set("token", pm.response.json().token);
    console.log("✅ Login successful!");
}
```

---

## **Step 3: Notes CRUD Tests**

### **Test 3️⃣: Create Note**

```
Method: POST
URL: {{base_url}}/notes
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body (raw JSON):
{
  "title": "Project Planning",
  "content": "Discussed the project roadmap, Q3 timeline, budget allocation, team assignments, and sprint cycles. Decided to use React for frontend and Node.js for backend. Key action items include architecture design, database schema creation, and API endpoint documentation.",
  "tags": ["work", "project"]
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Note created successfully",
  "note": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "title": "Project Planning",
    "content": "Discussed the project roadmap...",
    "tags": ["work", "project"],
    "shareId": "abc-123-def-456",
    "isPublic": false,
    "isArchived": false,
    "createdAt": "2026-05-16T10:30:00Z",
    "updatedAt": "2026-05-16T10:30:00Z"
  }
}
```

**Tests Tab (Save Note ID & Share ID):**
```javascript
if (pm.response.code === 201) {
    const note = pm.response.json().note;
    pm.environment.set("note_id", note._id);
    pm.environment.set("share_id", note.shareId);
    console.log("✅ Note created! ID: " + note._id);
}
```

---

### **Test 4️⃣: Get All Notes**

```
Method: GET
URL: {{base_url}}/notes
Headers:
  Authorization: Bearer {{token}}

Query Params (optional):
  tag=work
  archived=false
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Notes retrieved successfully",
  "notes": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Project Planning",
      "content": "Discussed the project roadmap...",
      "tags": ["work", "project"],
      "isPublic": false,
      "isArchived": false,
      "createdAt": "2026-05-16T10:30:00Z",
      "updatedAt": "2026-05-16T10:30:00Z"
    }
  ],
  "total": 1
}
```

**Test with Filters:**
- Add `?tag=work` to URL → Returns only notes with "work" tag
- Add `?archived=true` to URL → Returns only archived notes

---

### **Test 5️⃣: Get Single Note**

```
Method: GET
URL: {{base_url}}/notes/{{note_id}}
Headers:
  Authorization: Bearer {{token}}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Note retrieved successfully",
  "note": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Project Planning",
    "content": "Discussed the project roadmap...",
    "tags": ["work", "project"],
    "shareId": "abc-123-def-456",
    "isPublic": false,
    "isArchived": false,
    "aiMetadata": {
      "summary": "",
      "actionItems": [],
      "suggestedTitle": ""
    },
    "createdAt": "2026-05-16T10:30:00Z",
    "updatedAt": "2026-05-16T10:30:00Z"
  }
}
```

---

### **Test 6️⃣: Update Note (Partial)**

```
Method: PATCH
URL: {{base_url}}/notes/{{note_id}}
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body (raw JSON - only fields you want to change):
{
  "title": "Updated Project Planning",
  "tags": ["work", "project", "important"]
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Note updated successfully",
  "note": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Updated Project Planning",
    "tags": ["work", "project", "important"],
    "updatedAt": "2026-05-16T11:00:00Z"
  }
}
```

**Test Auto-Save (Partial Updates):**
- Only update `title` → Only title changes
- Only update `tags` → Only tags change
- Update `isArchived: true` → Note gets archived
- Update `isPublic: true` → Note becomes public

---

### **Test 7️⃣: Search Notes**

```
Method: GET
URL: {{base_url}}/notes/search?q=project
Headers:
  Authorization: Bearer {{token}}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Search results retrieved",
  "results": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Project Planning",
      "content": "Discussed the project roadmap...",
      "tags": ["work", "project"],
      "updatedAt": "2026-05-16T11:00:00Z"
    }
  ],
  "total": 1
}
```

**Test Different Keywords:**
- `?q=planning` → Finds "planning" in title/content
- `?q=roadmap` → Finds "roadmap" in content
- `?q=xyz` → Returns empty if no match (200 with empty results array)

---

### **Test 8️⃣: Delete Note**

```
Method: DELETE
URL: {{base_url}}/notes/{{note_id}}
Headers:
  Authorization: Bearer {{token}}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Note deleted successfully"
}
```

---

## **Step 4: AI Features (Most Important! 🤖)**

### **Test 9️⃣: Generate AI Summary**

**⚠️ Requirements:**
- Content must be **at least 50 characters** long
- Note must already exist
- `GEMINI_API_KEY` must be set in `.env`

```
Method: POST
URL: {{base_url}}/notes/{{note_id}}/generate-summary
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body (raw JSON):
{}
```

**Expected Response (200 OK) - WITH GEMINI API KEY:**
```json
{
  "success": true,
  "message": "AI metadata generated successfully",
  "note": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Project Planning",
    "aiMetadata": {
      "summary": "Team discussed project roadmap and decided on tech stack: React frontend with Node.js backend. Identified key deliverables: architecture design, database schema, and API documentation.",
      "actionItems": [
        "Complete architecture design",
        "Create database schema",
        "Document API endpoints",
        "Set up CI/CD pipeline"
      ],
      "suggestedTitle": "Q3 Project Roadmap & Tech Stack Decision"
    }
  }
}
```

**Expected Response (200 OK) - WITHOUT GEMINI API KEY:**
```json
{
  "success": true,
  "message": "AI metadata generated successfully",
  "note": {
    "_id": "507f1f77bcf86cd799439012",
    "aiMetadata": {
      "summary": "Discussed the project roadmap, Q3 timeline, budget allocation, team assignments, and sprint cycles. Decided to use React for frontend and Node.js for backend.",
      "actionItems": [
        "Design architecture",
        "Create database schema",
        "Document API endpoints"
      ],
      "suggestedTitle": "Project Planning & Tech Stack"
    }
  }
}
```

**Tests Tab (Verify AI Data):**
```javascript
if (pm.response.code === 200) {
    const aiData = pm.response.json().note.aiMetadata;
    console.log("✅ Summary: " + aiData.summary);
    console.log("✅ Actions: " + aiData.actionItems.length + " items");
    console.log("✅ Suggested Title: " + aiData.suggestedTitle);
    
    pm.test("AI metadata has summary", function() {
        pm.expect(aiData.summary).to.not.be.empty;
    });
    pm.test("AI has action items", function() {
        pm.expect(aiData.actionItems.length).to.be.greaterThan(0);
    });
}
```

---

### **Test Multiple AI Calls (Repeat AI Summary)**

1. Create another note with different content
2. Call generate-summary again
3. Verify each note has unique AI metadata
4. Each API call should generate NEW summaries (not cached)

---

## **Step 5: Public Sharing Tests (No Auth)**

### **Test 🔟: Make Note Public**

```
Method: PATCH
URL: {{base_url}}/shared/{{note_id}}/visibility
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body (raw JSON):
{
  "isPublic": true
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Note visibility updated successfully",
  "shareId": "abc-123-def-456"
}
```

---

### **Test 1️⃣1️⃣: Access Public Note (No Token!)**

```
Method: GET
URL: {{base_url}}/shared/{{share_id}}
Headers:
  (NO Authorization header!)
  Content-Type: application/json
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Public note retrieved successfully",
  "note": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Project Planning",
    "content": "Discussed the project roadmap...",
    "tags": ["work", "project"],
    "shareId": "abc-123-def-456",
    "updatedAt": "2026-05-16T11:00:00Z"
    
  }
}
```

**⚠️ Notice:** No `userId` in response (privacy protection!)

**Test in Incognito Window:**
- Open a new incognito browser window
- Paste URL: `http://localhost:8000/shared/{{share_id}}`
- Should access without login ✅

---

### **Test 1️⃣2️⃣: Make Note Private Again**

```
Method: PATCH
URL: {{base_url}}/shared/{{note_id}}/visibility
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body (raw JSON):
{
  "isPublic": false
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Note visibility updated successfully"
}
```

**Verify:** Try accessing `/shared/{{share_id}}` again → Should return 404 ❌

---

## **Step 6: Dashboard & Analytics**

### **Test 1️⃣3️⃣: Get Dashboard Insights**

```
Method: GET
URL: {{base_url}}/dashboard/insights
Headers:
  Authorization: Bearer {{token}}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Dashboard insights retrieved successfully",
  "insights": {
    "totalNotes": 5,
    "activeNotes": 4,
    "archivedNotes": 1,
    "recentlyUpdated": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Project Planning",
        "updatedAt": "2026-05-16T11:00:00Z"
      }
    ],
    "topTags": [
      {
        "tag": "work",
        "count": 4
      },
      {
        "tag": "project",
        "count": 2
      }
    ],
    "aiUsage": {
      "thisWeek": 3,
      "lastWeek": 1
    },
    "weeklyActivity": [
      {
        "date": "2026-05-16",
        "count": 2
      },
      {
        "date": "2026-05-15",
        "count": 1
      }
    ]
  }
}
```

---

## **Complete Testing Workflow**

### **Run All Tests in Order:**

```
1. ✅ Signup (save token)
   ↓
2. ✅ Create Note 1 (save note_id, share_id)
   ↓
3. ✅ Generate AI Summary (test Gemini API)
   ↓
4. ✅ Update Note (add tags, archive it)
   ↓
5. ✅ Create Note 2 (different content)
   ↓
6. ✅ Generate AI Summary on Note 2
   ↓
7. ✅ Search Notes (find by keyword)
   ↓
8. ✅ Get All Notes (with filters)
   ↓
9. ✅ Make Note 1 Public
   ↓
10. ✅ Access Public Note (no auth!)
    ↓
11. ✅ Get Dashboard Insights
    ↓
12. ✅ Login (verify token works)
```

---

## **Error Testing (Negative Cases)**

### **Test Without Token**

```
Method: GET
URL: {{base_url}}/notes
Headers:
  (NO Authorization header)
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Authorization denied. No token provided"
}
```

---

### **Test with Invalid Token**

```
Method: GET
URL: {{base_url}}/notes
Headers:
  Authorization: Bearer invalid_token_123
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

---

### **Test Another User's Note (Ownership Verification)**

```
Steps:
1. Create Note 1 with User A
2. Login as User B (different email)
3. Try to access User A's note: GET /notes/{user_a_note_id}
```

**Expected Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "You are not authorized to access this note"
}
```

---

### **Test AI on Short Content**

```
Method: POST
URL: {{base_url}}/notes/{{note_id}}/generate-summary
Headers:
  Authorization: Bearer {{token}}

First, create a note with content < 50 characters:
{
  "title": "Short",
  "content": "Hi"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Content must be at least 50 characters for AI analysis"
}
```

---

### **Test Duplicate Email Signup**

```
Method: POST
URL: {{base_url}}/auth/signup

Body:
{
  "name": "Another User",
  "email": "testuser@example.com",  ← Same as existing user
  "password": "Different123"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

---

### **Test Invalid Email Format**

```
Method: POST
URL: {{base_url}}/auth/signup

Body:
{
  "name": "User",
  "email": "invalid-email",  ← Not a valid email
  "password": "Test123"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid email format"
}
```

---

### **Test Weak Password**

```
Method: POST
URL: {{base_url}}/auth/signup

Body:
{
  "name": "User",
  "email": "user@example.com",
  "password": "123"  ← Less than 6 characters
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Password must be at least 6 characters"
}
```

---

## **Postman Collection JSON (Import Ready)**

Copy this into Postman → Click **Import** → Paste as text:

```json
{
  "info": {
    "name": "Co-Mind API",
    "description": "Complete MERN Stack Note-Taking App with AI",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Signup",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": "{\"name\": \"{{name}}\", \"email\": \"{{email}}\", \"password\": \"{{password}}\"}"},
            "url": {"raw": "{{base_url}}/auth/signup", "host": ["{{base_url}}"], "path": ["auth", "signup"]}
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": "{\"email\": \"{{email}}\", \"password\": \"{{password}}\"}"},
            "url": {"raw": "{{base_url}}/auth/login", "host": ["{{base_url}}"], "path": ["auth", "login"]}
          }
        }
      ]
    },
    {
      "name": "Notes",
      "item": [
        {
          "name": "Create Note",
          "request": {
            "method": "POST",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}, {"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": "{\"title\": \"My Note\", \"content\": \"This is a detailed note about the project.\", \"tags\": [\"work\"]}"},
            "url": {"raw": "{{base_url}}/notes", "host": ["{{base_url}}"], "path": ["notes"]}
          }
        },
        {
          "name": "Get All Notes",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
            "url": {"raw": "{{base_url}}/notes", "host": ["{{base_url}}"], "path": ["notes"]}
          }
        },
        {
          "name": "Search Notes",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
            "url": {"raw": "{{base_url}}/notes/search?q=project", "host": ["{{base_url}}"], "path": ["notes", "search"], "query": [{"key": "q", "value": "project"}]}
          }
        },
        {
          "name": "Get Note",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
            "url": {"raw": "{{base_url}}/notes/{{note_id}}", "host": ["{{base_url}}"], "path": ["notes", "{{note_id}}"]}
          }
        },
        {
          "name": "Update Note",
          "request": {
            "method": "PATCH",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}, {"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": "{\"title\": \"Updated Title\", \"tags\": [\"work\", \"important\"]}"},
            "url": {"raw": "{{base_url}}/notes/{{note_id}}", "host": ["{{base_url}}"], "path": ["notes", "{{note_id}}"]}
          }
        },
        {
          "name": "Delete Note",
          "request": {
            "method": "DELETE",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
            "url": {"raw": "{{base_url}}/notes/{{note_id}}", "host": ["{{base_url}}"], "path": ["notes", "{{note_id}}"]}
          }
        }
      ]
    },
    {
      "name": "AI Features",
      "item": [
        {
          "name": "Generate AI Summary",
          "request": {
            "method": "POST",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}, {"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": "{}"},
            "url": {"raw": "{{base_url}}/notes/{{note_id}}/generate-summary", "host": ["{{base_url}}"], "path": ["notes", "{{note_id}}", "generate-summary"]}
          }
        }
      ]
    },
    {
      "name": "Public Sharing",
      "item": [
        {
          "name": "Make Note Public",
          "request": {
            "method": "PATCH",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}, {"key": "Content-Type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": "{\"isPublic\": true}"},
            "url": {"raw": "{{base_url}}/shared/{{note_id}}/visibility", "host": ["{{base_url}}"], "path": ["shared", "{{note_id}}", "visibility"]}
          }
        },
        {
          "name": "Get Public Note",
          "request": {
            "method": "GET",
            "url": {"raw": "{{base_url}}/shared/{{share_id}}", "host": ["{{base_url}}"], "path": ["shared", "{{share_id}}"]}
          }
        }
      ]
    },
    {
      "name": "Dashboard",
      "item": [
        {
          "name": "Get Insights",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
            "url": {"raw": "{{base_url}}/dashboard/insights", "host": ["{{base_url}}"], "path": ["dashboard", "insights"]}
          }
        }
      ]
    }
  ],
  "variable": [
    {"key": "base_url", "value": "http://localhost:8000"},
    {"key": "token", "value": ""},
    {"key": "note_id", "value": ""},
    {"key": "share_id", "value": ""}
  ]
}
```

---

## **Quick Debugging Tips**

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check token is set; run Signup/Login first |
| 403 Forbidden | You're accessing another user's note; not owner |
| 404 Not Found | Note doesn't exist; check note_id |
| 500 Internal Error | Server crashed; check terminal for logs |
| AI returns placeholder | GEMINI_API_KEY not set in .env file |
| Public note returns 404 | Make sure note is marked as `isPublic: true` |
| Search returns empty | Keyword not in title/content; try different term |

---

## **Performance Testing Tips**

### **Create Multiple Notes**
```
Loop 10 times:
1. Change title in body
2. Send POST /notes
3. Verify response
```

### **Bulk Search**
```
Search terms:
- "project", "meeting", "timeline", "budget"
- Verify all return results in < 200ms
```

### **AI Load Test**
```
Generate summaries on 5+ notes
Verify each gets unique AI metadata
Check dashboard counts increase
```

---

## **Final Checklist**

Before marking backend as "ready for frontend":

- [ ] Signup works → Token returned
- [ ] Login works → Can reuse token
- [ ] Create note works → note_id & share_id returned
- [ ] Update note works → Partial updates only
- [ ] Search works → Finds keywords
- [ ] AI summary works → Real data from Gemini API
- [ ] Public sharing works → No auth needed
- [ ] Dashboard works → All metrics calculated
- [ ] Delete works → Note removed from DB
- [ ] Auth required → 401 without token
- [ ] Ownership verified → 403 for other user's notes
- [ ] Error handling → Proper error messages
- [ ] Database → MongoDB Atlas connected

✅ **All tests pass?** → Ready to build frontend!

