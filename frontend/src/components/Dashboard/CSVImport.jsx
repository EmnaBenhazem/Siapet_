import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  IconButton,
  MenuItem,
  TextField,
  Paper,
  Grid,
} from '@mui/material';
import { 
  Close, 
  CloudUpload, 
  CheckCircle, 
  Error, 
  Warning,
  Download,
  Visibility,
} from '@mui/icons-material';
import Papa from 'papaparse';
import api from '../../services/api';

const C = {
  navy: '#1A3A6B',
  blue: '#4D9FFF',
  blueL: '#EAF4FF',
  orange: '#FF6B35',
  green: '#06D6A0',
  purple: '#7B2CBF',
};

const CSVImport = ({ open, onClose, onSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [userType, setUserType] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const steps = ['Choisir le type', 'Charger le CSV', 'Valider', 'Importer'];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = (file) => {
    if (!file.name.endsWith('.csv')) {
      alert('Veuillez sélectionner un fichier CSV');
      return;
    }

    setCsvFile(file);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        setActiveStep(2);
      },
      error: (error) => {
        console.error('Erreur lors du parsing CSV:', error);
        alert('Erreur lors de la lecture du fichier CSV');
      },
    });
  };

  const handleValidate = async () => {
    setLoading(true);
    try {
      const res = await api.post('/csv-import/validate', { csvData });
      setValidationResults(res.data);
      if (res.data.summary.hasErrors) {
        // Rester sur l'étape de validation
      } else {
        setActiveStep(3);
      }
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      alert('Erreur lors de la validation du CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const res = await api.post('/csv-import/import', { csvData });
      setImportResults(res.data.results);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'import du CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/csv-import/template?type=${userType}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_${userType}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors du téléchargement du template:', error);
      alert('Erreur lors du téléchargement du template');
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setUserType('');
    setCsvFile(null);
    setCsvData([]);
    setValidationResults(null);
    setImportResults(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: `linear-gradient(135deg, ${C.navy} 0%, ${C.blue} 100%)`,
        color: '#fff',
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            📥 Import CSV en masse
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Importez plusieurs utilisateurs en une seule fois
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: '#fff' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, mt: 2 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Étape 1: Choisir le type */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Sélectionnez le type d'utilisateurs à importer
            </Typography>
            <TextField
              select
              fullWidth
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              label="Type d'utilisateur"
              sx={{ mb: 3 }}
            >
              <MenuItem value="ENSEIGNANT">👨‍🏫 Enseignants</MenuItem>
              <MenuItem value="ETUDIANT">👨‍🎓 Étudiants</MenuItem>
              <MenuItem value="DIRECTEUR">👨‍💼 Directeurs</MenuItem>
              <MenuItem value="RECTEUR">👨‍💼 Recteurs</MenuItem>
            </TextField>

            {userType && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <AlertTitle>Template CSV disponible</AlertTitle>
                Téléchargez le template CSV pour {userType.toLowerCase()}s avec les colonnes requises
              </Alert>
            )}
          </Box>
        )}

        {/* Étape 2: Charger le CSV */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Chargez votre fichier CSV
            </Typography>

            <Box
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              sx={{
                border: `2px dashed ${dragActive ? C.blue : '#D1D5DB'}`,
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                background: dragActive ? `${C.blueL}` : '#F9FAFB',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: C.blue,
                  background: C.blueL,
                },
              }}
              onClick={() => document.getElementById('csv-file-input').click()}
            >
              <CloudUpload sx={{ fontSize: 48, color: C.blue, mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Glissez-déposez votre fichier CSV ici
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                ou cliquez pour sélectionner un fichier
              </Typography>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {csvFile && (
                <Chip 
                  label={csvFile.name} 
                  color="primary" 
                  sx={{ mt: 2 }}
                  onDelete={() => {
                    setCsvFile(null);
                    setCsvData([]);
                  }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Étape 3: Valider */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Prévisualisation et validation
            </Typography>

            {!validationResults ? (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {csvData.length} ligne(s) détectée(s). Cliquez sur "Valider" pour vérifier les données.
                </Alert>

                <TableContainer component={Paper} sx={{ maxHeight: 400, mb: 2 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Ligne</TableCell>
                        {csvData[0] && Object.keys(csvData[0]).map((key) => (
                          <TableCell key={key} sx={{ fontWeight: 700 }}>{key}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {csvData.slice(0, 10).map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          {Object.values(row).map((value, i) => (
                            <TableCell key={i}>{value}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {csvData.length > 10 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    ... et {csvData.length - 10} ligne(s) supplémentaire(s)
                  </Typography>
                )}
              </>
            ) : (
              <>
                {/* Résumé de validation */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, background: `${C.green}10`, border: `1px solid ${C.green}30` }}>
                      <CheckCircle sx={{ color: C.green, fontSize: 32, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700, color: C.green }}>
                        {validationResults.summary.valid}
                      </Typography>
                      <Typography variant="body2">Lignes valides</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, background: `${C.orange}10`, border: `1px solid ${C.orange}30` }}>
                      <Error sx={{ color: C.orange, fontSize: 32, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700, color: C.orange }}>
                        {validationResults.summary.invalid}
                      </Typography>
                      <Typography variant="body2">Lignes invalides</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, background: `${C.blue}10`, border: `1px solid ${C.blue}30` }}>
                      <Visibility sx={{ color: C.blue, fontSize: 32, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700, color: C.blue }}>
                        {validationResults.summary.total}
                      </Typography>
                      <Typography variant="body2">Total lignes</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Erreurs */}
                {validationResults.errors.length > 0 && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <AlertTitle>Erreurs détectées ({validationResults.errors.length})</AlertTitle>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {validationResults.errors.slice(0, 5).map((error, i) => (
                        <Typography component="li" key={i} variant="body2">
                          {error}
                        </Typography>
                      ))}
                      {validationResults.errors.length > 5 && (
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                          ... et {validationResults.errors.length - 5} erreur(s) supplémentaire(s)
                        </Typography>
                      )}
                    </Box>
                  </Alert>
                )}

                {/* Avertissements */}
                {validationResults.warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <AlertTitle>Avertissements ({validationResults.warnings.length})</AlertTitle>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {validationResults.warnings.slice(0, 3).map((warning, i) => (
                        <Typography component="li" key={i} variant="body2">
                          {warning}
                        </Typography>
                      ))}
                    </Box>
                  </Alert>
                )}
              </>
            )}
          </Box>
        )}

        {/* Étape 4: Importer */}
        {activeStep === 3 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              {importResults ? 'Résultats de l\'import' : 'Prêt à importer'}
            </Typography>

            {!importResults ? (
              <Alert severity="success">
                <AlertTitle>Validation réussie !</AlertTitle>
                {validationResults?.summary.valid} utilisateur(s) prêt(s) à être importé(s).
                Les mots de passe temporaires seront générés automatiquement et envoyés par email.
              </Alert>
            ) : (
              <>
                <Alert severity={importResults.failed === 0 ? 'success' : 'warning'} sx={{ mb: 3 }}>
                  <AlertTitle>Import terminé</AlertTitle>
                  {importResults.success} succès, {importResults.failed} échec(s)
                </Alert>

                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Ligne</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Nom</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Mot de passe</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importResults.details.map((detail, index) => (
                        <TableRow key={index}>
                          <TableCell>{detail.lineNumber}</TableCell>
                          <TableCell>{detail.nom}</TableCell>
                          <TableCell>{detail.email}</TableCell>
                          <TableCell>
                            <Chip 
                              label={detail.status === 'success' ? 'Succès' : 'Échec'}
                              size="small"
                              color={detail.status === 'success' ? 'success' : 'error'}
                            />
                          </TableCell>
                          <TableCell>
                            {detail.tempPassword ? (
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {detail.tempPassword}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="error">
                                {detail.error}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        {activeStep === 0 && (
          <>
            {userType && (
              <Button
                startIcon={<Download />}
                onClick={handleDownloadTemplate}
                sx={{ mr: 'auto' }}
              >
                Télécharger le template
              </Button>
            )}
            <Button onClick={handleClose}>Annuler</Button>
            <Button
              variant="contained"
              onClick={() => setActiveStep(1)}
              disabled={!userType}
            >
              Suivant
            </Button>
          </>
        )}

        {activeStep === 1 && (
          <>
            <Button onClick={() => setActiveStep(0)}>Retour</Button>
            <Button onClick={handleClose}>Annuler</Button>
          </>
        )}

        {activeStep === 2 && (
          <>
            <Button onClick={() => setActiveStep(1)}>Retour</Button>
            <Button onClick={handleClose}>Annuler</Button>
            {!validationResults ? (
              <Button
                variant="contained"
                onClick={handleValidate}
                disabled={loading || csvData.length === 0}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? 'Validation...' : 'Valider'}
              </Button>
            ) : validationResults.summary.hasErrors ? (
              <Button
                variant="contained"
                color="warning"
                onClick={() => {
                  setValidationResults(null);
                  setActiveStep(1);
                }}
              >
                Corriger le CSV
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => setActiveStep(3)}
              >
                Continuer
              </Button>
            )}
          </>
        )}

        {activeStep === 3 && (
          <>
            {!importResults && (
              <>
                <Button onClick={() => setActiveStep(2)}>Retour</Button>
                <Button onClick={handleClose}>Annuler</Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleImport}
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  {loading ? 'Import en cours...' : 'Importer'}
                </Button>
              </>
            )}
            {importResults && (
              <Button variant="contained" onClick={handleClose}>
                Terminer
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CSVImport;
