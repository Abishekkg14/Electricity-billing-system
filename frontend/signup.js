async function handleSignup(event) {
    event.preventDefault();
    alert("handleSignup triggered");  // Verify handler is invoked
    console.log('Signup form submitted');

    const formData = {
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value.trim()
    };

    console.log('Form Data being sent:', formData);

    if (!formData.username || !formData.email || !formData.password) {
        alert('All fields are required (client side check)');
        return;
    }

    try {
        const response = await fetch('/api/signup', {  // Use relative URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        console.log('Server response status:', response.status);
        const data = await response.json();
        console.log('Server response:', data);

        if (response.ok) {
            alert('Signup successful! Redirecting to verification page...');
            window.location.href = '/verification.html?email=' + encodeURIComponent(formData.email);
        } else {
            alert(data.message || 'Signup failed. Please try again.');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Connection error: ' + error.message);
    }
}
