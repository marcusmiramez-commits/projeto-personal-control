import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const POLL_INTERVAL = 60_000; // 60s

const getCurrentBuildHash = () => {
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  for (const s of scripts) {
    const m = s.src.match(/\/static\/js\/[^/]*\.([a-z0-9]+)\.js/i);
    if (m) return m[1];
  }
  return null;
};

const fetchRemoteBuildHash = async () => {
  try {
    const res = await fetch('/?_v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/\/static\/js\/[^/"]*\.([a-z0-9]+)\.js/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
};

const UpdateNotifier = () => {
  const currentHashRef = useRef(null);
  const notifiedRef = useRef(false);

  useEffect(() => {
    currentHashRef.current = getCurrentBuildHash();
    if (!currentHashRef.current) return;

    const check = async () => {
      if (notifiedRef.current) return;
      const remote = await fetchRemoteBuildHash();
      if (remote && remote !== currentHashRef.current) {
        notifiedRef.current = true;
        toast('Nova versão disponível 🚀', {
          description: 'Atualize para usar a versão mais recente do app.',
          duration: Infinity,
          action: {
            label: 'Atualizar',
            onClick: () => {
              try {
                if ('caches' in window) {
                  caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
                }
              } catch (_) { /* ignore */ }
              window.location.reload();
            },
          },
        });
      }
    };

    const intervalId = setInterval(check, POLL_INTERVAL);
    const initialTimer = setTimeout(check, 5_000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(intervalId);
      clearTimeout(initialTimer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
};

export default UpdateNotifier;
