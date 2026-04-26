import { ArrowLeft, Shield, Mail, Phone, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMeta } from '../../hooks/useMeta';
import '../../styles/legal.css';

export default function PrivacyPolicy() {
  useMeta({
    title: 'Privacy Policy - MAKEFARMHUB',
    description: 'Learn how MAKEFARMHUB collects, uses, and protects your personal information.',
    url: '/privacy',
  });

  const navigate = useNavigate();
  const lastUpdated = 'December 3, 2025';

  const handleBack = () => {
    // If opened in new tab (no history), close the tab or go to landing
    if (window.history.length <= 1) {
      // Try to close tab, if can't then go to landing
      window.close();
      // Fallback if window.close() doesn't work
      setTimeout(() => navigate('/'), 100);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="legal-page">
      <div className="legal-header">
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={20} />
          Back
        </button>
        <button className="close-btn" onClick={() => window.close()} title="Close">
          <X size={20} />
        </button>
        <div className="legal-title">
          <Shield size={32} />
          <h1>Privacy Policy</h1>
        </div>
        <p className="last-updated">Last Updated: {lastUpdated}</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to MakeFarmHub ("we," "our," or "us"). We are committed to protecting your 
            personal information and your right to privacy. This Privacy Policy explains how we 
            collect, use, disclose, and safeguard your information when you use our mobile 
            application and website (collectively, the "Platform").
          </p>
          <p>
            By using MakeFarmHub, you agree to the collection and use of information in accordance 
            with this policy. If you do not agree with our policies and practices, please do not 
            use our Platform.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Personal Information</h3>
          <p>We collect personal information that you voluntarily provide when you:</p>
          <ul>
            <li>Register for an account (name, email, phone number)</li>
            <li>Create a user profile (profile picture, location, farm details)</li>
            <li>List products for sale (product images, descriptions, pricing)</li>
            <li>Make purchases or transactions</li>
            <li>Communicate with other users or our support team</li>
            <li>Subscribe to our newsletters or notifications</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <p>When you access our Platform, we automatically collect:</p>
          <ul>
            <li>Device information (device type, operating system, unique device identifiers)</li>
            <li>Log data (IP address, browser type, pages visited, time spent)</li>
            <li>Location data (with your consent, for delivery and marketplace features)</li>
            <li>Usage data (features used, interactions, preferences)</li>
          </ul>

          <h3>2.3 Payment Information</h3>
          <p>
            When you make transactions, our payment processors collect payment card details. 
            We do not store complete credit card numbers on our servers. All payment processing 
            is handled by secure, PCI-compliant third-party processors.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information for:</p>
          <ul>
            <li><strong>Account Management:</strong> Creating and managing your account</li>
            <li><strong>Platform Operations:</strong> Facilitating transactions between buyers, sellers, and transporters</li>
            <li><strong>Communication:</strong> Sending order updates, notifications, and promotional content</li>
            <li><strong>Improvement:</strong> Analyzing usage patterns to enhance our services</li>
            <li><strong>Security:</strong> Detecting and preventing fraud, abuse, and security threats</li>
            <li><strong>Legal Compliance:</strong> Meeting legal obligations and enforcing our terms</li>
            <li><strong>Customer Support:</strong> Responding to inquiries and resolving disputes</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Information Sharing and Disclosure</h2>
          <p>We may share your information with:</p>
          
          <h3>4.1 Other Users</h3>
          <p>
            When you list products or engage in transactions, certain information (name, location, 
            ratings) is visible to other users to facilitate the marketplace experience.
          </p>

          <h3>4.2 Service Providers</h3>
          <p>
            We share data with third-party vendors who assist with payment processing, 
            SMS/email delivery, analytics, and customer support.
          </p>

          <h3>4.3 Legal Requirements</h3>
          <p>
            We may disclose information when required by law, court order, or government 
            request, or to protect our rights and safety.
          </p>

          <h3>4.4 Business Transfers</h3>
          <p>
            In the event of a merger, acquisition, or sale of assets, your information may 
            be transferred as part of that transaction.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your personal information, 
            including:
          </p>
          <ul>
            <li>SSL/TLS encryption for data transmission</li>
            <li>Secure server infrastructure</li>
            <li>Regular security audits and updates</li>
            <li>Access controls and authentication</li>
            <li>Escrow system for secure payments</li>
          </ul>
          <p>
            However, no method of transmission over the Internet is 100% secure. While we strive 
            to protect your information, we cannot guarantee absolute security.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed 
            to provide services. We may retain certain information for legal, accounting, or 
            business purposes even after account deletion, typically for up to 7 years for 
            transaction records.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Your Rights and Choices</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your account and data</li>
            <li><strong>Portability:</strong> Receive your data in a portable format</li>
            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            <li><strong>Restrict Processing:</strong> Limit how we use your data</li>
          </ul>
          <p>
            To exercise these rights, contact us at privacy@makefarmhub.com or through the 
            app settings.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Children's Privacy</h2>
          <p>
            MakeFarmHub is not intended for users under 18 years of age. We do not knowingly 
            collect personal information from children. If you believe a child has provided us 
            with personal information, please contact us immediately.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Third-Party Links</h2>
          <p>
            Our Platform may contain links to third-party websites or services. We are not 
            responsible for the privacy practices of these external sites. We encourage you 
            to review their privacy policies before providing any information.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your 
            own. We ensure appropriate safeguards are in place to protect your data in 
            accordance with this Privacy Policy.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any 
            material changes by posting the new policy on this page and updating the 
            "Last Updated" date. Continued use of the Platform after changes constitutes 
            acceptance of the updated policy.
          </p>
        </section>

        <section className="legal-section">
          <h2>12. Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy or our data practices, 
            please contact us:
          </p>
          <div className="contact-info">
            <div className="contact-item">
              <Mail size={20} />
              <span>privacy@makefarmhub.com</span>
            </div>
            <div className="contact-item">
              <Phone size={20} />
              <span>+263 78 291 9633</span>
            </div>
            <div className="contact-item">
              <strong>MakeFarmHub</strong>
              <span>Harare, Zimbabwe</span>
            </div>
          </div>
        </section>
      </div>

      <div className="legal-footer">
        <p>© {new Date().getFullYear()} MakeFarmHub. All rights reserved.</p>
      </div>
    </div>
  );
}
