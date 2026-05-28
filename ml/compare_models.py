"""
compare_models.py — Comparaison detaillee des 4 algorithmes par modele
Genere des tableaux CSV + affichage console pour le rapport PFE
"""
import warnings, os
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold, KFold
from xgboost import XGBRegressor, XGBClassifier
from lightgbm import LGBMRegressor, LGBMClassifier

os.makedirs('rapport', exist_ok=True)

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

SEP = '=' * 65

# =============================================================================
# M1 - Taux de reussite (Regression)
# =============================================================================
print('\n' + SEP)
print('  M1 - TAUX DE REUSSITE (Regression)')
print(SEP)

df1   = pd.read_csv('dataset_reussite.csv')
NUM1  = ['taux_reussite_an2','taux_reussite_an1','taux_absence_moyen',
         'ratio_etud_ens','budget_par_etud','nb_labos','taux_rotation_ens']
CAT1  = ['region','type_etablissement']
X1    = df1.drop(columns=['code_etablissement','taux_reussite_actuel'])
y1    = df1['taux_reussite_actuel']
kf    = KFold(n_splits=5, shuffle=True, random_state=42)

algos1 = {
    'Regression Lineaire': make_reg_pipeline(LinearRegression(), NUM1, CAT1),
    'Random Forest':       make_reg_pipeline(RandomForestRegressor(n_estimators=100, random_state=42), NUM1, CAT1),
    'XGBoost':             make_reg_pipeline(XGBRegressor(n_estimators=100, random_state=42, verbosity=0), NUM1, CAT1),
    'LightGBM':            make_reg_pipeline(LGBMRegressor(n_estimators=100, random_state=42, verbose=-1), NUM1, CAT1),
}

rows1 = []
for nom, pipe in algos1.items():
    r2   = cross_val_score(pipe, X1, y1, cv=kf, scoring='r2').mean()
    mae  = -cross_val_score(pipe, X1, y1, cv=kf, scoring='neg_mean_absolute_error').mean()
    rmse = np.sqrt(-cross_val_score(pipe, X1, y1, cv=kf, scoring='neg_mean_squared_error').mean())
    retenu = 'OUI ***' if nom == max(algos1, key=lambda k: cross_val_score(algos1[k], X1, y1, cv=kf, scoring='r2').mean()) else ''
    rows1.append({'Algorithme': nom, 'R2 Score': round(r2,4), 'MAE (%)': round(mae,4), 'RMSE (%)': round(rmse,4), 'Decision': retenu})

df_res1 = pd.DataFrame(rows1).sort_values('R2 Score', ascending=False).reset_index(drop=True)
df_res1.to_csv('rapport/comparaison_m1_reussite.csv', index=False)

print(f'\n  Dataset : {df1.shape[0]} etablissements  |  Target : taux_reussite_actuel (%)')
print(f'  Validation croisee : 5-fold  |  Critere de selection : R2 Score\n')
print(df_res1.to_string(index=False))
print(f'\n  -> Meilleur modele : {df_res1.iloc[0]["Algorithme"]}')
print(f'     R2={df_res1.iloc[0]["R2 Score"]}  MAE={df_res1.iloc[0]["MAE (%)"]}%  RMSE={df_res1.iloc[0]["RMSE (%)"]}%')
print(f'\n  Fichier : rapport/comparaison_m1_reussite.csv')

# =============================================================================
# M2 - Etudiants a risque (Classification)
# =============================================================================
print('\n' + SEP)
print('  M2 - ETUDIANTS A RISQUE (Classification)')
print(SEP)

df2   = pd.read_csv('dataset_risque.csv')
NUM2  = ['moy_semestre_prec','note_cc1','note_cc2','note_cc3',
         'taux_absence','nb_echecs_anterieurs','evolution_notes','participation']
CAT2  = ['niveau','filiere']
X2    = df2.drop(columns=['etudiant_id','a_risque'])
y2    = df2['a_risque']
skf   = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scale = (y2==0).sum() / (y2==1).sum()

algos2 = {
    'Regression Logistique': make_clf_pipeline(LogisticRegression(class_weight='balanced', max_iter=500, random_state=42), NUM2, CAT2),
    'Random Forest':         make_clf_pipeline(RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42), NUM2, CAT2),
    'XGBoost':               make_clf_pipeline(XGBClassifier(n_estimators=100, scale_pos_weight=scale, random_state=42, verbosity=0, eval_metric='logloss'), NUM2, CAT2),
    'LightGBM':              make_clf_pipeline(LGBMClassifier(n_estimators=100, class_weight='balanced', random_state=42, verbose=-1), NUM2, CAT2),
}

rows2 = []
for nom, pipe in algos2.items():
    acc     = cross_val_score(pipe, X2, y2, cv=skf, scoring='accuracy').mean()
    recall  = cross_val_score(pipe, X2, y2, cv=skf, scoring='recall').mean()
    prec    = cross_val_score(pipe, X2, y2, cv=skf, scoring='precision').mean()
    f1      = cross_val_score(pipe, X2, y2, cv=skf, scoring='f1').mean()
    auc     = cross_val_score(pipe, X2, y2, cv=skf, scoring='roc_auc').mean()
    retenu  = 'OUI ***' if nom == max(algos2, key=lambda k: cross_val_score(algos2[k], X2, y2, cv=skf, scoring='recall').mean()) else ''
    rows2.append({
        'Algorithme': nom,
        'Accuracy':   round(acc*100, 2),
        'Recall':     round(recall*100, 2),
        'Precision':  round(prec*100, 2),
        'F1-Score':   round(f1*100, 2),
        'AUC-ROC':    round(auc, 4),
        'Decision':   retenu
    })

df_res2 = pd.DataFrame(rows2).sort_values('Recall', ascending=False).reset_index(drop=True)
df_res2.to_csv('rapport/comparaison_m2_risque.csv', index=False)

print(f'\n  Dataset : {df2.shape[0]} etudiants  |  {y2.sum()} a risque ({y2.mean()*100:.1f}%)  |  {(y2==0).sum()} pas a risque')
print(f'  Validation croisee : 5-fold stratifie  |  Critere de selection : RECALL (prioritaire)\n')
print(df_res2.to_string(index=False))
print(f'\n  -> Meilleur modele : {df_res2.iloc[0]["Algorithme"]}')
print(f'     Recall={df_res2.iloc[0]["Recall"]}%  F1={df_res2.iloc[0]["F1-Score"]}%  AUC={df_res2.iloc[0]["AUC-ROC"]}')
print(f'\n  Fichier : rapport/comparaison_m2_risque.csv')

# =============================================================================
# M3 - Performance future (Regression)
# =============================================================================
print('\n' + SEP)
print('  M3 - PERFORMANCE FUTURE (Regression)')
print(SEP)

df3   = pd.read_csv('dataset_performance.csv')
NUM3  = ['moy_semestre_prec','note_cc1','note_cc2','note_cc3',
         'taux_absence_actuel','pente_evolution','nb_matieres_sous_10','ratio_notes_obtenues']
CAT3  = ['niveau','filiere']
X3    = df3.drop(columns=['etudiant_id','moyenne_finale'])
y3    = df3['moyenne_finale']

algos3 = {
    'Regression Lineaire': make_reg_pipeline(LinearRegression(), NUM3, CAT3),
    'Random Forest':       make_reg_pipeline(RandomForestRegressor(n_estimators=100, random_state=42), NUM3, CAT3),
    'XGBoost':             make_reg_pipeline(XGBRegressor(n_estimators=100, random_state=42, verbosity=0), NUM3, CAT3),
    'LightGBM':            make_reg_pipeline(LGBMRegressor(n_estimators=100, random_state=42, verbose=-1), NUM3, CAT3),
}

rows3 = []
for nom, pipe in algos3.items():
    r2   = cross_val_score(pipe, X3, y3, cv=kf, scoring='r2').mean()
    mae  = -cross_val_score(pipe, X3, y3, cv=kf, scoring='neg_mean_absolute_error').mean()
    rmse = np.sqrt(-cross_val_score(pipe, X3, y3, cv=kf, scoring='neg_mean_squared_error').mean())
    retenu = 'OUI ***' if nom == max(algos3, key=lambda k: cross_val_score(algos3[k], X3, y3, cv=kf, scoring='r2').mean()) else ''
    rows3.append({'Algorithme': nom, 'R2 Score': round(r2,4), 'MAE (/20)': round(mae,4), 'RMSE (/20)': round(rmse,4), 'Decision': retenu})

df_res3 = pd.DataFrame(rows3).sort_values('R2 Score', ascending=False).reset_index(drop=True)
df_res3.to_csv('rapport/comparaison_m3_performance.csv', index=False)

print(f'\n  Dataset : {df3.shape[0]} etudiants  |  Target : moyenne_finale (/20)')
print(f'  Validation croisee : 5-fold  |  Critere de selection : R2 Score\n')
print(df_res3.to_string(index=False))
print(f'\n  -> Meilleur modele : {df_res3.iloc[0]["Algorithme"]}')
print(f'     R2={df_res3.iloc[0]["R2 Score"]}  MAE={df_res3.iloc[0]["MAE (/20)"]}  RMSE={df_res3.iloc[0]["RMSE (/20)"]}')
print(f'\n  Fichier : rapport/comparaison_m3_performance.csv')

print('\n' + SEP)
print('  RECAPITULATIF FINAL')
print(SEP)
print(f'\n  M1 Reussite    : {df_res1.iloc[0]["Algorithme"]:<25} R2={df_res1.iloc[0]["R2 Score"]}')
print(f'  M2 Risque      : {df_res2.iloc[0]["Algorithme"]:<25} Recall={df_res2.iloc[0]["Recall"]}%')
print(f'  M3 Performance : {df_res3.iloc[0]["Algorithme"]:<25} R2={df_res3.iloc[0]["R2 Score"]}')
print(f'\n  3 fichiers CSV sauvegardes dans rapport/')
print(SEP)
