import { firebaseClient } from '../base44Client.js';

export const list = (filters = {}) => firebaseClient.entities.get('/Tournament', filters);

export const create = (data) => firebaseClient.entities.post('/Tournament', data);

export const update = (id, data) => firebaseClient.entities.put(`/Tournament/${id}`, data);

export const remove = (id) => firebaseClient.entities.delete(`/Tournament/${id}`);