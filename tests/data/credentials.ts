// The assignment README points at js/users.js as the source of the seeded
// accounts, so the suite imports it directly rather than duplicating the
// data: if the seed ever changes, the tests follow automatically.
import { users } from '../../js/users.js';

export interface Credentials {
  email: string;
  password: string;
}

export const validUsers: Credentials[] = users;

// Named accounts make the specs read as intent, e.g. "primary user's email
// with secondary user's password must be rejected".
export const primaryUser = validUsers[0];
export const secondaryUser = validUsers[1];

export const unknownUser: Credentials = {
  email: 'not.registered@example.com',
  password: 'definitely-wrong',
};
