<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = htmlspecialchars(trim($_POST['newsletter-email']));

    if (empty($email)) {
        echo "Email is required!";
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "Invalid email format!";
        exit;
    }

    // Check for business email domains (reject common public domains)
    $publicDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
        'icloud.com', 'live.com', 'msn.com', 'yahoo.co.uk', 'googlemail.com',
        'me.com', 'mac.com', 'comcast.net', 'verizon.net', 'att.net',
        'sbcglobal.net', 'bellsouth.net', 'cox.net', 'earthlink.net',
        'protonmail.com', 'mail.com', 'yandex.com', 'zoho.com', 'gmx.com'
    ];

    $domain = strtolower(substr(strrchr($email, "@"), 1));
    if (in_array($domain, $publicDomains)) {
        echo "Please use a business email address!";
        exit;
    }

    $to = "Hello@markoagency.com";
    $subject = "New Newsletter Subscription";
    $message = "New subscriber: $email";
    $headers = "From: noreply@example.com\r\n";
    $headers .= "Reply-To: noreply@example.com\r\n";

    if (mail($to, $subject, $message, $headers)) {
        echo "Thank you for subscribing!";
    } else {
        echo "Failed to subscribe. Please try again.";
    }
} else {
    echo "Invalid request!";
}
?>