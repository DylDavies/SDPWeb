# TutorCore Development Guide

This document provides a complete guide for setting up and running the **TutorCore platform** in a local development environment. It covers both the **backend API** (Express.js + Node.js) and the **frontend web application** (Angular), including database setup, environment configuration, and testing.

(version 1.0)

### Link to documentation: 

https://docs.google.com/document/d/1BPZIDnR-s_He5p6xu5FMFo6GpAuEMMncOMYEbDsGPV8/edit?usp=sharing 
---

## Prerequisites

Before you begin, ensure the following are installed:

- [Node.js](https://nodejs.org/) (v22.x)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [MongoDB](https://www.mongodb.com/try/download/community) (local instance or cloud-hosted Atlas instance)
- [Angular CLI](https://angular.dev/cli) (`npm install -g @angular/cli`)
- [Git](https://git-scm.com/)

---

## Development Environment

The TutorCore platform is designed to be largely cross-platform, leveraging technologies like Node.js, npm, and MongoDB, which support multiple operating systems, but shall detail the Windows 11 Guide

- **Windows**: Windows 10 or later
- **macOS**: Recent versions (e.g., Ventura, Sonoma)
- **Linux**: Major distributions (e.g., Ubuntu, Fedora, Debian)

Ensure your specific OS version meets the minimum requirements for Node.js (v22.x) and MongoDB.

---

## 1. Cloning the Repositories

Clone both backend and frontend repositories:

**Backend API:**

```bash
git clone https://github.com/DylDavies/SDPApi.git
cd SDPApi
```

**Frontend Web Application**

```bash
git clone https://github.com/DylDavies/SDPWeb.git
cd SDPWeb
```

## 2. Branching Methodology

The project follows a git-flow-like branching strategy to manage development and releases:

### 2.1 Main Branch

This branch represents the production-ready code. All stable, deployed features are merged into `main`. Direct pushes to `main` are generally avoided; merges typically come from the `dev` branch after thorough testing.

### 2.2 Dev Branch

This is the primary integration branch for ongoing development. All new features and bug fixes are developed on separate feature branches and then merged into `dev`. The `dev` branch is periodically merged into `main` for releases.

### 2.3 Feature Branches

For any new feature or bug fix, create a new branch off of `dev` (e.g., `feature/your-feature-name` or `bugfix/issue-description`). Once the feature is complete and tested, merge it back into `dev` via a Pull Request.

## 3. Development Database Setup

Provides a safe environment for testing features without effecting the Production database and data.

1. Install MonogDB from https://www.mongodb.com/try/download/community and follow your OS download instruction guide.
2. Run the MongoDB server

```bash
mongod --dbpath "C:\data\db"
```

Remember to keep the terminal open, as closing will result in shutting down the running server.

3. Verify that installation is successful

```bash
mongod --version
```

4. Configure your application: Create a .env file in the root directory of your backend folder.

```.env
DB_CONN_STRING=mongodb://localhost:27017/tutor_management_dev
DB_NAME=tutorcore
```

## 4. Backend API Setup(Express and Node)

The backend provides endpoints for user profiles, scheduling and authentication

Steps:

1. Install dependencies:

```bash
npm ci
```

2. Setting up Google OAuth Credentials:

   To get your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, you need to create a project in the Google Cloud Console and configure an OAuth 2.0 Client ID.

   **Step-by-step Guide:**

   **2.1** Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

   **2.2** Create a Project: If you don't have one already, create a new project (e.g., "TutorCore-Dev").

   **2.3** Create Credentials: At the top of the page, click "+ CREATE CREDENTIALS" and select "OAuth client ID".

   **2.4** Configure Consent Screen: If prompted, you'll need to configure the consent screen.
   - Choose **"External"** for the User Type.
   - Fill in the required fields (App name, User support email, Developer contact information). You can skip optional scopes and test users for now.

   **2.5** Create the OAuth Client ID:
   - For **"Application type"**, select **"Web application"**.
   - Give it a name, like "TutorCore Local Dev".
   - Under **"Authorized JavaScript origins"**, click "+ ADD URI" and enter your frontend's URL: `http://localhost:4200`
   - Under **"Authorized redirect URIs"**, click "+ ADD URI" and enter the callback URI your API uses. This must exactly match the `REDIRECT_URI` in your `.env` file: `http://localhost:8080/api/auth/callback`

   **2.6** Get Your Credentials: After clicking "CREATE", a popup will appear with your **Client ID** and **Client Secret**. Copy these values into your `.env` file.

3. Configure environment variables in .env:

```bash
# MongoDB Connection
DB_CONN_STRING=your_mongodb_connection_string_here
DB_NAME=tutorcore

# Google OAuth Credentials (from the steps above)
REDIRECT_URI=http://localhost:8080/api/auth/callback
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-from-google

# JWT Authentication
JWT_SECRET=generate_a_long_random_and_secure_string_for_this

# Frontend URL (for CORS and redirects)
FRONTEND_URL=http://localhost:4200
```

4. Run the development server

To start the server in development mode with automatic reloading on file changes, run:

```bash
# Ensure you have a "dev" script in your package.json (e.g., using ts-node-dev or nodemon)
npm run dev
```

This server will run on http://localhost:8080

5. Test API endpoints using tools like Postman

```h
GET http://localhost:8080/api/tutors
```

6. Running backend tests:

   To run the Jest test suite, use the following command:

```bash
npm test
```

To run tests and generate code coverage reports, use:

```bash
npm test -- --coverage
```

## 5. Frontend Web Application Setup(Angular)

The Angular frontend provides a dynamic interface for tutors and students.

Steps:

1. Install dependencies:

```bash
npm ci
```

2. Configure Environment variables:

- **For local development**, ensure `src/environments/environment.ts` points to your local API server:
  ```typescript
  export const environment = {
    production: false,
    apiUrl: "http://localhost:8080/api",
  };
  ```
- **For production builds**, `src/environments/environment.prod.ts` is used automatically and should point to the live API URL.

  This project uses dedicated files to manage the API URL for different environments.

3. Run the development server:
   To start the local development server, run the following command. The application will be available at `http://localhost:4200/`.

```bash
ng server
```

4. Run front end tests:
   To run the Karma/Jasmine test suite for all components and services, use the following command:

```bash
ng test
```

This will run in an interactive "watch mode" locally. The CI workflow is configured to run in a headless, single-run mode for automation.

# TutorCore Technology Stack

## Our Tech Stack (MEAN)

This project is built on the MEAN stack, a powerful and popular choice for building modern web applications.

- **M - MongoDB**: Our backend API uses MongoDB as its NoSQL database. It stores all application data, including user profiles, roles, and other essential information.
- **E - Express.js**: The backend is a robust API built with Express.js, running on Node.js. It handles all business logic, user authentication via Google OAuth2, and serves data to our Angular application.
- **A - Angular**: This repository contains the frontend, a dynamic Single-Page Application (SPA) built with a modern version of Angular. We leverage the latest features including Standalone Components, function-based Guards for route protection, and HTTP Interceptors to manage API communication.
- **N - Node.js**: Node.js serves as the runtime environment for our Express API and provides the tooling for the Angular development and build process.

## 1. MongoDB(Database Layer)

Our backend makes use of MongoDB as the database of choice, a NoSQL document database allowing for more flexibility, performance and scalability.

- Flexibility & JSON structure: MongoBS's BSON document model aligns naturally with JSON making it easy to manipulate and handle data. This is especially useful in projects like TutorCore, where different entities (e.g., tutors, students, sessions) may evolve over time.
- Scalability & Cloud Compatibility: Mongo has horizontal scaling ,sharding and cloud deployment through Mongo Atlas.

MongoDB is widely used in enterprise by Netflix, Uber, LinkedIn. This shows how flexible, reliable and trustworthy Mongo is. Mongo is also cloud ready making it easy to scale and deploy

> _“MongoDB is great for projects that need rapid development and scale quickly. Its flexible schema lets teams evolve their application without the heavy lifting of altering rigid relational schemas.”_ — [Infomaze](https://www.infomazeelite.com/why-choose-mongodb-over-sql-database/)

> _“MongoDB has been adopted by leading enterprises because of its ability to handle unstructured data, scalability, and ease of use with modern JavaScript frameworks.”_ — [Spinx Solutions](https://www.spinxdigital.com/blog/why-use-mongodb-for-your-next-project/)

> _“MongoDB’s document model maps to the objects in your application code, making data easy to work with. Its popularity in the MEAN stack is proof of how well it fits with Node.js and Angular applications.”_ — [Medium](https://medium.com/@amitrahav/why-mongodb-is-so-popular-in-modern-development-ecosystem-9a1dbd4ad02e)

## 2. Express.js(Backend Framework)

Our backend is a robust API built with **Express.js**, running on Node.js. It handles all business logic, manages API routes, integrates with Google OAuth2 for authentication, and connects with the MongoDB database.

- Express is lightweight and flexible making it ideal for rapidly building API that can scale. The middleware system allows for adding of features such as logging, authentication and validation.
- The express API is containerized and deployed with MongoDB, enabling modular scaling between the two.
- Reduces boilerplate code with build int HTTP methods and routing.

> _“Express.js has become the de facto standard server framework for Node.js, thanks to its simplicity, minimalism, and rich ecosystem of middleware.”_ — [RisingStack](https://blog.risingstack.com/why-to-use-express-js-node-js-framework/)

> _“Express is the most popular framework for Node.js, used by companies like Uber, IBM, and Accenture for building fast, scalable apps.”_ — [Toptal](https://www.toptal.com/express-js/nodejs-expressjs-rest-api-tutorial)

## 3. Angular(Frontend Framework)

The frontend is a **dynamic Single-Page Application (SPA)** built with **Angular**, a TypeScript-based framework maintained by Google.

- **UI Libraries**: We extensively use **Angular Material**, a UI component library developed by Google that provides responsive, accessible, and production-ready components following Material Design guidelines.
- **Why Angular**: Angular enforces structure and consistency through TypeScript, making the codebase maintainable for large teams. It offers built-in support for routing, reactive forms, dependency injection, and state management.

> _“Angular is a complete solution for building large-scale applications. Its opinionated structure, TypeScript integration, and built-in tooling make it a favorite for enterprise projects.”_ — [Medium](https://medium.com/@javayou/why-angular-is-still-relevant-in-2023-47d08a702d07)

> _“Angular Material provides developers with high-quality UI components that follow modern design principles, allowing for rapid prototyping and production-ready apps.”_ — [Angular Material Docs](https://material.angular.io/)

## 4. Node.js(Runtime Environment)

The project runs on **Node.js**, a high-performance JavaScript runtime built on Chrome’s V8 engine.

- **Why Node.js**: Node’s event-driven, non-blocking I/O model makes it perfect for real-time applications and APIs with high concurrency, like TutorCore’s tutoring session management.
- **Deployment**: Node.js applications are easily containerized with Docker and can be deployed on cloud services such as AWS, GCP, or Azure.
- **Usefulness**: Node.js allows our team to use **JavaScript/TypeScript across the full stack**, reducing context switching and enabling faster development.

> _“Node.js is designed to build scalable network applications. Its single-threaded event loop and non-blocking I/O make it lightweight and efficient.”_ — [Node.js Foundation](https://nodejs.org/en/about)

> _“Node.js is the dominant backend JavaScript runtime, powering apps for LinkedIn, Netflix, PayPal, and more due to its scalability and speed.”_ — [Infoworld](https://www.infoworld.com/article/3222855/what-is-nodejs-javascript-runtime-explained.html)

## 5. Libraries & External Packages

### Angular Material

- **Purpose**: provides a set of ready to use , accessible and responsive UI components.
- **Usage**: Used in frontend for consistent design elements such as navigation bars and buttons.
- **Why?**: Speed up development and consistent UI design

## References

- Infomaze. _Why choose MEAN stack for web app development?_ [Infomaze](https://www.infomazeelite.com/why-choose-mean-stack-for-web-app-development/)
- Spinx Solutions. _Advantages of Angular for Web Development._ [Spinx Solutions](https://www.spinxdigital.com/blog/angular-advantages/)
- Medium. _Why Angular Material Should Be Your UI Library of Choice (2021)._ [Medium](https://medium.com/swlh/why-angular-material-should-be-your-ui-library-of-choice-2021-34b2ff13fb5)
- Medium. _Passport.js: The Definitive Guide for Node.js Authentication._ [Medium](https://medium.com/@nishanksingla/passport-js-the-definitive-guide-for-node-js-authentication-9f6df8ab8e9f)
- Auth0. _Introduction to JSON Web Tokens._ [Auth0](https://auth0.com/learn/json-web-tokens/)


# Project Vision & Goals

## Problem Statement
The management, scheduling, and payment processing for tutoring services is often fragmented, relying on manual spreadsheets and disparate communication channels. This leads to administrative overhead, scheduling conflicts, and a lack of transparency for both tutors and students.

## Solution
We are developing a centralized, all-in-one platform to streamline every aspect of tutor management. The system will automate scheduling via an interactive timetable, manage user roles and permissions, track performance with stats and badges, and handle complex tasks like payslip generation and student-tutor matching.

## Core Objectives
- To develop a secure, scalable, and intuitive platform for tutors, students, and administrators.
- To create a robust backend API that can support a wide range of features, from event management to AI-assisted debriefing.

---

# Scope and Feature Prioritization by Sprint

This plan outlines an iterative approach to development. Each sprint builds upon the last, delivering a progressively more functional product.

## Sprint 1: Foundation & Core User Experience (MVP)

**Theme:** The primary goal of this sprint is to establish the technical foundation and build the essential user-facing components. A user should be able to sign up, log in, and view a basic, non-interactive version of their personal space.

#### Features to Implement:
- **User Authentication & Onboarding:**
  - Feature: Secure sign-up and login using Google OAuth.
- **Core Application Shell:**
  - Feature: A static Landing Page for unauthenticated users.
  - Feature: A logged-in experience with a basic layout, including a TopBar and SideBar component.
- **Basic User Profile:**
  - Feature: A view-only Profile Page that displays the user's basic information retrieved from the database.
- **Dashboard & Timetable Placeholder:**
  - Feature: A Dashboard Page that acts as the main landing area after login.

#### API & Backend Development:
- **Users API:** Initial version with endpoints for Creation (via Google Auth), and Reading a user's own data.
- **Database Entities:** Schemas for Users.

#### UI/UX Pages:
- Landing Page
- 404 page
- Sign Up Page
- Logged in pages `/` (The main application shell)
- `Dashboard/`
- `Profile/`

---

## Sprint 2: Management Systems & Core Functionality

**Theme:** With the foundation laid, this sprint focuses on empowering Administrators and Tutors. We will build the core management systems for users, events, turning the static application into an interactive platform.

#### Features to Implement:
- **User & Access Management:**
  - Feature: A Team / User Management Page for Admins to archive, and manage users.
  - Feature: An Admin Page for managing system-wide Roles and Permissions.
- **Event & Timetable Management:**
  - Feature: The Time Table/Events Management Page is made and small interactions are present.
- **Tutor & Student Core Systems:**
  - Feature: Profile Page is enhanced to allow Tutors to manage their Proficiencies and Availability (AVA).
  - Feature: A Leave system allowing Tutors to report and manage their leave days.
  - Feature: A Bundle Management page for Admins to link students to tutors and manage lesson bundles.
- **External API Integration:**
  - Feature: Connecting to third-party systems like the "campus study buddy project" to link study sessions with events.

#### API & Backend Development:
- **Users API:** Expanded to include full CRUD operations for admins, Settings, and Location fields.
- **Roles/Permissions API:** Fully implemented with endpoints for assignment and customization.
- **Proficiencies API:** Endpoints for tutors to manage their subjects.
- **Subjects API:** Endpoints for admins to manage available subjects/syllabi.
- **Bundles API:** Endpoints for creating and managing student lesson bundles.
- **Leave API:** Endpoints for submitting and viewing leave.

#### UI/UX Pages:
- Team / User Management Page
- Time Table/Events Management Page (now interactive)
- Admin Page
- Bundle Management Page

---

## Sprint 3: Engagement, Communication & Reporting

**Theme:** This sprint is about enriching the user experience. We will add features that increase engagement (badges, missions), improve communication (notifications), and provide valuable feedback and reporting mechanisms (debriefs, stats).

#### Features to Implement:
- **User Engagement:**
  - Feature: A Badges system to reward tutors for achievements, complete with rate increases. Displayed on the Profile Page.
  - Feature: A Missions system for Admins to set goals for tutors regarding specific students. Viewable on the Students Page.
- **Reporting & Feedback:**
  - Feature: An Event Rating system allowing students to rate completed sessions.
  - Feature: A Debrief System where tutors can leave voice note reports for a student after an event. Managed on the Students Page.
  - Feature: An Extra Work Management system for tutors to report and claim compensation for work outside of scheduled events.
- **Communication:**
  - Feature: An email-based Notifications system for critical actions (e.g., event cancellation, report submission).
- **Data & Analytics:**
  - Feature: A Stats page for viewing key metrics (Num Hours, Subjects, etc.) for both tutors and admins.
- **Financial Systems:**
  - Feature: A Payslip System allowing for the creation and querying of payslips based on completed events. Includes a Payslips Management Page and a detailed Payslip Page.
- **Event & Timetable Management:**
  - Feature: The Time Table/Events Management Page is made with users being able to load and remark events.

#### API & Backend Development:
- **Badges API:** Endpoints for achievement management.
- **Debrief API:** Endpoints for uploading and linking voice notes to users/events.
- **Extra Work API:** Endpoints to manage claims.
- **Missions API:** Endpoints for goal management.
- **Events API:** Full CRUD functionality implemented.
- **Notifications Service:** Backend implementation for sending emails.

#### UI/UX Pages:
- Payslips Management Page & Payslip Page
- Students Page (for debriefs and missions)
- Extra Work Page

---

## Sprint 4: Intelligence, Polish & Advanced Features

**Theme:** The final sprint focuses on implementing advanced, "intelligent" features that provide a competitive edge. We will also incorporate visual polish and features that enhance organizational transparency.

#### Features to Implement:
- **Intelligent Matching & AI:**
  - Feature: Location & proficiency matching system to help admins find the best tutor for a student, potentially with a map-based view on the Bundle Management page.
  - Feature: AI Implementation to assist with Event Remarks, providing summaries or flagging keywords from tutor debriefs.
- **Organizational Features:**
  - Feature: An Organisational Chart component added to the Profile Page to show user hierarchies and relationships.
- **Data & Analytics:**
  - Feature: A Stats page for viewing key metrics (Num Hours, Subjects, etc.) for both tutors and admins.
- **Final Polish:**
  - Feature: Final UI/UX review and enhancements across the entire application.

#### API & Backend Development:
- **Stats API:** Endpoints for retrieving statistics.

#### UI/UX Pages:
- Stats Page

---

### Features Out of Scope for Initial Sprints (Future Development)
- **Payment System through portal:** A fully integrated payment gateway is a significant undertaking and is planned for a post-launch release.

---

# Database Schema Design

The following MongoDB collections will form the core of our database. Relationships will be managed via object IDs.

- **Users:** Stores user credentials, roles, leave, personal info.
- **Roles:** Defines permission sets (e.g., Admin, Tutor).
- **Permissions:** Granular permissions linked to specific API features.
- **Events:** Contains details of tutoring sessions, including ratings and remarks.
- **Subjects:** A collection of available subjects and syllabi.
- **Bundles:** Links students to tutors and tracks remaining lessons.
- **Payslips:** Stores generated payslip data for tutors.
- **(Additional entities:** Badges, Debriefs, Missions, etc., will be added in later sprints).

The database consists of the following 5 primary collections as of right now:

1.  [**Users**](#1-users-collection): Stores all user account information.
2.  [**Roles**](#2-roles-collection): Defines the role-based access control (RBAC) hierarchy.
3.  [**Proficiencies**](#3-proficiencies-collection): Contains the master list of all teaching syllabi and subjects.
4.  [**Bundles**](#4-bundles-collection): Manages student lesson bundles, linking students to tutors.
5.  [**ApiKeys**](#5-apikeys-collection): Stores hashed API keys for external system access.

---

## 1. `users` Collection

Stores information about all registered users, including their personal details, authentication info, roles, status, and application-specific data like leave and proficiencies.

| Field | Data Type | Description | Constraints & Defaults |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Unique identifier for the user document. | Automatically generated. |
| `googleId` | `String` | The unique ID provided by Google OAuth. | **Required**, **Unique** |
| `email` | `String` | The user's email address. | **Required**, **Unique** |
| `displayName` | `String` | The user's public display name. | **Required** |
| `picture` | `String` | URL to the user's profile picture. | Optional |
| `firstLogin` | `Boolean` | Flag to determine if the user needs to complete the initial profile setup. | `Default: true` |
| `type` | `String` | The primary category of the user. | **Required**, Enum: `EUserType:[admin, staff, client]`, `Default: 'client'` |
| `roles` | `Array<ObjectId>` | An array of ObjectIds referencing documents in the `roles` collection. | `ref: 'Role'` |
| `leave` | `Array` | An array of embedded leave request documents. (See **Leave Sub-schema** below). | N/A |
| `pending` | `Boolean` | If `true`, the user's account is awaiting admin approval. | **Required**, `Default: true` |
| `disabled` | `Boolean` | If `true`, the user's account is disabled and they cannot log in. | **Required**, `Default: false` |
| `proficiencies`| `Array` | An array of embedded proficiency documents specific to the user. | See `proficiencies` collection. |
| `theme` | `String` | The user's preferred UI theme. | Enum: `['light', 'dark', 'system']`, `Default: 'system'` |
| `availability` | `Number` | A field to store a tutor's availability in hours. | `Default: 0` |
| `createdAt` | `Date` | Timestamp of when the user was created. | `timestamps: true` |
| `updatedAt` | `Date` | Timestamp of the last update. | `timestamps: true` |

#### Leave Sub-schema (Embedded in `users`)

| Field | Data Type | Description | Constraints & Defaults |
| :--- | :--- | :--- | :--- |
| `reason` | `String` | The reason provided for the leave request. | **Required** |
| `startDate` | `Date` | The starting date of the leave period. | **Required** |
| `endDate` | `Date` | The ending date of the leave period. | **Required** |
| `approved` | `String` | The current status of the leave request. | Enum: `ELeave: [pending, approved, denied]`, `Default: 'pending'` |

---

## 2. `roles` Collection

Defines a hierarchical structure of roles, each with a specific set of permissions that can be assigned to users. This collection powers the Role-Based Access Control (RBAC) system.

| Field | Data Type | Description | Constraints & Defaults |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Unique identifier for the role document. | Automatically generated. |
| `name` | `String` | The unique name of the role (e.g., "Senior Tutor", "Content Manager"). | **Required**, **Unique** |
| `permissions` | `Array<String>` | A list of permission strings granted by this role. | **Required**, Enum: `EPermission:[ROLES_CREATE,ROLES_VIEW,ROLES_EDIT,ROLES_DELETE,USERS_VIEW,USERS_MANAGE_ROLES,USERS_EDIT,USERS_DELETE,VIEW_USER_PROFILE,DASHBOARD_VIEW,ADMIN_DASHBOARD_VIEW,PROFILE_PAGE_VIEW,BUNDLES_CREATE,BUNDLES_VIEW,BUNDLES_EDIT,BUNDLES_DELETEPROFICIENCIES_MANAGE,LEAVE_MANAGE]` |
| `parent` | `ObjectId` | A self-reference to a parent role, creating a tree structure. | `ref: 'Role'`, `Default: null` (for root roles) |
| `color` | `String` | A hex color code for displaying the role in the UI. | **Required** |
| `createdAt` | `Date` | Timestamp of when the role was created. | `timestamps: true` |
| `updatedAt` | `Date` | Timestamp of the last update. | `timestamps: true` |

---

## 3. `proficiencies` Collection

Stores the master list of all available teaching syllabi (e.g., Cambridge, IEB) and the subjects/grades associated with each. This acts as a template from which tutors can select their own proficiencies (which are then embedded in their `user` document).

| Field | Data Type | Description | Constraints & Defaults |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Unique identifier for the proficiency document. | Automatically generated. |
| `name` | `String` | The name of the proficiency/syllabus (e.g., "Cambridge"). | **Required** |
| `subjects`| `Map` | A map where keys are subject identifiers and values are embedded subject documents. | **Required**, `of: SubjectSchema` |

#### Subject Sub-schema (Embedded in `proficiencies`)

| Field | Data Type | Description | Constraints & Defaults |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Unique identifier for the subject within the proficiency. | `_id: true` |
| `name` | `String` | The name of the subject (e.g., "Mathematics", "Physical Sciences"). | **Required** |
| `grades` | `Array<String>` | A list of grades available for this subject (e.g., ["Grade 10", "Grade 11"]). | **Required**, `Default: []` |

---

## 4. `bundles` Collection

Manages lesson bundles, linking a student to one or more tutors for specific subjects and a set number of hours.

| Field | Data Type | Description | Constraints & Defaults |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Unique identifier for the bundle document. | Automatically generated. |
| `student` | `ObjectId` | A reference to the student user document. | **Required**, `ref: 'User'` |
| `subjects` | `Array` | An array of embedded documents detailing the subjects in the bundle. | See **Bundle Subject Sub-schema** below. |
| `isActive` | `Boolean` | A flag to quickly activate or deactivate a bundle. | `Default: true` |
| `status` | `String` | The current status of the bundle (e.g., Pending, Active, Completed). | Enum: `EBundleStatus:[Approved, Pending, Denied]`, `Default: 'Pending'` |
| `createdBy` | `ObjectId` | A reference to the admin/user who created the bundle. | **Required**, `ref: 'User'` |
| `createdAt` | `Date` | Timestamp of when the bundle was created. | `timestamps: true` |
| `updatedAt` | `Date` | Timestamp of the last update. | `timestamps: true` |

#### Bundle Subject Sub-schema (Embedded in `bundles`)

| Field | Data Type | Description | Constraints & Defaults |
| :--- | :--- | :--- | :--- |
| `subject` | `String` | The name of the subject for this part of the bundle. | **Required** |
| `tutor` | `ObjectId` | A reference to the tutor user assigned to this subject. | **Required**, `ref: 'User'` |
| `hours` | `Number` | The number of lesson hours allocated for this subject in the bundle. | **Required**, `min: 0` |

---

## 5. `apikeys` Collection

Stores API keys for external clients, allowing secure, programmatic access to the system. Keys are hashed for security and are never stored in plain text.

| Field | Data Type | Description | Constraints & Defaults |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Unique identifier for the API key document. | Automatically generated. |
| `clientName` | `String` | A unique, human-readable name for the client using the key. | **Required**, **Unique** |
| `key` | `String` | The **hashed** API key. | **Required** |
| `createdAt` | `Date` | Timestamp of when the key was created. | `timestamps: true` |
| `updatedAt` | `Date` | Timestamp of the last update. | `timestamps: true` |

#### Special Logic & Methods

* **Pre-save Middleware:** A `pre('save')` hook automatically hashes the `key` field using `bcryptjs` before any document is saved to the database.
* **`compareKey` Method:** An instance method is available on `ApiKey` documents to securely compare a plain-text key (from an incoming request) with the stored hash. It returns a `Promise<boolean>`.

---

# Development Roadmap

| Sprint    | Duration  | Theme & Key Goals                                                                         |
| :-------- | :-------- | :---------------------------------------------------------------------------------------- |
| Sprint 1  | 2 Weeks   | **Foundation & Authentication:** User Login (Google), Dashboard & Profile Pages, Core UI. |
| Sprint 2  | 2 Weeks   | **User Management:** Admin User Management (Roles), Bundle.                               |
| Sprint 3  | 3.5 Weeks | **Core Functionality:** Interactive Timetable (CRUD), Notifications, Missions, Payslips.  |
| Sprint 4  | 3 Weeks   | **Advanced Features & Intelligence:** AI Assist, Proficiency Matching, Stats Dashboard.   |

---

# System Architecture & Technical Design

We are implementing a 3-Tier Architecture to ensure a clean separation of concerns between the user interface, business logic, and data storage.

**Tech Stack:**
- **Frontend:** Angular
- **Backend:** Node.js with Express.js
- **Database:** MongoDB

### Architecture Design:

**Presentation Tier (Frontend - `Website/`)**
- Developed using Angular, this client-side application is responsible for all user interaction and rendering.
- It is component-based, with reusable elements like `Modal` and `ProfileCard`.
- Data is fetched and managed through injectable Services (`AuthService`, `UserService`), which consume the backend API via a central HTTP service.

**Application Tier (Backend - `API/`)**
- A Node.js/Express RESTful API that handles all business logic.
- Its structure is service-oriented, with Services (`UserService`) encapsulating logic and consuming the MongoDB service for database operations.
- Middleware is used for handling authentication (`Auth`) and attaching user data to requests (`User attach`).

**Data Tier (Database)**
- A MongoDB NoSQL database is used for flexible and scalable data storage.
- Data structures are defined by Models (`User`, `Event`, `Remark`). Direct database interaction is abstracted away by the `API/Services/MongoDB` service.
