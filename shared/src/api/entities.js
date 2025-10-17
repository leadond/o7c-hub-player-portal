import { firebaseClient } from './base44Client';
import { list, filter, create, update, remove, fetchPlayers } from './entities/Player.js';

// Helper function to create entity operations
const createEntityOperations = (entityName) => {
  return {
    list: (orderBy = '-created_date', limit = null) => firebaseClient.entities[entityName]?.list(orderBy, limit),
    filter: (filters = {}, limit = null) => firebaseClient.entities[entityName]?.filter(filters, limit),
    get: (id) => firebaseClient.entities[entityName]?.get(id),
    create: (data) => firebaseClient.entities[entityName]?.create(data),
    update: (id, data) => firebaseClient.entities[entityName]?.update(id, data),
    delete: (id) => firebaseClient.entities[entityName]?.delete(id),
    bulkCreate: (items) => firebaseClient.entities[entityName]?.bulkCreate(items)
  };
};

// Export all entities
export const Player = {
  ...createEntityOperations('Player'),
  list,
  filter,
  create,
  update,
  delete: remove,
  fetchPlayers
};
export const School = createEntityOperations('School');
export const Contact = createEntityOperations('Contact');
export const TeamHistory = createEntityOperations('TeamHistory');
export const Tournament = createEntityOperations('Tournament');
export const TournamentParticipation = createEntityOperations('TournamentParticipation');
export const PlayerImage = createEntityOperations('PlayerImage');
export const Team = createEntityOperations('Team');
export const Coach = createEntityOperations('Coach');
export const CoachAssignment = createEntityOperations('CoachAssignment');
export const ParentPlayerAssignment = createEntityOperations('ParentPlayerAssignment');
export const Payment = createEntityOperations('Payment');
export const AdditionalFee = createEntityOperations('AdditionalFee');
export const PaymentMethod = createEntityOperations('PaymentMethod');
export const TeamFee = createEntityOperations('TeamFee');
export const RecruitingInterest = createEntityOperations('RecruitingInterest');

// Firebase auth operations
export const User = {
  me: async () => {
    // Return current Firebase user info
    const { auth } = await import('../lib/firebase');
    const user = auth.currentUser;
    if (user) {
      return {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        // Add other user properties as needed
      };
    }
    return null;
  },
  isAuthenticated: async () => {
    // Check if user is authenticated
    const { auth } = await import('../lib/firebase');
    return !!auth.currentUser;
  }
};