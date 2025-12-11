'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { signIn } from 'next-auth/react';
import { PlatformType } from '@prisma/client';
import { getPlatformConnectionsAction, disconnectPlatformAction } from '@/app/actions/platformActions';

// Type for the connection data received from the server action
type ConnectionInfo = {
  platform: PlatformType;
  connectedAt: Date;
  profileId: string | null;
  username: string | null; // Include username from connection
};

export default function ConnectionsPage() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // For connect/disconnect actions
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Function to fetch connections (memoized to satisfy hook dependency rules)
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

  // Fetch data on load and when Clerk user is available
  useEffect(() => {
    if (isClerkLoaded && clerkUser) {
      fetchData();
    }
    if (isClerkLoaded && !clerkUser) {
        setIsLoading(false);
    }
  }, [isClerkLoaded, fetchData, clerkUser]);

   // Get display info for a connected platform
   const getConnectionInfo = (platform: PlatformType): ConnectionInfo | undefined => {
    return connections.find((conn) => conn.platform === platform);
  };

  // Handle connection click - uses NextAuth's signIn
  const handleConnect = (providerId: 'github' | 'twitter') => {
    if (isSaving) return;
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    signIn(providerId)
      .catch(err => {
        console.error("Sign in initiation error", err);
        setError(`Failed to initiate connection with ${providerId}.`);
      })
      .finally(() => {
         // Consider managing loading state based on page navigation or query params.
         setIsSaving(false);
      });
  };

  // Handle disconnect
  const handleDisconnect = async (platform: PlatformType) => {
      if (isSaving) return;
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      try {
          const result = await disconnectPlatformAction(platform);
          if (result.success) {
              setSuccess(`${platform} disconnected successfully.`);
              await fetchData(); // Refetch connections to update UI
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
    return <div className="container mx-auto p-4 max-w-2xl text-center">Loading connections...</div>;
  }

  if (!clerkUser) {
    return <div className="container mx-auto p-4 max-w-2xl">Please sign in to manage connections.</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Manage Connections</h1>

      {error && <p className="text-red-500 mb-4 p-3 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded">Error: {error}</p>}
      {success && <p className="text-green-500 mb-4 p-3 bg-green-100 dark:bg-green-900 dark:text-green-200 rounded">{success}</p>}

      {/* Platform Connections List */}
      <div className="space-y-4">
        {[PlatformType.GITHUB, PlatformType.X].map((platform) => {
          const connection = getConnectionInfo(platform);
          const providerId = platform === PlatformType.GITHUB ? 'github' : 'twitter';
          const platformName = platform === PlatformType.X ? 'X (Twitter)' : platform;

          return (
            <div key={platform} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded dark:border-gray-700 bg-white dark:bg-gray-800">
              <div>
                 <span className="font-medium text-gray-700 dark:text-gray-300">{platformName}</span>
                 {connection && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Connected as: {connection.username || connection.profileId} (ID: {connection.profileId})
                        <br/>
                        On: {new Date(connection.connectedAt).toLocaleDateString()}
                    </p>
                 )}
              </div>
              <div className="mt-2 sm:mt-0">
                  {connection ? (
                    <button
                      onClick={() => handleDisconnect(platform)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Working...' : 'Disconnect'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(providerId)}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Working...' : 'Connect'}
                    </button>
                  )}
              </div>
            </div>
          );
        })}
        {/* Add LinkedIn similarly */}
      </div>
    </div>
  );
}