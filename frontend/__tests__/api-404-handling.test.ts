/**
 * Test to verify 404 error handling in API routes
 */
import { NextResponse } from 'next/server';

// Mock the fetch function
global.fetch = jest.fn();

describe('API 404 Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle 404 errors in TTS API route', async () => {
    // Mock a 404 response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
      json: async () => ({ error: 'Not Found' })
    });

    // Import the route handler
    const routeModule = await import('../app/api/tts/route');
    
    // Create a mock request
    const mockRequest = new Request('http://localhost:3000/api/tts', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello world' }),
    });

    // Call the POST function
    const response = await routeModule.POST(mockRequest);
    const responseBody = await response.json();

    // Verify the response
    expect(response.status).toBe(404);
    expect(responseBody.error).toBe('Text-to-speech service not found');
  });

  it('should handle 404 errors in structured lesson API route', async () => {
    // Mock a 404 response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
      json: async () => ({ error: 'Not Found' })
    });

    // Import the route handler
    const routeModule = await import('../app/api/structured-lesson/route');
    
    // Create a mock request
    const mockRequest = new Request('http://localhost:3000/api/structured-lesson', {
      method: 'POST',
      body: JSON.stringify({ topic: 'Math', age: 10 }),
    });

    // Call the POST function
    const response = await routeModule.POST(mockRequest);
    const responseBody = await response.json();

    // Verify the response
    expect(response.status).toBe(404);
    expect(responseBody.error).toBe('Structured lesson service not found');
  });

  it('should handle 404 errors in avatar streams API route', async () => {
    // Mock a 404 response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
      json: async () => ({ error: 'Not Found' })
    });

    // Import the route handler
    const routeModule = await import('../app/api/avatar/streams/route');
    
    // Create a mock request
    const mockRequest = new Request('http://localhost:3000/api/avatar/streams', {
      method: 'POST',
      body: JSON.stringify({ sourceImageUrl: 'https://example.com/image.jpg' }),
    });

    // Call the POST function
    const response = await routeModule.POST(mockRequest);
    const responseBody = await response.json();

    // Verify the response
    expect(response.status).toBe(404);
    expect(responseBody.error).toBe('D-ID streaming service not found');
  });
});