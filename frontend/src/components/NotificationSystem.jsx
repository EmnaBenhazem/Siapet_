import { useState, useEffect } from 'react';
import { Snackbar, Alert, Badge, IconButton, Menu, MenuItem, Typography, Box, Divider } from '@mui/material';
import { Notifications as NotificationsIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationSystem = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  // Afficher un snackbar quand une nouvelle notification arrive
  useEffect(() => {
    if (notifications.length > 0 && !notifications[0].read) {
      const latestNotif = notifications[0];
      setSnackbar({
        open: true,
        message: `📋 ${latestNotif.title}`,
        severity: 'info',
      });
    }
  }, [notifications]);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    handleCloseMenu();
    
    // Rediriger vers la page appropriée selon le type
    if (notif.type === 'nouvelle-demande') {
      navigate('/dashboard/admin/demandes-acces');
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const getRoleEmoji = (role) => {
    const emojis = {
      etudiant: '🎓',
      enseignant: '👨‍🏫',
      directeur: '👔',
      recteur: '🏛️',
    };
    return emojis[role] || '👤';
  };

  return (
    <>
      {/* Icône de notification avec badge */}
      <IconButton
        color="inherit"
        onClick={handleOpenMenu}
        sx={{
          position: 'relative',
          '&:hover': {
            background: 'rgba(255,255,255,0.1)',
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* Menu des notifications */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        slotProps={{
          paper: {
            sx: {
              width: 400,
              maxHeight: 520,
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              mt: 1,
            },
          },
        }}
      >
        <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0' }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#1A3A6B' }}>
              🔔 Notifications
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#8A9BB0', mt: 0.3 }}>
              {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
            </Typography>
          </Box>
          {notifications.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {unreadCount > 0 && (
                <Typography
                  onClick={handleMarkAllRead}
                  sx={{
                    fontSize: '0.75rem',
                    color: '#4D9FFF',
                    cursor: 'pointer',
                    fontWeight: 600,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '6px',
                    '&:hover': { 
                      background: 'rgba(77,159,255,0.1)',
                    },
                  }}
                >
                  Tout marquer lu
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {notifications.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🔕</Typography>
            <Typography sx={{ color: '#1A3A6B', fontSize: '0.95rem', fontWeight: 600, mb: 0.5 }}>
              Aucune notification
            </Typography>
            <Typography sx={{ color: '#8A9BB0', fontSize: '0.8rem' }}>
              Vous serez notifié ici des événements importants
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {notifications.slice(0, 10).map((notif) => (
              <MenuItem
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                sx={{
                  py: 2,
                  px: 2.5,
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  background: notif.read ? 'transparent' : 'rgba(77,159,255,0.05)',
                  borderLeft: notif.read ? 'none' : '3px solid #4D9FFF',
                  borderBottom: '1px solid #F1F5F9',
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: 'rgba(77,159,255,0.08)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%' }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '10px', 
                    background: notif.read ? '#F1F5F9' : 'rgba(77,159,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    flexShrink: 0
                  }}>
                    {notif.icon}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography sx={{ 
                        fontWeight: notif.read ? 600 : 800, 
                        fontSize: '0.9rem', 
                        color: '#1A3A6B',
                        flex: 1
                      }}>
                        {notif.title}
                      </Typography>
                      {!notif.read && (
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          background: '#4D9FFF',
                          flexShrink: 0
                        }} />
                      )}
                    </Box>
                    <Typography sx={{ fontSize: '0.8rem', color: '#64748B', mb: 0.8, lineHeight: 1.4 }}>
                      {notif.message}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        {notif.timestamp.toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleDelete(e, notif.id)}
                        sx={{
                          color: '#94A3B8',
                          '&:hover': { 
                            color: '#EF4444',
                            background: 'rgba(239,68,68,0.1)'
                          },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Box>
        )}

        {notifications.length > 0 && (
          <Box sx={{ 
            p: 1.5, 
            borderTop: '1px solid #E2E8F0',
            textAlign: 'center'
          }}>
            <Typography
              onClick={() => {
                handleCloseMenu();
                navigate('/profile?tab=notifications');
              }}
              sx={{
                fontSize: '0.85rem',
                color: '#4D9FFF',
                cursor: 'pointer',
                fontWeight: 600,
                py: 0.5,
                '&:hover': { 
                  textDecoration: 'underline',
                },
              }}
            >
              Voir toutes les notifications →
            </Typography>
          </Box>
        )}
      </Menu>

      {/* Snackbar pour les notifications en temps réel */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            fontWeight: 600,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationSystem;
