// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// Type declaration for global Sentry in development
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: any) => void;
      captureMessage: (message: any) => void;
    };
  }
  var Sentry: any; // For Node.js global object
}

let Sentry: typeof import("@sentry/nextjs") | undefined;

// Guard against multiple initializations
let initialized = false;

// Only initialize Sentry in production to avoid development overhead
if (!initialized) {
  if (process.env.NODE_ENV === 'production') {
    import("@sentry/nextjs")
      .then((S) => {
        Sentry = S;
        S.init({
          dsn:
            process.env.NEXT_PUBLIC_SENTRY_DSN ||
            "https://d68bb2a6dff253e4c3cd5d0bbd7edd26@o4510461990469632.ingest.us.sentry.io/4510461997809664",

          // Reduce traces sample rate in production to reduce overhead
          tracesSampleRate: 0.2,

          // Reduce replay sampling rates to minimize performance impact
          replaysSessionSampleRate: 0.05,
          replaysOnErrorSampleRate: 0.2,

          // Optimize integrations for performance
          integrations: [
            S.replayIntegration({
              maskAllText: true,
              blockAllMedia: true,
              // Reduce network payloads
              networkDetailAllowUrls: [],
              networkCaptureBodies: false,
            }),
          ],

          // Environment
          environment: process.env.NODE_ENV,

          // Disable verbose logging in production
          debug: false,

          // Optimize performance
          beforeSend: (event: any) => {
            // Limit the size of events to reduce network overhead
            if (event.extra) {
              const extraSize = JSON.stringify(event.extra).length;
              if (extraSize > 50000) {
                event.extra = { truncated: true, originalSize: extraSize };
              }
            }
            return event;
          },
        });
      })
      .catch(() => {
        // Ignore Sentry load failures
      });
  } else {
    // In development, provide a minimal Sentry mock to avoid errors
    if (typeof window !== 'undefined') {
      window.Sentry = {
        captureException: (error: any) => console.error('Sentry captureException (dev):', error),
        captureMessage: (message: any) => console.log('Sentry captureMessage (dev):', message),
      };
    } else {
      global.Sentry = {
        captureException: (error: any) => console.error('Sentry captureException (dev):', error),
        captureMessage: (message: any) => console.log('Sentry captureMessage (dev):', message),
      };
    }
  }
  initialized = true;
}

export const onRouterTransitionStart = (...args: any[]) => {
  if (process.env.NODE_ENV === "production" && Sentry?.captureRouterTransitionStart) {
    return (Sentry.captureRouterTransitionStart as any)(...args);
  }
};