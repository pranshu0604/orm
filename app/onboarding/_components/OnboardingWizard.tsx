'use client';

import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { PlatformType, TargetTier } from '@prisma/client';
import {
  saveProfileAction,
  savePlatformSetupAction,
  generateWelcomeGreetingAction,
  getOnboardingStateAction,
  completeOnboardingAction,
} from '@/app/actions/onboardingActions';
import HudBackground from '@/components/hud/HudBackground';
import CornerBrackets from '@/components/hud/CornerBrackets';
import StatusDots from '@/components/hud/StatusDots';
import TerminalButton from '@/components/hud/TerminalButton';

type Step = 1 | 2 | 3;

type ConnectionState = {
  platform: PlatformType;
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

type InitialProfile = { role: string | null; aspiration: string | null; targetCloudVolume: string | null };

const STEP_LABELS = ['You', 'Platforms', 'Ready'];

export default function OnboardingWizard({
  firstName,
  initialProfile,
}: {
  firstName: string | null;
  initialProfile: InitialProfile;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  return (
    <HudBackground>
      <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-20 w-[28rem] h-[28rem] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <div className="flex items-center gap-3 mb-14">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className="flex items-center gap-3">
              <span className={`font-mono text-[10px] ${n <= step ? 'text-cyan-400' : 'text-gray-700'}`}>
                0{n}
              </span>
              <div
                className={`h-px w-10 transition-colors ${n <= step ? 'bg-cyan-500/60' : 'bg-white/10'}`}
              />
              <span
                className={`font-mono text-xs tracking-widest uppercase ${n === step ? 'text-white' : 'text-gray-600'}`}
              >
                {STEP_LABELS[n - 1]}
              </span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <ProfileStep firstName={firstName} initial={initialProfile} onDone={() => setStep(2)} />
        )}
        {step === 2 && <PlatformsStep onDone={() => setStep(3)} />}
        {step === 3 && (
          <WelcomeStep
            onDone={async () => {
              await completeOnboardingAction();
              router.push('/');
            }}
          />
        )}
      </div>
    </HudBackground>
  );
}

function ProfileStep({
  firstName,
  initial,
  onDone,
}: {
  firstName: string | null;
  initial: InitialProfile;
  onDone: () => void;
}) {
  const [role, setRole] = useState(initial.role || '');
  const [aspiration, setAspiration] = useState(initial.aspiration || '');
  const [targetCloudVolume, setTargetCloudVolume] = useState(initial.targetCloudVolume || '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    const result = await saveProfileAction({ role, aspiration, targetCloudVolume });
    setIsSaving(false);
    if (!result.success) {
      setError(result.error || 'Something went wrong.');
      return;
    }
    onDone();
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-xs text-cyan-400/80">{'//'}</span>
        <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">Onboarding</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-white">
        {firstName ? `Hey ${firstName}, ` : ''}who are you building this for?
      </h1>
      <p className="text-gray-400 mb-10 max-w-xl font-light">
        A few details so we can grade your growth against the right bar, not a generic one.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Field label="What do you do, in one or two words?">
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Indie developer"
            required
            className="hud-input"
          />
        </Field>

        <Field label="What are you trying to become known for?">
          <textarea
            value={aspiration}
            onChange={(e) => setAspiration(e.target.value)}
            placeholder="e.g. The go-to voice on practical AI tooling for small teams"
            required
            rows={3}
            className="hud-input resize-none"
          />
        </Field>

        <Field label="How much clout are you aiming for, and by when?">
          <input
            value={targetCloudVolume}
            onChange={(e) => setTargetCloudVolume(e.target.value)}
            placeholder="e.g. 25K engaged followers within a year"
            required
            className="hud-input"
          />
        </Field>

        {error && <p className="font-mono text-xs text-red-400">ERROR {'//'} {error}</p>}

        <TerminalButton type="submit" disabled={isSaving} loading={isSaving}>
          Continue
        </TerminalButton>
      </form>
    </div>
  );
}

type PlatformCardHandle = { saveIfDirty: () => Promise<void> };

function PlatformsStep({ onDone }: { onDone: () => void }) {
  const [connections, setConnections] = useState<ConnectionState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const xCardRef = useRef<PlatformCardHandle>(null);

  const refresh = useCallback(async () => {
    setLoadError(false);
    try {
      const state = await getOnboardingStateAction();
      setConnections(state.connections);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const findConnection = (platform: PlatformType) => connections.find((c) => c.platform === platform);

  const connect = () => {
    signIn('twitter', { callbackUrl: '/onboarding' });
  };

  // Persist any typed-but-unsaved platform setup before leaving, so it isn't silently lost.
  const advance = async () => {
    setIsAdvancing(true);
    await xCardRef.current?.saveIfDirty();
    setIsAdvancing(false);
    onDone();
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-xs text-cyan-400/80">{'//'}</span>
        <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">Onboarding</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-white">Link where you show up</h1>
      <p className="text-gray-400 mb-10 max-w-xl font-light">
        Connect X so we can actually read your activity. You can skip this and do it later from Settings.
      </p>

      {isLoading ? (
        <p className="font-mono text-xs text-gray-500">Loading…</p>
      ) : loadError ? (
        <p className="font-mono text-xs text-red-400">Couldn&apos;t load your connections. Refresh and try again.</p>
      ) : (
        <div className="max-w-sm">
          <PlatformCard
            ref={xCardRef}
            platform="X"
            label="X / Twitter"
            glyph="X"
            accent="cyan"
            connection={findConnection(PlatformType.X)}
            onConnect={connect}
            onSaved={refresh}
          />
        </div>
      )}

      <div className="mt-10 flex items-center gap-6">
        <TerminalButton onClick={advance} disabled={isAdvancing} loading={isAdvancing}>
          Continue
        </TerminalButton>
        <button
          onClick={advance}
          disabled={isAdvancing}
          className="font-mono text-xs text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-widest"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

const ACCENT_TEXT = { cyan: 'text-cyan-400' } as const;
const ACCENT_BORDER = { cyan: 'border-cyan-500/30' } as const;

const PlatformCard = forwardRef<
  PlatformCardHandle,
  {
    platform: PlatformType;
    label: string;
    glyph: string;
    accent: 'cyan';
    connection?: ConnectionState;
    onConnect: () => void;
    onSaved: () => void;
  }
>(function PlatformCard({ platform, label, glyph, accent, connection, onConnect, onSaved }, ref) {
  const [platformRole, setPlatformRole] = useState(connection?.platformRole || '');
  const [platformAspiration, setPlatformAspiration] = useState(connection?.platformAspiration || '');
  const [targetTier, setTargetTier] = useState<TargetTier>(connection?.targetTier || 'BEGINNER');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await savePlatformSetupAction(platform, { platformRole, platformAspiration, targetTier });
    setIsSaving(false);
    onSaved();
  };

  useImperativeHandle(ref, () => ({
    saveIfDirty: async () => {
      if (connection && !connection.setupCompleted && platformRole.trim() && platformAspiration.trim()) {
        await savePlatformSetupAction(platform, { platformRole, platformAspiration, targetTier });
      }
    },
  }));

  return (
    <div className="relative bg-[#0a0f1e]/60 backdrop-blur-sm border border-blue-500/20 h-full flex flex-col">
      <CornerBrackets accent="cyan" size={3} thickness={2} />

      <div className="flex items-center justify-between px-4 pt-3.5 pb-3 border-b border-blue-500/10">
        <div className="flex items-center gap-2">
          <StatusDots />
          <span className="font-mono text-[10px] text-gray-500 tracking-wider uppercase">MODULE_{glyph}</span>
        </div>
        {connection && (
          <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">Linked</span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-9 h-9 border ${ACCENT_BORDER[accent]} flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent shrink-0`}>
            <span className={`font-mono text-xs font-bold ${ACCENT_TEXT[accent]}`}>{glyph}</span>
          </div>
          <div>
            <span className="font-mono font-semibold text-white text-sm">{label}</span>
            {connection && (
              <p className="text-xs text-gray-500 font-mono">@{connection.username || 'connected'}</p>
            )}
          </div>
        </div>

        {!connection ? (
          <>
            <p className="font-mono text-xs text-gray-600 mb-4 flex-1">
              <span className="text-gray-700 mr-1">&gt;</span>not connected yet
            </p>
            <TerminalButton onClick={onConnect} className="self-start">
              Connect
            </TerminalButton>
          </>
        ) : connection.setupCompleted ? (
          <p className="font-mono text-xs text-gray-500 flex-1">
            <span className="text-emerald-500 mr-1">&gt;</span>configured. you&apos;re set for {label}.
          </p>
        ) : (
          <div className="space-y-2.5 flex-1">
            <input
              value={platformRole}
              onChange={(e) => setPlatformRole(e.target.value)}
              placeholder="role (e.g. builder)"
              className="hud-input hud-input-sm"
            />
            <input
              value={platformAspiration}
              onChange={(e) => setPlatformAspiration(e.target.value)}
              placeholder="goal on this platform"
              className="hud-input hud-input-sm"
            />
            <select
              value={targetTier}
              onChange={(e) => setTargetTier(e.target.value as TargetTier)}
              className="hud-input hud-input-sm"
            >
              {TARGET_TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  Target: {t.label}
                </option>
              ))}
            </select>
            <TerminalButton onClick={handleSave} disabled={isSaving || !platformRole || !platformAspiration} loading={isSaving}>
              Save
            </TerminalButton>
          </div>
        )}
      </div>
    </div>
  );
});

function WelcomeStep({ onDone }: { onDone: () => Promise<void> }) {
  const [greeting, setGreeting] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateWelcomeGreetingAction().then((r) => setGreeting(r.greeting));
  }, []);

  const handleDone = async () => {
    setIsFinishing(true);
    setError(null);
    try {
      await onDone();
    } catch {
      setError('Something went wrong finishing setup. Try again.');
      setIsFinishing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-center gap-2 mb-4">
        <motion.span
          className="w-2 h-2 rounded-full bg-emerald-400"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">You&apos;re in</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-8 max-w-2xl text-white min-h-[1.2em]">
        {greeting ? greeting : <span className="text-gray-600 font-light">Putting together your welcome…</span>}
      </h1>
      {error && <p className="font-mono text-xs text-red-400 mb-4">ERROR {'//'} {error}</p>}
      <TerminalButton onClick={handleDone} disabled={isFinishing} loading={isFinishing}>
        Go to dashboard
      </TerminalButton>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-xs text-gray-500 mb-2 tracking-wide">{label}</span>
      {children}
    </label>
  );
}
