import api from './api';

const mlService = {
  predireReussite:    (data) => api.post('/predictions/reussite',    data),
  predireRisque:      (data) => api.post('/predictions/risque',      data),
  predirePerformance: (data) => api.post('/predictions/performance', data),
  statut:             ()     => api.get('/predictions/status'),
};

export default mlService;
