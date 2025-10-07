export function getPersistLocalStorage(): boolean {
  const persistLocalStorage = localStorage.getItem('persist');
  const parsedPersistValue = persistLocalStorage ? JSON.parse(persistLocalStorage) : false;

  return parsedPersistValue;
}
