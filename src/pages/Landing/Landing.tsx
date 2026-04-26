import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useScrollAnimation, useParallax } from '../../hooks/useScrollAnimation';
import { useMeta } from '../../hooks/useMeta';
import { seoService } from '../../services/seo/SEOService';
import {
  ArrowRight,
  Shield,
  Truck,
  Users,
  TrendingUp,
  CheckCircle,
  Star,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Play,
  Leaf,
  DollarSign,
  Clock,
  Award,
  Menu,
  X,
  Facebook,
  Twitter,
  Instagram,
  MessageCircle,
  Zap,
  Globe,
  HeartHandshake,
  BadgeCheck,
  Sparkles,
} from 'lucide-react';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // SEO setup
  useEffect(() => {
    seoService.updateMeta({
      title: 'Zimbabwe\'s #1 Agricultural Marketplace',
      description: 'Connect farmers directly with buyers. Secure payments, reliable transport, and real-time pricing. Join 100+ farmers and 200+ products on MAKEFARMHUB.',
      keywords: ['agriculture marketplace Zimbabwe', 'buy farm produce', 'sell crops online', 'farmer marketplace', 'agricultural trading platform', 'farm products Zimbabwe', 'livestock marketplace'],
      type: 'website',
      image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&h=630&fit=crop',
    });

    // Add organization schema
    seoService.addOrganizationSchema({
      name: 'MAKEFARMHUB',
      url: 'https://makefarmhub.vercel.app',
      logo: 'https://makefarmhub.vercel.app/logo.png',
      description: 'Digital agriculture marketplace connecting farmers, buyers, and transporters in Zimbabwe',
      address: {
        addressLocality: 'Harare',
        addressCountry: 'Zimbabwe',
      },
      contactPoint: {
        telephone: '+263782919633',
        contactType: 'Customer Service',
      },
      sameAs: [
        'https://www.facebook.com/share/.1b4pTedzHC/?mibextid=wwXIfr',
        'https://www.instagram.com/makefarmhub?igsh=bjJmOTJtZjBldGZ3&utm_source=qr',
      ],
    });

    // Add search action schema
    seoService.addSearchActionSchema();

    // Add local business schema
    seoService.addLocalBusinessSchema();

    return () => {
      seoService.removeJsonLd('organization-schema');
      seoService.removeJsonLd('search-action-schema');
      seoService.removeJsonLd('local-business-schema');
    };
  }, []);
  
  // Parallax effect for hero background (very subtle)
  const parallaxOffset = useParallax(0.3);
  
  // Scroll animations for sections
  const categoriesAnim = useScrollAnimation({ threshold: 0.2 });
  const featuresAnim = useScrollAnimation({ threshold: 0.15 });
  const howItWorksAnim = useScrollAnimation({ threshold: 0.15 });
  const testimonialsAnim = useScrollAnimation({ threshold: 0.2 });
  const ctaAnim = useScrollAnimation({ threshold: 0.3 });
  const features = [
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Your money is held safely until you confirm delivery. No more payment disputes.',
      highlight: 'Bank-level security',
    },
    {
      icon: Users,
      title: 'Direct Farm Access',
      description: 'Buy directly from farmers. No middlemen, better prices for everyone.',
      highlight: 'Save up to 40%',
    },
    {
      icon: TrendingUp,
      title: 'Real-time Pricing',
      description: 'See live market prices and make informed buying decisions.',
      highlight: 'Updated daily',
    },
    {
      icon: Truck,
      title: 'Reliable Transport',
      description: 'Book verified transporters with real-time tracking and delivery confirmation.',
      highlight: 'GPS tracking',
    },
  ];

  // Trust indicators
  const trustBadges = [
    { icon: BadgeCheck, text: 'Verified Sellers' },
    { icon: Shield, text: 'Secure Payments' },
    { icon: Zap, text: 'Fast Delivery' },
    { icon: HeartHandshake, text: '24/7 Support' },
  ];

  const stats = [
    { value: '100+', label: 'Active Farmers' },
    { value: '200+', label: 'Products Listed' },
    { value: '2,000+', label: 'Transactions' },
    { value: '98%', label: 'Satisfaction Rate' },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Create Your Account',
      description: 'Sign up as a farmer, buyer, or transporter in under 2 minutes.',
      icon: Users,
    },
    {
      step: 2,
      title: 'List or Browse Products',
      description: 'Farmers list their produce, buyers browse and compare prices.',
      icon: Leaf,
    },
    {
      step: 3,
      title: 'Secure Payment',
      description: 'Buyers pay securely. Funds are held safely until delivery is confirmed.',
      icon: DollarSign,
    },
    {
      step: 4,
      title: 'Arrange Transport',
      description: 'Book a verified transporter or arrange your own pickup.',
      icon: Truck,
    },
    {
      step: 5,
      title: 'Confirm & Release',
      description: 'Confirm delivery and funds are released to the farmer.',
      icon: CheckCircle,
    },
  ];

  const testimonials = [
    {
      name: 'Tendai Moyo',
      role: 'Farmer, Masvingo',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      quote: 'MAKEFARMHUB changed my life. I now sell directly to buyers in Harare and get paid on time, every time.',
      rating: 5,
      verified: true,
    },
    {
      name: 'Sarah Ndlovu',
      role: 'Restaurant Owner, Bulawayo',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
      quote: 'Fresh produce delivered to my restaurant at wholesale prices. The secure payment system gives me peace of mind.',
      rating: 5,
      verified: true,
    },
    {
      name: 'Peter Chikwanha',
      role: 'Transporter, Mutare',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      quote: 'As a transporter, I get consistent work and fair pay. The platform handles everything professionally.',
      rating: 5,
      verified: true,
    },
  ];

  const categories = [
    { name: 'Vegetables', emoji: '🥬', count: 450 },
    { name: 'Fruits', emoji: '🍎', count: 320 },
    { name: 'Grains', emoji: '🌾', count: 180 },
    { name: 'Livestock', emoji: '🐄', count: 95 },
    { name: 'Dairy', emoji: '🥛', count: 120 },
    { name: 'Poultry', emoji: '🐔', count: 200 },
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav__container">
          <Link to="/" className="landing-logo">
            <span className="logo-icon">🌾</span>
            MAKEFARMHUB
          </Link>
          <div className="landing-nav__links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="landing-nav__actions">
            <Link to="/login" className="btn-login">Log In</Link>
            <Link to="/signup" className="btn-signup">
              Get Started <ArrowRight size={18} />
            </Link>
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="landing-mobile-menu">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a>
            <div className="mobile-menu-actions">
              <Link to="/login" className="btn-login-mobile">Log In</Link>
              <Link to="/signup" className="btn-signup-mobile">
                Get Started <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero-section parallax-container">
        <div 
          className="parallax-bg"
          style={{ 
            transform: `translateY(${parallaxOffset}px)`,
            backgroundImage: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)'
          }}
        />
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            Zimbabwe's #1 Agricultural Marketplace
          </div>
          <h1>
            Farm Fresh. <span className="highlight">Direct.</span> Secure.
          </h1>
          <p className="hero-subtitle">
            Connect farmers directly with buyers. Secure payments protect both parties. 
            Reliable transport to your doorstep. The future of agricultural trade is here.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="btn-primary-large">
              <Zap size={20} />
              Start Selling or Buying
              <ArrowRight size={20} />
            </Link>
            <button onClick={() => setShowHowItWorks(true)} className="btn-video">
              <Play size={20} />
              See How It Works
            </button>
          </div>
          {/* Trust Badges */}
          <div className="hero-trust-badges">
            {trustBadges.map((badge, index) => (
              <div key={index} className="trust-badge-item">
                <badge.icon size={16} />
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-card main">
            <img 
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&h=400&fit=crop" 
              alt="Fresh farm produce"
            />
            <div className="hero-card-overlay">
              <span className="live-badge">🔴 Live</span>
              <span>2,450 products available now</span>
            </div>
          </div>
          <div className="hero-card floating-1">
            <div className="mini-stat">
              <TrendingUp size={20} />
              <div>
                <span className="stat-value">+45%</span>
                <span className="stat-label">Farmer Income</span>
              </div>
            </div>
          </div>
          <div className="hero-card floating-2">
            <div className="mini-stat">
              <Shield size={20} />
              <div>
                <span className="stat-value">100%</span>
                <span className="stat-label">Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Preview - First thing users see after hero */}
      <section 
        ref={categoriesAnim.ref as React.RefObject<HTMLElement>}
        className={`categories-section hero-categories scroll-fade-up ${categoriesAnim.isVisible ? 'visible' : ''}`}
      >
        <div className="section-header">
          <span className="section-tag">What We Offer</span>
          <h2>Fresh From Zimbabwe's Farms</h2>
          <p>Browse thousands of products from local farmers</p>
        </div>
        <div className="categories-grid">
          {categories.map((cat) => (
            <Link to="/signup" key={cat.name} className="category-card">
              <span className="category-emoji">{cat.emoji}</span>
              <h4>{cat.name}</h4>
              <span className="category-count">{cat.count} listings</span>
            </Link>
          ))}
        </div>
        <Link to="/signup" className="view-all-link">
          Explore Marketplace <ChevronRight size={18} />
        </Link>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        ref={featuresAnim.ref as React.RefObject<HTMLElement>}
        className={`features-section scroll-fade-up ${featuresAnim.isVisible ? 'visible' : ''}`}
      >
        <div className="section-header">
          <span className="section-tag">Why Choose Us</span>
          <h2>Everything You Need to Trade Smarter</h2>
          <p>Built specifically for Zimbabwe's agricultural market with features that matter.</p>
        </div>
        <div className="features-grid">
          {features.map((feature) => (
            <div key={feature.title} className="feature-card">
              <div className="feature-icon">
                <feature.icon size={28} />
              </div>
              <span className="feature-highlight">{feature.highlight}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section 
        id="how-it-works" 
        ref={howItWorksAnim.ref as React.RefObject<HTMLElement>}
        className={`how-it-works-section scroll-fade-up ${howItWorksAnim.isVisible ? 'visible' : ''}`}
      >
        <div className="section-header">
          <span className="section-tag">Simple Process</span>
          <h2>How MAKEFARMHUB Works</h2>
          <p>From farm to table in 5 simple steps</p>
        </div>
        <div className="steps-container">
          {howItWorks.map((item, index) => (
            <div key={item.step} className="step-card">
              <div className="step-number">{item.step}</div>
              <div className="step-icon">
                <item.icon size={24} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {index < howItWorks.length - 1 && <div className="step-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section 
        id="testimonials" 
        ref={testimonialsAnim.ref as React.RefObject<HTMLElement>}
        className={`testimonials-section scroll-fade-up ${testimonialsAnim.isVisible ? 'visible' : ''}`}
      >
        <div className="section-header">
          <span className="section-tag">Success Stories</span>
          <h2>Trusted by Farmers & Buyers Across Zimbabwe</h2>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="#F7B733" color="#F7B733" />
                  ))}
                </div>
                {testimonial.verified && (
                  <span className="verified-badge">
                    <BadgeCheck size={14} /> Verified
                  </span>
                )}
              </div>
              <p className="testimonial-quote">"{testimonial.quote}"</p>
              <div className="testimonial-author">
                <img src={testimonial.image} alt={testimonial.name} />
                <div>
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us - Additional Benefits */}
      <section className="benefits-section">
        <div className="benefits-container">
          <div className="benefit-item">
            <Globe size={32} />
            <div>
              <h4>Nationwide Coverage</h4>
              <p>Serving all major cities and rural areas across Zimbabwe</p>
            </div>
          </div>
          <div className="benefit-item">
            <Clock size={32} />
            <div>
              <h4>24/7 Platform Access</h4>
              <p>Trade anytime, anywhere with our mobile-friendly platform</p>
            </div>
          </div>
          <div className="benefit-item">
            <HeartHandshake size={32} />
            <div>
              <h4>Dedicated Support</h4>
              <p>Our team is always ready to help you succeed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar - Moved here for better placement */}
      <section className="stats-bar">
        <div className="stats-container">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-item">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section 
        ref={ctaAnim.ref as React.RefObject<HTMLElement>}
        className={`cta-section scroll-fade-up ${ctaAnim.isVisible ? 'visible' : ''}`}
      >
        <div className="cta-content">
          <h2>Ready to Transform Your Agricultural Business?</h2>
          <p>Join thousands of farmers and buyers already trading on MAKEFARMHUB</p>
          <div className="cta-buttons">
            <Link to="/signup" className="btn-primary-large">
              Create Free Account
              <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="btn-outline-light">
              I Already Have an Account
            </Link>
          </div>
          <div className="cta-features">
            <span><CheckCircle size={16} /> Free to join</span>
            <span><CheckCircle size={16} /> No hidden fees</span>
            <span><CheckCircle size={16} /> Start in 2 minutes</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="landing-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="logo-icon">🌾</span>
              MAKEFARMHUB
            </Link>
            <p>Connecting Zimbabwe's farmers directly with buyers. Secure, transparent, and efficient agricultural trade.</p>
            <div className="footer-social">
              <a href="https://www.facebook.com/share/.1b4pTedzHC/?mibextid=wwXIfr" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <Facebook size={20} />
              </a>
              <a href="https://twitter.com/makefarmhub" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                <Twitter size={20} />
              </a>
              <a href="https://www.instagram.com/makefarmhub?igsh=bjJmOTJtZjBldGZ3&utm_source=qr" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <Instagram size={20} />
              </a>
              <a href="https://wa.me/263782919633" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
                <MessageCircle size={20} />
              </a>
            </div>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <Link to="/signup">Get Started</Link>
              <a href="#contact">Contact</a>
            </div>
            <div className="footer-column">
              <h4>For Users</h4>
              <Link to="/signup?role=farmer">For Farmers</Link>
              <Link to="/signup?role=buyer">For Buyers</Link>
              <Link to="/signup?role=transporter">For Transporters</Link>
              <a href="#testimonials">Success Stories</a>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <a href="#contact">Support</a>
            </div>
            <div className="footer-column">
              <h4>Contact</h4>
              <a href="tel:+263782919633">
                <Phone size={14} /> +263 78 291 9633
              </a>
              <a href="mailto:missal@makefarmhub.com">
                <Mail size={14} /> missal@makefarmhub.com
              </a>
              <a href="#">
                <MapPin size={14} /> Harare, Zimbabwe
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} MAKEFARMHUB. All rights reserved.</p>
          <div className="footer-legal">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </footer>

      {/* How It Works Modal */}
      {showHowItWorks && (
        <div className="modal-overlay" onClick={() => setShowHowItWorks(false)}>
          <div className="modal-content how-it-works-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>How MAKEFARMHUB Works</h2>
              <button className="modal-close" onClick={() => setShowHowItWorks(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-subtitle">From farm to table in 5 simple steps</p>
              <div className="steps-list">
                {howItWorks.map((item, index) => (
                  <div key={item.step} className="step-item">
                    <div className="step-number-badge">{item.step}</div>
                    <div className="step-details">
                      <div className="step-icon-small">
                        <item.icon size={20} />
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <Link to="/signup" className="btn-primary-large" onClick={() => setShowHowItWorks(false)}>
                  Get Started Now
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )}
