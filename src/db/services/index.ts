import { db } from 'db/db';
import { DbTicketService } from './ticket.js';
import { DbTicketCategoryService } from './ticketCategory.js';
import { DbUserService } from './user.js';

export * from './user.js';
export * from './ticket.js';
export * from './ticketCategory.js';

export const dbUserService = new DbUserService({ db });
export const dbTicketService = new DbTicketService({ db, dbUserService });
export const dbTicketCategoryService = new DbTicketCategoryService({ db });
