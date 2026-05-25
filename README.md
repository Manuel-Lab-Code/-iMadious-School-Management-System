iMadious School Management System (EduPortal)
A multi-tenant school management backend built with Node.js, Express, and MongoDB. It supports complete data isolation across multiple schools, role-based access control, JWT authentication, OTP email verification, and a developer control panel for system-wide administration.

Table of Contents

Features
Tech Stack
Project Structure
Roles & Access Model
Getting Started
Environment Variables
Running the App
Seeding the Database
API Overview
Multi-Tenancy
Additional Documentation
Production Checklist


Features

Multi-school support — multiple schools on shared infrastructure with full data isolation per school
Three-tier role system — Developer (master admin), School Admin, and Students/Teachers
JWT authentication — tokens carry schoolId to enforce per-school data scoping automatically
OTP email verification — new registrations are verified via Gmail SMTP before activation
Rate limiting & input validation — via express-rate-limit and express-validator
Bcrypt password hashing — all passwords stored securely
Developer control panel — a web UI at /developer.html for registering schools and viewing system stats
Pending approval flow — students and teachers require admin approval before gaining access
