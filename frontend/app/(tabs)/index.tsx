// app/index.tsx
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Delay tiny bit so layout e montat
    const timeout = setTimeout(() => {
      router.replace("/open");
    }, 10);

    return () => clearTimeout(timeout);
  }, []);

  return null;
}
