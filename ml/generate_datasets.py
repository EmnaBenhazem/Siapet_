import numpy as np
import pandas as pd

rng = np.random.default_rng(42)

# ── M1 : dataset_reussite.csv — 200 établissements ────────────────────────────
regions = ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabes',
           'Ariana', 'Gafsa', 'Monastir', 'Beja', 'Nabeul', 'Jendouba']
types   = ['Faculté', 'École', 'Institut', 'ISET']

n = 200
an2  = rng.uniform(50, 90, n)
an1  = an2 + rng.normal(1, 5, n)
an1  = np.clip(an1, 40, 95)
abs_ = rng.uniform(5, 30, n)
ratio= rng.uniform(15, 45, n)
budget= rng.integers(1500, 8000, n)
labos = rng.integers(1, 20, n)
rot   = rng.uniform(5, 30, n)

taux_actuel = (
    0.70 * an1
    + 0.28 * an2
    - 0.18 * abs_
    - 0.04 * ratio
    + 0.001 * budget
    + 0.15 * labos
    - 0.06 * rot
    + rng.normal(0, 2.5, n)
)
taux_actuel = np.clip(taux_actuel, 40, 98).round(2)

df1 = pd.DataFrame({
    'code_etablissement': [f'ETB{i+1:03d}' for i in range(n)],
    'type_etablissement': rng.choice(types, n),
    'region':             rng.choice(regions, n),
    'taux_reussite_an2':  an2.round(2),
    'taux_reussite_an1':  an1.round(2),
    'taux_absence_moyen': abs_.round(2),
    'ratio_etud_ens':     ratio.round(2),
    'budget_par_etud':    budget,
    'nb_labos':           labos,
    'taux_rotation_ens':  rot.round(2),
    'taux_reussite_actuel': taux_actuel,
})
df1.to_csv('dataset_reussite.csv', index=False)
print(f'M1 dataset_reussite.csv OK: {df1.shape}')

# ── M2 : dataset_risque.csv — 3000 étudiants ──────────────────────────────────
niveaux  = ['L1', 'L2', 'L3', 'M1', 'M2']
filieres = ['Informatique', 'Gestion', 'Droit', 'Médecine', 'Ingénierie']

n = 3000
moy_prec   = rng.uniform(6, 19, n)
cc1        = rng.uniform(5, 19, n)
cc2        = cc1 + rng.normal(0.2, 1.5, n)
cc3        = cc2 + rng.normal(0.3, 1.5, n)
cc2        = np.clip(cc2, 0, 20)
cc3        = np.clip(cc3, 0, 20)
taux_abs   = rng.uniform(0, 40, n)
echecs     = rng.integers(0, 5, n)
evolution  = cc3 - cc1
particip   = rng.uniform(0, 10, n)

score_risque = (
    -0.40 * moy_prec
    - 0.30 * ((cc1 + cc2 + cc3) / 3)
    + 0.35 * taux_abs
    + 0.25 * echecs
    - 0.15 * evolution
    - 0.10 * particip
    + rng.normal(0, 1.5, n)
)
# ~10.5% à risque
threshold = np.percentile(score_risque, 89.5)
a_risque  = (score_risque >= threshold).astype(int)

df2 = pd.DataFrame({
    'etudiant_id':          [f'ETU{i+1:05d}' for i in range(n)],
    'niveau':               rng.choice(niveaux, n),
    'filiere':              rng.choice(filieres, n),
    'moy_semestre_prec':    moy_prec.round(2),
    'note_cc1':             cc1.round(2),
    'note_cc2':             cc2.round(2),
    'note_cc3':             cc3.round(2),
    'taux_absence':         taux_abs.round(2),
    'nb_echecs_anterieurs': echecs,
    'evolution_notes':      evolution.round(2),
    'participation':        particip.round(2),
    'a_risque':             a_risque,
})
df2.to_csv('dataset_risque.csv', index=False)
print(f'M2 dataset_risque.csv OK: {df2.shape} | risque: {a_risque.sum()} ({a_risque.mean()*100:.1f}%)')

# ── M3 : dataset_performance.csv — 3000 étudiants ────────────────────────────
moy_prec2  = rng.uniform(6, 19, n)
cc1b       = rng.uniform(5, 19, n)
cc2b       = cc1b + rng.normal(0.2, 1.5, n)
cc3b       = cc2b + rng.normal(0.3, 1.5, n)
cc2b       = np.clip(cc2b, 0, 20)
cc3b       = np.clip(cc3b, 0, 20)
abs_actuel = rng.uniform(0, 35, n)
pente      = cc3b - cc1b
sous_10    = rng.integers(0, 6, n)
ratio_notes= rng.uniform(0.5, 1.0, n)

moy_finale = (
    2.5
    + 0.42 * moy_prec2
    + 0.36 * ((cc1b + cc2b + cc3b) / 3)
    - 0.03 * abs_actuel
    + 0.06 * pente
    - 0.06 * sous_10
    + rng.normal(0, 1.2, n)
)
moy_finale = np.clip(moy_finale, 0, 20).round(2)

df3 = pd.DataFrame({
    'etudiant_id':          [f'ETU{i+1:05d}' for i in range(n)],
    'niveau':               rng.choice(niveaux, n),
    'filiere':              rng.choice(filieres, n),
    'moy_semestre_prec':    moy_prec2.round(2),
    'note_cc1':             cc1b.round(2),
    'note_cc2':             cc2b.round(2),
    'note_cc3':             cc3b.round(2),
    'taux_absence_actuel':  abs_actuel.round(2),
    'pente_evolution':      pente.round(2),
    'nb_matieres_sous_10':  sous_10,
    'ratio_notes_obtenues': ratio_notes.round(3),
    'moyenne_finale':       moy_finale,
})
df3.to_csv('dataset_performance.csv', index=False)
print(f'M3 dataset_performance.csv OK: {df3.shape}')
print('\nDatasets générés avec succès.')
