# University Grievance System

A modern, secure, and responsive web application for managing student grievances. Built with React + Vite.

## Features

### 🔒 Access Control
- **Restricted Registration**: Only users with official university emails (`@college.edu`) can access the system.
- **Role-Based Access**: Specialized dashboards for Students and Administrators.

### 🎓 Student Features
- **Raise Grievance Token**: Easily report issues regarding Hall Tickets, Fees, ERP, Timetable, etc.
- **Track Status**: Real-time updates on the status of your query (Pending, Reviewed, Resolved).

### 🛡️ Admin Features
- **Priority Queue**: Urgent issues like **Hall Tickets** and **Fee Updates** are automatically prioritized at the top.
- **Workflow Management**:
  - **Forward**: Route grievances to specific departments (Finance, Exam Cell, Sports, etc.).
  - **Resolve**: Mark issues as resolved once completed.
  - **Review**: Acknowledge receipt of the issue.

## Getting Started

### Prerequisites
- Node.js installed on your system.

### Installation

1. Open your terminal in this folder.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open the link shown in the terminal (usually `http://localhost:5173`).

## Demo Credentials

You can use these credentials to test the different roles:

**Administrator Access:**
- Email: `admin@college.edu`
- ID: `admin123`

**Student Access:**
- Email: `anyname@college.edu` (Must end in @college.edu)
- ID: `2024-CSE-001` (Any ID)
