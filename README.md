# Customer Intelligence Platform
![Python](https://img.shields.io/badge/Python-3.12-blue)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-Latest-orange)
![Git](https://img.shields.io/badge/Git-Version%20Control-red)
![License](https://img.shields.io/badge/License-MIT-green)
![Pandas](https://img.shields.io/badge/Pandas-Latest-blue)
![NumPy](https://img.shields.io/badge/NumPy-Latest-lightgrey)

An end-to-end Machine Learning project developed using the Olist Brazilian E-commerce Public Dataset to analyze customer behavior, generate business insights, engineer predictive features, and build customer intelligence models.

---

# Project Description

Customer intelligence enables organizations to better understand purchasing behavior, customer satisfaction, and transaction patterns through data-driven analysis.

This project demonstrates a complete machine learning workflow that begins with raw relational e-commerce data and progresses through data preprocessing, exploratory analysis, feature engineering, predictive modeling, model evaluation, and deployment.

The primary objective is to build a reproducible customer intelligence pipeline that follows industry-standard data science practices while producing meaningful business insights and machine learning features.

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
- Demonstrate a complete end-to-end machine learning pipeline.

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

These datasets are integrated to construct a customer-level analytical dataset for predictive modeling.

---

# Project Structure

```text
customer-intelligence-platform/
│
├── app/
│
├── data/
│   ├── raw/
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

The first notebook focuses on understanding the overall structure and quality of the raw datasets.

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
- Revenue analysis
- Payment behavior
- Product category analysis
- Customer satisfaction
- Delivery performance
- Correlation analysis
- Business insights

---

## 04. Feature Engineering

The fourth notebook transforms the cleaned datasets into a machine-learning-ready modeling dataset.

Feature engineering includes:

- Customer-level aggregation
- Product-level aggregation
- Payment aggregation
- Purchase behavior features
- Time-based features
- Delivery-related features
- Target variable creation
- Information leakage prevention
- Train-test split
- Exporting modeling datasets

---

## 05. Machine Learning Modeling *(Planned)*

The next stage of the project will focus on training and comparing multiple classification algorithms.

Candidate models include:

- Logistic Regression
- Decision Tree
- Random Forest
- XGBoost

---

## 06. Model Evaluation *(Planned)*

The trained models will be evaluated using standard classification metrics including:

- Accuracy
- Precision
- Recall
- F1 Score
- ROC-AUC

Feature importance and model interpretation will also be investigated.

---

## 07. Deployment *(Planned)*

The final trained model will be deployed as a lightweight web application demonstrating customer prediction capabilities.

---

# Technologies

### Programming Language

- Python

### Data Analysis

- Pandas
- NumPy

### Data Visualization

- Matplotlib
- Seaborn

### Machine Learning

- Scikit-learn

### Development Environment

- Jupyter Notebook
- PyCharm

### Version Control

- Git
- GitHub

---

# Future Improvements

Future development of the project will include:

- Hyperparameter optimization
- Cross-validation
- Feature importance analysis
- Model explainability using SHAP
- Streamlit web application
- Docker containerization
- CI/CD integration

---

# Repository Information

This repository is being developed as part of a Machine Learning Internship Project.

Each notebook represents an individual stage of a complete machine learning workflow, ensuring that every step of the project is reproducible, modular, and easy to understand.

---

# Author

**Rümeysa Koçak**

Machine Learning Internship Project

2026
