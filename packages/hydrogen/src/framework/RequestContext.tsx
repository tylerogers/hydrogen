import {createContext, useContext} from 'react';

export const RequestContext = createContext<any>({cache: {}});

export function useRequest() {
  return useContext(RequestContext);
}
