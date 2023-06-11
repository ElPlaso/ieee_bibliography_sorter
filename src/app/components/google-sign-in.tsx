"use client";

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { AppDispatch } from "../store/store";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../features/auth/auth-slice";
import { auth } from "../../../firebase";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import AuthUser from "../types/auth-user";

const provider = new GoogleAuthProvider();

export const loginWithGoogle =
  (router: ReturnType<typeof useRouter>) => async (dispatch: AppDispatch) => {
    dispatch(loginStart());
    try {
      const result = await signInWithPopup(auth, provider);
      const user = {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoUrl: result.user.photoURL,
      };
      dispatch(loginSuccess(user as AuthUser));
      router.push("/");
    } catch (error) {
      const errorCode = (error as { code?: string }).code;
      const errorMessage = (error as { message?: string }).message;
      dispatch(loginFailure(errorMessage || `Unknown error ${errorCode}`));
      console.log(errorMessage);
    }
  };

export default function GoogleSignIn() {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogin = () => {
    loginWithGoogle(router)(dispatch);
  };

  return (
    <button
      className=" flex bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 font-bold rounded w-[250px] items-center shadow-md"
      onClick={handleLogin}
    >
      <div className="bg-white rounded p-2">
        <FcGoogle size={25} />
      </div>
      <h1 className="flex-grow my-2 ml-2">Sign in with Google</h1>
    </button>
  );
}