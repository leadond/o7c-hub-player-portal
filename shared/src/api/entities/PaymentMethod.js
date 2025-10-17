import { firebaseClient } from '../base44Client.js';

export const list = (orderBy = '-created_date', limit = null) => firebaseClient.entities.PaymentMethod.list(orderBy, limit);

export const filter = (filters = {}, limit = null) => firebaseClient.entities.PaymentMethod.filter(filters, limit);

export const create = (data) => firebaseClient.entities.PaymentMethod.create(data);

export const update = (id, data) => firebaseClient.entities.PaymentMethod.update(id, data);

export const remove = (id) => firebaseClient.entities.PaymentMethod.delete(id);