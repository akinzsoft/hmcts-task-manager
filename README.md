HMCTS Task Management System

Developer Challenge submission for HMCTS.

This application provides a task management system enabling caseworkers to create, retrieve, update, and delete tasks. The solution consists of a backend REST API with database persistence and a frontend user interface.

Architecture Overview

The system follows a layered architecture to ensure separation of concerns:

Controller Layer – Handles HTTP requests and responses

Service Layer – Contains business logic and validation rules

Repository/Data Layer – Handles database interaction

Frontend Client – Provides user interface and communicates via REST API

This structure supports maintainability, testability, and ease of extension during the interview exercise.

Tech Stack
Backend

Python (Django REST Framework)

PostgreSQL (or SQLite if applicable)

RESTful API

Unit testing with Django test framework / pytest

Frontend

JavaScript (React)

Axios for API communication

Features Implemented
Backend API

Create a task

Retrieve a task by ID

Retrieve all tasks

Update task status

Delete a task

Validation and structured error responses

Database persistence

Unit tests

Frontend

Create task

View all tasks

Update status

Delete task

Basic validation and error handling

Clean, minimal UI

Task Model

Each task contains:

id

title (required)

description (optional)

status (PENDING, IN_PROGRESS, COMPLETED)

due_date

Validation Rules

Title is required

Status must be a valid enum value

Due date must not be in the past (if implemented)

400 returned for validation errors

404 returned if task not found

All errors return structured JSON responses.

API Endpoints
POST    /tasks/
GET     /tasks/
GET     /tasks/{id}/
PATCH   /tasks/{id}/status/
DELETE  /tasks/{id}/

Example Create Request:

POST /tasks/
{
  "title": "Review case file",
  "description": "Check supporting documents",
  "status": "PENDING",
  "due_date": "2026-03-20T12:00:00Z"
}
Running the Application
1. Clone the Repository
git clone https://github.com/akinzsoft/hmcts-task-manager.git
cd hmcts-task-manager
Backend Setup
Create virtual environment
cd server
python -m venv venv
source venv/bin/activate
Install dependencies
pip install -r requirements.txt
Apply migrations
python manage.py migrate
Run server
python manage.py runserver

API runs at:

http://127.0.0.1:8000/
Frontend Setup
cd client
npm install
npm start

Frontend runs at:

http://localhost:3000/
Running Tests

Backend tests:

cd server
python manage.py test

All tests validate:

Task creation

Retrieval by ID

Status updates

Validation behaviour

404 handling

Design Decisions

Layered architecture for maintainability

Clear separation of business logic from HTTP handling

Enum-based status validation to prevent invalid transitions

Centralised error handling for consistent responses

Database persistence instead of in-memory storage to reflect production standards

Assumptions

Authentication is not required for this challenge

Tasks are single-user scoped

Basic status workflow without complex transition rules

Potential Improvements (With More Time)

Authentication and authorisation (JWT / session-based)

Pagination and filtering

Audit logging

Status transition rules enforcement

Docker containerisation

CI pipeline integration

API documentation with OpenAPI/Swagger

Improved frontend UX and error messaging

Extension Readiness

The system has been structured to allow:

Easy addition of new task fields

Pagination support

Filtering by status or due date

Integration of authentication middleware

Additional validation rules

This implementation focuses on clean structure, validation, testing, and maintainability in line with production standards.
