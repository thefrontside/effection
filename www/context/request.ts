import { createContext } from "effection";

export const CurrentRequest = createContext<Request>("Request");
