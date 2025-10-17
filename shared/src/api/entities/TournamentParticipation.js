import { firebaseClient } from '../base44Client.js';

export const list = (filters = {}) => firebaseClient.entities.get('/TournamentParticipation', filters);

export const create = (data) => firebaseClient.entities.post('/TournamentParticipation', data);

export const update = (id, data) => firebaseClient.entities.put(`/TournamentParticipation/${id}`, data);

export const remove = (id) => firebaseClient.entities.delete(`/TournamentParticipation/${id}`);