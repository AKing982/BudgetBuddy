# BudgetBuddy

**An intelligent budgeting app powered by Java Spring, Machine Learning, and AI.**

BudgetBuddy helps users manage their finances by forecasting spending patterns and accurately categorizing transactions using cutting-edge technology. Built with a robust Java Spring backend and AI-driven predictions, it’s your personal finance companion.

---

## Features

- **AI-Powered Categorization**: Automatically tags transactions (e.g., groceries, rent) with high precision.
- **Spending Forecasts**: Predicts future budgets based on historical data using Machine Learning.
- **Budget Tracking**: Set and monitor personalized budgets with real-time insights.
- **Secure & Scalable**: Powered by Java Spring for reliable backend performance.
- **Actionable Insights**: Get tailored recommendations to optimize your finances.

---

## Tech Stack

- **Backend**: Java Spring (Spring Boot, Spring Data, Spring Security)  
- **Machine Learning**: Python (TensorFlow/Scikit-learn) integrated via REST APIs  
- **Database**: [e.g., PostgreSQL/MySQL]  
- **Frontend**: furture development [e.g., React/Angular/Thymeleaf]  
- **Tools**: Maven, Docker (optional), Git  

---

## Getting Started

### Prerequisites
- Java 17+  
- Maven 3.6+  
- Python 3.8+ (for ML)  
- [Database, e.g., PostgreSQL 15+]  
- Git  

### Installation

1. **Clone the Repo**
   ```bash
   git clone https://github.com/[your-username]/BudgetBuddy.git
   cd BudgetBuddy

2. **Setup the Backend**
   ```bash
   cd backend
  - Update src/main/resources/application.properties with database configuration:
    ```spring.datasource.url=jdbc:[your-db]://localhost:5432/budgetbuddy
    spring.datasource.username=[username]
    spring.datasource.password=[password]

  - Build and Run:
    ```mvn clean install
    mvn spring-boot:run 
3. **Launch the App**
    - Visit http://localhost:3000 in your browser.
    - Hosted Site: https://budgetbuddy-app2-30f69a583595.herokuapp.com/
