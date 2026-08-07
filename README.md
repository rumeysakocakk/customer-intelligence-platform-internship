# Customer Intelligence Platform

An end-to-end Machine Learning project developed using the Olist Brazilian E-commerce Public Dataset to analyze customer behavior, generate business insights, engineer predictive features, train customer intelligence models, and deploy the final solution through a Flask-based web application.

---

# Project Description

Customer intelligence enables organizations to better understand purchasing behavior, customer satisfaction, and transaction patterns through data-driven analysis.

This project demonstrates a complete machine learning workflow that begins with raw relational e-commerce data and progresses through data preprocessing, exploratory analysis, feature engineering, predictive modeling, model evaluation, and web deployment.

The project is designed not only as a machine learning study, but also as a practical software project. The final solution will expose the trained model through a Flask-based web application with analytical dashboards, prediction capabilities, and model performance views.

---

# Project Objectives

The project aims to:

- Understand the structure and quality of a real-world e-commerce dataset.
- Assess and improve data quality through systematic preprocessing.
- Explore customer purchasing behavior and business trends.
- Generate business insights using exploratory data analysis.
- Engineer robust predictive features suitable for machine learning.
- Prevent information leakage during feature engineering.
- Develop and evaluate customer intelligence models.
- Deploy the final model through a Flask-based web application.
- Demonstrate a complete end-to-end machine learning and software development workflow.

---

# Dataset

This project uses the **Olist Brazilian E-commerce Public Dataset**, which contains transactional data collected from a Brazilian online marketplace.

The dataset consists of multiple relational tables including:

- Customers
- Orders
- Order Items
- Order Payments
- Order Reviews
- Products
- Sellers
- Geolocation
- Product Category Translation

These datasets are integrated to construct a machine-learning-ready analytical dataset for predictive modeling.

---

# Project Structure

```text
customer-intelligence-platform/
│
├── app/
│   ├── app.py
│   ├── routes/
│   ├── services/
│   ├── templates/
│   ├── static/
│   └── utils/
│
├── data/
│   └── processed/
│
├── docs/
├── models/
│
├── notebooks/
│   ├── 01_Data_Understanding.ipynb
│   ├── 02_Data_Cleaning.ipynb
│   ├── 03_Exploratory_Data_Analysis.ipynb
│   └── 04_Feature_Engineering.ipynb
│
├── reports/
├── src/
├── tests/
│
├── .gitignore
├── README.md
└── requirements.txt
```

---

# Notebook Overview

## 01. Data Understanding

The first notebook focuses on understanding the structure and quality of the raw datasets.

Main tasks include:

- Dataset inspection
- Dimension analysis
- Missing value analysis
- Duplicate record detection
- Data type inspection
- Initial data quality assessment

---

## 02. Data Cleaning

The second notebook prepares the raw datasets for further analysis and machine learning.

Main tasks include:

- Handling missing values
- Removing duplicate records
- Converting incorrect data types
- Standardizing data formats
- Dataset validation
- Exporting cleaned datasets

---

## 03. Exploratory Data Analysis

The third notebook explores customer behavior and business performance through statistical analysis and visualization.

Analyses include:

- Customer purchasing behavior
- Payment behavior
- Product category analysis
- Average order value analysis
- Customer satisfaction
- Delivery performance
- Correlation analysis
- Business insights

---

## 04. Feature Engineering

The fourth notebook transforms the cleaned datasets into a machine-learning-ready modeling dataset.

Feature engineering includes:

- Order-level aggregation
- Product-level aggregation
- Payment aggregation
- Purchase behavior features
- Time-based features
- Delivery-related features
- Target variable creation
- Missing value handling
- Information leakage prevention
- Train-test split
- Exporting modeling datasets

---

## 05. Machine Learning Modeling

The next stage of the project focuses on training and comparing multiple classification algorithms.

Candidate models include:

- Logistic Regression
- Decision Tree
- Random Forest
- XGBoost

The modeling workflow will also include:

- Preprocessing pipelines
- Categorical encoding
- Numerical scaling
- Cross-validation
- Hyperparameter optimization
- Model comparison

---

## 06. Model Evaluation and Deployment

The final notebook will focus on selecting and evaluating the best-performing model.

Evaluation will include:

- Accuracy
- Precision
- Recall
- F1 Score
- ROC-AUC
- Confusion Matrix
- Classification Report
- Feature Importance
- Model interpretation

The selected model will then be serialized and integrated into the Flask application.

---

# Flask Web Application

The final stage of the project will include a Flask-based customer intelligence platform.

The application is planned to contain:

## Executive Dashboard

A high-level business overview including:

- Total orders
- Customer activity
- Average order value
- Customer satisfaction indicators
- Payment distribution
- Product category insights
- Delivery performance

## Customer Insights

Interactive analytical views focused on customer and transaction behavior.

Planned capabilities include:

- State-based analysis
- Payment method analysis
- Product category analysis
- Time-based purchasing patterns
- Customer satisfaction trends

## Model Prediction

A prediction interface that allows users to provide order and customer-related information and receive a customer satisfaction prediction.

The prediction view will display:

- Predicted class
- Prediction probability
- Risk interpretation
- Input validation feedback

## Model Performance

A dedicated model evaluation page including:

- Confusion Matrix
- ROC Curve
- Classification metrics
- Model comparison
- Feature importance

## REST API

The Flask application will also expose model predictions through an API endpoint.

Example:

```text
POST /api/predict
```

This will allow the trained machine learning pipeline to be used independently from the web interface.

---

# Technologies

## Programming Language

- Python

## Data Analysis

- Pandas
- NumPy

## Data Visualization

- Matplotlib
- Seaborn

## Machine Learning

- Scikit-learn
- XGBoost

## Web Development

- Flask
- HTML
- CSS
- JavaScript
- Jinja2

## Model Serialization

- Joblib

## Development Environment

- Jupyter Notebook
- PyCharm

## Version Control

- Git
- GitHub

---

# Application Architecture

The Flask application will follow a modular structure to separate presentation, business logic, and machine learning functionality.

```text
app/
│
├── app.py
│
├── routes/
│   ├── dashboard.py
│   ├── prediction.py
│   └── api.py
│
├── services/
│   ├── data_service.py
│   ├── model_service.py
│   └── prediction_service.py
│
├── templates/
│   ├── base.html
│   ├── dashboard.html
│   ├── prediction.html
│   └── model_performance.html
│
├── static/
│   ├── css/
│   ├── js/
│   └── images/
│
└── utils/
    └── validators.py
```

This architecture is intended to keep the application modular, maintainable, and suitable for future extension.

---

# Future Improvements

Future development may include:

- Hyperparameter optimization
- Cross-validation
- Feature importance analysis
- Model explainability using SHAP
- Flask REST API expansion
- Docker containerization
- Automated testing
- CI/CD integration
- Cloud deployment

---

# Repository Information

This repository is being developed as part of a Machine Learning Internship Project.

Each notebook represents a separate stage of the machine learning workflow, while the Flask application provides the final deployment layer for interactive analytics and predictive inference.

The project follows a modular and reproducible development approach so that individual components can be maintained, tested, and extended independently.

---

# Author

**Rümeysa Koçak**

