import { firebaseClient } from '../base44Client.js';

export const list = (orderBy = '-created_date', limit = null) => firebaseClient.entities.CoachAssignment.list(orderBy, limit);

export const filter = (filters = {}, limit = null) => firebaseClient.entities.CoachAssignment.filter(filters, limit);

export const create = (data) => firebaseClient.entities.CoachAssignment.create(data);

export const update = (id, data) => firebaseClient.entities.CoachAssignment.update(id, data);

export const remove = (id) => firebaseClient.entities.CoachAssignment.delete(id);