export const pounds = (pence: number) => `£${(pence / 100).toFixed(2)}`;
export const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
