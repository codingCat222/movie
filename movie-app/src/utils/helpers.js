export const formatDuration = (mins) => {
  if (!mins) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

export const getQualityOptions = (isPremium) =>
  isPremium ? ['480p', '720p', '1080p'] : ['480p'];

export const truncate = (str, n = 120) =>
  str?.length > n ? str.slice(0, n) + '…' : str;

export const getGenreColor = (genre) => {
  const colors = { Action: '#e74c3c', Drama: '#9b59b6', Comedy: '#f39c12', Thriller: '#e67e22', Sci_Fi: '#3498db', Horror: '#c0392b', Romance: '#e91e63', Mystery: '#2ecc71' };
  return colors[genre] || '#D4AF37';
};