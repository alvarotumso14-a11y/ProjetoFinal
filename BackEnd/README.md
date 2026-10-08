# TiaBete Backend

REST API developed with **ASP.NET Core .NET 8** for the TiaBete project, an academic application focused on diabetes tracking.

> Academic project. This application does not provide medical diagnosis and does not replace professional medical advice.

---

## 🚀 Technologies

- C#
- .NET 8
- ASP.NET Core Web API
- Entity Framework Core
- MySQL
- Pomelo.EntityFrameworkCore.MySql
- JWT Authentication
- BCrypt
- QuestPDF
- xUnit
- Moq
- k6
- Swagger / OpenAPI

---

## 🏗 Architecture

The project follows a layered architecture:

```text
Presentation
    ↓
Application
    ↓
Domain
    ↑
Infrastructure
```

### Project Structure

- `Presentation` — Controllers, authentication, Swagger, CORS and API configuration
- `Application` — DTOs, interfaces and business services
- `Domain` — Entities, repository contracts and domain exceptions
- `Infrastructure` — EF Core, repositories, JWT implementation and PDF generation
- `Tests` — Unit, integration, concurrency and rate limiting tests

---

## ✨ Main Features

- User registration and login
- JWT authentication
- BCrypt password hashing
- User profile management
- Soft delete and account reactivation
- Role-based authorization
- Blood glucose record CRUD
- User data isolation
- Support for glucose meter `HI` readings
- History filtering by date
- PDF history export
- Rate limiting
- CORS configuration
- Duplicate e-mail protection
- Concurrent request handling
- MySQL persistence with EF Core

---

## 🔐 Security

The API includes:

- JWT authentication
- BCrypt password hashing
- Role-based authorization
- Per-user record ownership
- Rate limiting
- Extra protection for login and account reactivation
- Unique e-mail constraint
- Soft deletion
- Validation with DataAnnotations
- User Secrets for sensitive configuration
- Protection against duplicate e-mail race conditions

---

## 🧪 Automated Tests

The project includes automated tests covering:

- Duplicate e-mail registration
- Inactive user login
- Valid `HI` glucose reading
- Invalid `HI` with numeric glucose value
- Login rate limiting
- Concurrent requests
- Multiple simulated users
- Glucose record integration scenarios
- High-volume request scenarios

### Current result

```text
9 tests
9 passed
0 failed
```

---

## 📈 Load Testing

Load tests were executed locally using **k6**.

> Important: the API and k6 were running on the same local machine, so these results reflect the local development environment and should not be interpreted as production capacity.

### Login / Rate Limiting Tests

| Virtual Users | Checks |
|---:|---:|
| 20 | 100% |
| 500 | 100% |
| 1,000 | 100% |
| 2,000 | 100% |
| 5,000 | 100% |
| 10,000 | Local environment saturation |

The application remained stable up to **5,000 virtual users** in the local environment.

At **10,000 virtual users**, the local machine reached saturation. This result should be interpreted as a stress test of the local environment, not as the production capacity of the application.

### Real MySQL Write Tests

A separate test database was used to execute real write operations through the complete backend flow:

```text
k6
 ↓
ASP.NET Core API
 ↓
Service
 ↓
Repository
 ↓
Entity Framework Core
 ↓
MySQL
```

Results:

| Virtual Users | HTTP Failures | Approx. Throughput |
|---:|---:|---:|
| 50 | 0% | 44 req/s |
| 100 | 0% | 65 req/s |
| 250 | 0% | 63 req/s |

At 250 concurrent virtual users, the API remained stable with no HTTP failures, although latency increased, indicating saturation of the local API + MySQL environment.

---

## 🛠 Requirements

- .NET 8 SDK
- MySQL 8
- Visual Studio 2022 or another compatible IDE
- Git
- Optional: k6 for load testing

---

## ⚙️ Configuration

Sensitive values are not stored directly in the repository.

The project uses **.NET User Secrets** for local configuration.

Example:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "YOUR_CONNECTION_STRING" --project Presentation
```

JWT settings should also be configured using User Secrets.

Example:

```powershell
dotnet user-secrets set "Jwt:Key" "YOUR_SECRET_KEY" --project Presentation
dotnet user-secrets set "Jwt:Issuer" "TiaBete" --project Presentation
dotnet user-secrets set "Jwt:Audience" "TiaBete" --project Presentation
```

The default SMTP settings use Gmail (`smtp.gmail.com:587`) and the authorized sender `glichelpgh@gmail.com`. The account owner must enable two-step verification and generate a Google App Password. Store it only in User Secrets locally:

```powershell
dotnet user-secrets set "Smtp:Password" "PASTE_THE_APP_PASSWORD_IN_YOUR_TERMINAL" --project Presentation
```

For production, set the `Smtp__Password` environment variable. Never commit or share the App Password. Without it, Development logs verification codes locally; outside Development, the API fails to start. Email delivery uses StartTLS with a 15-second timeout.

---

## 🗄 Database

After configuring the MySQL connection string, apply the Entity Framework Core migrations:

```powershell
dotnet ef database update --project Infrastructure --startup-project Presentation
```

The project uses EF Core migrations to create and update the database structure.
New sign-ups remain in `CadastrosPendentes` until the emailed verification code is validated; only then is a row created in `Usuarios`.

---

## ▶️ Running the API

Run:

```powershell
dotnet run --project Presentation
```

ASP.NET Core will display the local API URL in the terminal.

Example:

```text
https://localhost:7130
```

Swagger can then be accessed at:

```text
https://localhost:7130/swagger
```

---

## 📚 Main API Areas

The API provides endpoints for:

### Users

- Registration
- Login
- Account reactivation
- Profile retrieval
- Partial profile update
- Soft account deletion
- Admin user listing

### Blood Glucose Records

- Create records
- List authenticated user's records
- Retrieve individual records
- Update records
- Delete records
- Filter records by period
- Export history as PDF

---

## 🔑 Authentication

The API uses JWT Bearer authentication.

After login, the API returns a JWT token that must be sent in protected requests using:

```text
Authorization: Bearer YOUR_TOKEN
```

Swagger is configured to support JWT authentication for protected endpoints.

---

## ⏱ Rate Limiting

The project includes request rate limiting to reduce abusive or excessive traffic.

The API uses:

```text
General API:
60 requests per minute per authenticated user / client

Login:
5 requests per minute

Account reactivation:
5 requests per minute
```

When the limit is exceeded, the API responds with:

```text
429 Too Many Requests
```

---

## 📄 PDF Export

Users can export their glucose history as a PDF report.

The PDF contains information such as:

- User profile data
- Date range
- Total records
- Minimum glucose
- Maximum glucose
- Date and time
- Glucose values
- Insulin dose
- Meal
- Observations

PDF generation is implemented using **QuestPDF**.

---

## ✅ Running Automated Tests

Run:

```powershell
dotnet test
```

Current result:

```text
9 passed
0 failed
```

---

## 📊 Load Testing with k6

Example command:

```powershell
k6 run --insecure-skip-tls-verify load-login.js
```

Load tests were also executed against a dedicated MySQL test database to avoid modifying the main development database.

---

## 📚 What I Learned

This project was built while studying backend development with C# and .NET.

During development I practiced:

- REST API design
- Layered architecture
- Dependency Injection
- Entity Framework Core
- MySQL
- JWT authentication
- Authorization
- DTOs
- Repository and Service patterns
- Data validation
- Exception handling
- Soft delete
- Rate limiting
- Unit testing
- Integration testing
- Concurrency testing
- Load testing with k6
- Git and GitHub

---

## 📌 Project Status

Backend completed and tested.

```text
Build: 0 errors
Automated tests: 9 passed
JWT authentication: implemented
Authorization: implemented
Rate limiting: implemented
PDF export: implemented
MySQL integration: completed
Load testing: completed
```

---

## 👨‍💻 Author

Developed by **Dieisson Floriano** as an academic and portfolio project while studying backend development with **C#, .NET and ASP.NET Core**.

---

## 📌 Disclaimer

TiaBete is an academic project created for educational purposes.

It is not intended to provide medical diagnosis, treatment recommendations or replace professional healthcare guidance.
