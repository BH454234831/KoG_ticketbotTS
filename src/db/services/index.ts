import { db } from "db/db";
import { DbTicketService } from "./ticket";
import { DbTicketCategoryService } from "./ticketCategory";
import { DbUserService } from "./user";

export * from "./user";
export * from "./ticket";
export * from "./ticketCategory";

export const dbUserService = new DbUserService({ db });
export const dbTicketService = new DbTicketService({ db, dbUserService });
export const dbTicketCategoryService = new DbTicketCategoryService({ db });