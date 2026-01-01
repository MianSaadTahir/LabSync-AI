"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "../hooks/useSocket";

export const AutoNavigator = () => {
  const router = useRouter();
  const { onMessageCreated, onBudgetDesigned, onBudgetAllocated } = useSocket();

  // Helper to safely navigate
  const safePush = useCallback(
    (url: string) => {
      console.log(`[AutoNavigator] Navigating to ${url}`);
      router.push(url);
    },
    [router]
  );

  useEffect(() => {
    const handleMessageCreated = () => {
      console.log(
        "[AutoNavigator] Message created event received, navigating to /messages"
      );
      safePush("/messages");

      // After 6 seconds, navigate to meetings
      setTimeout(() => {
        console.log(
          "[AutoNavigator] 6s timer expired, navigating to /meetings"
        );
        safePush("/meetings");
      }, 6000);
    };

    const handleBudgetDesigned = () => {
      console.log(
        "[AutoNavigator] Budget designed event received, navigating to /budgets"
      );
      safePush("/budgets");
    };

    const handleBudgetAllocated = () => {
      console.log(
        "[AutoNavigator] Budget allocated event received, navigating to /allocations"
      );
      safePush("/allocations");
    };

    // Register listeners
    // The hook returns an unsubscribe function directly
    const unsubscribeMessage = onMessageCreated(handleMessageCreated);
    const unsubscribeBudget = onBudgetDesigned(handleBudgetDesigned);
    const unsubscribeAllocation = onBudgetAllocated(handleBudgetAllocated);

    return () => {
      // Execute the unsubscribe functions
      if (unsubscribeMessage) unsubscribeMessage();
      if (unsubscribeBudget) unsubscribeBudget();
      if (unsubscribeAllocation) unsubscribeAllocation();
    };
  }, [onMessageCreated, onBudgetDesigned, onBudgetAllocated, safePush]);

  return null; // Headless component
};
