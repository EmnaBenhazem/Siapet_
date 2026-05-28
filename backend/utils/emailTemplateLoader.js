const fs = require('fs');
const path = require('path');

/**
 * Charge un template HTML et remplace les variables
 * @param {string} templateName - Nom du fichier template (sans chemin)
 * @param {object} variables - Variables à remplacer dans le template
 * @returns {string} - HTML avec variables remplacées
 */
function loadTemplate(templateName, variables) {
  const templatePath = path.join(__dirname, '../templates', templateName);
  
  try {
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    // Remplacer toutes les variables {{variable}}
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlTemplate = htmlTemplate.replace(regex, variables[key] || '');
    });
    
    return htmlTemplate;
  } catch (error) {
    console.error(`❌ Erreur lecture template ${templateName}:`, error.message);
    return null;
  }
}

/**
 * Obtient le nom du template selon le rôle
 * @param {string} typeActeur - Type d'acteur (etudiant, enseignant, directeur, recteur)
 * @returns {string} - Nom du fichier template
 */
function getTemplateForRole(typeActeur) {
  const templateMap = {
    etudiant: 'access-granted-etudiant.html',
    enseignant: 'access-granted-enseignant.html',
    directeur: 'access-granted-directeur.html',
    recteur: 'access-granted-recteur.html',
  };
  
  return templateMap[typeActeur] || 'access-granted-etudiant.html';
}

/**
 * Obtient le nom du template de broadcast selon le rôle
 * @param {string} typeActeur - Type d'acteur (etudiant, enseignant, directeur, recteur)
 * @returns {string} - Nom du fichier template de broadcast
 */
function getBroadcastTemplateForRole(typeActeur) {
  const templateMap = {
    etudiant: 'broadcast-etudiant.html',
    enseignant: 'broadcast-enseignant.html',
    directeur: 'broadcast-directeur.html',
    recteur: 'broadcast-recteur.html',
  };
  
  return templateMap[typeActeur] || 'broadcast-etudiant.html';
}

module.exports = {
  loadTemplate,
  getTemplateForRole,
  getBroadcastTemplateForRole,
};
