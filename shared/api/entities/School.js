import { firebaseClient } from '../base44Client.js';

export const list = (orderBy = '-created_date', limit = null) => firebaseClient.entities.School.list(orderBy, limit);

export const filter = (filters = {}, limit = null) => firebaseClient.entities.School.filter(filters, limit);

export const create = (data) => firebaseClient.entities.School.create(data);

export const update = (id, data) => firebaseClient.entities.School.update(id, data);

export const remove = (id) => firebaseClient.entities.School.delete(id);