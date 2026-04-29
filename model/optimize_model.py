import pandas as pd
import numpy as np
import joblib
import xgboost as xgb
import shap
import matplotlib.pyplot as plt
import seaborn as sns
import sys
from pathlib import Path

# Add backend to path for imports
sys.path.append(str(Path(__file__).parent.parent / "backend"))
from utils import ShapExplainerWrapper

from sklearn.model_selection import train_test_split, RandomizedSearchCV, StratifiedKFold
from sklearn.metrics import (
    classification_report, roc_auc_score, average_precision_score,
    precision_recall_curve, roc_curve, confusion_matrix
)
from xgboost import XGBClassifier

# Set up logging
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def optimize_pipeline():
    logger.info(f"XGBoost version: {xgb.__version__}")
    logger.info(f"SHAP version: {shap.__version__}")
    # 1. Load Processed Data
    data_path = Path("../data/processed/train.csv")
    if not data_path.exists():
        # Try absolute path if relative fails in some environments
        data_path = Path("d:/PranRakshak-AI/PranRakshak-AI/data/processed/train.csv")
    
    logger.info(f"Loading data from {data_path}")
    df = pd.read_csv(data_path)
    
    X = df.drop("SepsisLabel", axis=1)
    y = df["SepsisLabel"]
    
    # Ensure column order is preserved as per existing predictor.py
    # (Based on our analysis of predictor.py and preprocess.ipynb)
    feature_names = list(X.columns)
    logger.info(f"Features in data: {len(feature_names)}")

    # 2. Split Data
    # Use stratification to maintain class ratio
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # 3. Handle Imbalance: Calculate scale_pos_weight
    pos = sum(y_train == 1)
    neg = sum(y_train == 0)
    scale_weight = neg / pos
    logger.info(f"Class distribution - Neg: {neg}, Pos: {pos}, Scale Weight: {scale_weight:.2f}")

    # 4. Hyperparameter Tuning for XGBoost
    # We focus on parameters that affect recall and handle imbalance
    xgb_model = XGBClassifier(
        random_state=42,
        eval_metric="logloss"
    )

    param_grid = {
        'n_estimators': [300, 500, 800],
        'max_depth': [4, 5, 6, 7],
        'learning_rate': [0.01, 0.02, 0.05],
        'subsample': [0.8, 0.9],
        'colsample_bytree': [0.8, 0.9],
        'scale_pos_weight': [scale_weight, scale_weight * 2, scale_weight * 3],
        'min_child_weight': [5, 10, 15],
        'gamma': [0.1, 0.2, 0.5],
        'max_delta_step': [1, 5, 10] # Helps with extremely imbalanced classes
    }

    logger.info("Starting RandomizedSearchCV for XGBoost...")
    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    search = RandomizedSearchCV(
        xgb_model, 
        param_distributions=param_grid, 
        n_iter=20, # Increased for better search
        scoring='average_precision', # Focus on PR-AUC for imbalanced data
        cv=cv, 
        verbose=1, 
        random_state=42,
        n_jobs=-1
    )
    
    search.fit(X_train, y_train)
    
    best_model = search.best_estimator_
    logger.info(f"Best Params: {search.best_params_}")

    # 5. Evaluate and Threshold Optimization
    y_proba = best_model.predict_proba(X_test)[:, 1]
    
    # Calculate metrics
    auc_roc = roc_auc_score(y_test, y_proba)
    auc_pr = average_precision_score(y_test, y_proba)
    
    logger.info(f"Test ROC-AUC: {auc_roc:.4f}")
    logger.info(f"Test PR-AUC: {auc_pr:.4f}")

    # Find optimal threshold for Recall > 0.75
    precisions, recalls, thresholds = precision_recall_curve(y_test, y_proba)
    
    # We want a threshold that gives us high recall
    target_recall = 0.75
    idx = np.where(recalls >= target_recall)[0][-1]
    best_threshold = thresholds[idx]
    
    logger.info(f"Optimal Threshold for Recall >= {target_recall}: {best_threshold:.4f}")
    
    y_pred_custom = (y_proba >= best_threshold).astype(int)
    
    logger.info("\nClassification Report (Custom Threshold):")
    logger.info("\n" + classification_report(y_test, y_pred_custom))

    # 6. SHAP Explainer
    logger.info("Generating SHAP explainer...")
    try:
        # Try a robust wrapper for SHAP to handle compatibility issues
        background = X_train.sample(100, random_state=42)
        explainer = ShapExplainerWrapper(best_model.predict_proba, background)
        logger.info("SHAP Explainer wrapper created successfully.")
            
    except Exception as e:
        logger.error(f"SHAP generation failed completely: {e}")
        # Last resort: try to load the existing one if it exists
        try:
            explainer = joblib.load("../model/shap_explainer.pkl")
            logger.info("Re-using existing SHAP explainer as fallback.")
        except:
            explainer = None
            logger.error("Could not even fallback to existing explainer.")
    
    # 7. Save Artifacts (Production ready)
    model_save_path = Path("../model/saved_model.pkl")
    explainer_save_path = Path("../model/shap_explainer.pkl")
    
    joblib.dump(best_model, model_save_path)
    joblib.dump(explainer, explainer_save_path)
    
    logger.info(f"Model saved to {model_save_path}")
    logger.info(f"Explainer saved to {explainer_save_path}")

    # 8. Visualization (Optional - for logs/debug)
    plt.figure(figsize=(10, 5))
    
    # ROC Curve
    plt.subplot(1, 2, 1)
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    plt.plot(fpr, tpr, label=f'ROC (area = {auc_roc:.2f})')
    plt.plot([0, 1], [0, 1], 'k--')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve')
    plt.legend()

    # PR Curve
    plt.subplot(1, 2, 2)
    plt.plot(recalls, precisions, label=f'PR (area = {auc_pr:.2f})')
    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title('Precision-Recall Curve')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig("../model/evaluation_plots.png")
    logger.info("Evaluation plots saved to ../model/evaluation_plots.png")

if __name__ == "__main__":
    optimize_pipeline()
