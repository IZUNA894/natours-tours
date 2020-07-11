import Stripe from "stripe";

/* eslint-disable */
const axios = require("axios");
var stripe = window.Stripe(
  "pk_test_51H2ysAA5x3ylwfO5ckgwzogxSEWkgPexpcpVeqQtrtfFtVz35JWZ1RHmKwvLDKEqew7vovjUKvhCjkOMf4q1rIcx00LFpNo4HC"
);

export const getBooking = async tourId => {
  try {
    //1. get check out session from  api
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);
    //2. get checkout from and charge the cc
    await stripe.redirectToCheckout({
      sessionId: session.data.Stripe.id
    });
  } catch (err) {
    console.log(err);
    alert(err.message);
  }
};
