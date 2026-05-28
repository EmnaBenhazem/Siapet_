import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AuthForms.css';

const ChangePassword = ({ isFirstLogin = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ancien_mot_de_passe: '',
    nouveau_mot_de_passe: '',
    confirmer_mot_de_passe: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.nouveau_mot_de_passe !== formData.confirmer_mot_de_passe) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.nouveau_mot_de_passe.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/password/change`,
        {
          ancien_mot_de_passe: formData.ancien_mot_de_passe,
          nouveau_mot_de_passe: formData.nouveau_mot_de_passe,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          if (isFirstLogin) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const role = user.role?.toLowerCase() || 'admin';
            navigate(`/dashboard/${role}`);
          } else {
            navigate(-1);
          }
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="register-container">
        <div className="register-card success-card">
          <div className="success-icon">
            <div className="checkmark">✓</div>
          </div>

          <h1>Mot de passe changé !</h1>
          <p className="success-message">
            Votre mot de passe a été modifié avec succès.
          </p>

          <button
            className="btn-primary"
            onClick={() => {
              if (isFirstLogin) {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const role = user.role?.toLowerCase() || 'admin';
                navigate(`/dashboard/${role}`);
              } else {
                navigate(-1);
              }
            }}
          >
            Continuer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>🔐 Changer le mot de passe</h1>
          {isFirstLogin && (
            <div className="alert alert-info" style={{ marginTop: '20px' }}>
              <span>⚠️</span>
              <div>
                <strong>Première connexion</strong>
                <p>Pour des raisons de sécurité, vous devez changer votre mot de passe temporaire.</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="ancien_mot_de_passe">Mot de passe actuel *</label>
            <input
              type="password"
              id="ancien_mot_de_passe"
              name="ancien_mot_de_passe"
              value={formData.ancien_mot_de_passe}
              onChange={handleChange}
              required
              placeholder="Votre mot de passe actuel"
            />
          </div>

          <div className="form-group">
            <label htmlFor="nouveau_mot_de_passe">Nouveau mot de passe *</label>
            <input
              type="password"
              id="nouveau_mot_de_passe"
              name="nouveau_mot_de_passe"
              value={formData.nouveau_mot_de_passe}
              onChange={handleChange}
              required
              minLength="8"
              placeholder="Minimum 8 caractères"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmer_mot_de_passe">Confirmer le nouveau mot de passe *</label>
            <input
              type="password"
              id="confirmer_mot_de_passe"
              name="confirmer_mot_de_passe"
              value={formData.confirmer_mot_de_passe}
              onChange={handleChange}
              required
              minLength="8"
              placeholder="Retapez votre nouveau mot de passe"
            />
          </div>

          <div className="alert alert-info">
            <span>💡</span>
            <div>
              <strong>Conseils pour un mot de passe sécurisé :</strong>
              <ul>
                <li>Au moins 8 caractères</li>
                <li>Mélangez majuscules et minuscules</li>
                <li>Incluez des chiffres et des caractères spéciaux</li>
                <li>Évitez les informations personnelles</li>
              </ul>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Modification...' : 'Changer le mot de passe'}
          </button>

          {!isFirstLogin && (
            <div className="form-footer">
              <p>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate(-1); }}>
                  ← Annuler
                </a>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
