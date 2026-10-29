let quitting = false;

export const isQuitting = () => quitting;
export const setQuitting = (on: boolean) => void (quitting = on);
