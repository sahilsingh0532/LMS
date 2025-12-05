emailjs.init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY);

emailjs.send(
  process.env.REACT_APP_EMAILJS_SERVICE_ID,
  process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
  templateParams,
  process.env.REACT_APP_EMAILJS_PUBLIC_KEY
);


// Replace these with your actual credentials from EmailJS dashboard