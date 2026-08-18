'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { signIn } from 'next-auth/react';
import { PlatformType, TargetTier } from '@prisma/client';
import { getPlatformConnectionsAction, disconnectPlatformAction } from '@/app/actions/platformActions';
import { savePlatformSetupAction } from '@/app/actions/onboardingActions';
import HudBackground from '@/components/hud/HudBackground';
import CornerBrackets from '@/components/hud/CornerBrackets';
import StatusDots from '@/components/hud/StatusDots';
import TerminalButton from '@/components/hud/TerminalButton';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthCallback: 'The provider rejected the connection request. This usually means the callback URL registered with the provider doesn\'t match this app, or the API credentials are invalid.',
  OAuthSignin: 'Could not start the connection request with the provider.',
  db_user_not_found: 'Could not find your account. Try refreshing and reconnecting.',
  db_error: 'Failed to save the connection. Try again.',
  missing_profile_id: 'The provider didn\'t return a usable profile ID.',
  unsupported_provider: 'That provider isn\'t supported.',
  rate_limited: 'Too many connection attempts. Please wait a bit and try again.',
};

type ConnectionInfo = {
  platform: PlatformType;
  connectedAt: Date;
  profileId: string | null;
  username: string | null;
  setupCompleted: boolean;
  platformRole: string | null;
  platformAspiration: string | null;
  targetTier: TargetTier;
};

const TARGET_TIERS: { value: TargetTier; label: string }[] = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' },
];

const PLATFORM_META: Record<PlatformType, { label: string; glyph: string; accent: 'cyan' }> = {
  X: { label: 'X (Twitter)', glyph: 'X', accent: 'cyan' },
};

const ACCENT_TEXT = { cyan: 'text-cyan-400' } as const;
const ACCENT_BORDER = { cyan: 'border-cyan-500/30' } as const;

export default function ConnectionsPage() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Surface OAuth redirect outcomes (NextAuth's error/success come back as query params,
  // not thrown errors, so they were previously silently ignored).
  useEffect(() => {
    const errorCode = searchParams.get('error');
    const didSucceed = searchParams.get('success');
    if (errorCode) {
      setError(OAUTH_ERROR_MESSAGES[errorCode] || `Connection failed (${errorCode}).`);
    } else if (didSucceed) {
      setSuccess('Connected successfully.');
    }
    if (errorCode || didSucceed) {
      router.replace(pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = useCallback(async () => {
    if (!clerkUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedConnections = await getPlatformConnectionsAction();
      setConnections(fetchedConnections);
    } catch (err) {
      setError('Failed to load connection data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [clerkUser]);

  useEffect(() => {
    if (isClerkLoaded && clerkUser) {
      fetchData();
    }
    if (isClerkLoaded && !clerkUser) {
      setIsLoading(false);
    }
  }, [isClerkLoaded, fetchData, clerkUser]);

  const getConnectionInfo = (platform: PlatformType): ConnectionInfo | undefined => {
    return connections.find((conn) => conn.platform === platform);
  };

  const handleConnect = () => {
    if (isSaving) return;
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    signIn('twitter')
      .catch((err) => {
        console.error('Sign in initiation error', err);
        setError('Failed to initiate connection with twitter.');
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleDisconnect = async (platform: PlatformType) => {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await disconnectPlatformAction(platform);
      if (result.success) {
        setSuccess(`${platform} disconnected successfully.`);
        await fetchData();
      } else {
        setError(result.error || `Failed to disconnect ${platform}.`);
      }
    } catch (err) {
      setError(`An unexpected error occurred while disconnecting ${platform}.`);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <HudBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center gap-3 font-mono text-sm text-gray-500">
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}>
              &gt;
            </motion.span>
            Loading connections...
          </div>
        </div>
      </HudBackground>
    );
  }

  if (!clerkUser) {
    return (
      <HudBackground>
        <div className="min-h-screen flex items-center justify-center">
          <p className="font-mono text-sm text-gray-500">Please sign in to manage connections.</p>
        </div>
      </HudBackground>
    );
  }

  return (
    <HudBackground>
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs text-cyan-400/80">{'//'}</span>
            <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">Settings</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-mono font-bold text-white tracking-tight">
            Connections
          </h1>
          <p className="mt-2 text-sm text-gray-400 font-light">
            Link the platforms P.R.A.N. monitors and analyzes on your behalf.
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 border-l-2 border-red-500/60 bg-red-500/5 px-4 py-3 font-mono text-xs text-red-300"
            >
              ERROR {'//'} {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 border-l-2 border-emerald-500/60 bg-emerald-500/5 px-4 py-3 font-mono text-xs text-emerald-300"
            >
              &gt; {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Platform Connections List */}
        <div className="space-y-6">
          {[PlatformType.X].map((platform) => {
            const connection = getConnectionInfo(platform);
            const meta = PLATFORM_META[platform];

            return (
              <div key={platform} className="relative bg-[#0a0f1e]/60 backdrop-blur-sm border border-blue-500/20">
                <CornerBrackets accent="cyan" size={3} thickness={2} />

                {/* Status bar */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-blue-500/10">
                  <div className="flex items-center gap-2">
                    <StatusDots />
                    <span className="font-mono text-[10px] text-gray-500 tracking-wider uppercase">
                      MODULE_{meta.glyph}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[10px] tracking-widest uppercase ${
                      connection ? 'text-emerald-400' : 'text-gray-600'
                    }`}
                  >
                    {connection ? 'Linked' : 'Not Linked'}
                  </span>
                </div>

                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-11 h-11 border ${ACCENT_BORDER[meta.accent]} flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent shrink-0`}
                    >
                      <span className={`font-mono text-sm font-bold ${ACCENT_TEXT[meta.accent]}`}>
                        {meta.glyph}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono font-semibold text-white text-sm tracking-tight">
                        {meta.label}
                      </span>
                      {connection ? (
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                          @{connection.username || connection.profileId}
                          <span className="text-gray-700 mx-1.5">|</span>
                          linked {new Date(connection.connectedAt).toLocaleDateString()}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-600 font-mono mt-0.5">
                          <span className="text-gray-700 mr-1">&gt;</span>awaiting connection
                        </p>
                      )}
                    </div>
                  </div>

                  {connection ? (
                    <TerminalButton
                      variant="danger"
                      onClick={() => handleDisconnect(platform)}
                      disabled={isSaving}
                      className="shrink-0"
                    >
                      Disconnect
                    </TerminalButton>
                  ) : (
                    <TerminalButton
                      variant="primary"
                      onClick={handleConnect}
                      disabled={isSaving}
                      className="shrink-0"
                    >
                      Connect
                    </TerminalButton>
                  )}
                </div>

                {connection && !connection.setupCompleted && (
                  <div className="px-5 pb-5">
                    <PlatformSetupForm platform={platform} connection={connection} onSaved={fetchData} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </HudBackground>
  );
}

function PlatformSetupForm({
  platform,
  connection,
  onSaved,
}: {
  platform: PlatformType;
  connection: ConnectionInfo;
  onSaved: () => void;
}) {
  const [platformRole, setPlatformRole] = useState(connection.platformRole || '');
  const [platformAspiration, setPlatformAspiration] = useState(connection.platformAspiration || '');
  const [targetTier, setTargetTier] = useState<TargetTier>(connection.targetTier);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await savePlatformSetupAction(platform, { platformRole, platformAspiration, targetTier });
    setIsSaving(false);
    onSaved();
  };

  return (
    <div className="border-t border-amber-500/10 pt-4 space-y-3">
      <p className="font-mono text-[11px] text-amber-400/80">
        <span className="mr-1.5">!</span>FINISH SETUP {'//'} required to enable reports for this platform
      </p>
      <input
        value={platformRole}
        onChange={(e) => setPlatformRole(e.target.value)}
        placeholder="role (e.g. builder)"
        className="w-full px-3 py-2.5 bg-[#030712] border border-white/10 focus:border-cyan-500/40 text-white font-mono text-sm placeholder-gray-600 focus:outline-none transition-colors"
      />
      <input
        value={platformAspiration}
        onChange={(e) => setPlatformAspiration(e.target.value)}
        placeholder="goal on this platform"
        className="w-full px-3 py-2.5 bg-[#030712] border border-white/10 focus:border-cyan-500/40 text-white font-mono text-sm placeholder-gray-600 focus:outline-none transition-colors"
      />
      <select
        value={targetTier}
        onChange={(e) => setTargetTier(e.target.value as TargetTier)}
        className="w-full px-3 py-2.5 bg-[#030712] border border-white/10 focus:border-cyan-500/40 text-white font-mono text-sm focus:outline-none transition-colors"
      >
        {TARGET_TIERS.map((t) => (
          <option key={t.value} value={t.value}>
            Target: {t.label}
          </option>
        ))}
      </select>
      <TerminalButton
        onClick={handleSave}
        disabled={isSaving || !platformRole || !platformAspiration}
        loading={isSaving}
        className="w-full sm:w-auto"
      >
        Save
      </TerminalButton>
    </div>
  );
}
