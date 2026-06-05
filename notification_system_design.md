# Stage 1

## Notification System Overview

The Campus Notification Platform is designed to deliver real-time notifications to students regarding Placements, Events, Results, and General Announcements. The system supports notification creation, retrieval, update, deletion, read tracking, and real-time delivery.

---

## Core Actions

### Student Actions

* View all notifications
* View notification details
* Mark notification as read
* Mark all notifications as read
* Get unread notification count

### Admin Actions

* Create notification
* Update notification
* Delete notification

### Real-Time Actions

* Receive instant notifications through WebSocket connection

---

## Common Request Headers

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
Accept: application/json
```

---

## 1. Create Notification

### Endpoint

```http
POST /api/v1/notifications
```

### Request Body

```json
{
  "title": "Amazon Placement Drive",
  "message": "Amazon recruitment starts tomorrow.",
  "type": "PLACEMENT",
  "priority": "HIGH",
  "targetAudience": ["CSE", "IT"]
}
```

### Response

```json
{
  "success": true,
  "message": "Notification created successfully",
  "data": {
    "notificationId": "N1001"
  }
}
```

---

## 2. Get Notifications

### Endpoint

```http
GET /api/v1/notifications?page=1&limit=20
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "N1001",
      "title": "Amazon Placement Drive",
      "message": "Amazon recruitment starts tomorrow.",
      "type": "PLACEMENT",
      "isRead": false,
      "createdAt": "2025-07-01T10:00:00Z"
    }
  ]
}
```

---

## 3. Get Notification By ID

### Endpoint

```http
GET /api/v1/notifications/{notificationId}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "N1001",
    "title": "Amazon Placement Drive",
    "message": "Amazon recruitment starts tomorrow.",
    "type": "PLACEMENT",
    "priority": "HIGH"
  }
}
```

---

## 4. Mark Notification as Read

### Endpoint

```http
PATCH /api/v1/notifications/{notificationId}/read
```

### Response

```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

## 5. Mark All Notifications as Read

### Endpoint

```http
PATCH /api/v1/notifications/read-all
```

### Response

```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## 6. Get Unread Notification Count

### Endpoint

```http
GET /api/v1/notifications/unread-count
```

### Response

```json
{
  "success": true,
  "count": 12
}
```

---

## 7. Update Notification

### Endpoint

```http
PUT /api/v1/notifications/{notificationId}
```

### Request

```json
{
  "title": "Updated Placement Drive",
  "priority": "MEDIUM"
}
```

### Response

```json
{
  "success": true,
  "message": "Notification updated successfully"
}
```

---

## 8. Delete Notification

### Endpoint

```http
DELETE /api/v1/notifications/{notificationId}
```

### Response

```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

## Notification JSON Schema

```json
{
  "id": "string",
  "title": "string",
  "message": "string",
  "type": "PLACEMENT | EVENT | RESULT | GENERAL",
  "priority": "LOW | MEDIUM | HIGH",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

---

## Real-Time Notification Mechanism

The system uses WebSocket for instant notification delivery.

### WebSocket Connection

```http
ws://server/api/v1/ws
```

### Flow

```text
Admin Creates Notification
        ↓
Backend Stores Notification
        ↓
WebSocket Event Published
        ↓
Connected Students Receive Notification Instantly
```

### Sample Event

```json
{
  "event": "NEW_NOTIFICATION",
  "data": {
    "id": "N1001",
    "title": "Amazon Placement Drive"
  }
}
```

---

# Stage 2

## Database Selection

PostgreSQL is selected as the primary database because:

* Strong ACID compliance
* Excellent support for relational data
* High reliability
* Powerful indexing capabilities
* Efficient pagination and querying
* Easy integration with backend applications

Redis will be used for caching unread counts and frequently accessed data.

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(50),
    year_of_study INT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

### Notifications Table

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(20) NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### User Notifications Table

```sql
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    notification_id UUID REFERENCES notifications(id),
    is_read BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP
);
```

---

## Entity Relationship

```text
Users
   |
   |
UserNotifications
   |
   |
Notifications
```

Many users can receive many notifications, resulting in a many-to-many relationship.

---

## Indexing Strategy

```sql
CREATE INDEX idx_user_notifications_user
ON user_notifications(user_id);
```

```sql
CREATE INDEX idx_user_notifications_read
ON user_notifications(is_read);
```

```sql
CREATE INDEX idx_notifications_created
ON notifications(created_at DESC);
```

---

## SQL Queries for APIs

### Create Notification

```sql
INSERT INTO notifications(
 id,
 title,
 message,
 category,
 priority
)
VALUES(
 gen_random_uuid(),
 'Amazon Placement Drive',
 'Amazon hiring starts tomorrow',
 'PLACEMENT',
 'HIGH'
);
```

---

### Get Notifications

```sql
SELECT
 n.id,
 n.title,
 n.message,
 n.category,
 un.is_read,
 n.created_at
FROM notifications n
JOIN user_notifications un
ON n.id = un.notification_id
WHERE un.user_id = :userId
ORDER BY n.created_at DESC
LIMIT 20 OFFSET 0;
```

---

### Mark Notification as Read

```sql
UPDATE user_notifications
SET is_read = TRUE,
    read_at = NOW()
WHERE user_id = :userId
AND notification_id = :notificationId;
```

---

### Get Unread Count

```sql
SELECT COUNT(*)
FROM user_notifications
WHERE user_id = :userId
AND is_read = FALSE;
```

---

## Scalability Challenges and Solutions

### Challenge 1: Large Notification Volume

Problem:

* Millions of notification records

Solution:

* Table partitioning by month or year

---

### Challenge 2: Slow Read Operations

Problem:

* Frequent unread count requests

Solution:

* Store unread counts in Redis cache

---

### Challenge 3: High Notification Throughput

Problem:

* Thousands of users receiving notifications simultaneously

Solution:

* Use Kafka or RabbitMQ as a message broker

---

### Challenge 4: Database Bottlenecks

Problem:

* Increased read traffic

Solution:

* Introduce read replicas

---

## High-Level Architecture

```text
Admin
  ↓
REST API
  ↓
PostgreSQL
  ↓
Kafka/RabbitMQ
  ↓
Notification Service
  ↓
WebSocket Server
  ↓
Students
# Stage 3

## Analysis of Existing Query

### Existing Query

```sql
SELECT *
FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt DESC;
```

---

## Is the Query Accurate?

The query is logically correct because it retrieves all unread notifications for a specific student and sorts them by creation time in descending order.

However, with a database containing approximately 50,000 students and 5,000,000 notifications, the query may become slow if proper indexing is not implemented.

---

## Why is the Query Slow?

### 1. Large Dataset

The notifications table contains millions of rows. Without suitable indexes, the database engine must scan a large portion of the table to locate matching records.

### 2. Filtering on Multiple Columns

The query filters using:

* studentID
* isRead

If indexes do not exist on these columns, the database performs expensive scans.

### 3. Sorting Cost

The query also performs:

```sql
ORDER BY createdAt DESC
```

Sorting a large result set requires additional CPU and memory resources.

### 4. SELECT *

Using SELECT * retrieves all columns even when only a few fields may be required by the application. This increases I/O overhead.

---

## Recommended Improvements

### Optimized Query

```sql
SELECT id,
       title,
       message,
       createdAt
FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt DESC;
```

This reduces the amount of data transferred from the database.

---

## Recommended Index

A composite index should be created on the columns used for filtering and sorting.

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications(studentID, isRead, createdAt DESC);
```

### Why This Index?

The index supports:

1. Filtering by studentID
2. Filtering by isRead
3. Returning rows already ordered by createdAt

This significantly reduces scanning and sorting costs.

---

## Likely Computational Cost

### Without Index

The database may perform a full table scan.

Approximate complexity:

```text
O(N)
```

where N is the number of rows in the notifications table.

For 5,000,000 rows this is expensive.

---

### With Composite Index

The database can directly locate matching records.

Approximate complexity:

```text
O(log N)
```

for index lookup, followed by retrieval of matching rows.

This provides a substantial performance improvement.

---

## Should We Add Indexes on Every Column?

No.

Adding indexes on every column is generally not recommended.

### Disadvantages

1. Increased storage usage
2. Slower INSERT operations
3. Slower UPDATE operations
4. Slower DELETE operations
5. Higher maintenance overhead

Indexes should only be created for:

* Frequently filtered columns
* Join columns
* Sorting columns
* Columns used in search operations

Indexing every column often hurts overall database performance.

---

## Query to Find Students Who Received Placement Notifications in the Last 7 Days

Assuming notificationType contains values:

* Event
* Result
* Placement

The following query returns all students who received placement notifications during the last seven days.

```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
AND createdAt >= NOW() - INTERVAL '7 days';
```

---

## Additional Scaling Recommendations

As notification volume continues to grow:

### Table Partitioning

Partition notifications by month or year to reduce scan size.

### Read Replicas

Use database replicas for read-heavy workloads.

### Redis Caching

Store unread counts and frequently accessed notification data in Redis.

### Message Queue

Use Kafka or RabbitMQ to decouple notification creation from delivery and improve scalability.

---

## Conclusion

The original query is functionally correct but inefficient for a dataset containing millions of notifications. A composite index on studentID, isRead, and createdAt, combined with selecting only required columns, significantly improves performance. Creating indexes on every column is not recommended because it increases storage and write costs without proportional benefits.

