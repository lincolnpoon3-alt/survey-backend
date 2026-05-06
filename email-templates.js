// Email templates for Fuzzymilky Survey System
// Templates are selected based on rating (Q4) and trial interest (Q6)

function getEmailTemplate(fullName, orderNumber, rating, tryProducts) {
    const ratingNum = parseInt(rating);
    const wantsTrial = tryProducts && tryProducts.toLowerCase().includes('yes');
    
    // Template A: 5 stars + Yes (Welcome + Perks + Gift reminder)
    if (ratingNum === 5 && wantsTrial) {
        return {
            subject: 'Welcome to the Fuzzymilky Community | Your Perks & Dedicated Contact',
            html: `
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p>Dear ${fullName},</p>
                    <p>Thank you so much for purchasing our product!</p>
                    <p>I'm Zoe from the Fuzzymilky Product Support Team, your go-to contact for any product questions—simply reply to this email anytime.</p>
                    <p><strong>Quick reminder:</strong> if you've shared your product experience, reply to this email with your post screenshot and shipping address, and I'll immediately arrange to send you the product from your registered order as a thank-you gift.</p>
                    <p>Welcome to the Pawsome Trial Crew family – we're thrilled you're here!</p>
                    <p>As part of our Crew, you'll be the first to hear about all our brand-new pet products and improved fan favorites, with exclusive trial invites sent straight to your inbox on the regular. If something sparks your interest for your fur baby, just shoot me a message, and I'll lock in your free trial order and get it shipped out instantly.</p>
                    <p>Wishing you and your pet health and happiness always!</p>
                    <p>Warm regards,<br>Zoe</p>
                </body>
                </html>
            `
        };
    }
    
    // Template B: 4 or 3 stars + Yes (Welcome)
    if ((ratingNum === 4 || ratingNum === 3) && wantsTrial) {
        return {
            subject: 'Welcome to the Fuzzymilky Community | Your Perks & Dedicated Contact',
            html: `
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p>Dear ${fullName},</p>
                    <p>Thank you so much for purchasing our product!</p>
                    <p>I'm Zoe from the Fuzzymilky Product Support Team, your go-to contact for any product questions—simply reply to this email anytime.</p>
                    <p>Welcome to the Pawsome Trial Crew family – we're thrilled you're here!</p>
                    <p>As part of our Crew, you'll be the first to hear about all our brand-new pet products and improved fan favorites, with exclusive trial invites sent straight to your inbox on the regular. If something sparks your interest for your fur baby, just shoot me a message, and I'll lock in your free trial order and get it shipped out instantly.</p>
                    <p>Wishing you and your pet health and happiness always!</p>
                    <p>Warm regards,<br>Zoe</p>
                </body>
                </html>
            `
        };
    }
    
    // Template C: 2 or 1 stars + Yes (Apology + Refund/Replacement)
    if ((ratingNum === 2 || ratingNum === 1) && wantsTrial) {
        return {
            subject: 'We're Sorry Your Fuzzymilky Experience Fell Short – Let's Make This Right',
            html: `
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p>Dear ${fullName},</p>
                    <p>Thank you for purchasing our Fuzzymilky product, and we're truly sorry it didn't live up to your expectations.</p>
                    <p>I'm Zoe from the Fuzzymilky Product Support Team, your dedicated contact to make this right.</p>
                    <p>We know how frustrating this is, especially when you chose our product for your pet. Your satisfaction is our top priority, with no hoops to jump through.</p>
                    <p><strong>Just reply to this email with what went wrong, and I'll immediately apply your choice of a refund or a free replacement to you.</strong></p>
                    <p>Your feedback helps us improve for every pet parent, and I'm here for you anytime.</p>
                    <p>Welcome to the Pawsome Trial Crew family – we're thrilled you're here!</p>
                    <p>As part of our Crew, you'll be the first to hear about all our brand-new pet products and improved fan favorites, with exclusive trial invites sent straight to your inbox on the regular. If something sparks your interest for your fur baby, just shoot me a message, and I'll lock in your free trial order and get it shipped out instantly.</p>
                    <p>Wishing you and your pet health and happiness always!</p>
                    <p>Warm regards,<br>Zoe</p>
                </body>
                </html>
            `
        };
    }
    
    // Template D: 5 stars + No (Perks only)
    if (ratingNum === 5 && !wantsTrial) {
        return {
            subject: 'Your Perks & Dedicated Contact | For you & your pet: Fuzzymilky exclusive benefits',
            html: `
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p>Dear ${fullName},</p>
                    <p>Thank you so much for purchasing our Fuzzymilky product!</p>
                    <p>I'm Zoe from the Fuzzymilky Product Support Team, reachable anytime by replying to this email for any product questions.</p>
                    <p><strong>Quick reminder:</strong> if you've shared your product experience, reply to this email with your post screenshot and shipping address, and I'll immediately arrange to send you the full product set from your registered order as a thank-you gift.</p>
                    <p>We totally understand if you've held off on our Pawsome Trial Crew—no one likes unwanted emails or forced commitments, and that's never our goal.</p>
                    <p>This 100% free program lets you try our brand-new and upgraded products first, just for sharing your feedback. There's zero obligation: join only when you're interested, and opt out anytime.</p>
                    <p>Wishing you and your pet health and happiness always!</p>
                    <p>Warm regards,<br>Zoe</p>
                </body>
                </html>
            `
        };
    }
    
    // Template E: 4 or 3 stars + No (Perks only)
    if ((ratingNum === 4 || ratingNum === 3) && !wantsTrial) {
        return {
            subject: 'Your Perks & Dedicated Contact | For you & your pet: Fuzzymilky exclusive benefits',
            html: `
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p>Dear ${fullName},</p>
                    <p>Thank you so much for purchasing our Fuzzymilky product!</p>
                    <p>I'm Zoe from the Fuzzymilky Product Support Team, reachable anytime by replying to this email for any product questions.</p>
                    <p>We totally understand if you've held off on our Pawsome Trial Crew—no one likes unwanted emails or forced commitments, and that's never our goal.</p>
                    <p>This 100% free program lets you try our brand-new and upgraded products first, just for sharing your feedback. There's zero obligation: join only when you're interested, and opt out anytime.</p>
                    <p>Wishing you and your pet health and happiness always!</p>
                    <p>Warm regards,<br>Zoe</p>
                </body>
                </html>
            `
        };
    }
    
    // Template F: 2 or 1 stars + No (Apology + Refund/Replacement)
    if ((ratingNum === 2 || ratingNum === 1) && !wantsTrial) {
        return {
            subject: 'We're Sorry Your Fuzzymilky Experience Fell Short – Let's Make This Right',
            html: `
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p>Dear ${fullName},</p>
                    <p>Thank you for purchasing our Fuzzymilky product, and we're truly sorry it didn't live up to your expectations.</p>
                    <p>I'm Zoe from the Fuzzymilky Product Support Team, your dedicated contact to make this right.</p>
                    <p>We know how frustrating this is, especially when you chose our product for your pet. Your satisfaction is our top priority, with no hoops to jump through.</p>
                    <p><strong>Just reply to this email with what went wrong, and I'll immediately send your choice of a refund or a free replacement to you.</strong></p>
                    <p>Your feedback helps us improve for every pet parent, and I'm here for you anytime.</p>
                    <p>Wishing you and your pet health and happiness always!</p>
                    <p>Warm regards,<br>Zoe</p>
                </body>
                </html>
            `
        };
    }
    
    // Fallback (should not reach here)
    return {
        subject: 'Thank you for your feedback!',
        html: `<p>Dear ${fullName},</p><p>Thank you for your feedback!</p><p>Warm regards,<br>Zoe</p>`
    };
}

module.exports = { getEmailTemplate };
