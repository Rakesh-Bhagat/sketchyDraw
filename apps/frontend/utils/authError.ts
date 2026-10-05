import axios from "axios";

export interface AuthError {
  message: string;
  fields: Record<string, string>;
}

const GENERIC = "Something went wrong. Please try again.";

// Maps the server's responses (status + message) to friendly, field-aware errors.
export function parseAuthError(error: unknown, mode: "signin" | "signup"): AuthError {
  if (!axios.isAxiosError(error)) return { message: GENERIC, fields: {} };

  if (!error.response) {
    return {
      message: "Can't reach the server. Check your connection and try again.",
      fields: {},
    };
  }

  const { status, data } = error.response;
  const serverMsg: string = typeof data?.message === "string" ? data.message : "";

  if (mode === "signup") {
    if (status === 409) {
      return {
        message: "That username is already taken.",
        fields: { username: "Try a different username" },
      };
    }
    if (status === 401 || status === 400) {
      return { message: "Some of your details look invalid. Please check them and try again.", fields: {} };
    }
  } else {
    if (/no user/i.test(serverMsg)) {
      return { message: "No account found with that username.", fields: { username: "Username not found" } };
    }
    if (/password/i.test(serverMsg)) {
      return { message: "Incorrect password. Please try again.", fields: { password: "Incorrect password" } };
    }
    if (status === 401 || status === 400 || /input/i.test(serverMsg)) {
      return { message: "Please check your username and password.", fields: {} };
    }
  }

  if (status >= 500) {
    return { message: "The server ran into a problem. Please try again in a moment.", fields: {} };
  }
  return { message: serverMsg || GENERIC, fields: {} };
}
