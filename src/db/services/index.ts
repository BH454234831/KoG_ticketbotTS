import { db } from "db/db";
import { DbTicketService } from "./ticket";
import { DbTicketCategoryService } from "./ticketCategory";

export * from "./ticket";
export * from "./ticketCategory";

export const dbTicketService = new DbTicketService({ db });
export const dbTicketCategoryService = new DbTicketCategoryService({ db });