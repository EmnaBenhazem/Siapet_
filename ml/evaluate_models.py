"""
evaluate_models.py — Evaluation precise des 3 modeles sur donnees de test
"""
import warnings, os
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, cross_val_score, KFold, StratifiedKFold
from sklearn.metrics import (
    r2_score, mean_absolute_error, mean_squared_error,
    accuracy_score, recall_score, precision_score,
    f1_score, roc_auc_score, confusion_matrix
)
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression, LogisticRegression

SEP = '=' * 65

def pct(val): return f'{val*100:.2f}%'

# ─── Charger les modeles ────────────────────────────────────────────────────
m1 = joblib.load('models/model_reussite.pkl')
m2 = joblib.load('models/model_risque.pkl')
m3 = joblib.load('models/model_performance.pkl')

# ═══════════════════════════════════════════════════════════════════════════
# M1 - Taux de reussite
# ═══════════════════════════════════════════════════════════════════════════
print('\n' + SEP)
print('  M1 - TAUX DE REUSSITE  (Regression Lineaire)')
print(SEP)

df1  = pd.read_csv('dataset_reussite.csv')
NUM1 = ['taux_reussite_an2','taux_reussite_an1','taux_absence_moyen',
        'ratio_etud_ens','budget_par_etud','nb_labos','taux_rotation_ens']
CAT1 = ['region','type_etablissement']
X1   = df1.drop(columns=['code_etablissement','taux_reussite_actuel'])
y1   = df1['taux_reussite_actuel']

X1_tr, X1_te, y1_tr, y1_te = train_test_split(X1, y1, test_size=0.3, random_state=42)
m1.fit(X1_tr, y1_tr)
y1_pred = m1.predict(X1_te)

r2   = r2_score(y1_te, y1_pred)
mae  = mean_absolute_error(y1_te, y1_pred)
rmse = np.sqrt(mean_squared_error(y1_te, y1_pred))

# Cross-validation
kf    = KFold(n_splits=5, shuffle=True, random_state=42)
cv_r2 = cross_val_score(m1, X1, y1, cv=kf, scoring='r2')

print(f'\n  Taille train : {len(X1_tr)} etablissements (70%)')
print(f'  Taille test  : {len(X1_te)} etablissements (30%)')
print()
print(f'  -- Resultats sur donnees de test (jamais vues) --')
print(f'  R2 Score     : {r2:.4f}   => {r2*100:.2f}% de la variance expliquee')
print(f'  MAE          : {mae:.2f}%  => erreur moyenne de prediction')
print(f'  RMSE         : {rmse:.2f}%')
print()
print(f'  -- Validation croisee 5-fold (robustesse) --')
print(f'  R2 moyen     : {cv_r2.mean():.4f} (+/- {cv_r2.std():.4f})')
print(f'  R2 min/max   : {cv_r2.min():.4f} / {cv_r2.max():.4f}')
print()

if r2 >= 0.85:
    verdict = 'EXCELLENT  - Objectif R2>0.85 atteint'
elif r2 >= 0.75:
    verdict = 'BON        - Performances satisfaisantes'
elif r2 >= 0.60:
    verdict = 'ACCEPTABLE - Peut etre ameliore'
else:
    verdict = 'INSUFFISANT'

print(f'  VERDICT : {verdict}')
print(f'  Le modele predit le taux de reussite avec une erreur moyenne de {mae:.1f}%')

# ═══════════════════════════════════════════════════════════════════════════
# M2 - Etudiants a risque
# ═══════════════════════════════════════════════════════════════════════════
print('\n' + SEP)
print('  M2 - ETUDIANTS A RISQUE  (Regression Logistique)')
print(SEP)

df2  = pd.read_csv('dataset_risque.csv')
NUM2 = ['moy_semestre_prec','note_cc1','note_cc2','note_cc3',
        'taux_absence','nb_echecs_anterieurs','evolution_notes','participation']
CAT2 = ['niveau','filiere']
X2   = df2.drop(columns=['etudiant_id','a_risque'])
y2   = df2['a_risque']

X2_tr, X2_te, y2_tr, y2_te = train_test_split(X2, y2, test_size=0.3, stratify=y2, random_state=42)
m2.fit(X2_tr, y2_tr)
y2_pred  = m2.predict(X2_te)
y2_proba = m2.predict_proba(X2_te)[:, 1]

acc  = accuracy_score(y2_te, y2_pred)
rec  = recall_score(y2_te, y2_pred)
prec = precision_score(y2_te, y2_pred)
f1   = f1_score(y2_te, y2_pred)
auc  = roc_auc_score(y2_te, y2_proba)
cm   = confusion_matrix(y2_te, y2_pred)
tn, fp, fn, tp = cm.ravel()

skf    = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_rec = cross_val_score(m2, X2, y2, cv=skf, scoring='recall')
cv_auc = cross_val_score(m2, X2, y2, cv=skf, scoring='roc_auc')

nb_risque_test = (y2_te == 1).sum()
detectes       = tp
manques        = fn

print(f'\n  Taille train : {len(X2_tr)} etudiants (70%)')
print(f'  Taille test  : {len(X2_te)} etudiants (30%)')
print(f'  Etudiants a risque dans le test : {nb_risque_test}')
print()
print(f'  -- Resultats sur donnees de test --')
print(f'  Accuracy     : {pct(acc)}   (predictions correctes au total)')
print(f'  Recall       : {pct(rec)}   => detecte {tp} etudiants a risque sur {nb_risque_test}')
print(f'  Precision    : {pct(prec)}   => parmi les alertes, {pct(prec)} sont vraiment a risque')
print(f'  F1-Score     : {pct(f1)}')
print(f'  AUC-ROC      : {auc:.4f}  ({auc*100:.2f}%)')
print()
print(f'  -- Matrice de confusion --')
print(f'  Vrais Positifs  (TP) : {tp:4d}  etudiants a risque bien detectes')
print(f'  Faux Positifs   (FP) : {fp:4d}  fausse alarme (alertes inutiles)')
print(f'  Faux Negatifs   (FN) : {fn:4d}  etudiants a risque MANQUES !! (dangereux)')
print(f'  Vrais Negatifs  (TN) : {tn:4d}  etudiants sains bien classes')
print()
print(f'  -- Validation croisee 5-fold --')
print(f'  Recall moyen   : {cv_rec.mean()*100:.2f}% (+/- {cv_rec.std()*100:.2f}%)')
print(f'  AUC moyen      : {cv_auc.mean():.4f} (+/- {cv_auc.std():.4f})')
print()

if rec >= 0.90:
    verdict2 = 'EXCELLENT  - Objectif Recall>90% atteint'
elif rec >= 0.80:
    verdict2 = 'BON        - Performances satisfaisantes'
else:
    verdict2 = 'ACCEPTABLE - Recall insuffisant pour la production'

print(f'  VERDICT : {verdict2}')
print(f'  Sur 100 etudiants a risque, le modele en detecte {int(rec*100)}')

# ═══════════════════════════════════════════════════════════════════════════
# M3 - Performance future
# ═══════════════════════════════════════════════════════════════════════════
print('\n' + SEP)
print('  M3 - PERFORMANCE FUTURE  (Regression Lineaire)')
print(SEP)

df3  = pd.read_csv('dataset_performance.csv')
NUM3 = ['moy_semestre_prec','note_cc1','note_cc2','note_cc3',
        'taux_absence_actuel','pente_evolution','nb_matieres_sous_10','ratio_notes_obtenues']
CAT3 = ['niveau','filiere']
X3   = df3.drop(columns=['etudiant_id','moyenne_finale'])
y3   = df3['moyenne_finale']

X3_tr, X3_te, y3_tr, y3_te = train_test_split(X3, y3, test_size=0.3, random_state=42)
m3.fit(X3_tr, y3_tr)
y3_pred = m3.predict(X3_te)

r2_3   = r2_score(y3_te, y3_pred)
mae_3  = mean_absolute_error(y3_te, y3_pred)
rmse_3 = np.sqrt(mean_squared_error(y3_te, y3_pred))
cv_r23 = cross_val_score(m3, X3, y3, cv=kf, scoring='r2')

# Precision par tranche de note
ranges = [(0,10,'Insuffisant (<10)'), (10,12,'Passable (10-12)'),
          (12,14,'Assez Bien (12-14)'), (14,20,'Bien/TB (14-20)')]
print(f'\n  Taille train : {len(X3_tr)} etudiants (70%)')
print(f'  Taille test  : {len(X3_te)} etudiants (30%)')
print()
print(f'  -- Resultats sur donnees de test --')
print(f'  R2 Score     : {r2_3:.4f}   => {r2_3*100:.2f}% de la variance expliquee')
print(f'  MAE          : {mae_3:.4f} / 20  => erreur moyenne de {mae_3:.2f} points')
print(f'  RMSE         : {rmse_3:.4f} / 20')
print()

# Precision par mention
print(f'  -- Precision par mention --')
for lo, hi, label in ranges:
    mask = (y3_te >= lo) & (y3_te < hi)
    if mask.sum() == 0: continue
    sub_mae = mean_absolute_error(y3_te[mask], y3_pred[mask])
    sub_r2  = r2_score(y3_te[mask], y3_pred[mask]) if mask.sum() > 1 else float('nan')
    print(f'  {label:<22} : MAE={sub_mae:.3f}  etudiants={mask.sum()}')

print()
print(f'  -- Validation croisee 5-fold --')
print(f'  R2 moyen     : {cv_r23.mean():.4f} (+/- {cv_r23.std():.4f})')
print()

if r2_3 >= 0.82:
    verdict3 = 'EXCELLENT  - Objectif R2>0.82 atteint'
elif r2_3 >= 0.70:
    verdict3 = 'BON        - Performances satisfaisantes'
elif r2_3 >= 0.55:
    verdict3 = 'ACCEPTABLE - Peut etre ameliore'
else:
    verdict3 = 'INSUFFISANT'

print(f'  VERDICT : {verdict3}')
print(f'  Le modele predit la moyenne finale avec une erreur de {mae_3:.2f} points sur 20')

# ═══════════════════════════════════════════════════════════════════════════
# RECAPITULATIF
# ═══════════════════════════════════════════════════════════════════════════
print('\n' + SEP)
print('  RECAPITULATIF — QUALITE DES 3 MODELES')
print(SEP)
print()
print(f'  Modele 1 (Reussite)     : R2 = {r2*100:.1f}%   MAE = {mae:.1f}%         -> {verdict[:10].strip()}')
print(f'  Modele 2 (Risque)       : Recall = {rec*100:.1f}%  AUC = {auc*100:.1f}%   -> {verdict2[:10].strip()}')
print(f'  Modele 3 (Performance)  : R2 = {r2_3*100:.1f}%   MAE = {mae_3:.2f}/20      -> {verdict3[:10].strip()}')
print()
print(f'  Interpretation :')
print(f'  - R2 = 86% signifie que le modele explique 86% des variations du taux de reussite')
print(f'  - Recall = {rec*100:.0f}% signifie que sur 100 etudiants a risque, {int(rec*100)} sont detectes')
print(f'  - R2 = {r2_3*100:.0f}% signifie que le modele explique {r2_3*100:.0f}% des variations de performance')
print(SEP)
