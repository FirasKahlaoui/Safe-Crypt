import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  getMultiFactorResolver,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import GoogleAuth from "./GoogleAuth";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isPhoneVerification, setIsPhoneVerification] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [error, setError] = useState("");
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false); // Track if reCAPTCHA is ready to be used
  const [mfaResolver, setMfaResolver] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize reCAPTCHA v2 widget here
    const initializeRecaptcha = () => {
      if (auth) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          "recaptcha-container", // This will be the div ID where the reCAPTCHA widget is rendered
          {
            size: "normal", // Change to "normal" for visible reCAPTCHA
            callback: (response) => {
              console.log("reCAPTCHA solved:", response);
              setIsRecaptchaReady(true); // reCAPTCHA is ready for phone verification
            },
            "expired-callback": () => {
              console.warn("reCAPTCHA expired.");
              setIsRecaptchaReady(false); // Set the flag back to false
            },
          },
          auth
        );
        window.recaptchaVerifier.render().then((widgetId) => {
          window.recaptchaWidgetId = widgetId;
          console.log("reCAPTCHA widget rendered.");
        });
      } else {
        console.error("Firebase auth object is not defined.");
      }
    };

    // Initialize reCAPTCHA only if it's not already initialized
    if (!window.recaptchaVerifier) {
      initializeRecaptcha();
    }
  }, []);

  const handlePhoneVerification = async () => {
    if (!isRecaptchaReady) {
      console.error("reCAPTCHA not solved or ready.");
      return;
    }

    try {
      console.log("Starting phone verification...");
      let formattedPhoneNumber = `+216${phoneNumber.replace(/^\+/, "")}`;
      console.log("Formatted phone number:", formattedPhoneNumber);

      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhoneNumber,
        appVerifier
      );
      window.confirmationResult = confirmationResult;
      console.log("Verification code sent!");
    } catch (error) {
      setError(error.message);
      console.error("Error during phone verification:", error.message);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Email sign-in successful.");
      setIsEmailVerified(true);
      setIsPhoneVerification(true);
    } catch (error) {
      if (error.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, error);
        console.log("Multi-factor auth required. Resolver:", resolver);
        setMfaResolver(resolver);
        setIsPhoneVerification(true);
      } else {
        setError(error.message);
        console.error("Error during sign-in:", error.message);
      }
    }
  };

  const handleVerifyCode = async () => {
    const confirmationResult = window.confirmationResult;
    try {
      if (mfaResolver) {
        const credential = PhoneAuthProvider.credential(
          window.verificationId,
          verificationCode
        );
        const multiFactorAssertion = PhoneAuthProvider.assertion(credential);
        await mfaResolver.resolveSignIn(multiFactorAssertion);
        console.log("Phone number verified!");
      } else {
        await confirmationResult.confirm(verificationCode);
        console.log("Phone number verified!");
      }
      if (isEmailVerified) {
        navigate("/main");
      }
    } catch (error) {
      setError(error.message);
      console.error("Error verifying code:", error.message);
    }
  };

  return (
    <div className="w-[522px] h-[540px] ml-[600px] mt-[150px] p-[20px] bg-cyan text-center rounded-[15px] signInContainer">
      <h2 className="text-white text-[40px] mb-[50px]">Login</h2>
      <p className="text-white text-[20px] mb-[10px] font-semibold">
        Enter your e-mail and password
      </p>

      {!isPhoneVerification ? (
        <form onSubmit={handleSignIn}>
          <input
            className="block w-[380px] h-[45px] rounded-lg mb-5 border-white mx-auto px-3 py-2 mt-2 text-black signIn-email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="block w-96 h-12 rounded-lg mb-5 border-white mx-auto px-3 py-2 mt-2 text-black signIn-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-500">{error}</p>}
          <div className="flex items-center text-white mx-[50px] my-55 signIn-divider">
            <hr className="flex-1 border-none h-px bg-white" />
            <span className="px-5">Or</span>
            <hr className="flex-1 border-none h-px bg-white" />
          </div>
          <GoogleAuth />
          <button
            type="submit"
            className="w-[380px] h-12 bg-customBlue rounded-lg border-none text-white text-lg font-bold mt-[3px] signIn-btn"
          >
            Continue
          </button>
        </form>
      ) : (
        <div>
          <p className="text-white text-[20px] mb-[10px] font-semibold">
            Enter your phone number to receive a verification code
          </p>
          <input
            className="block w-[380px] h-[45px] rounded-lg mb-5 border-white mx-auto px-3 py-2 mt-2 text-black"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Phone Number"
            required
          />
          <button
            onClick={handlePhoneVerification}
            disabled={!isRecaptchaReady} // Disable button if reCAPTCHA isn't solved
            className="w-[380px] h-12 bg-customBlue rounded-lg border-none text-white text-lg font-bold mt-[3px]"
          >
            Send Code
          </button>
          <input
            className="block w-[380px] h-[45px] rounded-lg mb-5 border-white mx-auto px-3 py-2 mt-2 text-black"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Verification Code"
            required
          />
          <button
            onClick={handleVerifyCode}
            className="w-[380px] h-12 bg-customBlue rounded-lg border-none text-white text-lg font-bold mt-[3px]"
          >
            Verify Code
          </button>
        </div>
      )}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default SignIn;
