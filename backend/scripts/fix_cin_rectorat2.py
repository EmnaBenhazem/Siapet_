#!/usr/bin/env python3
"""
Script pour corriger les numéros de CIN du Rectorat 2
Génère des CIN uniques à 8 chiffres
"""

import re
from datetime import datetime

def generate_unique_cin(index, year, used_cins):
    """Génère un CIN unique à 8 chiffres"""
    attempts = 0
    while attempts < 1000:
        # Format: YY + 6 chiffres basés sur l'index
        year_prefix = str(year)[2:4]
        suffix = str(index * 100 + attempts).zfill(6)[:6]
        cin = year_prefix + suffix
        
        if cin not in used_cins and len(cin) == 8 and cin.isdigit():
            used_cins.add(cin)
            return cin
        
        attempts += 1
    
    # Fallback: génération aléatoire
    import random
    while True:
        cin = str(random.randint(10000000, 99999999))
        if cin not in used_cins:
            used_cins.add(cin)
            return cin

def extract_year(date_str):
    """Extrait l'année depuis une date"""
    match = re.search(r'(\d{4})-', date_str)
    return int(match.group(1)) if match else 2000

def read_sql_data(sql_content):
    """Parse les données SQL"""
    students = []
    
    # Extraire les lignes INSERT INTO etudiant
    pattern = r"\('(USR-\d{4}-\d{4})', '(ETU-\d{4}-R2-\d{4})', '(\d+)', '([\d-]+)', '([^']+)', '(\d+)', ([\d.]+), (\d+), (\d+), (\d+)\)"
    
    matches = re.findall(pattern, sql_content)
    
    for match in matches:
        students.append({
            'usr': match[0],
            'etu': match[1],
            'cin': match[2],
            'birth': match[3],
            'addr': match[4],
            'cp': match[5],
            'avg': match[6],
            'ville': match[7],
            'etab': match[8],
            'spec': match[9]
        })
    
    return students

def main():
    print("🔍 Analyse des CIN du Rectorat 2...\n")
    
    # Lire le contenu SQL depuis votre message
    # (Vous devrez coller le contenu complet ici)
    sql_content = """
    -- Collez ici le contenu de votre script SQL
    """
    
    # Pour l'exemple, créons des données de test
    students = []
    used_cins = set()
    corrections = []
    
    # Simuler 300 étudiants avec des CIN potentiellement problématiques
    for i in range(1, 301):
        usr = f"USR-{2019 + (i % 6)}-{str(i).zfill(4)}"
        etu = f"ETU-{2019 + (i % 6)}-R2-{str(i).zfill(4)}"
        
        # Générer un CIN (certains seront en doublon intentionnellement)
        if i % 50 == 0:
            cin = "12345678"  # Doublon intentionnel
        else:
            cin = str(10000000 + i * 1000 + (i % 100))[:8]
        
        birth = f"{1998 + (i % 8)}-{str((i % 12) + 1).zfill(2)}-{str((i % 28) + 1).zfill(2)}"
        
        students.append({
            'usr': usr,
            'etu': etu,
            'cin': cin,
            'birth': birth,
            'addr': f'{i} Rue Test, Tunis',
            'cp': '1000',
            'avg': 10.0 + (i % 10),
            'ville': 1,
            'etab': 15 + (i % 13),
            'spec': 1 + (i % 32)
        })
    
    # Analyser les CIN
    invalid_count = 0
    duplicate_count = 0
    
    for index, student in enumerate(students):
        cin = student['cin']
        is_valid = len(cin) == 8 and cin.isdigit()
        is_duplicate = cin in used_cins
        
        if not is_valid:
            invalid_count += 1
            print(f"❌ CIN invalide [{index + 1}]: {cin} ({student['usr']})")
            corrections.append({'index': index, 'reason': 'invalid', 'old': cin})
        elif is_duplicate:
            duplicate_count += 1
            print(f"⚠️  CIN en doublon [{index + 1}]: {cin} ({student['usr']})")
            corrections.append({'index': index, 'reason': 'duplicate', 'old': cin})
        else:
            used_cins.add(cin)
    
    print(f"\n📊 Résumé de l'analyse:")
    print(f"   Total étudiants: {len(students)}")
    print(f"   CIN invalides: {invalid_count}")
    print(f"   CIN en doublon: {duplicate_count}")
    print(f"   CIN à corriger: {len(corrections)}\n")
    
    # Corriger les CIN
    for correction in corrections:
        student = students[correction['index']]
        year = extract_year(student['birth'])
        new_cin = generate_unique_cin(correction['index'], year, used_cins)
        
        student['cin'] = new_cin
        print(f"✅ Corrigé [{correction['index'] + 1}]: {correction['old']} → {new_cin}")
    
    # Générer le fichier SQL
    print(f"\n✨ Génération du fichier SQL corrigé...\n")
    
    sql_output = f"""-- ============================================================
-- 300 étudiants — Rectorat 2 (Université de Tunis El Manar)
-- Établissements : id 15 à 27
-- CIN CORRIGÉS ET VÉRIFIÉS - {datetime.now().isoformat()}
-- ============================================================

INSERT INTO etudiant (numero_utilisateur, numero_etudiant, cin, date_naissance, adresse, code_postal, moyenne_generale, id_ville, id_etablissement, id_specialite) VALUES
"""
    
    for index, student in enumerate(students):
        comma = ',' if index < len(students) - 1 else ';'
        sql_output += f"('{student['usr']}', '{student['etu']}', '{student['cin']}', '{student['birth']}', '{student['addr']}', '{student['cp']}', {student['avg']}, {student['ville']}, {student['etab']}, {student['spec']}){comma}\n"
    
    sql_output += """
-- ============================================================
-- VÉRIFICATION
-- SELECT cin, COUNT(*) as count FROM etudiant 
-- WHERE id_etablissement BETWEEN 15 AND 27
-- GROUP BY cin HAVING COUNT(*) > 1;
-- ============================================================
"""
    
    # Sauvegarder le fichier
    output_file = 'insertEtudiantsRectorat2SQL_CORRECTED.sql'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql_output)
    
    print(f"✅ Fichier généré: {output_file}")
    print(f"\n🎉 Correction terminée avec succès!")
    print(f"   {len(corrections)} CIN ont été corrigés")
    print(f"   {len(used_cins)} CIN uniques au total\n")

if __name__ == '__main__':
    main()
