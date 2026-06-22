import { useSignUp } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { Body, Caption, Screen, Title } from "@/components/Themed";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { useColors } from "@/hooks/useColors";

export default function SignUpScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signUp, errors, fetchStatus } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const busy = fetchStatus === "fetching";

  const handleSubmit = async () => {
    const { error } = await signUp.password({
      emailAddress: email,
      password,
    });
    if (error) return;
    await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: () => router.replace("/(tabs)"),
      });
    }
  };

  const needsVerification =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  if (needsVerification) {
    return (
      <Screen>
        <View style={styles.container}>
          <Caption>One step left</Caption>
          <Title style={{ marginTop: 12 }}>Verify your email</Title>
          <Body
            style={{
              marginTop: 8,
              color: colors.mutedForeground,
              fontSize: 14,
            }}
          >
            We sent a code to {email}.
          </Body>

          <View style={{ marginTop: 24 }}>
            <Caption style={{ marginBottom: 6 }}>Verification code</Caption>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              style={{
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: colors.border,
                borderWidth: StyleSheet.hairlineWidth,
                borderRadius: colors.radius,
                paddingHorizontal: 14,
                paddingVertical: 14,
                fontFamily: "Inter_400Regular",
                fontSize: 16,
                letterSpacing: 4,
              }}
            />
            {errors.fields.code ? (
              <Body
                style={{
                  color: colors.destructive,
                  marginTop: 6,
                  fontSize: 12,
                }}
              >
                {errors.fields.code.message}
              </Body>
            ) : null}
          </View>

          <Pressable
            onPress={handleVerify}
            disabled={!code || busy}
            style={({ pressed }) => [
              styles.btn,
              {
                backgroundColor: colors.primary,
                opacity: !code || busy ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Body
                style={{
                  color: colors.primaryForeground,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                Verify
              </Body>
            )}
          </Pressable>

          <Pressable
            onPress={() => signUp.verifications.sendEmailCode()}
            style={{ marginTop: 16, alignItems: "center" }}
          >
            <Body style={{ color: colors.mutedForeground, fontSize: 13 }}>
              Resend code
            </Body>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Caption>Begin</Caption>
        <Title style={{ marginTop: 12 }}>Create your account</Title>
        <Body
          style={{
            marginTop: 8,
            color: colors.mutedForeground,
            fontSize: 14,
          }}
        >
          A small flame to keep your place.
        </Body>

        <View style={{ marginTop: 24 }}>
          <SocialAuthButtons />
        </View>

        <View style={{ marginTop: 24, gap: 14 }}>
          <View>
            <Caption style={{ marginBottom: 6 }}>Email</Caption>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              style={inputStyle(colors)}
            />
            {errors.fields.emailAddress ? (
              <Body
                style={{
                  color: colors.destructive,
                  marginTop: 6,
                  fontSize: 12,
                }}
              >
                {errors.fields.emailAddress.message}
              </Body>
            ) : null}
          </View>
          <View>
            <Caption style={{ marginBottom: 6 }}>Password</Caption>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              style={inputStyle(colors)}
            />
            {errors.fields.password ? (
              <Body
                style={{
                  color: colors.destructive,
                  marginTop: 6,
                  fontSize: 12,
                }}
              >
                {errors.fields.password.message}
              </Body>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={!email || !password || busy}
          style={({ pressed }) => [
            styles.btn,
            {
              backgroundColor: colors.primary,
              opacity: !email || !password || busy ? 0.5 : pressed ? 0.85 : 1,
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Body
              style={{
                color: colors.primaryForeground,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              Create account
            </Body>
          )}
        </Pressable>

        {errors.raw && errors.raw.length > 0 ? (
          <Body
            style={{
              color: colors.destructive,
              marginTop: 12,
              fontSize: 13,
            }}
          >
            {(errors.raw[0] as { message?: string })?.message ??
              "Sign-up failed."}
          </Body>
        ) : null}

        <View style={styles.footer}>
          <Body style={{ color: colors.mutedForeground }}>
            Already have an account?{" "}
          </Body>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable>
              <Body
                style={{
                  color: colors.primary,
                  fontFamily: "Inter_500Medium",
                }}
              >
                Sign in
              </Body>
            </Pressable>
          </Link>
        </View>

        <View nativeID="clerk-captcha" />
      </View>
    </Screen>
  );
}

function inputStyle(colors: ReturnType<typeof useColors>) {
  return {
    backgroundColor: colors.card,
    color: colors.foreground,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: colors.radius,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  } as const;
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 80 },
  btn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  footer: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "center",
  },
});
