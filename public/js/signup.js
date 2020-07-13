/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

export const signup = async (name, email, password, confirmPassword) => {
  try {
    if (password !== confirmPassword)
      throw new Error("password and confirm Password must be the same");

    const res = await axios({
      method: "POST",
      url: "/api/v1/create/user",
      data: {
        name,
        email,
        password,
        confirmPassword
      }
    });
    console.log(res.data);
    if (res.data.status === "success") {
      showAlert("success", "Account createdsuccessfully!");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err) {
    console.log(err);

    showAlert("error", err.message || err.response.data.message);
  }
};
