import { firebaseClient } from '../base44Client.js';

export const list = (orderBy = '-created_date', limit = null) => firebaseClient.entities.Coach.list(orderBy, limit);

export const filter = (filters = {}, limit = null) => firebaseClient.entities.Coach.filter(filters, limit);

export const create = (data) => firebaseClient.entities.Coach.create(data);

export const update = (id, data) => firebaseClient.entities.Coach.update(id, data);

export const remove = (id) => firebaseClient.entities.Coach.delete(id);