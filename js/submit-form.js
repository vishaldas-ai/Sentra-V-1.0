function initSubmitContact() {
    $('#contactForm').on('submit', function (event) {
        event.preventDefault();

        var $email = $('#email');
        var $successMessage = $('#success-message');
        var $errorMessage = $('#error-message');

        function validateEmail(email) {
            var pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return pattern.test(email);
        }

        if (!validateEmail($email.val())) {
            $errorMessage.removeClass('hidden');
            $successMessage.addClass('hidden');

            setTimeout(function () {
                $errorMessage.addClass('hidden');
            }, 3000);

            return;
        } else {
            $errorMessage.addClass('hidden');
            $successMessage.removeClass('hidden');
            $('#contactForm')[0].reset();

            setTimeout(function () {
                $successMessage.addClass('hidden');
            }, 3000);
        }
    });
}

function initSubmitNewsletter() {
    $('#newsletterForm').on('submit', function(event) {
        event.preventDefault();

        var $email = $('#newsletter-email');
        var $successMessage = $('#newsletter-success');
        var $errorMessage = $('#newsletter-error');
        var $errorText = $email.next('.error-text');

        var isValid = true;

        // List of common public email domains to reject
        var publicDomains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
            'icloud.com', 'live.com', 'msn.com', 'yahoo.co.uk', 'googlemail.com',
            'me.com', 'mac.com', 'comcast.net', 'verizon.net', 'att.net',
            'sbcglobal.net', 'bellsouth.net', 'cox.net', 'earthlink.net',
            'protonmail.com', 'mail.com', 'yandex.com', 'zoho.com', 'gmx.com'
        ];

        function validateEmail(email) {
            var pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return pattern.test(email);
        }

        function isBusinessEmail(email) {
            var domain = email.split('@')[1].toLowerCase();
            return !publicDomains.includes(domain);
        }

        if (!$email.val().trim()) {
            $email.addClass('error-border');
            $errorText.removeClass('hidden').text('This field is required');
            isValid = false;
        } else if (!validateEmail($email.val())) {
            $email.addClass('error-border');
            $errorText.text('Invalid email format').removeClass('hidden');
            isValid = false;
        } else if (!isBusinessEmail($email.val())) {
            $email.addClass('error-border');
            $errorText.text('Please use a business email address').removeClass('hidden');
            isValid = false;
        } else {
            $email.removeClass('error-border');
            $errorText.addClass('hidden');
        }

        if (isValid) {
            $successMessage.removeClass('hidden');
            $('#newsletterForm')[0].reset();
            setTimeout(function() {
                $successMessage.addClass('hidden');
            }, 3000);
        } else {
            $errorMessage.removeClass('hidden');
            $('#newsletterForm')[0].reset();
            setTimeout(function() {
                $errorMessage.addClass('hidden');
            }, 3000);
        }
    });
}