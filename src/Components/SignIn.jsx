import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
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
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const setupRecaptcha = () => {
    try {
      console.log("Setting up reCAPTCHA...");

      // Ensure that recaptchaVerifier is not already set up
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          "recaptcha-container", // The HTML element that will contain the reCAPTCHA
          {
            size: "invisible", // Invisible reCAPTCHA
            callback: (response) => {
              console.log("reCAPTCHA verified successfully");
            },
          },
          auth // Ensure auth is correctly passed here
        );
        window.recaptchaVerifier
          .render()
          .then(() => {
            console.log("reCAPTCHA setup complete");
          })
          .catch((error) => {
            setError(error.message);
            console.error("Error rendering reCAPTCHA:", error.message);
          });
      }
    } catch (error) {
      setError(error.message);
      console.error("Error setting up reCAPTCHA:", error.message);
    }
  };

  // Handle email and password sign-in
  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setIsEmailVerified(true); // Email sign-in successful
      setupRecaptcha(); // Initialize reCAPTCHA for phone verification
      setIsPhoneVerification(true); // Show phone verification UI
    } catch (error) {
      setError(error.message);
      console.error("Error during sign-in:", error.message);
    }
  };

  // Handle phone number verification
  const handlePhoneVerification = async () => {
    const appVerifier = window.recaptchaVerifier;
    try {
      // Ensure phone number is correctly formatted with the country code (+216)
      let formattedPhoneNumber = phoneNumber;

      // If the phone number doesn't start with '+216', add the country code
      if (!formattedPhoneNumber.startsWith("+216")) {
        formattedPhoneNumber = `+216${formattedPhoneNumber.replace(/^\+/, "")}`;
      }

      console.log("Phone Number to verify:", formattedPhoneNumber); // Log the phone number being verified

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

  // Handle the verification code confirmation
  const handleVerifyCode = async () => {
    const confirmationResult = window.confirmationResult;
    try {
      await confirmationResult.confirm(verificationCode);
      console.log("Phone number verified!");
      setIsPhoneVerified(true); // Mark phone verification as successful
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
          <div id="recaptcha-container"></div>
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
    </div>
  );
};

export default SignIn;
