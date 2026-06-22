import { useSignIn } from "@clerk/expo";
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

export default function SignInScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    const { error } = await signIn.password({
      emailAddress: email,
      password,
    });
    if (error) return;
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: () => router.replace("/(tabs)"),
      });
    }
  };

  const busy = fetchStatus === "fetching";

  return (
    <Screen>
      <View style={styles.container}>
        <Caption>Welcome back</Caption>
        <Title style={{ marginTop: 12 }}>Sign in</Title>
        <Body
          style={{
            marginTop: 8,
            color: colors.mutedForeground,
            fontSize: 14,
          }}
        >
          Continue your sacred listening.
        </Body>

        <View style={{ marginTop: 24 }}>
          <SocialAuthButtons />
        </View>

        <View style={{ marginTop: 24, gap: 14 }}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.fields.identifier?.message}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            error={errors.fields.password?.message}
          />
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
              Continue
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
              "Sign-in failed."}
          </Body>
        ) : null}

        <View style={styles.footer}>
          <Body style={{ color: colors.mutedForeground }}>
            New to NoorJyoti?{" "}
          </Body>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable>
              <Body
                style={{
                  color: colors.primary,
                  fontFamily: "Inter_500Medium",
                }}
              >
                Create an account
              </Body>
            </Pressable>
          </Link>
        </View>
      </View>
    </Screen>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  autoCapitalize?: "none" | "sentences";
  error?: string;
}) {
  const colors = useColors();
  return (
    <View>
      <Caption style={{ marginBottom: 6 }}>{props.label}</Caption>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry={props.secureTextEntry}
        keyboardType={props.keyboardType}
        autoCapitalize={props.autoCapitalize}
        style={{
          backgroundColor: colors.card,
          color: colors.foreground,
          borderColor: colors.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: colors.radius,
          paddingHorizontal: 14,
          paddingVertical: 14,
          fontFamily: "Inter_400Regular",
          fontSize: 15,
        }}
      />
      {props.error ? (
        <Body
          style={{
            color: colors.destructive,
            marginTop: 6,
            fontSize: 12,
          }}
        >
          {props.error}
        </Body>
      ) : null}
    </View>
  );
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
