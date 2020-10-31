//import { Context, Operation, main } from 'effection';
import { useCallback } from "react";

export const useEffection = (fn: any) => {
  const callback = useCallback(() => {
    fn();
  }, [fn]);
  return [callback]
}
