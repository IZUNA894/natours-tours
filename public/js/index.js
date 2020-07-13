/* eslint-disable */
import "@babel/polyfill";
import { displayMap } from "./mapbox";
import { login, logout } from "./login";
import { signup } from "./signup";
import { updateSettings } from "./updateSettings";
import { getBooking } from "./stripe.js";
// DOM ELEMENTS
const mapBox = document.getElementById("map");
const loginForm = document.querySelector("#loginForm");
const signupForm = document.querySelector("#signupForm");
const logOutBtn = document.querySelector(".nav__el--logout");
const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");
const bookTour = document.querySelector("#book-tour");
const signupBtn = document.querySelector("#signupBtn");
const loginBtn = document.querySelector("#loginBtn");

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm)
  loginForm.addEventListener("submit", e => {
    e.preventDefault();
    loginBtn.innerHTML = "Processing...";
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });

//for sign up form
if (signupForm)
  signupForm.addEventListener("submit", e => {
    e.preventDefault();
    signupBtn.innerHTML = "Processing...";
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    signup(name, email, password, confirmPassword);
  });

if (logOutBtn) logOutBtn.addEventListener("click", logout);

if (userDataForm)
  userDataForm.addEventListener("submit", e => {
    e.preventDefault();

    //! we can do this also...but now as we sendind photo also so we have to enctype='multipart/form-data in
    //! in form ,but we r not using it in form also so we ahave to do it here
    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;

    //this is way to do enctype='multipart/form-data'
    var form = new FormData();
    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("photo", document.getElementById("photo").files[0]);

    updateSettings(form, "data");
  });

if (userPasswordForm)
  userPasswordForm.addEventListener("submit", async e => {
    e.preventDefault();
    document.querySelector(".btn--save-password").textContent = "Updating...";

    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      "password"
    );

    document.querySelector(".btn--save-password").textContent = "Save password";
    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";
  });

if (bookTour) {
  bookTour.addEventListener("click", e => {
    var tourId = e.target.dataset.tourId;
    bookTour.innerHTML = "Processing...";
    getBooking(tourId);
  });
}
