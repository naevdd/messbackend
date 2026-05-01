# Mess Backend

A Node.js/Express backend API for the Messconnect application - a hostel/mess management system that connects hosts with students for meal services.

## Overview

This backend provides REST API endpoints for managing hosts, students, orders, and mess-related operations. It uses MongoDB for data persistence and includes features like user authentication, file uploads, and order management.

## Features

- **Authentication**: JWT-based authentication with password encryption (bcryptjs)
- **User Management**: Separate models for hosts and students
- **Order Management**: Track and manage student orders
- **File Uploads**: Support for document/image uploads via multer
- **CORS Support**: Configured for cross-origin requests
- **Environment Configuration**: Secure configuration using environment variables

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, bcryptjs
- **File Upload**: multer
- **Development**: nodemon for auto-reload

## Project Structure

```
├── db.js              # MongoDB connection setup
├── server.js          # Express server configuration
├── upload.js          # File upload configuration
├── package.json       # Project dependencies
├── models/
│   ├── Host.js        # Host schema
│   ├── Stud.js        # Student schema
│   └── Order.js       # Order schema
├── routes/
│   ├── hosts.js       # Host-related endpoints
│   └── students.js    # Student-related endpoints
└── uploads/           # Directory for uploaded files
```

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd messbackend_new
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   CORS_ORIGIN=http://localhost:3000
   JWT_SECRET=your_jwt_secret_key
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```
or
```bash
npm start
```

The server will start on the port specified in `.env` (default: 3000).

### Production Mode
```bash
node server.js
```

## API Endpoints

### Hosts
- `GET /host` - Retrieve all hosts
- `POST /host` - Create a new host
- `GET /host/:id` - Get specific host details
- `PUT /host/:id` - Update host information
- `DELETE /host/:id` - Delete a host

### Students
- `GET /student` - Retrieve all students
- `POST /student` - Register a new student
- `GET /student/:id` - Get specific student details
- `PUT /student/:id` - Update student information
- `DELETE /student/:id` - Delete a student

### Uploads
- Files are served from `/uploads` endpoint
- Upload functionality is configured in `upload.js`

## Dependencies

- **express** - Web framework
- **mongoose** - MongoDB object modeling
- **mongodb** - MongoDB driver
- **cors** - Cross-Origin Resource Sharing middleware
- **jwt** - JSON Web Token for authentication
- **bcryptjs** - Password hashing
- **multer** - Middleware for handling file uploads
- **dotenv** - Environment variable management
- **body-parser** - Middleware for parsing request bodies
- **nodemon** - Development tool for auto-restarting

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `MONGO_URI` | MongoDB connection string | Yes |
| `CORS_ORIGIN` | Allowed CORS origin | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |

## Contributing

1. Create a feature branch (`git checkout -b feature/your-feature`)
2. Commit your changes (`git commit -m 'Add some feature'`)
3. Push to the branch (`git push origin feature/your-feature`)
4. Open a Pull Request

## License

ISC

## Notes

- Ensure MongoDB is running and accessible before starting the server
- Keep `.env` file secure and never commit it to version control
- Use nodemon during development for automatic server restart on file changes
