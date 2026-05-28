const nodemailer = require("nodemailer");

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Envoyer email de vérification avec mot de passe temporaire
const sendVerificationEmail = async (
  email,
  nom,
  prenom,
  matricule,
  motDePasseTemporaire,
  role,
) => {
  const roleText = role === "ETUDIANT" ? "Étudiant" : "Enseignant";

  const mailOptions = {
    from: `"SIAPET" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Bienvenue sur SIAPET - Vérification de votre compte",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
          
          body { 
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; 
            line-height: 1.6; 
            color: #2D2926;
            margin: 0;
            padding: 0;
            background: #E8F1FB;
          }
          .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: white;
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(30, 112, 235, 0.25);
          }
          .header { 
            background: linear-gradient(135deg, #1E70EB 0%, #0D4CB3 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center;
          }
          .header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            margin: 0 0 10px 0;
            letter-spacing: -0.02em;
          }
          .header p {
            margin: 0;
            opacity: 0.95;
            font-size: 14px;
          }
          .content { 
            padding: 40px 30px;
            background: white;
          }
          .content h2 {
            font-size: 20px;
            color: #2D2926;
            margin: 0 0 15px 0;
          }
          .info-box { 
            background: linear-gradient(145deg, rgba(30, 112, 235, 0.06), rgba(111, 163, 245, 0.06));
            padding: 25px; 
            margin: 25px 0; 
            border-radius: 14px; 
            border: 2px solid rgba(30, 112, 235, 0.15);
          }
          .info-box h3 {
            margin: 0 0 15px 0;
            font-size: 16px;
            color: #2D2926;
          }
          .info-item {
            margin: 12px 0;
            font-size: 14px;
          }
          .info-item strong {
            color: #6B6560;
            font-weight: 600;
          }
          .credential { 
            display: inline-block;
            font-size: 18px; 
            font-weight: 700; 
            color: #1E70EB;
            background: rgba(30, 112, 235, 0.08);
            padding: 4px 12px;
            border-radius: 8px;
            margin-left: 8px;
            font-family: 'Courier New', monospace;
          }
          .warning { 
            background: rgba(245, 158, 11, 0.08);
            padding: 20px; 
            border-radius: 12px; 
            border-left: 4px solid #F59E0B; 
            margin: 25px 0;
          }
          .warning strong {
            color: #92400E;
            display: block;
            margin-bottom: 8px;
          }
          .warning p {
            margin: 0;
            color: #92400E;
            font-size: 14px;
          }
          .btn-container {
            text-align: center;
            margin: 35px 0;
          }
          .btn { 
            display: inline-block;
            background: linear-gradient(135deg, #1E70EB 0%, #0D4CB3 100%); 
            color: white; 
            padding: 16px 40px; 
            text-decoration: none; 
            border-radius: 12px;
            font-weight: 700;
            font-size: 15px;
            box-shadow: 0 4px 16px rgba(30, 112, 235, 0.3);
            transition: all 0.3s;
          }
          .btn:hover {
            box-shadow: 0 6px 24px rgba(30, 112, 235, 0.4);
          }
          .steps {
            background: rgba(30, 112, 235, 0.06);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid rgba(30, 112, 235, 0.2);
            margin: 25px 0;
          }
          .steps h4 {
            margin: 0 0 12px 0;
            color: #0D4CB3;
            font-size: 15px;
          }
          .steps ol {
            margin: 0;
            padding-left: 20px;
          }
          .steps li {
            margin: 8px 0;
            color: #2D2926;
            font-size: 14px;
          }
          .footer { 
            text-align: center; 
            padding: 30px;
            background: #E8F1FB;
            color: #A89F96; 
            font-size: 12px;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Bienvenue sur SIAPET</h1>
            <p>Système d'Information et d'Aide à la Planification de l'Enseignement en Tunisie</p>
          </div>
          
          <div class="content">
            <h2>Bonjour ${prenom} ${nom},</h2>
            <p>Félicitations ! Votre compte ${roleText} a été créé avec succès sur la plateforme SIAPET.</p>
            
            <div class="info-box">
              <h3>📋 Vos informations de connexion</h3>
              <div class="info-item">
                <strong>Matricule :</strong>
                <span class="credential">${matricule}</span>
              </div>
              <div class="info-item">
                <strong>Email :</strong> ${email}
              </div>
              <div class="info-item">
                <strong>Mot de passe temporaire :</strong>
                <span class="credential">${motDePasseTemporaire}</span>
              </div>
            </div>

            <div class="warning">
              <strong>⚠️ Important - Sécurité</strong>
              <p>Pour des raisons de sécurité, vous devrez <strong>obligatoirement changer votre mot de passe</strong> lors de votre première connexion.</p>
            </div>

            <div class="steps">
              <h4>💡 Prochaines étapes</h4>
              <ol>
                <li>Cliquez sur le bouton ci-dessous pour accéder à la plateforme</li>
                <li>Connectez-vous avec votre email et le mot de passe temporaire</li>
                <li>Changez votre mot de passe lors de votre première connexion</li>
                <li>Complétez votre profil si nécessaire</li>
              </ol>
            </div>

            <div class="btn-container">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" class="btn">
                Se connecter maintenant →
              </a>
            </div>

            <p style="color: #A89F96; font-size: 13px; text-align: center; margin-top: 30px;">
              Si vous rencontrez des difficultés, contactez l'administrateur système.
            </p>
          </div>
          
          <div class="footer">
            <p><strong>© 2026 SIAPET</strong></p>
            <p>Ministère de l'Enseignement Supérieur et de la Recherche Scientifique</p>
            <p style="margin-top: 15px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return { success: false, error: error.message };
  }
};

// Envoyer email de réinitialisation de mot de passe
const sendPasswordResetEmail = async (email, nom, prenom, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

  const mailOptions = {
    from: `"SIAPET" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "SIAPET - Réinitialisation de votre mot de passe",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
          }
          
          body { 
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif; 
            line-height: 1.6; 
            color: #2D3436;
            background: #F4F8FF;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
          }
          .container { 
            max-width: 600px; 
            width: 100%;
            background: white;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(77, 159, 255, 0.15);
            position: relative;
          }
          /* Ligne de progression bleue au lieu de corail */
          .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #4D9FFF, #1A3A6B);
            z-index: 10;
          }
          .header { 
            background: linear-gradient(155deg, #0F2549 0%, #1A3A6B 55%, #1E4880 100%);
            color: white; 
            padding: 50px 40px; 
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: radial-gradient(rgba(77, 159, 255, 0.12) 1px, transparent 1px);
            background-size: 26px 26px;
            pointer-events: none;
          }
          .header-content {
            position: relative;
            z-index: 1;
          }
          .header .emoji {
            font-size: 48px;
            margin-bottom: 16px;
            display: block;
          }
          .header h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 32px;
            font-weight: 900;
            margin: 0;
            letter-spacing: -1px;
          }
          .header p {
            margin: 12px 0 0 0;
            opacity: 0.85;
            font-size: 15px;
            font-weight: 500;
          }
          .content { 
            padding: 45px 40px;
            background: white;
          }
          .greeting {
            font-size: 22px;
            font-weight: 700;
            color: #1A3A6B;
            margin: 0 0 20px 0;
          }
          .message {
            color: #636E72;
            font-size: 16px;
            line-height: 1.75;
            margin-bottom: 30px;
          }
          .info-box { 
            background: linear-gradient(145deg, rgba(77, 159, 255, 0.06), rgba(26, 58, 107, 0.04));
            padding: 28px; 
            margin: 30px 0; 
            border-radius: 18px; 
            border: 1.5px solid rgba(77, 159, 255, 0.2);
          }
          .info-box h3 {
            margin: 0 0 12px 0;
            font-size: 17px;
            font-weight: 700;
            color: #1A3A6B;
          }
          .info-box p {
            margin: 0;
            color: #636E72;
            font-size: 15px;
            line-height: 1.7;
          }
          .warning { 
            background: rgba(255, 107, 53, 0.08);
            padding: 24px; 
            border-radius: 16px; 
            border-left: 4px solid #FF6B35; 
            margin: 30px 0;
          }
          .warning strong {
            color: #D85A30;
            display: block;
            margin-bottom: 10px;
            font-size: 15px;
            font-weight: 700;
          }
          .warning p {
            margin: 0;
            color: #993C1D;
            font-size: 14px;
            line-height: 1.7;
          }
          .btn-container {
            text-align: center;
            margin: 40px 0;
          }
          .btn { 
            display: inline-block;
            background: linear-gradient(155deg, #0F2549 0%, #1A3A6B 55%, #1E4880 100%);
            color: #FFFFFF !important; 
            padding: 18px 48px; 
            text-decoration: none; 
            border-radius: 14px;
            font-weight: 800;
            font-size: 16px;
            box-shadow: 0 4px 20px rgba(26, 58, 107, 0.3);
            transition: all 0.3s ease;
            border: 2px solid rgba(255, 255, 255, 0.2);
          }
          .btn:hover {
            box-shadow: 0 6px 28px rgba(26, 58, 107, 0.4);
            transform: translateY(-2px);
            color: #FFFFFF !important;
          }
          .link-fallback {
            background: rgba(77, 159, 255, 0.06);
            padding: 20px;
            border-radius: 12px;
            margin-top: 30px;
            border: 1px solid rgba(77, 159, 255, 0.15);
          }
          .link-fallback p {
            color: #636E72;
            font-size: 13px;
            text-align: center;
            margin: 0 0 12px 0;
          }
          .link-fallback a {
            word-break: break-all;
            color: #4D9FFF;
            font-size: 12px;
            font-weight: 600;
          }
          .security-tips {
            background: rgba(6, 214, 160, 0.06);
            padding: 24px;
            border-radius: 16px;
            border: 1.5px solid rgba(6, 214, 160, 0.2);
            margin: 30px 0;
          }
          .security-tips h4 {
            margin: 0 0 12px 0;
            color: #04B884;
            font-size: 16px;
            font-weight: 700;
          }
          .security-tips ul {
            margin: 0;
            padding-left: 20px;
            color: #636E72;
            font-size: 14px;
            line-height: 1.8;
          }
          .security-tips li {
            margin: 8px 0;
          }
          .footer { 
            text-align: center; 
            padding: 35px 40px;
            background: #F4F8FF;
            color: #B2BEC3; 
            font-size: 13px;
          }
          .footer p {
            margin: 6px 0;
          }
          .footer strong {
            color: #1A3A6B;
            font-weight: 700;
          }
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(77, 159, 255, 0.2), transparent);
            margin: 30px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-content">
              <span class="emoji">🔐</span>
              <h1>Réinitialisation de mot de passe</h1>
              <p>Sécurisez votre compte SIAPET</p>
            </div>
          </div>
          
          <div class="content">
            <p class="greeting">Bonjour ${prenom} ${nom},</p>
            
            <p class="message">
              Vous avez demandé la réinitialisation de votre mot de passe SIAPET. 
              Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe sécurisé.
            </p>

            <div class="btn-container">
              <a href="${resetUrl}" class="btn">
                Réinitialiser mon mot de passe →
              </a>
            </div>

            <div class="warning">
              <strong>⚠️ Important - Sécurité</strong>
              <p>Ce lien est valide pendant <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email et votre mot de passe restera inchangé.</p>
            </div>

            <div class="divider"></div>

            <div class="security-tips">
              <h4>🛡️ Conseils de sécurité</h4>
              <ul>
                <li>Utilisez un mot de passe unique et complexe</li>
                <li>Combinez lettres majuscules, minuscules, chiffres et symboles</li>
                <li>Ne partagez jamais votre mot de passe</li>
                <li>Changez régulièrement votre mot de passe</li>
              </ul>
            </div>

            <div class="link-fallback">
              <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
              <a href="${resetUrl}">${resetUrl}</a>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>© 2026 SIAPET</strong></p>
            <p>Système d'Information et d'Aide à la Planification de l'Enseignement en Tunisie</p>
            <p>Ministère de l'Enseignement Supérieur et de la Recherche Scientifique</p>
            <p style="margin-top: 20px; font-size: 12px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};

// Envoyer email d'acceptation de demande avec identifiants
const sendAccessGrantedEmail = async ({
  email,
  nom,
  prenom,
  numeroUtilisateur,
  motDePasse,
  matricule,
  typeActeur,
}) => {
  const { loadTemplate, getTemplateForRole } = require("./emailTemplateLoader");

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const templateName = getTemplateForRole(typeActeur);

  // Charger et remplir le template
  const htmlContent = loadTemplate(templateName, {
    prenom,
    nom,
    numeroUtilisateur,
    matricule: matricule || "N/A",
    email,
    motDePasse,
    frontendUrl,
  });

  // Si le template n'a pas pu être chargé, utiliser un fallback
  if (!htmlContent) {
    console.warn(`⚠️ Utilisation du template fallback pour ${typeActeur}`);
    return sendGenericAccessGrantedEmail({
      email,
      nom,
      prenom,
      numeroUtilisateur,
      motDePasse,
      matricule,
      typeActeur,
    });
  }

  const roleText = {
    etudiant: "Étudiant",
    enseignant: "Enseignant",
    directeur: "Directeur",
    recteur: "Recteur",
  }[typeActeur];

  const mailOptions = {
    from: `"SIAPET" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `SIAPET - Bienvenue ${roleText}! Votre compte est activé 🎉`,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email d'acceptation envoyé à ${email} (${typeActeur})`);
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return { success: false, error: error.message };
  }
};

// Fonction fallback pour envoyer un email générique
const sendGenericAccessGrantedEmail = async ({
  email,
  nom,
  prenom,
  numeroUtilisateur,
  motDePasse,
  matricule,
  typeActeur,
}) => {
  const roleText = {
    etudiant: "Étudiant",
    enseignant: "Enseignant",
    directeur: "Directeur",
    recteur: "Recteur",
  }[typeActeur];

  const mailOptions = {
    from: `"SIAPET" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "SIAPET - Votre demande d'accès a été acceptée ! 🎉",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
          
          body { 
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; 
            line-height: 1.6; 
            color: #2D2926;
            margin: 0;
            padding: 0;
            background: #E8F1FB;
          }
          .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: white;
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(16, 185, 129, 0.25);
          }
          .header { 
            background: linear-gradient(135deg, #10B981 0%, #059669 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center;
          }
          .header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            margin: 0 0 10px 0;
            letter-spacing: -0.02em;
          }
          .header p {
            margin: 0;
            opacity: 0.95;
            font-size: 14px;
          }
          .content { 
            padding: 40px 30px;
            background: white;
          }
          .content h2 {
            font-size: 20px;
            color: #2D2926;
            margin: 0 0 15px 0;
          }
          .success-badge {
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            display: inline-block;
            font-weight: 700;
            font-size: 14px;
            margin: 20px 0;
          }
          .info-box { 
            background: linear-gradient(145deg, rgba(16, 185, 129, 0.06), rgba(5, 150, 105, 0.06));
            padding: 25px; 
            margin: 25px 0; 
            border-radius: 14px; 
            border: 2px solid rgba(16, 185, 129, 0.15);
          }
          .info-box h3 {
            margin: 0 0 15px 0;
            font-size: 16px;
            color: #2D2926;
          }
          .info-item {
            margin: 12px 0;
            font-size: 14px;
          }
          .info-item strong {
            color: #6B6560;
            font-weight: 600;
          }
          .credential { 
            display: inline-block;
            font-size: 18px; 
            font-weight: 700; 
            color: #10B981;
            background: rgba(16, 185, 129, 0.08);
            padding: 4px 12px;
            border-radius: 8px;
            margin-left: 8px;
            font-family: 'Courier New', monospace;
          }
          .warning { 
            background: rgba(245, 158, 11, 0.08);
            padding: 20px; 
            border-radius: 12px; 
            border-left: 4px solid #F59E0B; 
            margin: 25px 0;
          }
          .warning strong {
            color: #92400E;
            display: block;
            margin-bottom: 8px;
          }
          .warning p {
            margin: 0;
            color: #92400E;
            font-size: 14px;
          }
          .btn-container {
            text-align: center;
            margin: 35px 0;
          }
          .btn { 
            display: inline-block;
            background: linear-gradient(135deg, #10B981 0%, #059669 100%); 
            color: white; 
            padding: 16px 40px; 
            text-decoration: none; 
            border-radius: 12px;
            font-weight: 700;
            font-size: 15px;
            box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
            transition: all 0.3s;
          }
          .btn:hover {
            box-shadow: 0 6px 24px rgba(16, 185, 129, 0.4);
          }
          .steps {
            background: rgba(16, 185, 129, 0.06);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid rgba(16, 185, 129, 0.2);
            margin: 25px 0;
          }
          .steps h4 {
            margin: 0 0 12px 0;
            color: #059669;
            font-size: 15px;
          }
          .steps ol {
            margin: 0;
            padding-left: 20px;
          }
          .steps li {
            margin: 8px 0;
            color: #2D2926;
            font-size: 14px;
          }
          .footer { 
            text-align: center; 
            padding: 30px;
            background: #E8F1FB;
            color: #A89F96; 
            font-size: 12px;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Félicitations !</h1>
            <p>Votre demande d'accès a été acceptée</p>
          </div>
          
          <div class="content">
            <h2>Bonjour ${prenom} ${nom},</h2>
            
            <div class="success-badge">
              ✓ Demande acceptée - Compte ${roleText} créé
            </div>
            
            <p>Nous avons le plaisir de vous informer que votre demande d'accès à la plateforme SIAPET a été <strong>acceptée</strong> par l'administration.</p>
            
            <div class="info-box">
              <h3>🔑 Vos identifiants de connexion</h3>
              <div class="info-item">
                <strong>Numéro utilisateur :</strong>
                <span class="credential">${numeroUtilisateur}</span>
              </div>
              ${matricule ? `<div class="info-item"><strong>Matricule :</strong><span class="credential">${matricule}</span></div>` : ""}
              <div class="info-item">
                <strong>Email :</strong> ${email}
              </div>
              <div class="info-item">
                <strong>Mot de passe temporaire :</strong>
                <span class="credential">${motDePasse}</span>
              </div>
            </div>

            <div class="warning">
              <strong>⚠️ Important - Sécurité</strong>
              <p>Pour des raisons de sécurité, vous devrez <strong>obligatoirement changer votre mot de passe</strong> lors de votre première connexion.</p>
            </div>

            <div class="steps">
              <h4>💡 Prochaines étapes</h4>
              <ol>
                <li>Cliquez sur le bouton ci-dessous pour accéder à la plateforme</li>
                <li>Connectez-vous avec votre email et le mot de passe temporaire</li>
                <li>Changez votre mot de passe lors de votre première connexion</li>
                <li>Complétez votre profil et explorez les fonctionnalités</li>
              </ol>
            </div>

            <div class="btn-container">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" class="btn">
                Accéder à SIAPET →
              </a>
            </div>

            <p style="color: #A89F96; font-size: 13px; text-align: center; margin-top: 30px;">
              Si vous rencontrez des difficultés, contactez l'administrateur système.
            </p>
          </div>
          
          <div class="footer">
            <p><strong>© 2026 SIAPET</strong></p>
            <p>Ministère de l'Enseignement Supérieur et de la Recherche Scientifique</p>
            <p style="margin-top: 15px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return { success: false, error: error.message };
  }
};

// Envoyer un email générique (pour le broadcast)
const sendEmail = async (to, subject, message) => {
  // Si le message contient déjà du HTML complet (<!DOCTYPE html>), l'utiliser directement
  const isFullHTML = message.trim().toLowerCase().startsWith("<!doctype html>");

  const mailOptions = {
    from: `"SIAPET" <${process.env.SMTP_USER}>`,
    to: to,
    subject: subject,
    html: isFullHTML
      ? message
      : `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
          
          body { 
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; 
            line-height: 1.6; 
            color: #2D2926;
            margin: 0;
            padding: 0;
            background: #E8F1FB;
          }
          .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: white;
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(30, 112, 235, 0.25);
          }
          .header { 
            background: linear-gradient(135deg, #1E70EB 0%, #0D4CB3 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center;
          }
          .header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            margin: 0;
            letter-spacing: -0.02em;
          }
          .content { 
            padding: 40px 30px;
            background: white;
          }
          .message {
            white-space: pre-wrap;
            line-height: 1.8;
            color: #2D2926;
            font-size: 15px;
          }
          .footer { 
            text-align: center; 
            padding: 30px;
            background: #E8F1FB;
            color: #A89F96; 
            font-size: 12px;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 ${subject}</h1>
          </div>
          
          <div class="content">
            <div class="message">${message.replace(/\n/g, "<br>")}</div>
          </div>
          
          <div class="footer">
            <p><strong>© 2026 SIAPET</strong></p>
            <p>Ministère de l'Enseignement Supérieur et de la Recherche Scientifique</p>
            <p style="margin-top: 15px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email:", error);
    throw error;
  }
};

// Envoyer un email de broadcast personnalisé par rôle
const sendBroadcastEmail = async ({
  email,
  nom,
  prenom,
  role,
  subject,
  message,
}) => {
  const {
    loadTemplate,
    getBroadcastTemplateForRole,
  } = require("./emailTemplateLoader");

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const templateName = getBroadcastTemplateForRole(role);

  // Charger et remplir le template
  const htmlContent = loadTemplate(templateName, {
    prenom,
    nom,
    subject,
    message,
    frontendUrl,
  });

  // Si le template n'a pas pu être chargé, utiliser sendEmail générique
  if (!htmlContent) {
    console.warn(
      `⚠️ Template broadcast non trouvé pour ${role}, utilisation email générique`,
    );
    return sendEmail(email, subject, message);
  }

  const roleText =
    {
      etudiant: "Étudiant",
      enseignant: "Enseignant",
      directeur: "Directeur",
      recteur: "Recteur",
    }[role] || "Utilisateur";

  const mailOptions = {
    from: `"SIAPET" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `SIAPET - ${subject}`,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email broadcast envoyé à ${email} (${role})`);
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email broadcast:", error);
    return { success: false, error: error.message };
  }
};

// Envoyer email de refus de demande
const sendAccessRejectedEmail = async ({
  email,
  nom,
  prenom,
  typeActeur,
  motif,
}) => {
  const roleText = {
    etudiant: "Étudiant",
    enseignant: "Enseignant",
    directeur: "Directeur",
    recteur: "Recteur",
  }[typeActeur];

  const mailOptions = {
    from: `"SIAPET" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "SIAPET - Mise à jour de votre demande d'accès",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
          
          body { 
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; 
            line-height: 1.6; 
            color: #2D2926;
            margin: 0;
            padding: 0;
            background: #E8F1FB;
          }
          .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: white;
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(239, 68, 68, 0.25);
          }
          .header { 
            background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center;
          }
          .header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            margin: 0 0 10px 0;
            letter-spacing: -0.02em;
          }
          .header p {
            margin: 0;
            opacity: 0.95;
            font-size: 14px;
          }
          .content { 
            padding: 40px 30px;
            background: white;
          }
          .content h2 {
            font-size: 20px;
            color: #2D2926;
            margin: 0 0 15px 0;
          }
          .info-box { 
            background: rgba(239, 68, 68, 0.06);
            padding: 25px; 
            margin: 25px 0; 
            border-radius: 14px; 
            border: 2px solid rgba(239, 68, 68, 0.15);
          }
          .info-box h3 {
            margin: 0 0 15px 0;
            font-size: 16px;
            color: #DC2626;
          }
          .info-box p {
            margin: 0;
            color: #2D2926;
            font-size: 14px;
            line-height: 1.6;
          }
          .btn-container {
            text-align: center;
            margin: 35px 0;
          }
          .btn { 
            display: inline-block;
            background: #1E3A5F; 
            color: #FFFFFF !important; 
            padding: 16px 40px; 
            text-decoration: none; 
            border-radius: 12px;
            font-weight: 700;
            font-size: 15px;
            box-shadow: 0 4px 16px rgba(30, 58, 95, 0.3);
          }
          .btn:hover {
            background: #152B47;
            box-shadow: 0 6px 24px rgba(30, 58, 95, 0.4);
          }
          .footer { 
            text-align: center; 
            padding: 30px;
            background: #E8F1FB;
            color: #A89F96; 
            font-size: 12px;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Mise à jour de votre demande</h1>
            <p>Demande d'accès ${roleText}</p>
          </div>
          
          <div class="content">
            <h2>Bonjour ${prenom} ${nom},</h2>
            
            <p>Nous vous remercions pour votre demande d'accès à la plateforme SIAPET.</p>
            
            <p>Après examen de votre dossier, nous regrettons de vous informer que votre demande n'a pas pu être acceptée pour le moment.</p>
            
            <div class="info-box">
              <h3>📝 Motif</h3>
              <p>${motif}</p>
            </div>

            <p>Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez obtenir plus d'informations, n'hésitez pas à contacter l'administration.</p>

            <p style="margin-top: 25px;"><strong>Vous pouvez soumettre une nouvelle demande</strong> en corrigeant les points mentionnés ci-dessus.</p>

            <div class="btn-container">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/demande-acces" class="btn">
                Soumettre une nouvelle demande →
              </a>
            </div>

            <p style="color: #A89F96; font-size: 13px; text-align: center; margin-top: 30px;">
              Pour toute question, contactez l'administrateur système.
            </p>
          </div>
          
          <div class="footer">
            <p><strong>© 2026 SIAPET</strong></p>
            <p>Ministère de l'Enseignement Supérieur et de la Recherche Scientifique</p>
            <p style="margin-top: 15px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAccessGrantedEmail,
  sendAccessRejectedEmail,
  sendEmail,
  sendBroadcastEmail,
};
