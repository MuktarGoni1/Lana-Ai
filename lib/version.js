// Simple version generator for cache busting
export const getVersion = () => {
  if (process.env.NODE_ENV === 'development') {
    // In development, use timestamp for immediate cache busting
    return Date.now().toString();
  }
  
  // In production, you could use git hash or build timestamp
  return process.env.NEXT_PUBLIC_BUILD_VERSION || Date.now().toString();
};

export const getVersionedUrl = (url) => {
  const version = getVersion();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${version}`;
};