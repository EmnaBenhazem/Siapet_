import React, { createContext, useContext, useState, useEffect } from 'react';
import socketService from '../services/socketService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState({
    email: true,
    push: true,
    sms: false,
    rapports: true,
    demandes: true,
    activite: false,
  });

  // Charger les notifications depuis localStorage au démarrage
  useEffect(() => {
    const savedNotifs = localStorage.getItem('notifications');
    const savedPrefs = localStorage.getItem('notificationPreferences');
    
    if (savedNotifs) {
      try {
        const parsed = JSON.parse(savedNotifs);
        setNotifications(parsed.map(n => ({ 
          ...n, 
          timestamp: new Date(n.timestamp) 
        })));
      } catch (e) {
        console.error('Erreur chargement notifications:', e);
      }
    }

    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (e) {
        console.error('Erreur chargement préférences:', e);
      }
    }

    // Connecter Socket.IO
    socketService.connect();

    // Écouter les nouvelles demandes d'accès
    const handleNouvelleDemande = (data) => {
      console.log('🔔 NotificationContext: Nouvelle demande reçue:', data);
      
      const notification = {
        id: Date.now(),
        type: 'nouvelle-demande',
        title: `Nouvelle demande d'accès ${data.type_acteur}`,
        message: `${data.nom} ${data.prenom} (${data.email})`,
        timestamp: new Date(),
        read: false,
        icon: getRoleEmoji(data.type_acteur),
        data,
      };

      setNotifications(prev => [notification, ...prev]);

      // Jouer un son si les notifications push sont activées
      if (preferences.push) {
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => {});
        } catch {}
      }
    };

    socketService.on('nouvelle-demande', handleNouvelleDemande);

    return () => {
      socketService.off('nouvelle-demande', handleNouvelleDemande);
    };
  }, [preferences.push]);

  // Sauvegarder les notifications dans localStorage
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, 50)));
    } else {
      localStorage.removeItem('notifications');
    }
  }, [notifications]);

  // Sauvegarder les préférences dans localStorage
  useEffect(() => {
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
  }, [preferences]);

  const getRoleEmoji = (role) => {
    const emojis = {
      etudiant: '🎓',
      enseignant: '👨‍🏫',
      directeur: '👔',
      recteur: '🏛️',
    };
    return emojis[role] || '👤';
  };

  const addNotification = (notification) => {
    const newNotif = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('notifications');
  };

  const togglePreference = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    preferences,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    togglePreference,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
