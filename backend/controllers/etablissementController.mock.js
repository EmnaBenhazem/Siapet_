const crypto = require("crypto");

// Mock etablissements database
let mockEtablissements = [
  {
    id_etablissement: "660e8400-e29b-41d4-a716-446655440000",
    code_etablissement: "UNIV-TUN-001",
    nom: "Université de Tunis",
    type: "universite",
    ville: "Tunis",
    region: "Tunis",
    effectif_total: 15000,
    nombre_enseignants: 450,
    budget_alloue: 5000000,
    actif: true,
    date_creation: new Date(),
  },
  {
    id_etablissement: "660e8400-e29b-41d4-a716-446655440001",
    code_etablissement: "FAC-SCI-001",
    nom: "Faculté des Sciences de Tunis",
    type: "faculte",
    ville: "Tunis",
    region: "Tunis",
    effectif_total: 5000,
    nombre_enseignants: 150,
    budget_alloue: 2000000,
    actif: true,
    date_creation: new Date(),
  },
];

// M3-US01: Ajouter un établissement
exports.createEtablissement = async (req, res) => {
  try {
    const { code_etablissement, nom, type, ville, region, budget_alloue } =
      req.body;

    const existing = mockEtablissements.find(
      (e) => e.nom === nom || e.code_etablissement === code_etablissement,
    );

    if (existing) {
      return res.status(400).json({
        message: "Un établissement avec ce nom ou code existe déjà",
      });
    }

    const etablissement = {
      id_etablissement: crypto.randomUUID(),
      code_etablissement,
      nom,
      type,
      ville,
      region,
      budget_alloue,
      effectif_total: 0,
      nombre_enseignants: 0,
      actif: true,
      date_creation: new Date(),
    };

    mockEtablissements.push(etablissement);

    res.status(201).json({
      message: "Établissement créé (Mock)",
      etablissement,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// M3-US02: Consulter les établissements
exports.getEtablissements = async (req, res) => {
  try {
    const { search, type, ville, page = 1, limit = 10 } = req.query;

    let filtered = mockEtablissements.filter((e) => e.actif);

    if (type) {
      filtered = filtered.filter((e) => e.type === type);
    }
    if (ville) {
      filtered = filtered.filter((e) => e.ville === ville);
    }
    if (search) {
      filtered = filtered.filter(
        (e) =>
          e.nom.toLowerCase().includes(search.toLowerCase()) ||
          e.code_etablissement.toLowerCase().includes(search.toLowerCase()),
      );
    }

    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginated = filtered.slice(start, end);

    res.json({
      etablissements: paginated,
      total: filtered.length,
      page: parseInt(page),
      totalPages: Math.ceil(filtered.length / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// M3-US03: Modifier un établissement
exports.updateEtablissement = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, type, ville, region, budget_alloue } = req.body;

    const index = mockEtablissements.findIndex(
      (e) => e.id_etablissement === id,
    );
    if (index === -1) {
      return res.status(404).json({ message: "Établissement non trouvé" });
    }

    mockEtablissements[index] = {
      ...mockEtablissements[index],
      nom: nom || mockEtablissements[index].nom,
      type: type || mockEtablissements[index].type,
      ville: ville || mockEtablissements[index].ville,
      region: region || mockEtablissements[index].region,
      budget_alloue: budget_alloue || mockEtablissements[index].budget_alloue,
    };

    res.json({
      message: "Établissement modifié (Mock)",
      etablissement: mockEtablissements[index],
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// M3-US04: Archiver un établissement
exports.archiveEtablissement = async (req, res) => {
  try {
    const { id } = req.params;

    const index = mockEtablissements.findIndex(
      (e) => e.id_etablissement === id,
    );
    if (index === -1) {
      return res.status(404).json({ message: "Établissement non trouvé" });
    }

    mockEtablissements[index].actif = false;

    res.json({
      message: "Établissement archivé (Mock)",
      etablissement: mockEtablissements[index],
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
