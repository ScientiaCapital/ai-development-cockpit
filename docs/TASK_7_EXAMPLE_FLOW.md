# Task 7: Chat to Orchestrator Integration - Example Flow

This document demonstrates the complete end-to-end flow of the Chat → RequirementsExtractor → AgentOrchestrator integration.

## Overview

The chat interface now intelligently extracts requirements from conversations and automatically triggers the build process when:
1. **Confidence is HIGH** (all necessary information collected)
2. **User confirms** (says "yes", "ready", "build it", etc.)

## Example Flow 1: Low Confidence → Questions → High Confidence → Build

### Step 1: Initial Vague Request (Low Confidence)

**User Input:**
```
"I want to build something"
```

**API Request:**
```bash
POST /api/chat
{
  "message": "I want to build something",
  "history": []
}
```

**API Response:**
```json
{
  "response": "I can help you build that! What type of application would you like to create?",
  "cost": 0.0001,
  "provider": "claude",
  "requirementsExtracted": {
    "projectType": undefined,
    "language": undefined,
    "framework": undefined,
    "features": [],
    "constraints": undefined,
    "clarificationNeeded": [
      "What type of application do you want to build?",
      "Do you have a preferred programming language?"
    ],
    "confidence": "low"
  }
}
```

**Result:** No build triggered. System asks clarifying questions.

---

### Step 2: User Provides More Details (Medium Confidence)

**User Input:**
```
"A Python REST API"
```

**API Request:**
```bash
POST /api/chat
{
  "message": "A Python REST API",
  "history": [
    { "id": "1", "role": "user", "content": "I want to build something" },
    { "id": "2", "role": "assistant", "content": "I can help you build that! What type of application..." }
  ]
}
```

**API Response:**
```json
{
  "response": "Great! A Python REST API. What features do you need?",
  "cost": 0.0001,
  "provider": "claude",
  "requirementsExtracted": {
    "projectType": "api",
    "language": "python",
    "framework": undefined,
    "features": ["rest"],
    "constraints": undefined,
    "clarificationNeeded": [
      "What features do you need? (auth, database, etc.)",
      "What framework would you like? (FastAPI, Django, Flask)"
    ],
    "confidence": "medium"
  }
}
```

**Result:** Still no build. Confidence is medium. More details needed.

---

### Step 3: User Provides All Details (High Confidence)

**User Input:**
```
"With FastAPI, authentication, and PostgreSQL database"
```

**API Request:**
```bash
POST /api/chat
{
  "message": "With FastAPI, authentication, and PostgreSQL database",
  "history": [
    { "id": "1", "role": "user", "content": "I want to build something" },
    { "id": "2", "role": "assistant", "content": "..." },
    { "id": "3", "role": "user", "content": "A Python REST API" },
    { "id": "4", "role": "assistant", "content": "..." }
  ]
}
```

**API Response:**
```json
{
  "response": "Perfect! I have all the details. Ready to start building?",
  "cost": 0.0001,
  "provider": "claude",
  "requirementsExtracted": {
    "projectType": "api",
    "language": "python",
    "framework": "fastapi",
    "features": ["rest", "auth", "database"],
    "constraints": ["postgresql"],
    "clarificationNeeded": [],
    "confidence": "high"
  }
}
```

**Result:** Confidence is high, but user hasn't confirmed yet. No build triggered.

---

### Step 4: User Confirms Build (High Confidence + Confirmation)

**User Input:**
```
"yes, build it!"
```

**API Request:**
```bash
POST /api/chat
{
  "message": "yes, build it!",
  "history": [
    { "id": "1", "role": "user", "content": "I want to build something" },
    { "id": "2", "role": "assistant", "content": "..." },
    { "id": "3", "role": "user", "content": "A Python REST API" },
    { "id": "4", "role": "assistant", "content": "..." },
    { "id": "5", "role": "user", "content": "With FastAPI, authentication, and PostgreSQL database" },
    { "id": "6", "role": "assistant", "content": "Perfect! Ready to start building?" }
  ]
}
```

**API Response:**
```json
{
  "response": "Great! Starting the build process now...",
  "cost": 0.0001,
  "provider": "claude",
  "requirementsExtracted": {
    "projectType": "api",
    "language": "python",
    "framework": "fastapi",
    "features": ["rest", "auth", "database"],
    "constraints": ["postgresql"],
    "clarificationNeeded": [],
    "confidence": "high"
  },
  "buildStarted": true,
  "projectId": "test-project-123",
  "buildStatus": {
    "projectId": "test-project-123",
    "status": "running",
    "currentPhase": "architecture",
    "agentsActive": ["CodeArchitect"],
    "progress": 0,
    "needsApproval": null,
    "errors": []
  }
}
```

**Result:** ✅ **Build STARTED!** AgentOrchestrator is now generating the project.

---

## Example Flow 2: Direct High Confidence Request

Sometimes users provide all details upfront:

**User Input:**
```
"Build a TypeScript Next.js dashboard with authentication and a PostgreSQL database"
```

**API Response:**
```json
{
  "response": "I can build that for you! This will be a Next.js dashboard with auth and PostgreSQL. Ready to start?",
  "cost": 0.0001,
  "provider": "claude",
  "requirementsExtracted": {
    "projectType": "web_app",
    "language": "typescript",
    "framework": "nextjs",
    "features": ["dashboard", "auth", "database"],
    "constraints": ["postgresql"],
    "clarificationNeeded": [],
    "confidence": "high"
  }
}
```

**User Input:**
```
"yes"
```

**API Response:**
```json
{
  "buildStarted": true,
  "projectId": "abc-123",
  "buildStatus": { ... },
  ...
}
```

**Result:** ✅ Build starts immediately after confirmation.

---

## Confirmation Keywords Detected

The system detects these keywords as build confirmation:
- "yes"
- "ready"
- "build it"
- "build"
- "start"
- "go ahead"
- "proceed"
- "let's go"
- "do it"

Examples:
- ✅ "yes" → triggers build
- ✅ "I'm ready to start" → triggers build
- ✅ "go ahead and build it" → triggers build
- ❌ "what features?" → does NOT trigger build
- ❌ "tell me more" → does NOT trigger build

---

## Safety Mechanisms

### 1. Low Confidence Protection
Even if user says "yes", build will NOT start if confidence is low:

```
User: "I want something"
System: (confidence: low)
User: "yes build it"
System: "I need more information first. What type of application?"
```

### 2. Error Handling

If requirements extraction fails:
```json
{
  "response": "I can help you build that!",
  "cost": 0.0001,
  "provider": "claude"
  // No requirementsExtracted field - extraction failed gracefully
}
```

If build startup fails:
```json
{
  "response": "...",
  "requirementsExtracted": { ... },
  "buildStarted": false,
  "error": "Failed to start build process. Please try again."
}
```

---

## Integration Architecture

```
User Message
     ↓
┌────────────────────────────────────────┐
│  POST /api/chat                        │
│  - Validate input                      │
│  - Extract requirements (Task 7 NEW)  │
│  - Get AI response                     │
└────────────────┬───────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ↓                         ↓
RequirementsExtractor    CostOptimizerClient
(extracts structured      (gets AI response)
 requirements)
    │                         │
    └────────────┬────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    │  Check: confidence      │
    │    === 'high' AND       │
    │  isBuildConfirmation()  │
    │                         │
    └────────────┬────────────┘
                 │
         YES ────┴──── NO
          │             │
          ↓             ↓
  AgentOrchestrator   Return chat
  .startProject()     response only
          │
          ↓
  Return build status
  + chat response
```

---

## Testing

All 16 integration tests pass:

```bash
npm test -- chat-orchestrator-integration

✓ Requirements Extraction Flow (3 tests)
✓ Build Triggering Flow (3 tests)
✓ Build Trigger Detection (5 tests)
✓ Error Handling (2 tests)
✓ Response Format (2 tests)
✓ Full E2E Flow (1 test)
```

---

## Next Steps

After Task 7, the system can:
1. ✅ Extract requirements from natural language
2. ✅ Ask clarifying questions automatically
3. ✅ Trigger builds when ready
4. ✅ Handle errors gracefully

Future enhancements:
- Add build progress streaming (WebSockets)
- Show live agent activity in UI
- Allow users to approve architecture before full build
- Save conversation history to database
