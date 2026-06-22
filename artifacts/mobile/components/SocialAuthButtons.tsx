import { useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { Body, Caption } from "@/components/Themed";
import { useColors } from "@/hooks/useColors";

// Handle any pending authentication sessions returning from the browser.
WebBrowser.maybeCompleteAuthSession();

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

type Strategy = "oauth_google" | "oauth_apple";

export function SocialAuthButtons() {
  useWarmUpBrowser();
  const colors = useColors();
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const [busy, setBusy] = useState<Strategy | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handle = useCallback(
    async (strategy: Strategy) => {
      if (busy) return;
      setError(null);
      setBusy(strategy);
      try {
        const { createdSessionId, setActive } = await startSSOFlow({
          strategy,
          redirectUrl: AuthSession.makeRedirectUri(),
        });
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          router.replace("/(tabs)");
        }
      } catch {
        setError("Sign-in was canceled or didn't complete. Please try again.");
      } finally {
        setBusy(null);
      }
    },
    [busy, router, startSSOFlow],
  );

  return (
    <View>
      <View style={{ gap: 12 }}>
        <SocialButton
          label="Continue with Google"
          loading={busy === "oauth_google"}
          disabled={!!busy}
          onPress={() => handle("oauth_google")}
        />
        <SocialButton
          label="Continue with Apple"
          loading={busy === "oauth_apple"}
          disabled={!!busy}
          onPress={() => handle("oauth_apple")}
        />
      </View>

      {error ? (
        <Body
          style={{ color: colors.destructive, marginTop: 12, fontSize: 13 }}
        >
          {error}
        </Body>
      ) : null}

      <View style={styles.dividerRow}>
        <View
          style={[styles.dividerLine, { backgroundColor: colors.border }]}
        />
        <Caption style={{ color: colors.mutedForeground }}>
          or use email
        </Caption>
        <View
          style={[styles.dividerLine, { backgroundColor: colors.border }]}
        />
      </View>
    </View>
  );
}

function SocialButton({
  label,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: disabled ? 0.6 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.foreground} />
      ) : (
        <Body
          style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}
        >
          {label}
        </Body>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
