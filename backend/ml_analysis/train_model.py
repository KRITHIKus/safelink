import os
import pandas as pd
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_score, recall_score, f1_score

#Paths
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
dataset_path = os.path.join(backend_dir, "datasets", "phishing.csv")

#Load dataset
df = pd.read_csv(dataset_path)
df.columns = df.columns.str.strip()  # Remove leading/trailing spaces in column names

#Ensure 'class' column exists
if "class" not in df.columns:
    raise KeyError("Column 'class' is missing in the dataset!")

#Define Features & Target
X = df.drop(columns=["class"])  # Features
y = df["class"]  # Target variable

#Ensure valid training data
if X.empty or y.empty:
    raise ValueError("No valid data left for training! Check the dataset.")

#Standardize Features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

#Train-test split (80% train, 20% test)
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y)

#Define and train Logistic Regression model
model = LogisticRegression(max_iter=1000, solver="lbfgs", random_state=42)
model.fit(X_train, y_train)

#Predict on test set
y_pred = model.predict(X_test)

#Performance Metrics
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print("\n📈 Model Performance:")
print(f"✔️ Accuracy: {accuracy:.4f}")
print(f"✔️ Precision: {precision:.4f}")
print(f"✔️ Recall: {recall:.4f}")
print(f"✔️ F1 Score: {f1:.4f}")

#Classification Report
print("\n📊 Classification Report:\n", classification_report(y_test, y_pred))

#Cross-validation score
cv_scores = cross_val_score(model, X_scaled, y, cv=5)
print(f"\n🔍 Cross-Validation Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

#Confusion Matrix Visualization
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(6, 4))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=["Safe", "Phishing"], yticklabels=["Safe", "Phishing"])
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Confusion Matrix")
plt.show()

#Save the trained model & scaler
model_path = os.path.join(backend_dir, "ml_analysis", "trained_model.pkl")
scaler_path = os.path.join(backend_dir, "ml_analysis", "scaler.pkl")

joblib.dump(model, model_path)
joblib.dump(scaler, scaler_path)

print(f"\n✅ Model saved at: {model_path}")
print(f"✅ Scaler saved at: {scaler_path}")
