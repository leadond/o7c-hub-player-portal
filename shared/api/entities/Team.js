import { firebaseClient } from '../base44Client.js';

export const list = (orderBy = '-created_date', limit = null) => firebaseClient.entities.Team.list(orderBy, limit);

export const filter = (filters = {}, limit = null) => firebaseClient.entities.Team.filter(filters, limit);

export const create = (data) => firebaseClient.entities.Team.create(data);

export const update = (id, data) => firebaseClient.entities.Team.update(id, data);

export const remove = (id) => firebaseClient.entities.Team.delete(id);