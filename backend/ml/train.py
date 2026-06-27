import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score, confusion_matrix, classification_report
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
import optuna
import shap

# Ensure backend is in the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.features import FeatureExtractor

# Suppress Optuna logs to keep clean output, unless we are debugging
optuna.logging.set_verbosity(optuna.logging.WARNING)

def extract_features_parallel(urls, extractor):
    """
    Extracts lexical features for list of URLs in parallel using ThreadPoolExecutor.
    """
    print(f"Extracting features for {len(urls)} URLs in parallel...")
    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(extractor.extract_lexical, urls))
    return pd.DataFrame(results)

def main():
    # Define directories
    ML_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(ML_DIR, "..", "data")
    ARTIFACTS_DIR = os.path.join(ML_DIR, "artifacts")
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)

    # Load datasets
    phishing_path = os.path.join(DATA_DIR, "training", "phishing.csv")
    legitimate_path = os.path.join(DATA_DIR, "training", "legitimate.csv")

    if not os.path.exists(phishing_path) or not os.path.exists(legitimate_path):
        print("Error: Ingest datasets not found. Run prepare_data.py first.")
        sys.exit(1)

    phishing_urls = pd.read_csv(phishing_path)["url"].tolist()
    legitimate_urls = pd.read_csv(legitimate_path)["url"].tolist()

    extractor = FeatureExtractor()

    # Extract lexical features
    df_phish = extract_features_parallel(phishing_urls, extractor)
    df_phish["label"] = 1

    df_legit = extract_features_parallel(legitimate_urls, extractor)
    df_legit["label"] = 0

    # Combine
    data = pd.concat([df_phish, df_legit], ignore_index=True)
    
    # Separate features and label
    X = data.drop(columns=["label"])
    y = data["label"]

    feature_names = X.columns.tolist()
    # Save feature names order list
    joblib.dump(feature_names, os.path.join(ARTIFACTS_DIR, "feature_names.pkl"))
    print(f"Features list saved. Number of features: {len(feature_names)}")

    # Split into 80/20 train/test with stratification
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )
    print(f"Split data: Train={len(X_train)} rows, Test={len(X_test)} rows")

    # Apply SMOTE only to training split to balance the classes
    print("Applying SMOTE to balance classes in training split...")
    smote = SMOTE(random_state=42)
    X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
    print(f"Resampled training set: Phishing={sum(y_train_res == 1)}, Legitimate={sum(y_train_res == 0)}")

    # Optuna hyperparameter optimization
    def objective(trial):
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 100, 500, step=50),
            "max_depth": trial.suggest_int("max_depth", 3, 10),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
            "subsample": trial.suggest_float("subsample", 0.6, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
            "use_label_encoder": False,
            "eval_metric": "logloss",
            "random_state": 42
        }
        
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        scores = []
        
        for train_idx, val_idx in cv.split(X_train_res, y_train_res):
            # Split
            X_tr, y_tr = X_train_res.iloc[train_idx], y_train_res.iloc[train_idx]
            X_val, y_val = X_train_res.iloc[val_idx], y_train_res.iloc[val_idx]
            
            # Setup Pipeline
            pipeline = Pipeline([
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
                ("classifier", XGBClassifier(**params))
            ])
            
            pipeline.fit(X_tr, y_tr)
            preds_proba = pipeline.predict_proba(X_val)[:, 1]
            scores.append(roc_auc_score(y_val, preds_proba))
            
        return np.mean(scores)

    print("Running Optuna hyperparameter optimization (50 trials)...")
    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=50)
    
    print("Best trials params:")
    best_params = study.best_params
    print(json.dumps(best_params, indent=2))
    
    # Save best parameters
    with open(os.path.join(ARTIFACTS_DIR, "best_params.json"), "w") as f:
        json.dump(best_params, f, indent=2)

    # Train the final pipeline on all balanced training data
    print("Training final pipeline with best parameters...")
    final_params = {**best_params, "use_label_encoder": False, "eval_metric": "logloss", "random_state": 42}
    
    final_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("classifier", XGBClassifier(**final_params))
    ])
    
    final_pipeline.fit(X_train_res, y_train_res)

    # Evaluate on test set
    print("Evaluating on held-out test set...")
    y_pred = final_pipeline.predict(X_test)
    y_proba = final_pipeline.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    ap = average_precision_score(y_test, y_proba)

    print(f"\n--- EVALUATION METRICS ---")
    print(f"Accuracy:          {acc:.4f} (Target: >=0.9000)")
    print(f"Precision:         {prec:.4f}")
    print(f"Recall:            {rec:.4f}")
    print(f"F1 Score:          {f1:.4f}")
    print(f"AUC-ROC:           {auc:.4f} (Target: >=0.9500)")
    print(f"Avg Precision:     {ap:.4f}")
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # Save Pipeline
    joblib.dump(final_pipeline, os.path.join(ARTIFACTS_DIR, "model.pkl"))
    print("Model pipeline saved to models/model.pkl")

    # Generate and save SHAP Explainer
    print("Fitting SHAP TreeExplainer...")
    # SHAP Explainer needs the raw model and the transformed training data
    imputer = final_pipeline.named_steps["imputer"]
    scaler = final_pipeline.named_steps["scaler"]
    classifier = final_pipeline.named_steps["classifier"]
    
    X_train_trans = scaler.transform(imputer.transform(X_train_res))
    explainer = shap.TreeExplainer(classifier)
    
    # Save SHAP explainer
    joblib.dump(explainer, os.path.join(ARTIFACTS_DIR, "shap_explainer.pkl"))
    print("SHAP explainer saved to models/shap_explainer.pkl")

    # Print global feature importance (Mean Absolute SHAP values)
    print("\n--- GLOBAL FEATURE IMPORTANCE (Mean Abs SHAP) ---")
    # Take a sample of transformed training set to calculate global SHAP importances
    sample_size = min(1000, len(X_train_trans))
    shap_values = explainer.shap_values(X_train_trans[:sample_size])
    
    # Calculate mean absolute SHAP value for each feature
    mean_abs_shap = np.mean(np.abs(shap_values), axis=0)
    importance_df = pd.DataFrame({
        "Feature": feature_names,
        "Mean_Abs_SHAP": mean_abs_shap
    }).sort_values(by="Mean_Abs_SHAP", ascending=False)
    
    for idx, row in importance_df.head(20).iterrows():
        print(f"{row['Feature']:<30}: {row['Mean_Abs_SHAP']:.4f}")

if __name__ == "__main__":
    main()
