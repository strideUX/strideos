import packageJson from '../../package.json';

/**
 * Version configuration for strideOS
 * Displays clean version in production, version+commit in dev/preview
 */

const getBuildVersion = () => {
  const base = packageJson.version;
  const commit = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local';
  const branch = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || 'local';
  const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
  
  if (isProduction) {
    return base; // Clean version for production (e.g., "1.0.0")
  } else if (branch === 'local') {
    return `${base}-local`; // Local development
  } else {
    return `${base}-${commit}`; // Dev/preview with commit hash (e.g., "1.0.0-abc1234")
  }
};

export const VERSION_INFO = {
  version: getBuildVersion(),
  commit: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
  branch: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || 'local',
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
  buildTime: new Date().toISOString(),
  title: "strideOS Beta",
  notes: "Document-centric project management platform"
} as const;

export const getVersion = () => VERSION_INFO.version;
export const getVersionInfo = () => VERSION_INFO;