import { firebaseClient } from '../base44Client.js';

export const list = (orderBy = '-created_date', limit = null) => firebaseClient.entities.TeamFee.list(orderBy, limit);

export const filter = (filters = {}, limit = null) => firebaseClient.entities.TeamFee.filter(filters, limit);

export const create = (data) => firebaseClient.entities.TeamFee.create(data);

export const update = (id, data) => firebaseClient.entities.TeamFee.update(id, data);

export const remove = (id) => firebaseClient.entities.TeamFee.delete(id);