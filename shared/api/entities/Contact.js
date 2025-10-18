import { firebaseClient } from '../base44Client.js';

export const list = (options = {}) => {
  const { sort = '-created_date', limit = null } = options;
  return firebaseClient.entities.Contact.list(sort, limit);
};

export const filter = (filters = {}, limit = null) => firebaseClient.entities.Contact.filter(filters, limit);

export const create = (data) => firebaseClient.entities.Contact.create(data);

export const update = (id, data) => firebaseClient.entities.Contact.update(id, data);

export const remove = (id) => firebaseClient.entities.Contact.delete(id);