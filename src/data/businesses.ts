import { Business } from "../types/business";
import { SPOTS_DATA } from "./spotsData";

/**
 * Re-export verified business seed data synchronized with Google Spreadsheet & Google Places API
 */
export const INITIAL_BUSINESSES: Business[] = SPOTS_DATA as Business[];

export default INITIAL_BUSINESSES;
