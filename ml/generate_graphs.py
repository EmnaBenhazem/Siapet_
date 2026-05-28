"""
generate_graphs.py — Graphiques pour le rapport PFE SIAPET
Genere 10 graphiques PNG dans rapport/graphs/
"""
import warnings, os
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold, KFold, train_test_split
from sklearn.metrics import (
    confusion_matrix, roc_curve, auc,
    r2_score, mean_absolute_error
)
from xgboost import XGBRegressor, XGBClassifier
from lightgbm import LGBMRegressor, LGBMClassifier

os.makedirs('rapport/graphs', exist_ok=True)

PALETTE  = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444']
FONT_T   = {'fontsize': 14, 'fontweight': 'bold'}
FONT_L   = {'fontsize': 11}
SIAPET   = '#1e40af'

def save(fig, name):
    path = f'rapport/graphs/{name}.png'
    fig.savefig(path, dpi=150, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    print(f'  Sauvegarde : {path}')

def make_reg_pipe(model, num, cat):
    pre = ColumnTransformer([
        ('num', StandardScaler(), num),
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat),
    ])
    return Pipeline([('pre', pre), ('model', model)])

def make_clf_pipe(model, num, cat):
    pre = ColumnTransformer([
        ('num', StandardScaler(), num),
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat),
    ])
    return Pipeline([('pre', pre), ('model', model)])

# ─────────────────────────────────────────────────────────────────────────────
# Donnees
# ─────────────────────────────────────────────────────────────────────────────
df1  = pd.read_csv('dataset_reussite.csv')
NUM1 = ['taux_reussite_an2','taux_reussite_an1','taux_absence_moyen',
        'ratio_etud_ens','budget_par_etud','nb_labos','taux_rotation_ens']
CAT1 = ['region','type_etablissement']
X1   = df1.drop(columns=['code_etablissement','taux_reussite_actuel'])
y1   = df1['taux_reussite_actuel']

df2  = pd.read_csv('dataset_risque.csv')
NUM2 = ['moy_semestre_prec','note_cc1','note_cc2','note_cc3',
        'taux_absence','nb_echecs_anterieurs','evolution_notes','participation']
CAT2 = ['niveau','filiere']
X2   = df2.drop(columns=['etudiant_id','a_risque'])
y2   = df2['a_risque']

df3  = pd.read_csv('dataset_performance.csv')
NUM3 = ['moy_semestre_prec','note_cc1','note_cc2','note_cc3',
        'taux_absence_actuel','pente_evolution','nb_matieres_sous_10','ratio_notes_obtenues']
CAT3 = ['niveau','filiere']
X3   = df3.drop(columns=['etudiant_id','moyenne_finale'])
y3   = df3['moyenne_finale']

scale = (y2==0).sum() / (y2==1).sum()
kf    = KFold(n_splits=5, shuffle=True, random_state=42)
skf   = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

ALGOS_REG1 = {
    'Regression Lineaire': make_reg_pipe(LinearRegression(), NUM1, CAT1),
    'Random Forest':       make_reg_pipe(RandomForestRegressor(n_estimators=100, random_state=42), NUM1, CAT1),
    'XGBoost':             make_reg_pipe(XGBRegressor(n_estimators=100, random_state=42, verbosity=0), NUM1, CAT1),
    'LightGBM':            make_reg_pipe(LGBMRegressor(n_estimators=100, random_state=42, verbose=-1), NUM1, CAT1),
}
ALGOS_CLF = {
    'Reg. Logistique': make_clf_pipe(LogisticRegression(class_weight='balanced', max_iter=500, random_state=42), NUM2, CAT2),
    'Random Forest':   make_clf_pipe(RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42), NUM2, CAT2),
    'XGBoost':         make_clf_pipe(XGBClassifier(n_estimators=100, scale_pos_weight=scale, random_state=42, verbosity=0, eval_metric='logloss'), NUM2, CAT2),
    'LightGBM':        make_clf_pipe(LGBMClassifier(n_estimators=100, class_weight='balanced', random_state=42, verbose=-1), NUM2, CAT2),
}
ALGOS_REG3 = {
    'Regression Lineaire': make_reg_pipe(LinearRegression(), NUM3, CAT3),
    'Random Forest':       make_reg_pipe(RandomForestRegressor(n_estimators=100, random_state=42), NUM3, CAT3),
    'XGBoost':             make_reg_pipe(XGBRegressor(n_estimators=100, random_state=42, verbosity=0), NUM3, CAT3),
    'LightGBM':            make_reg_pipe(LGBMRegressor(n_estimators=100, random_state=42, verbose=-1), NUM3, CAT3),
}

print('\nCalcul des metriques en cours...')

# ═════════════════════════════════════════════════════════════════════════════
# G1 — Comparaison R2 M1
# ═════════════════════════════════════════════════════════════════════════════
print('\n[1/10] Comparaison R2 — M1 Reussite')
names1, r2s1, maes1 = [], [], []
for nom, pipe in ALGOS_REG1.items():
    r2  = cross_val_score(pipe, X1, y1, cv=kf, scoring='r2').mean()
    mae = -cross_val_score(pipe, X1, y1, cv=kf, scoring='neg_mean_absolute_error').mean()
    names1.append(nom); r2s1.append(r2); maes1.append(mae)

fig, axes = plt.subplots(1, 2, figsize=(13, 5))
fig.suptitle('M1 — Taux de Reussite : Comparaison des Algorithmes', **FONT_T, color=SIAPET)

bars = axes[0].barh(names1, r2s1, color=PALETTE, edgecolor='white', height=0.55)
axes[0].set_xlabel('R² Score', **FONT_L)
axes[0].set_title('R² Score (plus haut = meilleur)', fontsize=12)
axes[0].axvline(0.85, color='gray', linestyle='--', linewidth=1, label='Cible R²>0.85')
axes[0].legend(fontsize=9)
for bar, val in zip(bars, r2s1):
    axes[0].text(val + 0.005, bar.get_y() + bar.get_height()/2,
                 f'{val:.4f}', va='center', fontsize=10, fontweight='bold')
axes[0].set_xlim(0, 1)

bars2 = axes[1].barh(names1, maes1, color=PALETTE, edgecolor='white', height=0.55)
axes[1].set_xlabel('MAE (%)', **FONT_L)
axes[1].set_title('MAE — Erreur absolue moyenne (plus bas = meilleur)', fontsize=12)
for bar, val in zip(bars2, maes1):
    axes[1].text(val + 0.05, bar.get_y() + bar.get_height()/2,
                 f'{val:.2f}%', va='center', fontsize=10, fontweight='bold')

plt.tight_layout()
save(fig, 'G1_M1_comparaison_algorithmes')

# ═════════════════════════════════════════════════════════════════════════════
# G2 — Comparaison Recall M2
# ═════════════════════════════════════════════════════════════════════════════
print('[2/10] Comparaison Recall — M2 Risque')
names2, recalls, f1s, accs, aucs2 = [], [], [], [], []
for nom, pipe in ALGOS_CLF.items():
    rec = cross_val_score(pipe, X2, y2, cv=skf, scoring='recall').mean()
    f1  = cross_val_score(pipe, X2, y2, cv=skf, scoring='f1').mean()
    acc = cross_val_score(pipe, X2, y2, cv=skf, scoring='accuracy').mean()
    au  = cross_val_score(pipe, X2, y2, cv=skf, scoring='roc_auc').mean()
    names2.append(nom); recalls.append(rec); f1s.append(f1); accs.append(acc); aucs2.append(au)

fig, axes = plt.subplots(1, 2, figsize=(13, 5))
fig.suptitle('M2 — Etudiants a Risque : Comparaison des Algorithmes', **FONT_T, color=SIAPET)

bars = axes[0].barh(names2, [r*100 for r in recalls], color=PALETTE, edgecolor='white', height=0.55)
axes[0].set_xlabel('Recall (%)', **FONT_L)
axes[0].set_title('Recall — Critere prioritaire (plus haut = meilleur)', fontsize=12)
axes[0].axvline(90, color='gray', linestyle='--', linewidth=1, label='Cible Recall>90%')
axes[0].legend(fontsize=9)
for bar, val in zip(bars, recalls):
    axes[0].text(val*100 + 0.5, bar.get_y() + bar.get_height()/2,
                 f'{val*100:.2f}%', va='center', fontsize=10, fontweight='bold')
axes[0].set_xlim(0, 110)

x = np.arange(len(names2))
w = 0.25
axes[1].bar(x - w, [a*100 for a in accs], w, label='Accuracy', color='#3b82f6')
axes[1].bar(x,     [f*100 for f in f1s],  w, label='F1-Score',  color='#22c55e')
axes[1].bar(x + w, [a*100 for a in aucs2],w, label='AUC-ROC',   color='#f59e0b')
axes[1].set_xticks(x); axes[1].set_xticklabels(names2, rotation=15, ha='right', fontsize=9)
axes[1].set_ylabel('%'); axes[1].set_title('Accuracy / F1 / AUC-ROC', fontsize=12)
axes[1].legend(fontsize=9); axes[1].set_ylim(0, 115)

plt.tight_layout()
save(fig, 'G2_M2_comparaison_algorithmes')

# ═════════════════════════════════════════════════════════════════════════════
# G3 — Comparaison R2 M3
# ═════════════════════════════════════════════════════════════════════════════
print('[3/10] Comparaison R2 — M3 Performance')
names3, r2s3, maes3 = [], [], []
for nom, pipe in ALGOS_REG3.items():
    r2  = cross_val_score(pipe, X3, y3, cv=kf, scoring='r2').mean()
    mae = -cross_val_score(pipe, X3, y3, cv=kf, scoring='neg_mean_absolute_error').mean()
    names3.append(nom); r2s3.append(r2); maes3.append(mae)

fig, axes = plt.subplots(1, 2, figsize=(13, 5))
fig.suptitle('M3 — Performance Future : Comparaison des Algorithmes', **FONT_T, color=SIAPET)

bars = axes[0].barh(names3, r2s3, color=PALETTE, edgecolor='white', height=0.55)
axes[0].set_xlabel('R² Score', **FONT_L)
axes[0].set_title('R² Score (plus haut = meilleur)', fontsize=12)
axes[0].axvline(0.72, color='gray', linestyle='--', linewidth=1, label='Cible R²>0.72')
axes[0].legend(fontsize=9)
for bar, val in zip(bars, r2s3):
    axes[0].text(val + 0.005, bar.get_y() + bar.get_height()/2,
                 f'{val:.4f}', va='center', fontsize=10, fontweight='bold')
axes[0].set_xlim(0, 1)

bars2 = axes[1].barh(names3, maes3, color=PALETTE, edgecolor='white', height=0.55)
axes[1].set_xlabel('MAE (/20)', **FONT_L)
axes[1].set_title('MAE — Erreur absolue moyenne (plus bas = meilleur)', fontsize=12)
for bar, val in zip(bars2, maes3):
    axes[1].text(val + 0.005, bar.get_y() + bar.get_height()/2,
                 f'{val:.4f}', va='center', fontsize=10, fontweight='bold')

plt.tight_layout()
save(fig, 'G3_M3_comparaison_algorithmes')

# ═════════════════════════════════════════════════════════════════════════════
# G4 — Matrice de confusion M2
# ═════════════════════════════════════════════════════════════════════════════
print('[4/10] Matrice de confusion — M2')
X2_tr, X2_te, y2_tr, y2_te = train_test_split(X2, y2, test_size=0.3, stratify=y2, random_state=42)
best_clf = make_clf_pipe(LogisticRegression(class_weight='balanced', max_iter=500, random_state=42), NUM2, CAT2)
best_clf.fit(X2_tr, y2_tr)
y2_pred = best_clf.predict(X2_te)
cm = confusion_matrix(y2_te, y2_pred)

fig, ax = plt.subplots(figsize=(7, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax,
            xticklabels=['Pas a risque','A risque'],
            yticklabels=['Pas a risque','A risque'],
            linewidths=0.5, linecolor='white',
            annot_kws={'size': 16, 'weight': 'bold'})
ax.set_title('M2 — Matrice de Confusion\nRegression Logistique (test 30%)', **FONT_T, color=SIAPET)
ax.set_xlabel('Prediction', fontsize=12); ax.set_ylabel('Reel', fontsize=12)

tn, fp, fn, tp = cm.ravel()
recall_val   = tp / (tp + fn) * 100
precision_val= tp / (tp + fp) * 100
ax.text(1.02, 0.5,
        f'Vrais Positifs (TP): {tp}\nFaux Positifs (FP): {fp}\nFaux Negatifs (FN): {fn}\nVrais Negatifs (TN): {tn}\n\nRecall  : {recall_val:.1f}%\nPrecision: {precision_val:.1f}%',
        transform=ax.transAxes, fontsize=10,
        bbox=dict(boxstyle='round', facecolor='#eff6ff', edgecolor='#3b82f6'))

plt.tight_layout()
save(fig, 'G4_M2_matrice_confusion')

# ═════════════════════════════════════════════════════════════════════════════
# G5 — Courbe ROC M2 (tous algorithmes)
# ═════════════════════════════════════════════════════════════════════════════
print('[5/10] Courbe ROC — M2 (4 algorithmes)')
X2_tr2, X2_te2, y2_tr2, y2_te2 = train_test_split(X2, y2, test_size=0.3, stratify=y2, random_state=42)

fig, ax = plt.subplots(figsize=(8, 7))
colors_roc = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444']
for (nom, pipe), col in zip(ALGOS_CLF.items(), colors_roc):
    pipe.fit(X2_tr2, y2_tr2)
    y_prob = pipe.predict_proba(X2_te2)[:, 1]
    fpr, tpr, _ = roc_curve(y2_te2, y_prob)
    roc_auc = auc(fpr, tpr)
    ax.plot(fpr, tpr, color=col, linewidth=2.5, label=f'{nom} (AUC={roc_auc:.4f})')

ax.plot([0,1],[0,1], 'k--', linewidth=1.2, label='Aleatoire (AUC=0.50)')
ax.fill_between([0,1],[0,1], alpha=0.05, color='gray')
ax.set_xlabel('Taux de Faux Positifs (FPR)', fontsize=12)
ax.set_ylabel('Taux de Vrais Positifs (TPR / Recall)', fontsize=12)
ax.set_title('M2 — Courbes ROC\nComparaison des 4 algorithmes', **FONT_T, color=SIAPET)
ax.legend(loc='lower right', fontsize=10)
ax.set_xlim([0, 1]); ax.set_ylim([0, 1.02])
ax.grid(True, alpha=0.3)

save(fig, 'G5_M2_courbe_ROC')

# ═════════════════════════════════════════════════════════════════════════════
# G6 — Importance des features M2
# ═════════════════════════════════════════════════════════════════════════════
print('[6/10] Importance des features — M2')
# Utiliser Random Forest pour avoir feature_importances_ interpretables
rf_clf = make_clf_pipe(RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=42), NUM2, CAT2)
rf_clf.fit(X2, y2)

pre   = rf_clf.named_steps['pre']
model = rf_clf.named_steps['model']
ohe_features = pre.named_transformers_['cat'].get_feature_names_out(CAT2).tolist()
all_features  = NUM2 + ohe_features
importances   = model.feature_importances_

feat_df = pd.DataFrame({'feature': all_features, 'importance': importances})
feat_df = feat_df.groupby('feature')['importance'].sum().reset_index()
feat_df = feat_df.sort_values('importance', ascending=True).tail(10)

fig, ax = plt.subplots(figsize=(9, 6))
colors_feat = ['#ef4444' if imp > feat_df['importance'].quantile(0.75) else '#3b82f6'
               for imp in feat_df['importance']]
bars = ax.barh(feat_df['feature'], feat_df['importance'], color=colors_feat, edgecolor='white', height=0.6)
for bar, val in zip(bars, feat_df['importance']):
    ax.text(val + 0.001, bar.get_y() + bar.get_height()/2,
            f'{val:.4f}', va='center', fontsize=9)
ax.set_xlabel('Importance (Gini)', fontsize=12)
ax.set_title('M2 — Importance des Variables\n(Random Forest — Top 10)', **FONT_T, color=SIAPET)
red_patch  = mpatches.Patch(color='#ef4444', label='Impact majeur')
blue_patch = mpatches.Patch(color='#3b82f6', label='Impact modere')
ax.legend(handles=[red_patch, blue_patch], fontsize=10)
ax.grid(axis='x', alpha=0.3)

save(fig, 'G6_M2_importance_features')

# ═════════════════════════════════════════════════════════════════════════════
# G7 — Importance des features M1
# ═════════════════════════════════════════════════════════════════════════════
print('[7/10] Importance des features — M1')
rf_reg1 = make_reg_pipe(RandomForestRegressor(n_estimators=200, random_state=42), NUM1, CAT1)
rf_reg1.fit(X1, y1)
pre1   = rf_reg1.named_steps['pre']
ohe1   = pre1.named_transformers_['cat'].get_feature_names_out(CAT1).tolist()
all1   = NUM1 + ohe1
imp1   = rf_reg1.named_steps['model'].feature_importances_
fd1    = pd.DataFrame({'feature': all1, 'importance': imp1})
fd1    = fd1.groupby('feature')['importance'].sum().reset_index().sort_values('importance', ascending=True).tail(10)

fig, ax = plt.subplots(figsize=(9, 6))
colors_f1 = ['#ef4444' if v > fd1['importance'].quantile(0.75) else '#3b82f6' for v in fd1['importance']]
bars = ax.barh(fd1['feature'], fd1['importance'], color=colors_f1, edgecolor='white', height=0.6)
for bar, val in zip(bars, fd1['importance']):
    ax.text(val + 0.001, bar.get_y() + bar.get_height()/2, f'{val:.4f}', va='center', fontsize=9)
ax.set_xlabel('Importance (Gini)', fontsize=12)
ax.set_title('M1 — Importance des Variables\n(Random Forest — Top 10)', **FONT_T, color=SIAPET)
ax.legend(handles=[mpatches.Patch(color='#ef4444', label='Impact majeur'),
                   mpatches.Patch(color='#3b82f6', label='Impact modere')], fontsize=10)
ax.grid(axis='x', alpha=0.3)
save(fig, 'G7_M1_importance_features')

# ═════════════════════════════════════════════════════════════════════════════
# G8 — Residus M1 (predit vs reel)
# ═════════════════════════════════════════════════════════════════════════════
print('[8/10] Residus — M1')
X1_tr, X1_te, y1_tr, y1_te = train_test_split(X1, y1, test_size=0.3, random_state=42)
lr1 = make_reg_pipe(LinearRegression(), NUM1, CAT1)
lr1.fit(X1_tr, y1_tr)
y1_pred = lr1.predict(X1_te)
residus  = y1_te.values - y1_pred
r2_test  = r2_score(y1_te, y1_pred)
mae_test = mean_absolute_error(y1_te, y1_pred)

fig, axes = plt.subplots(1, 2, figsize=(13, 5))
fig.suptitle('M1 — Analyse des Residus (Regression Lineaire)', **FONT_T, color=SIAPET)

axes[0].scatter(y1_pred, y1_te, alpha=0.6, color='#3b82f6', edgecolors='white', linewidth=0.5, s=60)
mn = min(y1_pred.min(), y1_te.min()); mx = max(y1_pred.max(), y1_te.max())
axes[0].plot([mn,mx],[mn,mx],'r--', linewidth=2, label='Prediction parfaite')
axes[0].set_xlabel('Valeurs Predites (%)', fontsize=11)
axes[0].set_ylabel('Valeurs Reelles (%)', fontsize=11)
axes[0].set_title(f'Predit vs Reel  |  R²={r2_test:.4f}', fontsize=12)
axes[0].legend(fontsize=10)

axes[1].hist(residus, bins=20, color='#3b82f6', edgecolor='white', alpha=0.85)
axes[1].axvline(0, color='red', linestyle='--', linewidth=2, label='Erreur = 0')
axes[1].set_xlabel('Residu (Reel - Predit)', fontsize=11)
axes[1].set_ylabel('Nombre', fontsize=11)
axes[1].set_title(f'Distribution des Residus  |  MAE={mae_test:.2f}%', fontsize=12)
axes[1].legend(fontsize=10)

plt.tight_layout()
save(fig, 'G8_M1_residus')

# ═════════════════════════════════════════════════════════════════════════════
# G9 — Residus M3
# ═════════════════════════════════════════════════════════════════════════════
print('[9/10] Residus — M3')
X3_tr, X3_te, y3_tr, y3_te = train_test_split(X3, y3, test_size=0.3, random_state=42)
lr3 = make_reg_pipe(LinearRegression(), NUM3, CAT3)
lr3.fit(X3_tr, y3_tr)
y3_pred  = lr3.predict(X3_te)
residus3 = y3_te.values - y3_pred
r2_t3    = r2_score(y3_te, y3_pred)
mae_t3   = mean_absolute_error(y3_te, y3_pred)

fig, axes = plt.subplots(1, 2, figsize=(13, 5))
fig.suptitle('M3 — Analyse des Residus (Regression Lineaire)', **FONT_T, color=SIAPET)

axes[0].scatter(y3_pred, y3_te, alpha=0.5, color='#22c55e', edgecolors='white', linewidth=0.5, s=40)
mn3 = min(y3_pred.min(), y3_te.min()); mx3 = max(y3_pred.max(), y3_te.max())
axes[0].plot([mn3,mx3],[mn3,mx3],'r--', linewidth=2, label='Prediction parfaite')
axes[0].set_xlabel('Valeurs Predites (/20)', fontsize=11)
axes[0].set_ylabel('Valeurs Reelles (/20)', fontsize=11)
axes[0].set_title(f'Predit vs Reel  |  R²={r2_t3:.4f}', fontsize=12)
axes[0].legend(fontsize=10)

axes[1].hist(residus3, bins=25, color='#22c55e', edgecolor='white', alpha=0.85)
axes[1].axvline(0, color='red', linestyle='--', linewidth=2, label='Erreur = 0')
axes[1].set_xlabel('Residu (Reel - Predit)', fontsize=11)
axes[1].set_ylabel('Nombre', fontsize=11)
axes[1].set_title(f'Distribution des Residus  |  MAE={mae_t3:.4f}/20', fontsize=12)
axes[1].legend(fontsize=10)

plt.tight_layout()
save(fig, 'G9_M3_residus')

# ═════════════════════════════════════════════════════════════════════════════
# G10 — Synthese finale (tableau visuel des 3 modeles)
# ═════════════════════════════════════════════════════════════════════════════
print('[10/10] Synthese finale')
fig, ax = plt.subplots(figsize=(13, 5))
ax.axis('off')
fig.suptitle('SIAPET — Synthese des 3 Modeles ML', fontsize=16, fontweight='bold', color=SIAPET, y=1.02)

data_table = [
    ['', 'M1 — Taux de Reussite', 'M2 — Etudiants a Risque', 'M3 — Performance Future'],
    ['Type', 'Regression', 'Classification', 'Regression'],
    ['Algorithme retenu', 'Regression Lineaire', 'Regression Logistique', 'Regression Lineaire'],
    ['Dataset', '200 etablissements', '3000 etudiants (10.5% risque)', '3000 etudiants'],
    ['Metrique cle', 'R² = 0.8619', 'Recall = 93.97%', 'R² = 0.7243'],
    ['MAE', '2.63%', 'F1 = 68.50%', '0.80 / 20'],
    ['AUC-ROC', '—', '0.9741', '—'],
    ['Route FastAPI', '/predict/reussite', '/predict/risque', '/predict/performance'],
]

col_colors = [['#1e40af']*4] + [['#f0f9ff', '#dbeafe', '#bfdbfe', '#93c5fd']] * (len(data_table)-1)
col_colors[0] = ['#1e40af', '#1e40af', '#1e40af', '#1e40af']

table = ax.table(
    cellText=data_table,
    cellLoc='center',
    loc='center',
    bbox=[0, 0, 1, 1]
)
table.auto_set_font_size(False)
table.set_fontsize(10)

for (row, col), cell in table.get_celld().items():
    cell.set_edgecolor('white')
    if row == 0:
        cell.set_facecolor('#1e40af')
        cell.set_text_props(color='white', fontweight='bold')
    elif col == 0:
        cell.set_facecolor('#e0e7ff')
        cell.set_text_props(fontweight='bold', color='#1e40af')
    elif row % 2 == 0:
        cell.set_facecolor('#f0f9ff')
    else:
        cell.set_facecolor('#ffffff')

plt.tight_layout()
save(fig, 'G10_synthese_finale')

# ─────────────────────────────────────────────────────────────────────────────
print('\n' + '='*60)
print('10 graphiques generes dans rapport/graphs/')
print('='*60)
files = sorted(os.listdir('rapport/graphs'))
for f in files:
    size = os.path.getsize(f'rapport/graphs/{f}') // 1024
    print(f'  {f:<45} {size} Ko')
