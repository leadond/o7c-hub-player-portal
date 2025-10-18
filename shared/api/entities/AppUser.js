import { firebaseClient } from '../base44Client.js';

export const list = (options = {}) => {
  const { sort = '-createdAt', limit = null } = options;
  return firebaseClient.entities.AppUser.list(sort, limit);
};

export const fetchUsers = () => {
  return list();
};

export const filter = (filters = {}, limit = null) => firebaseClient.entities.AppUser.filter(filters, limit);

export const create = (data) => firebaseClient.entities.AppUser.create(data);

export const update = (id, data) => firebaseClient.entities.AppUser.update(id, data);

export const remove = (id) => firebaseClient.entities.AppUser.delete(id);