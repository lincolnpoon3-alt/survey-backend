// Email templates for Fuzzymilky Survey System

function getEmailTemplate(fullName, orderNumber, rating, tryProducts) {
    const ratingNum = parseInt(rating);
    const wantsTrial = tryProducts && tryProducts.toLowerCase().includes('yes');
    
    // Template A: 5 stars + Yes
    if (ratingNum === 5 && wantsTrial) {
        return {
            subject: 'Welcome to the Fuzzymilky Community',
            html: '<html><body style="font-family: Arial, sans-serif;"><p>Dear ' + fullName + ',</p><p>Thank you so much for purchasing our product!</p><p>I am Zoe from the Fuzzymilky Product Support Team.</p><p>Welcome to the Pawsome Trial Crew family!</p><p>Warm regards,<br>Zoe</p></body></html>'
        };
    }
    
    // Template B: 4 or 3 stars + Yes
    if ((ratingNum === 4 || ratingNum === 3) && wantsTrial) {
        return {
            subject: 'Welcome to the Fuzzymilky Community',
            html: '<html><body style="font-family: Arial, sans-serif;"><p>Dear ' + fullName + ',</p><p>Thank you for your feedback!</p><p>I am Zoe from the Fuzzymilky Product Support Team.</p><p>Warm regards,<br>Zoe</p></body></html>'
        };
    }
    
    // Template C: 2 or 1 stars + Yes
    if ((ratingNum === 2 || ratingNum === 1) && wantsTrial) {
        return {
            subject: 'We are Sorry - Let us Make This Right',
            html: '<html><body style="font-family: Arial, sans-serif;"><p>Dear ' + fullName + ',</p><p>We are truly sorry your experience fell short.</p><p>I am Zoe from the Fuzzymilky Product Support Team. Please reply and I will make this right.</p><p>Warm regards,<br>Zoe</p></body></html>'
        };
    }
    
    // Template D: 5 stars + No
    if (ratingNum === 5 && !wantsTrial) {
        return {
            subject: 'Thank You from Fuzzymilky',
            html: '<html><body style="font-family: Arial, sans-serif;"><p>Dear ' + fullName + ',</p><p>Thank you for your purchase and feedback!</p><p>I am Zoe from the Fuzzymilky Product Support Team.</p><p>Warm regards,<br>Zoe</p></body></html>'
        };
    }
    
    // Template E: 4 or 3 stars + No
    if ((ratingNum === 4 || ratingNum === 3) && !wantsTrial) {
        return {
            subject: 'Thank You from Fuzzymilky',
            html: '<html><body style="font-family: Arial, sans-serif;"><p>Dear ' + fullName + ',</p><p>Thank you for your feedback!</p><p>Warm regards,<br>Zoe</p></body></html>'
        };
    }
    
    // Template F: 2 or 1 stars + No
    if ((ratingNum === 2 || ratingNum === 1) && !wantsTrial) {
        return {
            subject: 'We are Sorry - Let us Make This Right',
            html: '<html><body style="font-family: Arial, sans-serif;"><p>Dear ' + fullName + ',</p><p>We are sorry your experience fell short. Please reply and we will make this right.</p><p>Warm regards,<br>Zoe</p></body></html>'
        };
    }
    
    // Fallback
    return {
        subject: 'Thank you',
        html: '<html><body><p>Dear ' + fullName + ',</p><p>Thank you!</p></body></html>'
    };
}

module.exports = { getEmailTemplate };
