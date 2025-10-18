import { firebaseClient } from '../base44Client.js';

export const list = (orderBy = '-created_date', limit = null) => firebaseClient.entities.Payment.list(orderBy, limit);

export const filter = (filters = {}, limit = null) => firebaseClient.entities.Payment.filter(filters, limit);

export const create = (data) => firebaseClient.entities.Payment.create(data);

export const update = (id, data) => firebaseClient.entities.Payment.update(id, data);

export const remove = (id) => firebaseClient.entities.Payment.delete(id);