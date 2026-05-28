"""
main.py — SIAPET ML API (FastAPI + scikit-learn + joblib)
Routes : /predict/reussite  /predict/risque  /predict/performance
Port   : 5001
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import joblib
import os

app = FastAPI(
    title='SIAPET ML API',
    description='API de prédictions ML — M1 Réussite · M2 Risque · M3 Performance',
    version='1.0.0'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

# ── Chargement des modèles ────────────────────────────────────────────────────
BASE = os.path.dirname(__file__)

model_reussite    = joblib.load(os.path.join(BASE, 'models', 'model_reussite.pkl'))
model_risque      = joblib.load(os.path.join(BASE, 'models', 'model_risque.pkl'))
model_performance = joblib.load(os.path.join(BASE, 'models', 'model_performance.pkl'))

print('3 modèles chargés.')

# ── Schémas Pydantic ──────────────────────────────────────────────────────────
class DataReussite(BaseModel):
    taux_reussite_an1:  float = Field(..., ge=0, le=100)
    taux_reussite_an2:  float = Field(..., ge=0, le=100)
    taux_absence_moyen: float = Field(..., ge=0, le=100)
    ratio_etud_ens:     float = Field(..., ge=1)
    budget_par_etud:    int   = Field(..., ge=0)
    nb_labos:           int   = Field(..., ge=0)
    taux_rotation_ens:  float = Field(..., ge=0, le=100)
    region:             str
    type_etablissement: str

class DataRisque(BaseModel):
    moy_semestre_prec:    float = Field(..., ge=0, le=20)
    note_cc1:             float = Field(..., ge=0, le=20)
    note_cc2:             float = Field(..., ge=0, le=20)
    note_cc3:             float = Field(..., ge=0, le=20)
    taux_absence:         float = Field(..., ge=0, le=100)
    nb_echecs_anterieurs: int   = Field(..., ge=0)
    evolution_notes:      float
    participation:        float = Field(..., ge=0, le=10)
    niveau:               str
    filiere:              str

class DataPerformance(BaseModel):
    moy_semestre_prec:    float = Field(..., ge=0, le=20)
    note_cc1:             float = Field(..., ge=0, le=20)
    note_cc2:             float = Field(..., ge=0, le=20)
    note_cc3:             float = Field(..., ge=0, le=20)
    taux_absence_actuel:  float = Field(..., ge=0, le=100)
    pente_evolution:      float
    nb_matieres_sous_10:  int   = Field(..., ge=0)
    ratio_notes_obtenues: float = Field(..., ge=0, le=1)
    niveau:               str
    filiere:              str

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get('/')
def home():
    return {'message': 'SIAPET ML API — OK', 'modeles': 3, 'docs': '/docs'}

@app.post('/predict/reussite')
def predict_reussite(data: DataReussite):
    try:
        df = pd.DataFrame([data.model_dump()])
        taux = float(model_reussite.predict(df)[0])
        taux = round(max(0.0, min(100.0, taux)), 2)
        return {
            'taux_reussite_predit': taux,
            'interpretation': 'Bon' if taux >= 70 else 'Moyen' if taux >= 55 else 'Faible',
            'couleur': '#22c55e' if taux >= 70 else '#f59e0b' if taux >= 55 else '#ef4444',
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/predict/risque')
def predict_risque(data: DataRisque):
    try:
        df = pd.DataFrame([data.model_dump()])
        prediction  = int(model_risque.predict(df)[0])
        proba_arr   = model_risque.predict_proba(df)[0]
        probabilite = round(float(proba_arr[1]), 3)

        # Analyse des facteurs de risque detectes
        facteurs = []

        if data.taux_absence > 25:
            facteurs.append({
                'facteur': "Taux d'absence tres eleve",
                'detail':  f"Vous avez manque {data.taux_absence}% des cours (seuil critique : 25%)",
                'gravite': 'haute'
            })
        elif data.taux_absence > 15:
            facteurs.append({
                'facteur': "Taux d'absence eleve",
                'detail':  f"{data.taux_absence}% d'absences — essayez de descendre sous 15%",
                'gravite': 'moyenne'
            })

        if data.moy_semestre_prec < 10:
            facteurs.append({
                'facteur': "Moyenne insuffisante au semestre precedent",
                'detail':  f"Votre moyenne etait {data.moy_semestre_prec}/20, sous la barre de validation (10/20)",
                'gravite': 'haute'
            })
        elif data.moy_semestre_prec < 12:
            facteurs.append({
                'facteur': "Moyenne faible",
                'detail':  f"Moyenne de {data.moy_semestre_prec}/20 — un effort supplementaire est necessaire",
                'gravite': 'moyenne'
            })

        if data.evolution_notes < -2:
            facteurs.append({
                'facteur': "Baisse significative des notes",
                'detail':  f"Vos notes ont chute de {abs(data.evolution_notes):.1f} points entre CC1 et CC3",
                'gravite': 'haute'
            })
        elif data.evolution_notes < 0:
            facteurs.append({
                'facteur': "Legere baisse des notes",
                'detail':  f"Tendance a la baisse de {abs(data.evolution_notes):.1f} points — restez vigilant",
                'gravite': 'faible'
            })

        if data.nb_echecs_anterieurs >= 2:
            facteurs.append({
                'facteur': "Antecedents d'echecs multiples",
                'detail':  f"{data.nb_echecs_anterieurs} matieres echouees precedemment — risque de repetition",
                'gravite': 'haute'
            })
        elif data.nb_echecs_anterieurs == 1:
            facteurs.append({
                'facteur': "Echec anterieur",
                'detail':  "1 matiere echouee anterieurement — veillez a ne pas repeter cet echec",
                'gravite': 'moyenne'
            })

        if data.participation < 4:
            facteurs.append({
                'facteur': "Tres faible participation",
                'detail':  f"Score de participation : {data.participation}/10 — l'engagement en cours est insuffisant",
                'gravite': 'haute'
            })
        elif data.participation < 6:
            facteurs.append({
                'facteur': "Participation limitee",
                'detail':  f"Score de {data.participation}/10 — essayez de vous impliquer davantage",
                'gravite': 'moyenne'
            })

        if data.note_cc3 < data.note_cc1 - 3:
            facteurs.append({
                'facteur': "Forte chute entre CC1 et CC3",
                'detail':  f"CC1 : {data.note_cc1}/20 -> CC3 : {data.note_cc3}/20 (difference de {data.note_cc1 - data.note_cc3:.1f} pts)",
                'gravite': 'haute'
            })

        # Conseil personnalise
        if probabilite > 0.75:
            conseil = "Consultez votre tuteur academique des cette semaine. Un suivi personnalise est fortement recommande."
        elif probabilite > 0.50:
            conseil = "Revoyez vos methodes de travail. Reduisez les absences et preparez-vous serieusement aux prochains controles."
        else:
            conseil = "Continuez vos efforts. Maintenez votre rythme de travail et votre assiduite pour rester sur la bonne voie."

        return {
            'a_risque':        prediction,
            'probabilite':     probabilite,
            'interpretation':  'A risque' if prediction == 1 else 'Pas a risque',
            'niveau_alerte':   'ROUGE'  if probabilite > 0.75 else 'ORANGE' if probabilite > 0.50 else 'VERT',
            'couleur':         '#ef4444' if probabilite > 0.75 else '#f59e0b' if probabilite > 0.50 else '#22c55e',
            'facteurs_risque': facteurs,
            'conseil':         conseil,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/predict/performance')
def predict_performance(data: DataPerformance):
    try:
        df = pd.DataFrame([data.model_dump()])
        moyenne = float(model_performance.predict(df)[0])
        moyenne = round(max(0.0, min(20.0, moyenne)), 2)

        mention = ('Très bien'  if moyenne >= 16
              else 'Bien'       if moyenne >= 14
              else 'Assez bien' if moyenne >= 12
              else 'Passable'   if moyenne >= 10
              else 'Insuffisant')
        couleur = '#22c55e' if moyenne >= 14 else '#f59e0b' if moyenne >= 10 else '#ef4444'

        # ── Intervalle de confiance (±8 % de la prédiction, min 0.5) ──
        marge = round(max(0.5, moyenne * 0.08), 1)
        intervalle = {
            'min': round(max(0.0, moyenne - marge), 1),
            'max': round(min(20.0, moyenne + marge), 1),
            'marge': marge,
        }

        # ── Tendance (basée sur pente_evolution) ──
        if data.pente_evolution > 0.25:
            tendance = 'hausse'
        elif data.pente_evolution < -0.25:
            tendance = 'baisse'
        else:
            tendance = 'stable'

        # ── Facteurs d'influence ──
        facteurs = []

        if data.moy_semestre_prec >= 14:
            facteurs.append({'label': 'Base académique excellente',
                             'detail': f'Moy. précédente : {data.moy_semestre_prec}/20',
                             'impact': 'positif'})
        elif data.moy_semestre_prec >= 10:
            facteurs.append({'label': 'Base académique satisfaisante',
                             'detail': f'Moy. précédente : {data.moy_semestre_prec}/20',
                             'impact': 'neutre'})
        else:
            facteurs.append({'label': 'Base académique fragile',
                             'detail': f'Moy. précédente : {data.moy_semestre_prec}/20 (sous 10)',
                             'impact': 'negatif'})

        if data.taux_absence_actuel <= 10:
            facteurs.append({'label': 'Excellente assiduité',
                             'detail': f'Seulement {data.taux_absence_actuel}% d\'absences',
                             'impact': 'positif'})
        elif data.taux_absence_actuel <= 20:
            facteurs.append({'label': 'Assiduité correcte',
                             'detail': f'{data.taux_absence_actuel}% d\'absences (seuil conseillé : ≤ 15%)',
                             'impact': 'neutre'})
        else:
            facteurs.append({'label': 'Absentéisme élevé',
                             'detail': f'{data.taux_absence_actuel}% d\'absences — impact fort',
                             'impact': 'negatif'})

        if data.pente_evolution > 0.3:
            facteurs.append({'label': 'Progression croissante',
                             'detail': f'Pente d\'évolution : +{data.pente_evolution:.2f} pts/sem.',
                             'impact': 'positif'})
        elif data.pente_evolution < -0.3:
            facteurs.append({'label': 'Régression académique',
                             'detail': f'Pente d\'évolution : {data.pente_evolution:.2f} pts/sem.',
                             'impact': 'negatif'})
        else:
            facteurs.append({'label': 'Progression stable',
                             'detail': f'Évolution : {data.pente_evolution:+.2f} pts/sem.',
                             'impact': 'neutre'})

        if data.nb_matieres_sous_10 == 0:
            facteurs.append({'label': 'Aucune matière en échec',
                             'detail': 'Toutes les matières sont au-dessus de 10/20',
                             'impact': 'positif'})
        elif data.nb_matieres_sous_10 <= 2:
            facteurs.append({'label': f'{data.nb_matieres_sous_10} matière(s) en difficulté',
                             'detail': 'Rattrapage possible avec un effort ciblé',
                             'impact': 'neutre'})
        else:
            facteurs.append({'label': f'{data.nb_matieres_sous_10} matières sous 10/20',
                             'detail': 'Risque élevé d\'échec sans intervention',
                             'impact': 'negatif'})

        cc_moy = round((data.note_cc1 + data.note_cc2 + data.note_cc3) / 3, 1)
        if cc_moy >= 13:
            facteurs.append({'label': 'CC réguliers au-dessus de la moyenne',
                             'detail': f'Moyenne CC : {cc_moy}/20',
                             'impact': 'positif'})
        elif cc_moy < 10:
            facteurs.append({'label': 'CC en dessous de la moyenne',
                             'detail': f'Moyenne CC : {cc_moy}/20 — révisions intensives conseillées',
                             'impact': 'negatif'})

        # ── Conseil personnalisé ──
        if moyenne >= 16:
            conseil = "Trajectoire excellente. Maintenez ce niveau et valorisez votre dossier académique pour les opportunités de poursuite d'études."
        elif moyenne >= 14:
            conseil = "Très bon niveau prédit. Ciblez les matières inférieures à 14/20 pour atteindre la mention Très Bien."
        elif moyenne >= 12:
            conseil = "Niveau satisfaisant. Renforcez les fondamentaux dans les matières difficiles et réduisez les absences."
        elif moyenne >= 10:
            conseil = "Niveau juste suffisant. Un travail régulier et un suivi pédagogique ciblé sont recommandés pour consolider la réussite."
        else:
            conseil = "Niveau insuffisant détecté. Un accompagnement pédagogique personnalisé et une révision en profondeur sont fortement conseillés."

        # ── Fiabilité du modèle ──
        fiabilite = min(95, round(55 + data.ratio_notes_obtenues * 35 + (5 if data.nb_matieres_sous_10 >= 0 else 0)))

        return {
            'moyenne_finale_predite': moyenne,
            'mention':    mention,
            'couleur':    couleur,
            'intervalle': intervalle,
            'tendance':   tendance,
            'facteurs':   facteurs,
            'conseil':    conseil,
            'fiabilite':  fiabilite,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
