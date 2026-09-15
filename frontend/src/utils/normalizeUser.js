const normalizeUser = (response) => response?.user || response || null;

export default normalizeUser;