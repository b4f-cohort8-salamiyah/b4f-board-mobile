import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { useSession } from "./session-provider";
import {
  signInErrorsFrom,
  validateSignInInput,
  type SignInErrors,
} from "./sign-in-errors";

export function SignInScreen() {
  const { session, signIn } = useSession();
  const theme = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<SignInErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const expired =
    session.status === "signedOut" && session.endReason === "expired";

  async function handleSubmit() {
    if (submitting) {
      return;
    }
    const inputErrors = validateSignInInput(email, password);
    if (inputErrors) {
      setErrors(inputErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      // On success the root guard replaces this screen; the password state goes with it.
    } catch (error) {
      setErrors(signInErrorsFrom(error));
      setPassword("");
      setSubmitting(false);
    }
  }

  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.backgroundElement },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText type="subtitle" accessibilityRole="header">
              Sign in
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              Use your B4F Board account.
            </ThemedText>

            {expired && (
              <ThemedView type="backgroundElement" style={styles.notice}>
                <ThemedText accessibilityRole="alert">
                  Your session has ended. Please sign in again.
                </ThemedText>
              </ThemedView>
            )}

            <View style={styles.field}>
              <ThemedText type="smallBold">Email</ThemedText>
              <TextInput
                style={inputStyle}
                value={email}
                onChangeText={setEmail}
                editable={!submitting}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="username"
                keyboardType="email-address"
                returnKeyType="next"
                placeholder="you@example.com"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel="Email"
              />
              {errors.email && (
                <ThemedText type="small">{errors.email}</ThemedText>
              )}
            </View>

            <View style={styles.field}>
              <ThemedText type="smallBold">Password</ThemedText>
              <TextInput
                style={inputStyle}
                value={password}
                onChangeText={setPassword}
                editable={!submitting}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                accessibilityLabel="Password"
              />
              {errors.password && (
                <ThemedText type="small">{errors.password}</ThemedText>
              )}
            </View>

            {errors.form && (
              <ThemedView type="backgroundElement" style={styles.notice}>
                <ThemedText accessibilityRole="alert">{errors.form}</ThemedText>
              </ThemedView>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              accessibilityState={{ disabled: submitting, busy: submitting }}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.text },
                (pressed || submitting) && styles.pressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <ThemedText themeColor="background" type="smallBold">
                  Sign in
                </ThemedText>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    gap: Spacing.three,
    padding: Spacing.four,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
  },
  notice: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    fontSize: 16,
  },
  button: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
