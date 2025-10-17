/**
 * Generates a unique 7-character alphanumeric invitation code
 * @returns {string} A random 7-character code
 */
export function generateInviteCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking characters (0, O, I, 1)
  let code = '';
  
  for (let i = 0; i < 7; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  
  return code;
}