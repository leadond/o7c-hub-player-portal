import { firebaseClient } from '../base44Client.js';

export const list = (orderBy = '-created_date', limit = null) => firebaseClient.entities.ParentPlayerAssignment.list(orderBy, limit);

export const filter = (filters = {}, limit = null) => firebaseClient.entities.ParentPlayerAssignment.filter(filters, limit);

export const create = (data) => firebaseClient.entities.ParentPlayerAssignment.create(data);

export const update = (id, data) => firebaseClient.entities.ParentPlayerAssignment.update(id, data);

export const remove = (id) => firebaseClient.entities.ParentPlayerAssignment.delete(id);