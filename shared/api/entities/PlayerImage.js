import { firebaseClient } from '../base44Client.js';

export const list = (filters = {}) => firebaseClient.entities.PlayerImage.filter(filters);

export const create = (data) => firebaseClient.entities.PlayerImage.create(data);

export const update = (id, data) => firebaseClient.entities.PlayerImage.update(id, data);

export const remove = (id) => firebaseClient.entities.PlayerImage.delete(id);