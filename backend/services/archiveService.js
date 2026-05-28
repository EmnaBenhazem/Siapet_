/**
 * archiveService — helpers réutilisables pour le système d'archivage sécurisé.
 *
 *   verifyPassword(actorNumero, plain)
 *     → bool. Vérifie le mot de passe d'un utilisateur via bcrypt.
 *
 *   logArchiveAction({ entityType, entityId, entityName, action, actor, req, reason, cascadeCount, metadata })
 *     → insère une ligne dans archive_log. Capture IP, user-agent à partir de req.
 *
 *   getArchiveLog({ entityType, entityId, action })
 *     → renvoie la dernière entrée de log pour cette entité (pour l'affichage du tracing).
 */
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');

async function verifyPassword(actorNumero, plain) {
  if (!actorNumero || !plain) return false;
  const [row] = await sequelize.query(
    `SELECT mot_de_passe FROM utilisateur WHERE numero_utilisateur = :actor`,
    { replacements: { actor: actorNumero }, type: sequelize.QueryTypes.SELECT }
  );
  if (!row || !row.mot_de_passe) return false;
  return bcrypt.compare(plain, row.mot_de_passe);
}

async function logArchiveAction({
  entityType, entityId, entityName, action,
  actor, req, reason = null, cascadeCount = 0, metadata = null,
  transaction = null,
}) {
  const ip = (
    req.headers['x-forwarded-for']
    || req.ip
    || req.connection?.remoteAddress
    || ''
  ).toString().split(',')[0].trim();
  const ua = req.headers['user-agent'] || '';

  await sequelize.query(
    `INSERT INTO archive_log
       (entity_type, entity_id, entity_name, action, performed_by,
        ip_address, user_agent, reason, cascade_count, metadata)
     VALUES (:entityType, :entityId, :entityName, :action, :actor,
             :ip, :ua, :reason, :cnt, :meta)`,
    {
      replacements: {
        entityType, entityId, entityName: entityName || null, action,
        actor: actor || null, ip, ua,
        reason, cnt: cascadeCount,
        meta: metadata ? JSON.stringify(metadata) : null,
      },
      type: sequelize.QueryTypes.INSERT,
      transaction,
    }
  );
}

/**
 * Wrapper haut niveau : vérifie le password, exécute le worker dans une transaction,
 * log l'action, renvoie un résultat normalisé. Le worker reçoit (transaction) et doit
 * retourner { entity, cascadeCount, metadata } ou throw.
 */
async function secureAction({ req, res, entityType, action, worker }) {
  const { password, reason = '' } = req.body || {};
  const actor = req.user?.numero_utilisateur || req.user?.id || null;

  if (!password) {
    return res.status(400).json({ success: false, message: 'Mot de passe requis' });
  }

  const passwordOk = await verifyPassword(actor, password);
  if (!passwordOk) {
    return res.status(403).json({ success: false, message: 'Mot de passe incorrect' });
  }

  const t = await sequelize.transaction();
  try {
    const result = await worker(t);
    if (!result || !result.entity) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Entité non trouvée' });
    }
    await logArchiveAction({
      entityType,
      entityId:   result.entity.id,
      entityName: result.entity.nom,
      action,
      actor,
      req,
      reason,
      cascadeCount: result.cascadeCount || 0,
      metadata:     result.metadata    || null,
      transaction:  t,
    });
    await t.commit();
    return res.json({
      success: true,
      message: result.message || (action === 'archive' ? 'Archivé avec succès' : 'Restauré avec succès'),
      cascade_count: result.cascadeCount || 0,
      entity: result.entity,
    });
  } catch (error) {
    await t.rollback();
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error(`Erreur ${action} ${entityType}:`, error);
    return res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
}

module.exports = { verifyPassword, logArchiveAction, secureAction };
