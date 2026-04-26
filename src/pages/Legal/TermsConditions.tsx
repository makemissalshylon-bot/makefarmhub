import { ArrowLeft, FileText, Mail, Phone, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMeta } from '../../hooks/useMeta';
import '../../styles/legal.css';

export default function TermsConditions() {
  useMeta({
    title: 'Terms & Conditions - MAKEFARMHUB',
    description: 'Read the terms and conditions for using MAKEFARMHUB\'s agricultural marketplace platform.',
    url: '/terms',
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
          <FileText size={32} />
          <h1>Terms and Conditions</h1>
        </div>
        <p className="last-updated">Last Updated: {lastUpdated}</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            Welcome to MakeFarmHub. These Terms and Conditions ("Terms") govern your access to 
            and use of our mobile application, website, and services (collectively, the "Platform"). 
            By registering for an account or using MakeFarmHub, you agree to be bound by these Terms.
          </p>
          <p>
            If you do not agree to these Terms, you must not access or use our Platform. We reserve 
            the right to modify these Terms at any time, and your continued use constitutes 
            acceptance of any changes.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Description of Service</h2>
          <p>
            MakeFarmHub is an agricultural marketplace platform that connects:
          </p>
          <ul>
            <li><strong>Farmers/Sellers:</strong> Individuals or entities selling agricultural products</li>
            <li><strong>Buyers:</strong> Individuals or businesses purchasing agricultural products</li>
            <li><strong>Transporters:</strong> Logistics providers facilitating delivery of goods</li>
          </ul>
          <p>
            MakeFarmHub acts as an intermediary platform and is not a party to transactions 
            between users. We facilitate connections but do not guarantee the quality, safety, 
            or legality of items listed.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. User Accounts</h2>
          
          <h3>3.1 Registration</h3>
          <p>To use certain features, you must create an account. You agree to:</p>
          <ul>
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and update your information as needed</li>
            <li>Keep your password secure and confidential</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized access</li>
          </ul>

          <h3>3.2 Account Types</h3>
          <ul>
            <li><strong>Farmer Account:</strong> For users who wish to sell agricultural products</li>
            <li><strong>Buyer Account:</strong> For users who wish to purchase products</li>
            <li><strong>Transporter Account:</strong> For logistics service providers</li>
          </ul>

          <h3>3.3 Verification</h3>
          <p>
            We may require identity verification for certain account types or transaction limits. 
            Verified accounts receive enhanced trust indicators on the platform.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. User Conduct</h2>
          <p>You agree NOT to:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Post false, misleading, or fraudulent content</li>
            <li>List prohibited or illegal items</li>
            <li>Infringe on intellectual property rights</li>
            <li>Harass, threaten, or discriminate against other users</li>
            <li>Manipulate prices or engage in market manipulation</li>
            <li>Use the platform for money laundering or illegal activities</li>
            <li>Create multiple accounts for fraudulent purposes</li>
            <li>Circumvent platform fees or payment systems</li>
            <li>Scrape, harvest, or collect user data without consent</li>
            <li>Introduce malware, viruses, or harmful code</li>
            <li>Interfere with platform operations or security</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Listings and Transactions</h2>
          
          <h3>5.1 Seller Responsibilities</h3>
          <p>Sellers agree to:</p>
          <ul>
            <li>Provide accurate descriptions, images, and pricing</li>
            <li>Only list products they have legal right to sell</li>
            <li>Fulfill orders within agreed timeframes</li>
            <li>Comply with food safety and agricultural regulations</li>
            <li>Respond to buyer inquiries in a timely manner</li>
            <li>Accept returns/refunds as per platform policies</li>
          </ul>

          <h3>5.2 Buyer Responsibilities</h3>
          <p>Buyers agree to:</p>
          <ul>
            <li>Provide accurate delivery information</li>
            <li>Complete payment for confirmed orders</li>
            <li>Inspect goods upon delivery and report issues promptly</li>
            <li>Communicate respectfully with sellers and transporters</li>
          </ul>

          <h3>5.3 Transporter Responsibilities</h3>
          <p>Transporters agree to:</p>
          <ul>
            <li>Maintain valid licenses and insurance</li>
            <li>Handle goods with appropriate care</li>
            <li>Deliver within agreed timeframes</li>
            <li>Maintain proper temperature controls where required</li>
            <li>Report any incidents or damages immediately</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. Payments and Escrow</h2>
          
          <h3>6.1 Payment Processing</h3>
          <p>
            All payments are processed through our secure payment system. We support various 
            payment methods including mobile money, bank transfers, and card payments.
          </p>

          <h3>6.2 Escrow System</h3>
          <p>
            For buyer protection, payments are held in escrow until the buyer confirms receipt 
            of goods. Funds are released to the seller after:
          </p>
          <ul>
            <li>Buyer confirms satisfactory delivery, OR</li>
            <li>7 days from delivery confirmation if no dispute is raised</li>
          </ul>

          <h3>6.3 Platform Fees</h3>
          <p>
            MakeFarmHub charges a commission on successful transactions. Current fee structure:
          </p>
          <ul>
            <li>Seller commission: 5% of transaction value</li>
            <li>Transport booking fee: 5% of transport cost</li>
            <li>Payment processing fees may apply</li>
          </ul>

          <h3>6.4 Refunds</h3>
          <p>
            Refunds are processed according to our dispute resolution policy. Eligible refunds 
            are typically processed within 7-14 business days.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Disputes and Resolution</h2>
          
          <h3>7.1 Dispute Process</h3>
          <p>In case of disputes:</p>
          <ol>
            <li>Parties should first attempt direct resolution</li>
            <li>If unresolved, file a dispute through the platform within 48 hours of delivery</li>
            <li>Provide evidence (photos, messages, receipts)</li>
            <li>Our team will review and make a decision within 7 days</li>
          </ol>

          <h3>7.2 Resolution Outcomes</h3>
          <p>Possible outcomes include:</p>
          <ul>
            <li>Full refund to buyer</li>
            <li>Partial refund</li>
            <li>Release of funds to seller</li>
            <li>Account warnings or suspensions</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>8. Prohibited Items</h2>
          <p>The following items are prohibited on MakeFarmHub:</p>
          <ul>
            <li>Illegal drugs or controlled substances</li>
            <li>Stolen or illegally obtained goods</li>
            <li>Counterfeit or fake products</li>
            <li>Endangered species or protected wildlife</li>
            <li>Hazardous materials</li>
            <li>Weapons or ammunition</li>
            <li>Items violating export/import regulations</li>
            <li>Products past expiration dates</li>
            <li>Contaminated or unsafe food products</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>9. Intellectual Property</h2>
          <p>
            All content, trademarks, logos, and intellectual property on MakeFarmHub are owned 
            by us or our licensors. Users retain ownership of content they create but grant us 
            a license to use, display, and distribute such content on the platform.
          </p>
          <p>
            You may not copy, reproduce, or use our intellectual property without written permission.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW:
          </p>
          <ul>
            <li>MakeFarmHub is provided "as is" without warranties of any kind</li>
            <li>We do not guarantee uninterrupted or error-free service</li>
            <li>We are not liable for actions of third-party users</li>
            <li>We are not responsible for product quality, safety, or legality</li>
            <li>Our liability is limited to the fees paid to us in the past 12 months</li>
            <li>We are not liable for indirect, incidental, or consequential damages</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>11. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless MakeFarmHub, its officers, directors, 
            employees, and agents from any claims, damages, losses, or expenses arising from:
          </p>
          <ul>
            <li>Your use of the platform</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of third parties</li>
            <li>Content you post or transmit</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>12. Termination</h2>
          <p>
            We may suspend or terminate your account at any time for violations of these Terms 
            or for any other reason at our discretion. Upon termination:
          </p>
          <ul>
            <li>Your right to use the platform ceases immediately</li>
            <li>Pending transactions will be handled according to our policies</li>
            <li>Funds in escrow will be processed according to dispute procedures</li>
            <li>You may request your data in accordance with our Privacy Policy</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>13. Governing Law</h2>
          <p>
            These Terms are governed by the laws of Zimbabwe. Any disputes arising from these 
            Terms or your use of MakeFarmHub shall be resolved in the courts of Zimbabwe.
          </p>
        </section>

        <section className="legal-section">
          <h2>14. Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable, the remaining 
            provisions will continue in full force and effect.
          </p>
        </section>

        <section className="legal-section">
          <h2>15. Entire Agreement</h2>
          <p>
            These Terms, together with our Privacy Policy, constitute the entire agreement 
            between you and MakeFarmHub regarding the use of our Platform.
          </p>
        </section>

        <section className="legal-section">
          <h2>16. Contact Information</h2>
          <p>
            For questions about these Terms, please contact us:
          </p>
          <div className="contact-info">
            <div className="contact-item">
              <Mail size={20} />
              <span>legal@makefarmhub.com</span>
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
        <p>
          By using MakeFarmHub, you acknowledge that you have read, understood, and agree 
          to be bound by these Terms and Conditions.
        </p>
      </div>
    </div>
  );
}
