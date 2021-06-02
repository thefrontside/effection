import { createContext } from 'react';
import { Task, Effection } from '@effection/core';

export const EffectionContext = createContext<Task>(Effection.root);
