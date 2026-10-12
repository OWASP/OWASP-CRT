import React, { useEffect, useState } from 'react';
import { APP_CONFIG } from '../config';

const isValidContributor = (entry) => {
  if (!entry || typeof entry !== 'object') return false;

  const name = String(entry.name || '').trim();
  const github = String(entry.github || '').trim();

  if (!name || name.toLowerCase() === 'nobody') return false;
  if (name.length > 80) return false;

  try {
    const profile = new URL(github);

    return (
      profile.protocol === 'https:' &&
      profile.hostname === 'github.com' &&
      profile.pathname.length > 1
    );
  } catch {
    return false;
  }
};

const HallOfFame = () => {
  const [contributors, setContributors] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();

    const loadContributors = async () => {
      const { owner, repo, branch } = APP_CONFIG.github;

      const url =
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/hall-of-fame.json`;

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Invalid Hall of Fame data');
        }

        const validEntries = data
          .filter(isValidContributor)
          .map((entry) => ({
            id: entry.id || entry.github,
            name: String(entry.name).trim(),
            github: String(entry.github).trim(),
            tier: String(entry.tier || 'Contributor').trim()
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setContributors(validEntries);
        setStatus('ready');
      } catch (error) {
        if (error.name === 'AbortError') return;

        console.error('Hall of Fame loading failed:', error);
        setStatus('error');
      }
    };

    loadContributors();

    return () => controller.abort();
  }, []);

  return (
    <section className="flex-1 w-full max-w-5xl mx-auto py-10">
      <div className="text-center mb-10">
        <p className="text-indigo-400 text-sm uppercase tracking-widest">
          OWASP-CRT
        </p>

        <h1 className="text-4xl font-bold text-white mt-3">
          Hall of Fame
        </h1>

        <p className="text-zinc-400 mt-4">
          Contributors who helped improve OWASP projects.
        </p>
      </div>

      {status === 'loading' && (
        <p className="text-center text-zinc-400">
          Loading contributors…
        </p>
      )}

      {status === 'error' && (
        <p className="text-center text-red-400">
          The Hall of Fame is temporarily unavailable.
        </p>
      )}

      {status === 'ready' && contributors.length === 0 && (
        <p className="text-center text-zinc-400">
          No contributors have been added yet.
        </p>
      )}

      {status === 'ready' && contributors.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contributors.map((contributor) => (
            <article
              key={contributor.id}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
            >
              <h2 className="text-xl font-semibold text-white">
                {contributor.name}
              </h2>

              <p className="text-sm text-indigo-300 mt-2">
                {contributor.tier}
              </p>

              <a
                href={contributor.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-5 text-sm text-zinc-400 hover:text-white"
              >
                View GitHub profile
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default HallOfFame;
