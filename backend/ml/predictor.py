import os
import joblib
import pandas as pd
import numpy as np
from ml.features import FeatureExtractor

class Predictor:
    def __init__(self):
        self.ml_dir = os.path.dirname(os.path.abspath(__file__))
        self.artifacts_dir = os.path.join(self.ml_dir, "artifacts")
        
        # Load artifacts
        self.pipeline = joblib.load(os.path.join(self.artifacts_dir, "model.pkl"))
        self.feature_names = joblib.load(os.path.join(self.artifacts_dir, "feature_names.pkl"))
        self.shap_explainer = joblib.load(os.path.join(self.artifacts_dir, "shap_explainer.pkl"))
        self.extractor = FeatureExtractor()
        
        # Display name mapping for human-readable features
        self.display_names = {
            "url_length": "URL Length",
            "hostname_length": "Hostname Length",
            "path_length": "Path Length",
            "query_length": "Query Length",
            "fragment_length": "Fragment Length",
            "count_dots": "Dot Count",
            "count_hyphens": "Hyphen Count",
            "count_underscores": "Underscore Count",
            "count_slashes": "Slash Count",
            "count_question_marks": "Question Mark Count",
            "count_equals": "Equals Sign Count",
            "count_ampersands": "Ampersand Count",
            "count_at_signs": "@ Count",
            "count_percent_encoding": "% Encoding Count",
            "count_digits_in_domain": "Digits in Domain",
            "count_subdomains": "Subdomain Count",
            "has_ip_address": "Has IP Address",
            "is_shortened": "Using Shortened Link",
            "has_at_in_url": "Has @ Symbol",
            "double_slash_in_path": "Double Slash Redirect In Path",
            "has_port": "Has Custom Port",
            "port_number": "Port Number",
            "tld_in_path": "TLD In Path",
            "https_token_in_domain": "HTTPS Token in Domain",
            "subdomain_is_ip_like": "IP-like Subdomain Structure",
            "special_char_ratio": "Special Character Ratio",
            "digit_ratio_in_url": "Digit Ratio",
            "subdomain_entropy": "Subdomain Entropy",
            "longest_word_length": "Longest Word Length",
            "avg_word_length": "Average Word Length"
        }

    def predict_and_explain(self, url: str) -> dict:
        """
        Runs model inference on the URL's lexical features and calculates SHAP values.
        Returns prediction probability and a list of formatted SHAP values for display.
        """
        # 1. Extract features
        features_dict = self.extractor.extract_lexical(url)
        
        # Create DataFrame in the exact training columns order
        df = pd.DataFrame([features_dict])[self.feature_names]
        
        # 2. Pipeline transformation
        imputer = self.pipeline.named_steps["imputer"]
        scaler = self.pipeline.named_steps["scaler"]
        classifier = self.pipeline.named_steps["classifier"]
        
        df_imputed = imputer.transform(df)
        df_scaled = scaler.transform(df_imputed)
        
        # 3. Model predict
        proba = classifier.predict_proba(df_scaled)[0][1]  # Phishing class probability
        
        # 4. SHAP Explanation
        # Compute SHAP values for the scaled features
        shap_values = self.shap_explainer.shap_values(df_scaled)[0]
        
        # Match SHAP values with feature names
        shap_list = []
        for i, f_name in enumerate(self.feature_names):
            val = df.iloc[0][f_name]
            shap_val = float(shap_values[i])
            direction = "phishing" if shap_val > 0 else "safe"
            
            shap_list.append({
                "feature": f_name,
                "display_name": self.display_names.get(f_name, f_name),
                "value": float(val) if isinstance(val, (int, float, np.integer, np.floating)) else val,
                "shap": shap_val,
                "direction": direction
            })
            
        # Sort SHAP list by absolute SHAP value descending
        shap_list.sort(key=lambda x: abs(x["shap"]), reverse=True)
        
        return {
            "probability": float(proba),
            "features": {k: float(v) if isinstance(v, (int, float, np.integer, np.floating)) else v for k, v in features_dict.items()},
            "shap_values": shap_list
        }

# Facade helper
_predictor = None
def get_prediction_and_explanation(url: str) -> dict:
    global _predictor
    if _predictor is None:
        _predictor = Predictor()
    return _predictor.predict_and_explain(url)
