"""
generate_infographic.py — Infographie explicative des 3 modeles ML SIAPET
"""
import warnings
warnings.filterwarnings('ignore')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

fig = plt.figure(figsize=(20, 26), facecolor='#f8fafc')
fig.patch.set_facecolor('#f8fafc')

# ─── Couleurs ────────────────────────────────────────────────────────────────
C_BLUE   = '#1e40af'
C_BLUE2  = '#3b82f6'
C_BLUE3  = '#dbeafe'
C_GREEN  = '#15803d'
C_GREEN2 = '#22c55e'
C_GREEN3 = '#dcfce7'
C_ORANGE = '#b45309'
C_ORANGE2= '#f59e0b'
C_ORANGE3= '#fef3c7'
C_RED    = '#dc2626'
C_RED2   = '#ef4444'
C_RED3   = '#fee2e2'
C_DARK   = '#0f172a'
C_GRAY   = '#64748b'
C_WHITE  = '#ffffff'

def rounded_box(ax, x, y, w, h, color, radius=0.02, alpha=1.0, zorder=2):
    box = FancyBboxPatch((x, y), w, h,
                         boxstyle=f'round,pad=0,rounding_size={radius}',
                         facecolor=color, edgecolor='none',
                         alpha=alpha, zorder=zorder,
                         transform=ax.transAxes, clip_on=False)
    ax.add_patch(box)
    return box

def shadow_box(ax, x, y, w, h, color, border=C_WHITE, radius=0.015):
    rounded_box(ax, x+0.003, y-0.003, w, h, '#cbd5e1', radius=radius, alpha=0.5, zorder=1)
    rounded_box(ax, x, y, w, h, color, radius=radius, zorder=2)
    if border != color:
        box = FancyBboxPatch((x, y), w, h,
                             boxstyle=f'round,pad=0,rounding_size={radius}',
                             facecolor='none', edgecolor=border, linewidth=1.5,
                             zorder=3, transform=ax.transAxes, clip_on=False)
        ax.add_patch(box)

ax = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(0, 1); ax.set_ylim(0, 1)
ax.axis('off')

# ═════════════════════════════════════════════════════════════════════════════
# HEADER
# ═════════════════════════════════════════════════════════════════════════════
rounded_box(ax, 0, 0.935, 1, 0.065, C_BLUE, radius=0)
ax.text(0.5, 0.975, 'SIAPET — Systeme Intelligent d\'Analyse Predictive',
        ha='center', va='center', fontsize=22, fontweight='bold',
        color=C_WHITE, transform=ax.transAxes)
ax.text(0.5, 0.948, '3 Modeles Machine Learning pour l\'Education Tunisienne',
        ha='center', va='center', fontsize=14, color='#bfdbfe',
        transform=ax.transAxes)

# Badge PFE
rounded_box(ax, 0.01, 0.940, 0.10, 0.050, '#1d4ed8', radius=0.01)
ax.text(0.06, 0.966, 'PFE 2025-2026', ha='center', va='center',
        fontsize=9, fontweight='bold', color=C_WHITE, transform=ax.transAxes)

# ═════════════════════════════════════════════════════════════════════════════
# SECTION : Architecture generale
# ═════════════════════════════════════════════════════════════════════════════
ax.text(0.5, 0.920, 'Architecture du Systeme ML',
        ha='center', va='center', fontsize=15, fontweight='bold',
        color=C_DARK, transform=ax.transAxes)

# Boxes architecture
arch_items = [
    (0.05, 0.860, 0.17, '#eff6ff', C_BLUE2, 'Base de\nDonnees\nPostgreSQL', '1'),
    (0.28, 0.860, 0.17, '#f0fdf4', C_GREEN2, 'Entrainement\nPyCaret /\nScikit-learn', '2'),
    (0.51, 0.860, 0.17, '#fef3c7', C_ORANGE2, 'Modeles\n.pkl\nSauvegardes', '3'),
    (0.74, 0.860, 0.17, '#fdf4ff', '#a855f7', 'API FastAPI\nPort 5001\n/predict/*', '4'),
]
for (x, y, w, bg, border, label, num) in arch_items:
    shadow_box(ax, x, y, w, 0.065, bg, border)
    ax.text(x + w/2, y + 0.048, f'Etape {num}', ha='center', va='center',
            fontsize=8, fontweight='bold', color=border, transform=ax.transAxes)
    ax.text(x + w/2, y + 0.025, label, ha='center', va='center',
            fontsize=9, color=C_DARK, transform=ax.transAxes, linespacing=1.4)

# Fleches entre boxes
for xa in [0.225, 0.455, 0.685]:
    ax.annotate('', xy=(xa + 0.045, 0.892), xytext=(xa, 0.892),
                xycoords='axes fraction', textcoords='axes fraction',
                arrowprops=dict(arrowstyle='->', color=C_GRAY, lw=2.0))

# ═════════════════════════════════════════════════════════════════════════════
# 3 MODELES — cartes principales
# ═════════════════════════════════════════════════════════════════════════════
models = [
    {
        'x': 0.02, 'color_main': C_BLUE, 'color_light': C_BLUE3,
        'color_accent': C_BLUE2, 'emoji': 'M1',
        'title': 'Taux de Reussite',
        'subtitle': 'REGRESSION',
        'target': 'Predit : taux_reussite_actuel (%)',
        'algo': 'Regression Lineaire',
        'dataset': '200 etablissements',
        'features': ['taux_reussite_an1 (N-1)', 'taux_absence_moyen', 'ratio_etud/ens',
                     'budget_par_etudiant', 'nb_laboratoires', 'taux_rotation_ens'],
        'metrics': [
            ('R2 Score',  '83.75%', C_GREEN2),
            ('MAE',       '2.77%',  C_BLUE2),
            ('AUC-ROC',   '—',      C_GRAY),
            ('CV 5-fold', '86.19%', C_GREEN2),
        ],
        'verdict': 'BON',
        'verdict_color': C_BLUE2,
        'interpretation': 'Le modele explique 84% des\nvariations du taux de reussite.\nErreur moyenne : 2.8 points.',
        'users': 'Admin MESRS · Recteur · Directeur',
        'output': 'Taux predit : 0 - 100%',
        'bar_val': 0.8375,
    },
    {
        'x': 0.35, 'color_main': C_GREEN, 'color_light': C_GREEN3,
        'color_accent': C_GREEN2, 'emoji': 'M2',
        'title': 'Etudiants a Risque',
        'subtitle': 'CLASSIFICATION',
        'target': 'Predit : a_risque (0 ou 1)',
        'algo': 'Regression Logistique + SMOTE',
        'dataset': '3000 etudiants (10.5% a risque)',
        'features': ['moy_semestre_prec', 'note_cc1 / cc2 / cc3', 'taux_absence',
                     'nb_echecs_anterieurs', 'evolution_notes', 'participation'],
        'metrics': [
            ('Recall',   '94.68%', C_GREEN2),
            ('AUC-ROC',  '97.79%', C_GREEN2),
            ('Accuracy', '91.44%', C_BLUE2),
            ('F1-Score', '69.80%', C_ORANGE2),
        ],
        'verdict': 'EXCELLENT',
        'verdict_color': C_GREEN2,
        'interpretation': '94 etudiants detectes sur 100\na risque. Seulement 5 manques.\nAUC = 97.8% (quasi parfait).',
        'users': 'Enseignant · Directeur',
        'output': 'Alerte : VERT / ORANGE / ROUGE',
        'bar_val': 0.9468,
    },
    {
        'x': 0.68, 'color_main': C_ORANGE, 'color_light': C_ORANGE3,
        'color_accent': C_ORANGE2, 'emoji': 'M3',
        'title': 'Performance Future',
        'subtitle': 'REGRESSION',
        'target': 'Predit : moyenne_finale (/20)',
        'algo': 'Regression Lineaire',
        'dataset': '3000 etudiants',
        'features': ['moy_semestre_prec', 'note_cc1 / cc2 / cc3', 'taux_absence_actuel',
                     'pente_evolution', 'nb_matieres_sous_10', 'ratio_notes_obtenues'],
        'metrics': [
            ('R2 Score',  '74.50%', C_ORANGE2),
            ('MAE',       '0.77/20', C_BLUE2),
            ('AUC-ROC',   '—',       C_GRAY),
            ('CV 5-fold', '72.43%', C_ORANGE2),
        ],
        'verdict': 'BON',
        'verdict_color': C_ORANGE2,
        'interpretation': 'Erreur moyenne de 0.77 point\nsur 20. Predit la moyenne\navant les examens finaux.',
        'users': 'Enseignant · Etudiant',
        'output': 'Mention : Passable → Tres bien',
        'bar_val': 0.7450,
    },
]

card_top = 0.840
card_h   = 0.530

for m in models:
    x = m['x']
    w = 0.295

    # Carte principale
    shadow_box(ax, x, card_top - card_h, w, card_h, C_WHITE, m['color_main'])

    # Header de carte
    rounded_box(ax, x, card_top - 0.060, w, 0.060, m['color_main'], radius=0.01)
    ax.text(x + 0.025, card_top - 0.030, m['emoji'],
            ha='left', va='center', fontsize=22, fontweight='bold',
            color=C_WHITE, transform=ax.transAxes)
    ax.text(x + w/2 + 0.01, card_top - 0.018, m['title'],
            ha='center', va='center', fontsize=13, fontweight='bold',
            color=C_WHITE, transform=ax.transAxes)
    rounded_box(ax, x + w - 0.095, card_top - 0.052, 0.088, 0.030,
                m['color_accent'], radius=0.008)
    ax.text(x + w - 0.051, card_top - 0.037, m['subtitle'],
            ha='center', va='center', fontsize=8, fontweight='bold',
            color=C_WHITE, transform=ax.transAxes)

    y_cur = card_top - 0.075

    # Algorithme retenu
    rounded_box(ax, x + 0.01, y_cur - 0.032, w - 0.02, 0.032, m['color_light'], radius=0.008)
    ax.text(x + 0.022, y_cur - 0.010, 'Algorithme retenu :',
            ha='left', va='center', fontsize=8, color=C_GRAY, transform=ax.transAxes)
    ax.text(x + 0.022, y_cur - 0.024, m['algo'],
            ha='left', va='center', fontsize=9, fontweight='bold',
            color=m['color_main'], transform=ax.transAxes)
    y_cur -= 0.042

    # Dataset
    ax.text(x + 0.015, y_cur - 0.006, f'Dataset :  {m["dataset"]}',
            ha='left', va='center', fontsize=8.5, color=C_GRAY, transform=ax.transAxes)
    ax.text(x + 0.015, y_cur - 0.018, f'Variable cible :  {m["target"]}',
            ha='left', va='center', fontsize=8.5, color=C_DARK, transform=ax.transAxes)
    y_cur -= 0.030

    # Separateur
    ax.plot([x + 0.01, x + w - 0.01], [y_cur - 0.005, y_cur - 0.005],
            color='#e2e8f0', linewidth=1, transform=ax.transAxes)
    y_cur -= 0.012

    # Features
    ax.text(x + 0.015, y_cur - 0.008, 'Variables d\'entree (features) :',
            ha='left', va='center', fontsize=8.5, fontweight='bold',
            color=C_DARK, transform=ax.transAxes)
    y_cur -= 0.018
    for feat in m['features']:
        ax.text(x + 0.025, y_cur - 0.005, f'• {feat}',
                ha='left', va='center', fontsize=8, color=C_DARK, transform=ax.transAxes)
        y_cur -= 0.016

    y_cur -= 0.004
    ax.plot([x + 0.01, x + w - 0.01], [y_cur, y_cur],
            color='#e2e8f0', linewidth=1, transform=ax.transAxes)
    y_cur -= 0.010

    # Metriques
    ax.text(x + 0.015, y_cur - 0.006, 'Performances (donnees de test 30%) :',
            ha='left', va='center', fontsize=8.5, fontweight='bold',
            color=C_DARK, transform=ax.transAxes)
    y_cur -= 0.020

    for i, (label, val, col) in enumerate(m['metrics']):
        col_x = x + 0.01 + (i % 2) * ((w - 0.02) / 2)
        row_y = y_cur - (i // 2) * 0.040

        rounded_box(ax, col_x + 0.002, row_y - 0.034, (w - 0.02)/2 - 0.006, 0.034,
                    m['color_light'], radius=0.006)
        ax.text(col_x + (w - 0.02)/4, row_y - 0.010, label,
                ha='center', va='center', fontsize=7.5, color=C_GRAY, transform=ax.transAxes)
        ax.text(col_x + (w - 0.02)/4, row_y - 0.024, val,
                ha='center', va='center', fontsize=11, fontweight='bold',
                color=col, transform=ax.transAxes)

    y_cur -= 0.090

    ax.plot([x + 0.01, x + w - 0.01], [y_cur, y_cur],
            color='#e2e8f0', linewidth=1, transform=ax.transAxes)
    y_cur -= 0.010

    # Verdict
    rounded_box(ax, x + 0.01, y_cur - 0.032, w - 0.02, 0.030,
                m['color_light'], radius=0.008)
    ax.text(x + 0.022, y_cur - 0.017, f'VERDICT : {m["verdict"]}',
            ha='left', va='center', fontsize=10, fontweight='bold',
            color=m['verdict_color'], transform=ax.transAxes)
    y_cur -= 0.040

    # Interpretation
    ax.text(x + 0.015, y_cur - 0.004, m['interpretation'],
            ha='left', va='top', fontsize=8, color=C_DARK,
            transform=ax.transAxes, linespacing=1.5,
            style='italic')
    y_cur -= 0.055

    ax.plot([x + 0.01, x + w - 0.01], [y_cur, y_cur],
            color='#e2e8f0', linewidth=1, transform=ax.transAxes)
    y_cur -= 0.010

    # Utilisateurs
    ax.text(x + 0.015, y_cur - 0.007, f'Utilisateurs : {m["users"]}',
            ha='left', va='center', fontsize=8, color=C_GRAY, transform=ax.transAxes)
    y_cur -= 0.020
    rounded_box(ax, x + 0.01, y_cur - 0.026, w - 0.02, 0.024, m['color_main'], radius=0.006)
    ax.text(x + w/2, y_cur - 0.014, f'Sortie : {m["output"]}',
            ha='center', va='center', fontsize=8.5, fontweight='bold',
            color=C_WHITE, transform=ax.transAxes)

# ═════════════════════════════════════════════════════════════════════════════
# SECTION COMPARAISON VISUELLE
# ═════════════════════════════════════════════════════════════════════════════
y_comp = 0.275
ax.text(0.5, y_comp + 0.025, 'Comparaison Visuelle des Performances',
        ha='center', va='center', fontsize=15, fontweight='bold',
        color=C_DARK, transform=ax.transAxes)

bar_data = [
    ('M1\nReussite', 0.8375, C_BLUE2, 'R2 = 83.8%'),
    ('M2\nRisque\n(Recall)', 0.9468, C_GREEN2, 'Recall = 94.7%'),
    ('M3\nPerformance', 0.7450, C_ORANGE2, 'R2 = 74.5%'),
]

bar_ax = fig.add_axes([0.08, 0.120, 0.50, 0.130])
bar_ax.set_facecolor('#f8fafc')
for spine in bar_ax.spines.values():
    spine.set_visible(False)

bar_ax.set_xlim(0, 1.05)
bar_ax.set_ylim(-0.5, len(bar_data) - 0.5)
bar_ax.set_yticks(range(len(bar_data)))
bar_ax.set_yticklabels([d[0] for d in bar_data], fontsize=10, fontweight='bold')
bar_ax.tick_params(axis='x', labelsize=9)
bar_ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f'{v*100:.0f}%'))
bar_ax.axvline(1.0, color='#94a3b8', linewidth=1, linestyle='--')
bar_ax.set_title('Metrique principale par modele (score sur donnees de test)',
                 fontsize=10, color=C_GRAY, pad=8)

for i, (label, val, col, text) in enumerate(bar_data):
    bar_ax.barh(i, val, height=0.5, color=col, alpha=0.85,
                left=0, zorder=2)
    bar_ax.barh(i, 1.0 - val, height=0.5, color='#e2e8f0', alpha=0.6,
                left=val, zorder=1)
    bar_ax.text(val + 0.01, i, text, va='center', fontsize=10,
                fontweight='bold', color=col)

bar_ax.axvline(0.70, color='#94a3b8', linewidth=0.8, linestyle=':')
bar_ax.text(0.70, -0.45, 'Seuil minimal\n70%', ha='center', fontsize=7.5, color=C_GRAY)

# ─── Jauge circulaire M2 ─────────────────────────────────────────────────────
gauge_ax = fig.add_axes([0.62, 0.105, 0.16, 0.165])
gauge_ax.set_facecolor('#f8fafc')
gauge_ax.set_xlim(-1.2, 1.2); gauge_ax.set_ylim(-1.2, 1.2)
gauge_ax.axis('off')

theta = np.linspace(np.pi, 0, 200)
gauge_ax.plot(np.cos(theta), np.sin(theta), color='#e2e8f0', linewidth=16, solid_capstyle='round')
val_gauge = 0.9468
theta_val = np.linspace(np.pi, np.pi - val_gauge * np.pi, 200)
gauge_ax.plot(np.cos(theta_val), np.sin(theta_val),
              color=C_GREEN2, linewidth=16, solid_capstyle='round')

gauge_ax.text(0, 0.15, '94.7%', ha='center', va='center',
              fontsize=20, fontweight='bold', color=C_GREEN)
gauge_ax.text(0, -0.20, 'Recall M2', ha='center', va='center',
              fontsize=9, color=C_GRAY)
gauge_ax.text(0, -0.50, 'EXCELLENT', ha='center', va='center',
              fontsize=10, fontweight='bold', color=C_GREEN2)

# ─── Mini stats ──────────────────────────────────────────────────────────────
stats_ax = fig.add_axes([0.80, 0.105, 0.18, 0.165])
stats_ax.set_facecolor('#f8fafc')
stats_ax.axis('off')

stats = [
    ('5 manques', 'sur 94 a risque', C_GREEN2),
    ('72 fausses', 'alertes (FP)', C_ORANGE2),
    ('734 sains', 'bien classes', C_BLUE2),
]
for i, (v, l, c) in enumerate(stats):
    yy = 0.80 - i * 0.32
    rounded_box(stats_ax, 0.05, yy - 0.22, 0.90, 0.26, c + '22', radius=0.05)
    stats_ax.text(0.50, yy - 0.04, v, ha='center', va='center',
                  fontsize=11, fontweight='bold', color=c,
                  transform=stats_ax.transAxes)
    stats_ax.text(0.50, yy - 0.16, l, ha='center', va='center',
                  fontsize=8, color=C_GRAY, transform=stats_ax.transAxes)

# ═════════════════════════════════════════════════════════════════════════════
# FOOTER
# ═════════════════════════════════════════════════════════════════════════════
rounded_box(ax, 0, 0.000, 1, 0.045, C_BLUE, radius=0)
ax.text(0.25, 0.022, 'Realisee par : Ghofranet Sebteoui & Emna Benhazem',
        ha='center', va='center', fontsize=9, color='#bfdbfe', transform=ax.transAxes)
ax.text(0.60, 0.022, 'Encadrant : Guettat Belhassen  |  Client : MESRS Tunisie',
        ha='center', va='center', fontsize=9, color='#bfdbfe', transform=ax.transAxes)
ax.text(0.92, 0.022, 'PFE 2025-2026',
        ha='center', va='center', fontsize=9, fontweight='bold',
        color=C_WHITE, transform=ax.transAxes)

# ─── Sauvegarde ──────────────────────────────────────────────────────────────
out = 'rapport/graphs/SIAPET_ML_Infographie.png'
fig.savefig(out, dpi=150, bbox_inches='tight', facecolor='#f8fafc')
plt.close(fig)
size = __import__('os').path.getsize(out) // 1024
print(f'Infographie generee : {out}  ({size} Ko)')
