function PrivacyPage() {
  return (
    <div className="pt-24">
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-charcoal leading-tight">Privacy Policy</h1>
          <p className="mt-4 text-lg text-soft">Last updated: July 2026</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="prose prose-slate max-w-none space-y-8 text-sm text-soft leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-3">Information We Collect</h2>
            <p>When you use ALEXTRONICS, we collect information you provide directly:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Account Information:</strong> If you sign up, we collect your email address and display name via Firebase Authentication.</li>
              <li><strong>Inquiry Information:</strong> When you submit an inquiry, we collect your name, phone number, county, town, estate, landmark, and any notes you provide.</li>
              <li><strong>Subscription Information:</strong> If you subscribe to our newsletter, we collect your email address and optional name.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-3">Local Storage & Cookies</h2>
            <p>ALEXTRONICS uses browser local storage for essential functionality:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>User Role:</strong> We store your assigned role (e.g., Buyer, Admin) in local storage to manage access control.</li>
              <li><strong>Inquiry Cart:</strong> Items you add to your inquiry cart are stored locally so your selection persists between sessions.</li>
              <li><strong>Firebase Auth:</strong> Firebase Authentication uses local storage and cookies to maintain your login session.</li>
            </ul>
            <p className="mt-2">We do not use tracking cookies, analytics cookies, or third-party advertising cookies. All local storage is used solely for functionality.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>To process and respond to product inquiries</li>
              <li>To send requested newsletters and promotional emails (with consent)</li>
              <li>To manage user accounts and admin access</li>
              <li>To improve our marketplace and user experience</li>
              <li>To comply with legal obligations</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-3">Data Sharing</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Firebase (Google):</strong> Authentication services and user account management</li>
              <li><strong>MongoDB Atlas:</strong> Database hosting for storing your inquiries and account data</li>
              <li><strong>Gmail SMTP:</strong> Sending transactional and promotional emails</li>
            </ul>
            <p className="mt-2">All third-party services are GDPR-compliant and use industry-standard security measures.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-3">Data Retention</h2>
            <p>We retain your personal data only as long as necessary:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Inquiry records are kept for order fulfillment and record-keeping purposes</li>
              <li>Subscription data is kept until you unsubscribe</li>
              <li>Account data is kept until you request deletion</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-3">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for email marketing at any time</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at alextronics.shop01@gmail.com.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-3">Security</h2>
            <p>We implement appropriate security measures including HTTPS encryption, Firebase Authentication for secure access, and database access controls. However, no online service is 100% secure.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-3">Changes to This Policy</h2>
            <p>We may update this policy from time to time. Changes will be posted on this page with an updated date.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-3">Contact</h2>
            <p>For questions about this policy, contact us at:</p>
            <p className="mt-1">Email: alextronics.shop01@gmail.com<br />Phone: 0708309429</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PrivacyPage;
