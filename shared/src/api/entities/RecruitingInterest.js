import { firebaseClient } from '../base44Client.js';

export const list = (filters = {}) => firebaseClient.entities.get('/RecruitingInterest', filters);

export const create = (data) => firebaseClient.entities.post('/RecruitingInterest', data);

export const update = (id, data) => firebaseClient.entities.put(`/RecruitingInterest/${id}`, data);

export const remove = (id) => firebaseClient.entities.delete(`/RecruitingInterest/${id}`);