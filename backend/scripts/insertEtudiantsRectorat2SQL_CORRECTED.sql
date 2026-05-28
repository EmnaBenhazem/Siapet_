-- ============================================================
-- 300 utilisateurs (étudiants) — Rectorat 2
-- Même ordre que insert_300_etudiants_rectorat2.sql
-- numero_utilisateur = clé de jointure avec table etudiant
-- CIN CORRIGÉS : Format 8 chiffres uniques
-- ============================================================

INSERT INTO utilisateur (numero_utilisateur, nom, prenom, email, mot_de_passe, telephone, sexe, statut, date_creation, derniere_connexion, type_utilisateur, reset_token, reset_token_expiry) VALUES
('USR-2021-0001', 'Khelifi', 'Mohamed', 'mohamed.khelifi1@etu.utm.tn', '$2b$12$a66fc7efef36cae6bad698eac5b8f918cff695b630658c3e82db0', '+216 37 854 204', 'Masculin', 'actif', '2024-09-14 08:01:00', '2024-11-01 08:01:00', 'etudiant', NULL, NULL),
('USR-2023-0002', 'Ayachi', 'Karim', 'karim.ayachi2@etu.utm.tn', '$2b$12$259667d51886d94ad1a8d368ca1d105c3f1660cbb254744c4e601', '+216 91 303 833', 'Masculin', 'actif', '2022-09-19 12:51:00', '2022-09-23 12:51:00', 'etudiant', NULL, NULL),
('USR-2021-0003', 'Cherif', 'Tarek', 'tarek.cherif3@etu.utm.tn', '$2b$12$f856aefff3b9e9174b3c1d0f77cd6f2780a7f795ace9699c22696', '+216 47 881 444', 'Masculin', 'actif', '2022-09-12 17:16:00', '2022-10-05 17:16:00', 'etudiant', NULL, NULL),
('USR-2024-0004', 'Hamdi', 'Asma', 'asma.hamdi4@etu.utm.tn', '$2b$12$5dbdca205729482e4a9520f1f994d935fb1c9884e31f5eedae587', '+216 68 180 665', 'Féminin', 'actif', '2023-07-12 17:12:00', '2024-07-07 17:12:00', 'etudiant', NULL, NULL),
('USR-2023-0005', 'Jlassi', 'Ahmed', 'ahmed.jlassi5@etu.utm.tn', '$2b$12$e97a2b6acfc9edf269f64a0a1809548ad958c13177af41f2093b8', '+216 30 975 338', 'Masculin', 'inactif', '2022-10-27 13:10:00', '2023-05-05 13:10:00', 'etudiant', NULL, NULL);

-- ============================================================
-- 300 étudiants — Rectorat 2 (Université de Tunis El Manar)
-- Établissements : id 15 à 27
-- Dates d'inscription variées : 2019–2024
-- CIN CORRIGÉS : Format 8 chiffres uniques
-- ============================================================

INSERT INTO etudiant (numero_utilisateur, numero_etudiant, cin, date_naissance, adresse, code_postal, moyenne_generale, id_ville, id_etablissement, id_specialite) VALUES
('USR-2021-0001', 'ETU-2023-R2-0001', '12872846', '1999-02-24', '76 Cité Universitaire, Tunis', '1002', 10.28, 1, 18, 10),
('USR-2023-0002', 'ETU-2023-R2-0002', '18532903', '2000-03-25', '29 Avenue du 7 Novembre, Tunis', '1100', 12.64, 1, 24, 25),
('USR-2021-0003', 'ETU-2024-R2-0003', '13086810', '2000-05-31', '49 Avenue Habib Bourguiba, Tunis', '1082', 18.05, 1, 20, 16),
('USR-2024-0004', 'ETU-2022-R2-0004', '16080602', '1998-11-19', '47 Boulevard du 20 Mars, Tunis', '1007', 16.69, 1, 23, 22),
('USR-2023-0005', 'ETU-2021-R2-0005', '12355618', '2002-04-06', '21 Rue des Orangers, Tunis', '1082', 11.99, 1, 16, 4);
