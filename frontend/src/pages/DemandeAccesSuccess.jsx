import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Typography, Button, Chip, keyframes } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import HomeIcon from '@mui/icons-material/Home';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const iconAnimation = keyframes`
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const DemandeAccesSuccess = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #E8EAF6 0%, #F3E5F5 100%)',
        padding: 3,
      }}
    >
      <Card
        sx={{
          maxWidth: 650,
          width: '100%',
          borderRadius: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          overflow: 'visible',
          animation: `${fadeIn} 0.6s ease-out`,
          position: 'relative',
          background: '#FEFEFE',
          borderTop: '4px solid #10B981',
        }}
      >
        <Box sx={{ p: 6, textAlign: 'center' }}>
          {/* Success Icon */}
          <Box
            sx={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '-90px auto 32px',
              boxShadow: '0 15px 50px rgba(16, 185, 129, 0.4)',
              animation: `${iconAnimation} 0.6s ease-out`,
              position: 'relative',
            }}
          >
            <CheckIcon
              sx={{
                fontSize: '80px',
                color: '#1E3A5F',
                fontWeight: 'bold',
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            sx={{
              fontSize: '38px',
              fontWeight: 900,
              color: '#1E3A5F',
              mb: 3,
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            Demande envoyée ! 🎉
          </Typography>

          {/* Description */}
          <Typography
            sx={{
              fontSize: '17px',
              color: '#8B92A8',
              mb: 2,
              lineHeight: 1.8,
            }}
          >
            Votre demande a été soumise avec succès.
          </Typography>
          <Typography
            sx={{
              fontSize: '17px',
              color: '#8B92A8',
              mb: 4,
              lineHeight: 1.8,
            }}
          >
            L'administration examinera votre dossier et vous recevrez vos identifiants par email si elle est acceptée.
          </Typography>

          {/* Status Badges */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              mb: 5,
              flexWrap: 'wrap',
            }}
          >
            <Chip
              icon={<LockIcon sx={{ fontSize: '18px !important' }} />}
              label="Sécurisé"
              sx={{
                background: '#E0F2FE',
                color: '#0369A1',
                fontWeight: 600,
                fontSize: '15px',
                py: 2.5,
                px: 1,
                height: 'auto',
                '& .MuiChip-icon': {
                  color: '#0369A1',
                },
              }}
            />
            <Chip
              icon={<CheckIcon sx={{ fontSize: '18px !important' }} />}
              label="Soumis"
              sx={{
                background: '#D1FAE5',
                color: '#065F46',
                fontWeight: 600,
                fontSize: '15px',
                py: 2.5,
                px: 1,
                height: 'auto',
                '& .MuiChip-icon': {
                  color: '#065F46',
                },
              }}
            />
            <Chip
              icon={<EmailIcon sx={{ fontSize: '18px !important' }} />}
              label="Email envoyé"
              sx={{
                background: '#DBEAFE',
                color: '#1E40AF',
                fontWeight: 600,
                fontSize: '15px',
                py: 2.5,
                px: 1,
                height: 'auto',
                '& .MuiChip-icon': {
                  color: '#1E40AF',
                },
              }}
            />
          </Box>

          {/* Return button */}
          <Button
            onClick={() => navigate('/')}
            startIcon={<HomeIcon />}
            endIcon={<ArrowForwardIcon />}
            sx={{
              width: '100%',
              py: 2.5,
              borderRadius: '50px',
              background: 'linear-gradient(135deg, #C2410C 0%, #EA580C 100%)',
              color: '#fff',
              fontSize: '17px',
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(194, 65, 12, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #9A3412 0%, #C2410C 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 32px rgba(194, 65, 12, 0.45)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Retour à l'accueil
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default DemandeAccesSuccess;
