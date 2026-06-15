// src/app/api/intelligence/route.ts
// Server-Sent Events (SSE) stream for real-time intelligence feed
// Pushes: new intelligence cards, audit events, agent status updates

import { NextRequest, NextResponse } from 'next/server';
import { getCards, getAuditEvents, getAgentStates } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastCardCount = 0;
      let lastAuditCount = 0;

      // Send initial state
      const sendEvent = (eventType: string, data: unknown) => {
        const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // Initial load
      const initialCards = getCards(20, 0);
      const initialAudit = getAuditEvents(30);
      const initialAgents = getAgentStates();

      sendEvent('init', {
        cards: initialCards,
        audit: initialAudit,
        agents: initialAgents,
      });

      lastCardCount = initialCards.length;
      lastAuditCount = initialAudit.length;

      // Poll for updates every 2 seconds
      const interval = setInterval(() => {
        try {
          const cards = getCards(20, 0);
          const audit = getAuditEvents(30);
          const agents = getAgentStates();

          let changed = false;

          if (cards.length !== lastCardCount) {
            // New cards arrived
            const newCards = cards.slice(0, cards.length - lastCardCount);
            newCards.forEach((card) => sendEvent('card', card));
            lastCardCount = cards.length;
            changed = true;
          }

          if (audit.length !== lastAuditCount) {
            const newEvents = (audit as Array<unknown>).slice(0, audit.length - lastAuditCount);
            newEvents.forEach((event) => sendEvent('audit', event));
            lastAuditCount = audit.length;
            changed = true;
          }

          // Always send agent state updates
          sendEvent('agents', agents);

          // Heartbeat
          if (!changed) {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          }
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 2000);

      // Clean up on close
      _req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    },
  });
}
