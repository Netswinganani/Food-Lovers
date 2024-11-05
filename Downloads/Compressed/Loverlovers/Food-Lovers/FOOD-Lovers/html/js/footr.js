function createFooter() {
    const footer = document.createElement('div');
    footer.className = 'footer-content';
    
    footer.innerHTML = `
        <img src="images/mainlogo.png" class="logo" alt="FoodLovers Logo" />
        <div class="footer-info">
            <div class="company">
                <p class="company-name">FoodLovers</p>
                <p class="company-address">FoodLovers, 289 Cooper St. Watertown, MA 02472</p>
            </div>
            <div class="socials">
                <a href="https://www.facebook.com/FoodLovers.in" class="social-link">
                    <img src="images/facebook.png" class="social-icon" alt="Facebook" />
                </a>
                <a href="https://www.instagram.com/FoodLovers.in" class="social-link">
                    <img src="images/instagram.png" class="social-icon" alt="Instagram" />
                </a>
                <a href="https://www.twitter.com/foodlovers.in" class="social-link">
                    <img src="images/twitter.png" class="social-icon" alt="Twitter" />
                </a>
            </div>
            <div class="footer-ul-container">
                <ul class="footer-ul">
                    <li class="footer-li"><a href="about.html" class="footer-link">About Us</a></li>
                    <li class="footer-li"><a href="contact.html" class="footer-link">Contact Us</a></li>
                    <li class="footer-li"><a href="seller.html" class="footer-link">Sell With Us</a></li>
                    <li class="footer-li"><a href="terms.html" class="footer-link">Terms & Conditions</a></li>
                    <li class="footer-li"><a href="privacy.html" class="footer-link">Privacy Policy</a></li>
                </ul>
            </div>
        </div>
       
    `;

    document.body.appendChild(footer);
}

// Call the createFooter function on page load
window.onload = createFooter;
