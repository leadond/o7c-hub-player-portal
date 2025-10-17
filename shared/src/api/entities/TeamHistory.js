import { firebaseClient } from '../base44Client.js';

export const list = (filters = {}) => firebaseClient.entities.get('/TeamHistory', filters);

export const create = (data) => firebaseClient.entities.post('/TeamHistory', data);

export const update = (id, data) => firebaseClient.entities.put(`/TeamHistory/${id}`, data);

export const remove = (id) => firebaseClient.entities.delete(`/TeamHistory/${id}`);