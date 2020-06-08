import { Operation } from 'effection';
import { AbortController, RequestInfo, RequestInit, Response } from './native-fetch';
export { AbortController, RequestInfo, RequestInit, Response };
export declare function fetch(resource: RequestInfo, init?: RequestInit): Operation<Response>;
