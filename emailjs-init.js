/*
  EmailJS initialization for the KennDev portfolio contact form.
  Sends a notification email to kenndanield@gmail.com whenever the
  contact form is submitted — no backend, no Blaze plan needed.

  This file must load BEFORE script.js (already wired up in index.html).
*/

emailjs.init({
  publicKey: "pRi3_fVBj_qdIcz_j"
});

// Exposed globally so script.js can reference the service/template IDs
// without hardcoding them inline.
window.EMAILJS_SERVICE_ID = "service_d5ozvmc";
window.EMAILJS_TEMPLATE_ID = "template_j6l5len";
