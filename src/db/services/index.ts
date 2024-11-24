import { db } from "db/db";
import { DbTicketService } from "./ticket";
import { DbTicketCategoryService } from "./ticketCategory";
import { DbUserService } from "./user";
import { DbImportantMessageService } from "./importantMessage";

export * from "./user";
export * from './importantMessage';
export * from "./ticket";
export * from "./ticketCategory";

export const dbUserService = new DbUserService({ db });
export const dbImportantMessageService = new DbImportantMessageService({ db });
export const dbTicketService = new DbTicketService({ db, dbUserService, dbImportantMessageService });
export const dbTicketCategoryService = new DbTicketCategoryService({ db });