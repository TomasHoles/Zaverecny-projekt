await register({
  email: formData.email,
  password: formData.password,
  password2: formData.password2,
  first_name: formData.first_name,
  last_name: formData.last_name,
  currency_preference: 'USD'
});