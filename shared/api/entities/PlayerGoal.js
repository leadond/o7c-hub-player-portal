import { base44 } from '../base44Client';

const apiRequest = async (operation, entityName, data) => {
  switch (operation) {
    case 'filter':
      return await base44.entities[entityName].filter(data);
    case 'create':
      return await base44.entities[entityName].create(data);
    case 'update':
      const { id, ...updateData } = data;
      return await base44.entities[entityName].update(id, updateData);
    case 'delete':
      return await base44.entities[entityName].delete(data.id);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
};

const ENTITY_NAME = 'PlayerGoal';

export const filter = async (filters = {}) => {
  try {
    return await apiRequest('filter', ENTITY_NAME, filters);
  } catch (error) {
    console.error(`Error filtering ${ENTITY_NAME}:`, error);
    return [];
  }
};

export const create = async (data) => {
  try {
    return await apiRequest('create', ENTITY_NAME, data);
  } catch (error) {
    console.error(`Error creating ${ENTITY_NAME}:`, error);
    throw error;
  }
};

export const update = async (id, data) => {
  try {
    return await apiRequest('update', ENTITY_NAME, { id, ...data });
  } catch (error) {
    console.error(`Error updating ${ENTITY_NAME}:`, error);
    throw error;
  }
};

export const remove = async (id) => {
  try {
    return await apiRequest('delete', ENTITY_NAME, { id });
  } catch (error) {
    console.error(`Error deleting ${ENTITY_NAME}:`, error);
    throw error;
  }
};