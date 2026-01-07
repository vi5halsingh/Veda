/**
 * useMcp Hook - React hook for MCP contextual awareness features
 */

import { useState, useEffect, useCallback } from "react";
import * as mcpService from "../services/mcpService";

/**
 * Hook for current time with auto-refresh
 * @param {number} refreshInterval - Refresh interval in ms (default: 60000)
 */
export function useCurrentTime(refreshInterval = 60000) {
  const [timeData, setTimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTime = useCallback(async () => {
    try {
      const result = await mcpService.getCurrentTime();
      if (result.success) {
        setTimeData(result.data);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTime();
    const interval = setInterval(fetchTime, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchTime, refreshInterval]);

  return { timeData, loading, error, refresh: fetchTime };
}

/**
 * Hook for user timezone
 */
export function useUserTimezone() {
  const [timezone, setTimezone] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimezone = async () => {
      try {
        const browserTz = mcpService.getBrowserTimezone();
        const result = await mcpService.getUserTimezone(browserTz);
        if (result.success) {
          setTimezone(result.data);
        }
      } catch (err) {
        // Fallback to browser timezone
        setTimezone({
          timezone: mcpService.getBrowserTimezone(),
          source: "browser_fallback",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTimezone();
  }, []);

  return { timezone, loading };
}

/**
 * Hook for session context
 * @param {string} sessionId - Session identifier
 */
export function useSessionContext(sessionId) {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchContext = useCallback(async () => {
    try {
      const result = await mcpService.getSystemContext(sessionId);
      if (result.success) {
        setContext(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch session context:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  return { context, loading, refresh: fetchContext };
}

/**
 * Hook for fetching live external data
 */
export function useLiveData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (options) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mcpService.fetchLiveData(options);
      if (result.success) {
        setData(result.data);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
}
