"""
train_models.py — Entraînement des 3 modèles ML SIAPET
Compare LR / RF / XGBoost / LightGBM et sauvegarde le meilleur.
"""
import warnings, os
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold, KFold
from sklearn.metrics import (
    r2_score, mean_absolute_error, mean_squared_error,
    recall_score, f1_score, roc_auc_score, accuracy_score,
    classification_report
)
from xgboost import XGBRegressor, XGBClassifier
from lightgbm import LGBMRegressor, LGBMClassifier

os.makedirs('models', exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
def make_reg_pipeline(model, num_cols, cat_cols):
    pre = ColumnTransformer([
        ('num', StandardScaler(), num_cols),
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols),
    ])
    return Pipeline([('pre', pre), ('model', model)])

def make_clf_pipeline(model, num_cols, cat_cols):
    pre = ColumnTransformer([
        ('num', StandardScaler(), num_cols),
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols),
    ])
    return Pipeline([('pre', pre), ('model', model)])

def compare_regressors(pipelines, X, y, cv=5):
    results = {}
    kf = KFold(n_splits=cv, shuffle=True, random_state=42)
    for name, pipe in pipelines.items():
        scores = cross_val_score(pipe, X, y, cv=kf, scoring='r2')
        mae    = -cross_val_score(pipe, X, y, cv=kf, scoring='neg_mean_absolute_error')
        results[name] = {'R2': scores.mean(), 'MAE': mae.mean()}
        print(f'  {name:<20} R2={scores.mean():.4f}  MAE={mae.mean():.4f}')
    return results

def compare_classifiers(pipelines, X, y, cv=5):
    results = {}
    skf = StratifiedKFold(n_splits=cv, shuffle=True, random_state=42)
    for name, pipe in pipelines.items():
        acc    = cross_val_score(pipe, X, y, cv=skf, scoring='accuracy')
        recall = cross_val_score(pipe, X, y, cv=skf, scoring='recall')
        f1     = cross_val_score(pipe, X, y, cv=skf, scoring='f1')
        results[name] = {'Accuracy': acc.mean(), 'Recall': recall.mean(), 'F1': f1.mean()}
        print(f'  {name:<20} Acc={acc.mean():.4f}  Recall={recall.mean():.4f}  F1={f1.mean():.4f}')
    return results

# ══════════════════════════════════════════════════════════════════════════════
# M1 — Taux de réussite (Régression)
# ══════════════════════════════════════════════════════════════════════════════
print('\n' + '='*60)
print('M1 — Taux de réussite (Régression)')
print('='*60)

df1 = pd.read_csv('dataset_reussite.csv')
TARGET1  = 'taux_reussite_actuel'
DROP1    = ['code_etablissement', TARGET1]
NUM1     = ['taux_reussite_an2', 'taux_reussite_an1', 'taux_absence_moyen',
            'ratio_etud_ens', 'budget_par_etud', 'nb_labos', 'taux_rotation_ens']
CAT1     = ['region', 'type_etablissement']

X1 = df1.drop(columns=DROP1)
y1 = df1[TARGET1]

pipes1 = {
    'LinearRegression':  make_reg_pipeline(LinearRegression(), NUM1, CAT1),
    'RandomForest':      make_reg_pipeline(RandomForestRegressor(n_estimators=100, random_state=42), NUM1, CAT1),
    'XGBoost':           make_reg_pipeline(XGBRegressor(n_estimators=100, random_state=42, verbosity=0), NUM1, CAT1),
    'LightGBM':          make_reg_pipeline(LGBMRegressor(n_estimators=100, random_state=42, verbose=-1), NUM1, CAT1),
}

print('\nComparaison algorithmes :')
res1 = compare_regressors(pipes1, X1, y1)
best1_name = max(res1, key=lambda k: res1[k]['R2'])
print(f'\n-> Meilleur modèle : {best1_name} (R2={res1[best1_name]["R2"]:.4f})')

best1_pipe = pipes1[best1_name]
best1_pipe.fit(X1, y1)
joblib.dump(best1_pipe, 'models/model_reussite.pkl')
print('models/model_reussite.pkl sauvegardé.')

# ══════════════════════════════════════════════════════════════════════════════
# M2 — Étudiants à risque (Classification)
# ══════════════════════════════════════════════════════════════════════════════
print('\n' + '='*60)
print('M2 — Étudiants à risque (Classification)')
print('='*60)

df2 = pd.read_csv('dataset_risque.csv')
TARGET2 = 'a_risque'
DROP2   = ['etudiant_id', TARGET2]
NUM2    = ['moy_semestre_prec', 'note_cc1', 'note_cc2', 'note_cc3',
           'taux_absence', 'nb_echecs_anterieurs', 'evolution_notes', 'participation']
CAT2    = ['niveau', 'filiere']

X2 = df2.drop(columns=DROP2)
y2 = df2[TARGET2]
print(f'Répartition : {(y2==1).sum()} à risque / {(y2==0).sum()} pas à risque')

# Poids pour gérer le déséquilibre
scale_pos = (y2 == 0).sum() / (y2 == 1).sum()

pipes2 = {
    'LogisticRegression': make_clf_pipeline(LogisticRegression(class_weight='balanced', max_iter=500, random_state=42), NUM2, CAT2),
    'RandomForest':       make_clf_pipeline(RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42), NUM2, CAT2),
    'XGBoost':            make_clf_pipeline(XGBClassifier(n_estimators=100, scale_pos_weight=scale_pos, random_state=42, verbosity=0, eval_metric='logloss'), NUM2, CAT2),
    'LightGBM':           make_clf_pipeline(LGBMClassifier(n_estimators=100, class_weight='balanced', random_state=42, verbose=-1), NUM2, CAT2),
}

print('\nComparaison algorithmes (tri par Recall) :')
res2 = compare_classifiers(pipes2, X2, y2)
best2_name = max(res2, key=lambda k: res2[k]['Recall'])
print(f'\n-> Meilleur modèle : {best2_name} (Recall={res2[best2_name]["Recall"]:.4f})')

best2_pipe = pipes2[best2_name]
best2_pipe.fit(X2, y2)
joblib.dump(best2_pipe, 'models/model_risque.pkl')
print('models/model_risque.pkl sauvegardé.')

# ══════════════════════════════════════════════════════════════════════════════
# M3 — Performance future (Régression)
# ══════════════════════════════════════════════════════════════════════════════
print('\n' + '='*60)
print('M3 — Performance future (Régression)')
print('='*60)

df3 = pd.read_csv('dataset_performance.csv')
TARGET3 = 'moyenne_finale'
DROP3   = ['etudiant_id', TARGET3]
NUM3    = ['moy_semestre_prec', 'note_cc1', 'note_cc2', 'note_cc3',
           'taux_absence_actuel', 'pente_evolution', 'nb_matieres_sous_10', 'ratio_notes_obtenues']
CAT3    = ['niveau', 'filiere']

X3 = df3.drop(columns=DROP3)
y3 = df3[TARGET3]

pipes3 = {
    'LinearRegression': make_reg_pipeline(LinearRegression(), NUM3, CAT3),
    'RandomForest':     make_reg_pipeline(RandomForestRegressor(n_estimators=100, random_state=42), NUM3, CAT3),
    'XGBoost':          make_reg_pipeline(XGBRegressor(n_estimators=100, random_state=42, verbosity=0), NUM3, CAT3),
    'LightGBM':         make_reg_pipeline(LGBMRegressor(n_estimators=100, random_state=42, verbose=-1), NUM3, CAT3),
}

print('\nComparaison algorithmes :')
res3 = compare_regressors(pipes3, X3, y3)
best3_name = max(res3, key=lambda k: res3[k]['R2'])
print(f'\n-> Meilleur modèle : {best3_name} (R2={res3[best3_name]["R2"]:.4f})')

best3_pipe = pipes3[best3_name]
best3_pipe.fit(X3, y3)
joblib.dump(best3_pipe, 'models/model_performance.pkl')
print('models/model_performance.pkl sauvegardé.')

print('\n' + '='*60)
print('Entraînement terminé — 3 modèles dans models/')
print('='*60)
