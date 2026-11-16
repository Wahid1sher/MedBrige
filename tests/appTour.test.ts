import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  placeTourCard,
  rememberTour,
  tourHasBeenSeen,
  tourScrollDestination,
  clipTourTarget,
} from '../src/services/appTour';
afterEach(() => vi.unstubAllGlobals());
describe('guided tour placement', () => {
  it('brings below-fold targets into view without depending on an inert element scroll method', () => {
    const viewport = { width: 1400, height: 900 };
    const top = tourScrollDestination(
      { left: 300, top: 1600, width: 500, height: 60 },
      0,
      viewport,
      350,
    );
    expect(1600 - top).toBeGreaterThanOrEqual(96);
    expect(1600 - top + 60).toBeLessThan(900);
    const mobile = { width: 375, height: 812 };
    const destination = tourScrollDestination(
      { left: 20, top: 1800, width: 300, height: 70 },
      200,
      mobile,
      300,
    );
    const visibleTop = 1800 - (destination - 200);
    expect(visibleTop).toBe(96);
    expect(visibleTop + 70).toBeLessThan(mobile.height - 300 - 12);
  });
  it('never renders an off-screen highlight as a misleading four-pixel sliver', () => {
    expect(
      clipTourTarget({ left: 20, top: 1600, width: 400, height: 60 }, { width: 1400, height: 900 }),
    ).toBeNull();
    expect(
      clipTourTarget({ left: 20, top: -100, width: 300, height: 50 }, { width: 375, height: 812 }),
    ).toBeNull();
    expect(
      clipTourTarget({ left: 20, top: 96, width: 300, height: 60 }, { width: 375, height: 812 }),
    ).toEqual({ left: 14, top: 90, width: 312, height: 72 });
  });
  it('places the navigation explanation beside the desktop menu without covering it', () => {
    const card = placeTourCard(
      { left: 16, top: 130, width: 180, height: 220 },
      { width: 1400, height: 900 },
      { width: 356, height: 360 },
    );
    expect(card.side).toBe('right');
    expect(card.left).toBeGreaterThan(196);
    expect(card.top).toBe(130);
  });
  it('keeps cards inside phone, landscape and desktop viewports, including edge targets', () => {
    for (const viewport of [
      { width: 320, height: 740 },
      { width: 375, height: 812 },
      { width: 812, height: 375 },
      { width: 1400, height: 900 },
    ]) {
      const size = {
        width: Math.min(356, viewport.width - 24),
        height: Math.min(390, viewport.height - 24),
      };
      for (const target of [
        null,
        { left: 0, top: 0, width: 180, height: 50 },
        { left: viewport.width - 30, top: viewport.height - 65, width: 30, height: 60 },
        { left: -90, top: -50, width: 220, height: 500 },
      ]) {
        const card = placeTourCard(target, viewport, size);
        expect(card.left).toBeGreaterThanOrEqual(12);
        expect(card.top).toBeGreaterThanOrEqual(12);
        expect(card.left + size.width).toBeLessThanOrEqual(viewport.width - 12);
        expect(card.top + size.height).toBeLessThanOrEqual(viewport.height - 12);
      }
    }
  });
  it('leaves the mobile navigation highlight visible above a bottom-anchored target', () => {
    const card = placeTourCard(
      { left: 12, top: 730, width: 351, height: 64 },
      { width: 375, height: 812 },
      { width: 351, height: 390 },
    );
    expect(card.top + 390).toBeLessThan(730);
  });
});
describe('tour preference storage', () => {
  it('remembers only the tour preference, never document or care data', () => {
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    });
    expect(tourHasBeenSeen()).toBe(false);
    rememberTour(false);
    expect(tourHasBeenSeen()).toBe(true);
    expect([...data.entries()]).toEqual([['medbrige-tour-v1', 'skipped']]);
    rememberTour(true);
    expect([...data.entries()]).toEqual([['medbrige-tour-v1', 'completed']]);
  });
  it('keeps the app usable when browser storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(tourHasBeenSeen()).toBe(true);
    expect(() => rememberTour(true)).not.toThrow();
  });
});
