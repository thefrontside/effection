export const unique = <S>(current: S) => (state: S): boolean => {
  if (current !== state) {
    current = state;
    return true;
  } else {
    return false;
  }
}