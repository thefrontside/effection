import { createContext } from 'react';
import { Task, Effection } from 'effection';

export const EffectionContext = createContext<Task>(Effection.root);
