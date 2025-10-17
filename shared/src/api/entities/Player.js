import { firebaseClient } from '../base44Client.js';

export const list = (options = {}) => {
  const { sort = '-stars', limit = null } = options;
  return firebaseClient.entities.Player.list(sort, limit);
};

export const fetchPlayers = () => {
  return list();
};

export const filter = (filters = {}, limit = null) => firebaseClient.entities.Player.filter(filters, limit);

export const create = (data) => firebaseClient.entities.Player.create(data);

export const update = (id, data) => firebaseClient.entities.Player.update(id, data);

export const remove = (id) => firebaseClient.entities.Player.delete(id);