// Do not import next/server to avoid Node Request dependency in Jest environment

// Mock next/server to avoid relying on global Request in Jest
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({ status: init?.status ?? 200, body }),
  },
}));

describe('frontend TTS API route', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('returns 400 when text is missing', async () => {
    const { POST } = await import('../app/api/tts/route');
    const req: any = { json: async () => ({}) };
    const res: any = await POST(req);
    expect(res.status).toBe(400);
  });

  test('propagates 503 when backend is unavailable', async () => {
    jest.doMock('../lib/utils', () => ({
      fetchWithTimeoutAndRetry: jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => 'Service unavailable',
      }),
    }));
    const { POST } = await import('../app/api/tts/route');
    const req: any = { json: async () => ({ text: 'Hello' }) };
    const res: any = await POST(req);
    expect(res.status).toBe(503);
  });
});