import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMeta } from '../../hooks/useMeta';
import {
  Search,
  Book,
  MessageSquare,
  Phone,
  Mail,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Video,
  FileText,
  Users
} from 'lucide-react';
import './HelpCenter.css';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // Buyers
  {
    id: 'b1',
    category: 'Buyers',
    question: 'How do I purchase products on MAKEFARMHUB?',
    answer: 'Browse the marketplace, select a product, choose quantity, and click "Pay Now". You can pay via Stripe card payment or Mobile Money (EcoCash, OneMoney). Your payment is held in escrow until delivery is confirmed.'
  },
  {
    id: 'b2',
    category: 'Buyers',
    question: 'Is my payment secure?',
    answer: 'Yes! All payments are processed through secure payment gateways (Stripe for cards, certified Mobile Money providers). Your money is held in escrow and only released to the seller after you confirm delivery.'
  },
  {
    id: 'b3',
    category: 'Buyers',
    question: 'What if I receive damaged or wrong products?',
    answer: 'Contact the seller immediately through our messaging system. If unresolved, open a dispute from your Orders page. Our admin team will review and help resolve the issue within 3-5 business days.'
  },
  {
    id: 'b4',
    category: 'Buyers',
    question: 'Can I cancel an order?',
    answer: 'Yes, you can cancel before the seller ships the order. Go to your Orders page, select the order, and click "Cancel Order". Funds in escrow will be refunded within 5-7 business days.'
  },
  
  // Farmers/Sellers
  {
    id: 's1',
    category: 'Farmers/Sellers',
    question: 'How do I list my products?',
    answer: 'Go to "Create Listing", fill in product details (name, category, price, quantity, images), set delivery terms, and toggle "Ready to Sell" when you want buyers to purchase directly. Submit and your listing goes live!'
  },
  {
    id: 's2',
    category: 'Farmers/Sellers',
    question: 'When do I receive payment?',
    answer: 'Payment is released from escrow to your wallet after the buyer confirms delivery. You can then withdraw funds to your bank account or mobile money wallet from the Wallet page.'
  },
  {
    id: 's3',
    category: 'Farmers/Sellers',
    question: 'What fees does MAKEFARMHUB charge?',
    answer: 'We charge a 5% commission on each successful sale. This covers platform maintenance, payment processing, and customer support. The fee is automatically deducted when releasing payment to your wallet.'
  },
  {
    id: 's4',
    category: 'Farmers/Sellers',
    question: 'How do I arrange delivery?',
    answer: 'You can arrange your own delivery or use our Transport Booking feature. Browse available transporters, check their rates and reviews, and book directly through the platform.'
  },
  
  // Transport
  {
    id: 't1',
    category: 'Transport',
    question: 'How do I become a transporter on MAKEFARMHUB?',
    answer: 'Sign up with a Transporter account, add your vehicles (with registration, capacity, and rates), and browse transport requests. Accept jobs and coordinate with sellers/buyers for pickup and delivery.'
  },
  {
    id: 't2',
    category: 'Transport',
    question: 'How are transport payments handled?',
    answer: 'Transport fees are agreed upfront and added to the order total. Payment is held in escrow and released to your wallet after delivery confirmation. You can track all earnings in your dashboard.'
  },
  
  // General
  {
    id: 'g1',
    category: 'General',
    question: 'How do I contact customer support?',
    answer: 'Email us at support@makefarmhub.com or call +263 78 291 9633. You can also use the Live Chat button at the bottom-right of any page for instant help.'
  },
  {
    id: 'g2',
    category: 'General',
    question: 'Is MAKEFARMHUB available on mobile?',
    answer: 'Yes! Our website is fully mobile-responsive. You can also install it as a Progressive Web App (PWA) on your phone for an app-like experience. Look for the "Install App" prompt when visiting on mobile.'
  },
  {
    id: 'g3',
    category: 'General',
    question: 'How do I change my account settings?',
    answer: 'Go to Settings from the navigation menu. You can update your profile, change password, set notification preferences, manage privacy settings, and more.'
  }
];

const categories = ['All', 'Buyers', 'Farmers/Sellers', 'Transport', 'General'];

const quickLinks = [
  { icon: Video, title: 'Video Tutorials', description: 'Watch how-to videos', link: '#' },
  { icon: FileText, title: 'User Guide', description: 'Detailed documentation', link: '#' },
  { icon: MessageSquare, title: 'Live Chat', description: 'Chat with support', action: 'chat' },
  { icon: Users, title: 'Community Forum', description: 'Connect with users', link: '#' }
];

export default function HelpCenter() {
  useMeta({
    title: 'Help Center - MAKEFARMHUB',
    description: 'Find answers to common questions about MAKEFARMHUB. Get help with buying, selling, payments, and transport.',
    url: '/help',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="help-center-page">
      {/* Hero Section */}
      <section className="help-hero">
        <div className="help-hero-content">
          <HelpCircle size={48} className="help-icon" />
          <h1>How can we help you?</h1>
          <p>Search our knowledge base or browse categories below</p>
          
          <div className="help-search">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="quick-links">
        <div className="container">
          <h2>Quick Links</h2>
          <div className="quick-links-grid">
            {quickLinks.map((link, index) => (
              <div key={index} className="quick-link-card">
                <link.icon size={32} />
                <h3>{link.title}</h3>
                <p>{link.description}</p>
                {link.link && (
                  <a href={link.link} className="link-arrow">
                    Learn more <ExternalLink size={16} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          
          {/* Category Filter */}
          <div className="category-filter">
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="faq-list">
            {filteredFAQs.length === 0 ? (
              <div className="no-results">
                <HelpCircle size={48} />
                <p>No results found for "{searchQuery}"</p>
                <button className="btn-primary" onClick={() => setSearchQuery('')}>
                  Clear search
                </button>
              </div>
            ) : (
              filteredFAQs.map(faq => (
                <div key={faq.id} className="faq-item">
                  <button
                    className="faq-question"
                    onClick={() => toggleFAQ(faq.id)}
                  >
                    <span>{faq.question}</span>
                    {expandedFAQ === faq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedFAQ === faq.id && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="contact-support">
        <div className="container">
          <h2>Still need help?</h2>
          <p>Our support team is ready to assist you</p>
          
          <div className="contact-methods">
            <div className="contact-card">
              <Mail size={32} />
              <h3>Email Support</h3>
              <p>support@makefarmhub.com</p>
              <span className="response-time">Response within 24 hours</span>
            </div>
            
            <div className="contact-card">
              <Phone size={32} />
              <h3>Phone Support</h3>
              <p>+263 78 291 9633</p>
              <span className="response-time">Mon-Fri, 8AM-6PM CAT</span>
            </div>
            
            <div className="contact-card">
              <MessageSquare size={32} />
              <h3>Live Chat</h3>
              <p>Instant messaging</p>
              <span className="response-time">Available now</span>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Resources */}
      <section className="resources">
        <div className="container">
          <h2>Additional Resources</h2>
          <div className="resource-links">
            <Link to="/terms" className="resource-link">
              <Book size={20} />
              Terms & Conditions
            </Link>
            <Link to="/privacy" className="resource-link">
              <Book size={20} />
              Privacy Policy
            </Link>
            <a href="#" className="resource-link">
              <ExternalLink size={20} />
              Community Guidelines
            </a>
            <a href="#" className="resource-link">
              <ExternalLink size={20} />
              Safety Tips
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
