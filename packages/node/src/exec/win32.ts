import { CreateOSProcess } from './api';
import { createPosixProcess } from './posix';

//cheat to win!
export const createWin32Process: CreateOSProcess = createPosixProcess;

export const isWin32 = () => false;
