import { firebaseClient } from '../base44Client.js';

export const create = (data) => firebaseClient.entities.AdditionalFee.create(data);

export const list = (orderBy = '-created_date', limit = null) => firebaseClient.entities.AdditionalFee.list(orderBy, limit);

export const filter = (filters = {}, limit = null) => firebaseClient.entities.AdditionalFee.filter(filters, limit);

export const update = (id, data) => firebaseClient.entities.AdditionalFee.update(id, data);

export const remove = (id) => firebaseClient.entities.AdditionalFee.delete(id);