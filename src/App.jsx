import { useEffect, useState, useCallback, useRef } from 'react'
import { authService, orderService, contactService, checkAuth, getUserFromToken, setToken, clearToken } from './api'
import productsData from './data/products.json'
import './App.css'

const logo = '/logo-gems-insider-dark.png'

const collectionMedia = import.meta.glob('./assets/gems/**/*.mp4', {
  eager: true,
  query: '?url',
  import: 'default',
})

const allCollectionProducts = productsData.map((product) => ({
  ...product,
  media: collectionMedia[product.media],
}))

const requirementLabels = {
  weight: 'Weight',
  dimension: 'Size',
  treatment: 'Treatment',
  clarity: 'Clarity',
  color: 'Color',
  shape: 'Shape',
  origin: 'Origin',
  hardness: 'Hardness',
}

function formatRequirements(requirements) {
  return Object.entries(requirements)
    .filter(([key, value]) => key !== 'price' && value)
    .map(([key, value]) => `${requirementLabels[key]}: ${value}`)
    .join(' · ')
}

function handleFullscreen(event) {
  event.preventDefault()
  event.stopPropagation()
  const video = event.currentTarget.closest('.gem-media, .product-media')?.querySelector('video')
  if (video?.requestFullscreen) {
    video.requestFullscreen()
  } else if (video?.webkitEnterFullscreen) {
    video.webkitEnterFullscreen()
  }
}

function LazyVideo({ src, label }) {
  const videoRef = useRef(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || shouldLoad) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldLoad(true)
        observer.disconnect()
      }
    }, { rootMargin: '300px 0px' })
    observer.observe(video)
    return () => observer.disconnect()
  }, [shouldLoad])

  return (
    <video ref={videoRef} autoPlay={shouldLoad} loop muted playsInline preload="none" aria-label={label}>
      {shouldLoad && <source src={src} type="video/mp4" />}
    </video>
  )
}

function readStorage(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => window.localStorage.getItem('gems-theme') || 'light')
  const [currentPage, setCurrentPage] = useState(window.location.hash.slice(1) || 'home')
  const [activePage, setActivePage] = useState(window.location.hash.slice(1) || 'home')
  const [contactSent, setContactSent] = useState(false)
  const [contactError, setContactError] = useState('')
  const [user, setUser] = useState(null)
  const [cart, setCart] = useState(() => readStorage('gems-cart', []))
  const [orders, setOrders] = useState([])
  const [authOpen, setAuthOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [cartOpen, setCartOpen] = useState(false)
  const [authError, setAuthError] = useState('')
  const [pendingBuy, setPendingBuy] = useState([])
  const [notice, setNotice] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const navigation = [
    { label: 'Home', href: '#home', page: 'home' },
    { label: 'Collection', href: '#collection', page: 'collection' },
    { label: 'About Us', href: '#about', page: 'about' },
    { label: 'Meet the Team', href: '#team', page: 'team' },
    { label: 'Contact Us', href: '#contact', page: 'contact' },
  ]

  const gemstones = [
    { name: 'Amethyst', origin: 'The violet signature', media: '/gems/amethyst.mp4' },
    { name: 'Ametrine', origin: 'Two tones, one stone', media: '/gems/ametrine.mp4' },
    { name: 'Aquamarine', origin: 'A breath of clear water', media: '/gems/aqua.mp4' },
    { name: 'Kunzite', origin: 'Softly incandescent', media: '/gems/kunzite.mp4' },
    { name: 'Peridot', origin: 'Green, with a golden pulse', media: '/gems/peridot.mp4' },
    { name: 'Rubellite', origin: 'A red with its own gravity', media: '/gems/rubellite.mp4' },
    { name: 'Tanzanite', origin: 'Blue at the edge of violet', media: '/gems/tanzanite.mp4' },
    { name: 'Tourmaline', origin: 'Colour without compromise', media: '/gems/tourmaline.mp4' },
  ]

  const teamMembers = [
    { name: 'Khushal Riaz Khan', role: 'Founder & CEO · Certified Gemologist', image: '/team-khushal.png', bio: 'Khushal Riaz Khan is the Founder and CEO of GEMS INSIDER and a Certified Gemologist with professional experience in the gemstone industry since 2021. His approach combines gemological knowledge with practical industry experience, ensuring every gemstone is carefully assessed and represented with professionalism, transparency, and integrity.' },
    { name: 'Kumail Ayaz', role: 'Chief Operating Officer · COO', image: '/team-kumail.png', bio: 'Kumail Ayaz serves as the Chief Operating Officer of GEMS INSIDER, contributing to the company\'s operations, development, and day-to-day management. He supports efficient operations, strategic initiatives, and strong relationships with clients and partners.' },
    { name: 'Muhammad Omer', role: 'Technical Specialist & Photographer', image: '/team-omer.png', bio: 'Muhammad Omer is a key member of the GEMS INSIDER team, managing technical needs and creating high-quality visual content that showcases gemstones in their finest detail. He focuses on accurate, professional, and visually appealing imagery.' },
  ]

  const policyPages = {
    privacy: {
      label: 'Privacy policy',
      title: 'Your privacy,<br /><em>protected.</em>',
      paragraphs: [
        'At GEMS INSIDER, we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains what information we may collect, how we use it, and how we protect it when you visit our website or purchase our products.',
        '1. Information We Collect',
        'When you use our website or place an order, we may collect your name, email address, phone number, shipping and billing address, order and purchase details, and information you provide when contacting us. We do not intentionally collect information that is not necessary for providing our services.',
        '2. How We Use Your Information',
        'We may use your information to process and fulfill your orders, arrange shipping and delivery, communicate with you about your order, respond to your questions and requests, improve our website and services, prevent fraud or misuse of our website, and comply with applicable legal requirements.',
        '3. Payment Information',
        'Payments may be processed through third-party payment providers. GEMS INSIDER does not normally store your complete credit or debit card details on our website. Payment providers may collect and process payment information according to their own privacy policies.',
        '4. Sharing Your Information',
        'We do not sell or rent your personal information. We may share necessary information with trusted service providers, such as payment processors, shipping companies, website service providers, or other businesses that help us operate our services. We may also disclose information when required by law or to protect our business, customers, or legal rights.',
        '5. Cookies',
        'Our website may use cookies and similar technologies to improve website functionality, understand how visitors use our website, and provide a better experience. You can manage or disable cookies through your browser settings. Some website features may not work properly if cookies are disabled.',
        '6. Data Security',
        'We take reasonable measures to protect your personal information from unauthorized access, misuse, loss, or disclosure. However, no method of transmitting or storing information online can be guaranteed to be completely secure.',
        '7. Third-Party Services',
        'Our website may use third-party services such as payment processors, shipping providers, analytics services, or other tools. These services may have their own privacy policies, and we encourage you to review them when appropriate.',
        '8. Your Privacy Rights',
        'Depending on your location and applicable laws, you may have rights to request access to, correction of, or deletion of your personal information. If you would like to make a privacy-related request, please contact us.',
        '9. Children\'s Privacy',
        'Our website is not intended for children who are not legally permitted to use online shopping services. We do not knowingly collect personal information from children without appropriate consent.',
        '10. Changes to This Privacy Policy',
        'We may update this Privacy Policy from time to time to reflect changes to our business, website, or applicable requirements. Any updates will be posted on this page with a new Last Updated date.',
        '11. Contact Us',
        'If you have any questions about this Privacy Policy or how GEMS INSIDER handles your information, please contact us through the contact information provided on our website. GEMS INSIDER.',
      ],
    },
    refund: {
      label: 'Refund policy',
      title: 'A clear,<br /><em>fair process.</em>',
      paragraphs: [
        'We have a 15-day return policy, which means you have 15 days after receiving your item to request a return.',
        'To be eligible for a return, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You will also need the receipt or proof of purchase.',
        'To start a return, contact us at GemsInsider@gmail.com. If your return is accepted, we will send you a return shipping address and instructions on how and where to send your package. Items sent back without first requesting a return will not be accepted.',
        'You can contact us at GemsInsider@gmail.com with any return questions.',
        'Damages and issues',
        'Please inspect your order upon reception and contact us immediately if the item is defective, damaged, or incorrect so that we can evaluate the issue and make it right.',
        'Exceptions and non-returnable items',
        'Certain types of items cannot be returned, including perishable goods, custom products, and personal care goods. We also do not accept returns for hazardous materials, flammable liquids, or gases. Please contact us if you have questions about a specific item.',
        'We cannot accept returns on sale items or gift cards.',
        'Exchanges',
        'The fastest way to ensure you get what you want is to return the item you have and, once the return is accepted, make a separate purchase for the new item.',
        'European Union 14-day cooling-off period',
        'If merchandise is being shipped into the European Union, you have the right to cancel or return your order within 14 days for any reason and without justification. Your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You will also need the receipt or proof of purchase.',
        'Refunds',
        'We will notify you once we have received and inspected your return and let you know whether the refund was approved. If approved, you will be automatically refunded through your original payment method within 10 business days. Please remember that your bank or credit card company may need additional time to process and post the refund.',
        'If more than 15 business days have passed since we approved your return, contact us at GemsInsider@gmail.com.',
      ],
    },
    terms: {
      label: 'Terms of service',
      title: 'Good faith,<br /><em>in every order.</em>',
      paragraphs: [
        'Welcome to GEMS INSIDER. By using our website or purchasing our gemstones, you agree to the following terms.',
        '1. Our Gemstones',
        'We make every effort to provide accurate information about the gemstones we offer, including their weight, size, color, treatment status, and other available details. Natural gemstones may have natural inclusions, variations, and imperfections.',
        '2. Product Photos',
        'We try our best to photograph gemstones accurately. However, colors and appearance may vary slightly depending on lighting, photography, and your device or screen.',
        '3. Prices and Orders',
        'All prices displayed on our website are subject to change without prior notice. An order is considered confirmed only after it has been accepted by GEMS INSIDER. We reserve the right to cancel an order if there is an incorrect price, listing error, stock issue, or other unforeseen circumstance.',
        '4. Payments',
        'Customers are responsible for providing accurate payment and shipping information. Orders will normally be processed after successful payment confirmation.',
        '5. Shipping',
        'We will make reasonable efforts to dispatch orders within the stated processing time of 24-48 hours. Delivery times may vary depending on the destination, courier, customs, and other circumstances outside our control.',
        '6. Customs and Import Duties',
        'Customers are responsible for any customs duties, taxes, or import charges imposed by their country. GEMS INSIDER is not responsible for delays caused by customs or local authorities.',
        '7. Returns and Refunds',
        'Returns and refunds are handled according to our Return and Refund Policy. Customers should review that policy before placing an order.',
        '8. Authenticity and Representation',
        'We are committed to honest and accurate representation of our gemstones. Where applicable, gemstone treatments, enhancements, or other relevant information will be disclosed in the product description.',
        '9. Website Content',
        'All photographs, descriptions, logos, text, and other content on the GEMS INSIDER website are the property of GEMS INSIDER or are used with permission and may not be copied or used without authorization.',
        '10. Changes to These Terms',
        'GEMS INSIDER may update these Terms of Service from time to time. Any changes will be posted on this page.',
        '11. Contact Us',
        'If you have any questions regarding these Terms of Service, please contact GEMS INSIDER through the contact information provided on our website.',
        'Thank you for choosing GEMS INSIDER.',
      ],
    },
    faqs: {
      label: 'Frequently asked questions',
      title: 'Questions,<br /><em>answered.</em>',
      paragraphs: [
        'Frequently Asked Questions (FAQs) - Gems Insider',
        '1. Are your gems ethically sourced? Yes, we take pride in offering ethically sourced gems. We work closely with miners and source directly from mining regions to support responsible and transparent sourcing.',
        '2. Are you direct suppliers from mines? Yes, we are direct suppliers and source many of our gems straight from the mines. This allows us to offer authentic, high-quality mineral specimens at competitive prices.',
        '3. Do you accept payment plans? Yes, we offer payment plans on all items and flexible payment options are available. Contact us at GemsInsider@gmail.com to arrange a plan that suits you.',
        '4. What payment methods do you accept? We accept a variety of secure payment methods, including credit cards, bank transfers, PayPal where applicable, and other secure online payment options. Contact us if you have a preferred payment method.',
        '5. Do you accept returns? Yes, we accept returns. Buyers are responsible for return shipping costs. A full refund will be issued once the item is received back in its original, undamaged condition, subject to our Return and Refund Policy.',
        '6. Do you offer combined shipping? Yes, we offer combined shipping on multiple purchases to help reduce shipping costs for our customers.',
        '7. How long does it take to ship orders? All orders are processed and shipped within 24-48 hours after payment confirmation.',
        '8. What shipping options do you provide? We offer Economy Shipping for a budget-friendly option and Express Shipping for fast and reliable delivery. Shipping times vary depending on your location.',
        '9. Do you ship worldwide? Yes, we ship worldwide and serve collectors, resellers, and gem lovers globally.',
        '10. How do you package your gems? We use professional, secure packaging to ensure all gems arrive safely. Fragile and high-value pieces are packed with extra care for international shipping.',
        '11. Are you responsible for customs duties and taxes? No. Customs duties and taxes are the responsibility of the buyer and depend on the regulations of the destination country. Customs declarations are prepared in accordance with applicable laws.',
        '12. Have you participated in gem and mineral shows? Yes, we actively participate in major exhibitions, including the 1st Pakistan Gems and Minerals Festival 2026, held on 7-9 August. Upcoming exhibition: the 2nd Pakistan Gems and Minerals Festival 2026, scheduled for 13-15 November. These exhibitions allow us to source unique gems and connect with collectors.',
        '13. Are your gems natural? Yes, all our gems are represented as natural, and authenticity is our top priority. We do not deal in synthetic or lab-grown gems.',
        '14. Will I receive the exact gem shown in the photos? Yes, you will receive the exact same gem shown in the photos and videos, unless otherwise stated in the product information.',
        '15. Can I reserve an item? Yes, we can reserve items for a limited time. Contact us at GemsInsider@gmail.com to request a reservation.',
        '16. Do you offer wholesale or bulk deals? Yes, we provide wholesale options and bulk deals for serious buyers, collectors, and resellers. Contact us at GemsInsider@gmail.com for more information.',
        '17. How can I contact you? You can reach us through the website contact form, Instagram, Facebook, TikTok, or WhatsApp at +92 333 9940220. We are always available to assist with inquiries, orders, and custom requests.',
      ],
    },
  }

  const collectionProducts = allCollectionProducts
  const [activeCategory, setActiveCategory] = useState('All stones')
  const [colorQuery, setColorQuery] = useState('')
  const categories = ['All stones', ...new Set(collectionProducts.map((product) => product.category))]
  const normalizeColor = (value) => value.toLowerCase().replace(/[\s-]+/g, '')
  const normalizedColorQuery = normalizeColor(colorQuery)
  const normalizedGlobalSearch = normalizeColor(globalSearch)
  const visibleProducts = collectionProducts.filter((product) => {
    const matchesCategory = activeCategory === 'All stones' || product.category === activeCategory
    const color = product.requirements.color || ''
    const matchesColor = !normalizedColorQuery || normalizeColor(color).includes(normalizedColorQuery)
    const searchableText = normalizeColor(`${product.name} ${product.category} ${color}`)
    const matchesGlobalSearch = !normalizedGlobalSearch || searchableText.includes(normalizedGlobalSearch)
    return matchesCategory && matchesColor && matchesGlobalSearch
  })

  useEffect(() => {
    const handleHashChange = () => {
      const page = window.location.hash.slice(1) || 'home'
      setActivePage(page)
      setCurrentPage(page)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    window.localStorage.setItem('gems-cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    const token = window.localStorage.getItem('gems-token')
    if (token) {
      const info = getUserFromToken(token)
      if (info) {
        setUser(info)
      } else {
        authService.me().then((data) => {
          setUser(data.user)
          setToken(data.token)
        }).catch(() => {
          clearToken()
          setUser(null)
        })
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (user?.role !== 'admin') {
      setOrders([])
      return
    }
    const fetchOrders = async () => {
      try {
        const data = await orderService.getAll()
        setOrders(data)
      } catch {
        setOrders([])
      }
    }
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [user?.role])

  const handleNavigation = (event, href) => {
    event.preventDefault()
    const page = href.slice(1)
    window.history.pushState({}, '', href)
    setActivePage(page)
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'auto' })
    setMenuOpen(false)
  }

  const addToCart = (product) => {
    if (!user) {
      setPendingBuy([product])
      setAuthMode('login')
      setAuthOpen(true)
      return
    }
    if (user.role === 'admin') return
    setCart((currentCart) => currentCart.some((item) => item.id === product.id)
      ? currentCart
      : [...currentCart, { id: product.id, name: product.name, category: product.category, price: product.requirements.price || 'Inquire' }])
    setNotice(`${product.name} added to your cart.`)
    setTimeout(() => setNotice(''), 2500)
  }

  const buyProduct = (product) => {
    if (!user) {
      setPendingBuy([product])
      setAuthMode('login')
      setAuthOpen(true)
      return
    }
    setPendingBuy([product])
    setPaymentError('')
    setPaymentOpen(true)
  }

  const buyCart = () => {
    if (!cart.length) return
    if (!user) {
      setPendingBuy(cart)
      setAuthMode('login')
      setAuthOpen(true)
      setCartOpen(false)
      return
    }
    setPendingBuy(cart)
    setPaymentError('')
    setCartOpen(false)
    setPaymentOpen(true)
  }

  const submitAuth = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email')).trim().toLowerCase()
    const password = String(form.get('password'))
    setAuthError('')

    try {
      let data
      if (authMode === 'register') {
        const name = String(form.get('name')).trim()
        data = await authService.register(email, password, name)
      } else {
        data = await authService.login(email, password)
      }
      setToken(data.token)
      setUser(data.user)
    } catch (error) {
      console.error('Auth error:', error)
      setAuthError(error.message || 'Something went wrong. Please try again.')
      return
    }
    setAuthOpen(false)
    if (pendingBuy.length) {
      setCart((currentCart) => {
        const newItems = pendingBuy.filter((item) => !currentCart.some((cartItem) => cartItem.id === item.id))
        return [...currentCart, ...newItems.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.requirements?.price || item.price || 'Inquire'
        }))]
      })
      setNotice(`${pendingBuy.length} item${pendingBuy.length > 1 ? 's' : ''} added to your cart.`)
      setTimeout(() => setNotice(''), 2500)
      setPendingBuy([])
      setPaymentError('')
      setPaymentOpen(true)
    }
  }

  const logout = () => {
    authService.logout().catch(() => {})
    clearToken()
    setUser(null)
    setCart([])
    setPendingBuy([])
    setPaymentError('')
    setActivePage('home')
    setCurrentPage('home')
    window.history.pushState({}, '', '#home')
  }

  const updateOrderStatus = async (orderId, status) => {
    await orderService.updateStatus(orderId, status)
  }

  const removeOrder = async (orderId) => {
    await orderService.remove(orderId)
  }

  const submitContact = async (event) => {
    event.preventDefault()
    setContactError('')
    const form = new FormData(event.currentTarget)
    try {
      await contactService.submit({
        name: String(form.get('name')).trim(),
        email: String(form.get('email')).trim(),
        subject: String(form.get('subject')).trim(),
        message: String(form.get('message')).trim(),
      })
      setContactSent(true)
      setTimeout(() => setContactSent(false), 5000)
      event.target.reset()
    } catch (error) {
      console.error('Contact error:', error)
      setContactError(error.message || 'Failed to send message. Please try again or contact admin directly.')
    }
  }

  const submitDemoPayment = async (event) => {
    event.preventDefault()
    if (!user) return
    setPaymentError('Payment failed. Something went wrong. Please contact website admin.')
    return
  }

  const formatCardNumber = (e) => {
    let value = e.target.value.replace(/\D/g, '').slice(0, 16)
    let formatted = value.replace(/(.{4})/g, '$1 ').trim()
    e.target.value = formatted
  }

  const formatExpiry = (e) => {
    let value = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (value.length >= 3) {
      value = value.slice(0, 2) + '/' + value.slice(2)
    }
    e.target.value = value
  }

  const formatCVV = (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4)
  }

  if (loading) {
    return <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: '#d4af37', fontSize: '18px' }}>Loading...</div>
  }

  return (
    <main className={theme === 'light' ? 'theme-light' : ''}>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#home" aria-label="Gems Insider home">
            <img src={theme === 'light' ? '/logo-gems-insider-light.png' : logo} alt="Gems Insider" />
          </a>

          <nav className={menuOpen ? 'primary-nav is-open' : 'primary-nav'} aria-label="Primary navigation">
            {navigation.map((item) => (
              <a className={activePage === item.page ? 'is-active' : ''} key={item.label} href={item.href} onClick={(event) => { setActivePage(item.page); handleNavigation(event, item.href) }}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="header-actions">
            <button className="cart-button" type="button" onClick={() => setCartOpen(true)} aria-label={`Open cart with ${cart.length} items`}>Cart <span>{cart.length}</span></button>
            {user ? <button className="account-button" type="button" onClick={logout}>{user.role === 'admin' ? 'Admin · Log out' : 'Log out'}</button> : <button className="account-button" type="button" onClick={() => { setAuthMode('login'); setAuthOpen(true) }}>Log in</button>}
            {user?.role === 'admin' && <a className="admin-link" href="#admin" onClick={(event) => handleNavigation(event, '#admin')}>Admin</a>}
            <button className="theme-toggle" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => setTheme((currentTheme) => {
              const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
              window.localStorage.setItem('gems-theme', nextTheme)
              return nextTheme
            })}>
              <span aria-hidden="true">{theme === 'dark' ? '☼' : '◐'}</span>
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <button className="icon-button" type="button" aria-label="Search" onClick={() => setSearchOpen((isOpen) => !isOpen)}>
              <span aria-hidden="true">⌕</span>
            </button>
            <button
              className="menu-button"
              type="button"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((isOpen) => !isOpen)}
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </header>

      {currentPage === 'home' ? <>
      <section className="home-intro" id="home">
        <div className="intro-copy">
          <p className="eyebrow">Gems Insider presents</p>
          <h1>Your Own<br /><em>Mind ART</em></h1>
          <p className="intro-description">A considered collection of natural gemstones for people who see beauty in the details others miss.</p>
          <a className="preview-link" href="#collection" onClick={(event) => handleNavigation(event, '#collection')}>Enter the collection <span aria-hidden="true">↗</span></a>
        </div>
        <div className="intro-mark" aria-hidden="true">GI<span>01</span></div>
      </section>
      </> : currentPage === 'collection' ? <section className="collection-page" id="collection">
        <div className="collection-page-heading">
          <div>
            <p className="eyebrow">The complete edit</p>
            <h1>Find your<br /><em>stone.</em></h1>
          </div>
          <p>Explore natural gemstones selected for colour, character, and the stories they carry.</p>
        </div>
        <div className="filter-row" aria-label="Filter gemstone collection">
          {categories.map((category) => (
            <button className={activeCategory === category ? 'filter-button is-active' : 'filter-button'} type="button" key={category} onClick={() => setActiveCategory(category)}>
              {category}
            </button>
          ))}
        </div>
        <div className="color-filter">
          <label htmlFor="color-search">Search by color</label>
          <input id="color-search" type="search" value={colorQuery} onChange={(event) => setColorQuery(event.target.value)} placeholder="Try blue, purple, green..." />
          {colorQuery && <button type="button" onClick={() => setColorQuery('')}>Clear</button>}
          <span>{visibleProducts.length} stone{visibleProducts.length === 1 ? '' : 's'}</span>
        </div>
        <div className="product-grid">
          {visibleProducts.map((product, index) => (
            <article className="product-card" key={`${product.id}-${index}`}>
              <div className="product-media">
                <LazyVideo src={product.media} label={`${product.name} gemstone video`} />
                <span>{product.category}</span>
                <button className="fullscreen-button" type="button" aria-label={`View ${product.name} video fullscreen`} onClick={handleFullscreen}>⛶</button>
              </div>
              <div className="product-info">
                <div><h2>{product.name}</h2><p>{formatRequirements(product.requirements) || 'Natural gemstone specimen'}</p></div>
                <strong>{product.requirements.price || 'Inquire'}</strong>
              </div>
              <div className="product-actions">
                <button type="button" onClick={() => addToCart(product)}>Add to cart</button>
                <button type="button" onClick={() => buyProduct(product)}>Buy now</button>
              </div>
            </article>
          ))}
        </div>
      </section> : currentPage === 'admin' ? <section className="admin-page" id="admin">
        {user?.role === 'admin' ? <>
          <div className="admin-heading"><div><p className="eyebrow">Private workspace</p><h1>Store<br /><em>control.</em></h1></div><p>Manage the catalogue and review incoming order requests from one place.</p></div>
          <div className="admin-stats"><div><strong>{collectionProducts.length}</strong><span>Catalogue stones</span></div><div><strong>{categories.length - 1}</strong><span>Gem categories</span></div><div><strong>{orders.length}</strong><span>Order requests</span></div></div>
          <div className="admin-orders"><h2>Recent order requests</h2>{orders.length ? orders.map((order) => <div className="admin-order" key={order.id}><span>#{order.id.slice(0, 8)}</span><strong>{order.items.map((item) => item.name || item).join(', ')}</strong><small>{order.userEmail}</small><select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)} aria-label={`Status for order ${order.id}`}><option>New</option><option>Confirmed</option><option>Shipped</option><option>Completed</option><option>Cancelled</option></select><button type="button" onClick={() => removeOrder(order.id)}>Delete</button></div>) : <p>No order requests yet.</p>}</div>
        </> : <div className="admin-login"><p className="eyebrow">Gems Insider administration</p><h1>Admin access<br /><em>required.</em></h1><p>Sign in with an administrator account to manage the catalogue and orders.</p><button type="button" onClick={() => { setAuthMode('login'); setAuthOpen(true) }}>Open admin login ↗</button></div>}
      </section> : policyPages[currentPage] ? <section className="policy-page" id={currentPage}>
        <div className="policy-heading"><div><p className="eyebrow">Gems Insider · {policyPages[currentPage].label}</p><h1 dangerouslySetInnerHTML={{ __html: policyPages[currentPage].title }} /></div><p>Information for customers, collectors, and visitors to the Gems Insider website.</p></div>
        <div className="policy-content">{policyPages[currentPage].paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      </section> : currentPage === 'team' ? <section className="team-page" id="team">
        <div className="team-heading">
          <div>
            <p className="eyebrow">The people behind the stones</p>
            <h1>Meet the<br /><em>team.</em></h1>
          </div>
          <p>Knowledge, care, and a shared commitment to bringing exceptional gemstones into view.</p>
        </div>
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <article className="team-card" key={member.name}>
              <div className="team-portrait"><img src={member.image} alt={member.name} /><small>0{index + 1}</small></div>
              <div className="team-card-copy">
                <p className="team-role">{member.role}</p>
                <h2>{member.name}</h2>
                <p>{member.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </section> : currentPage === 'contact' ? <section className="contact-page" id="contact">
        <div className="contact-heading">
          <div>
            <p className="eyebrow">Contact Us team</p>
            <h1>Contact<br /><em>us.</em></h1>
          </div>
          <p>Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>
        <form className="contact-form" onSubmit={submitContact}>
          <div className="form-row">
            <label><span>Your name</span><input name="name" type="text" placeholder="Full name" required /></label>
            <label><span>Email address</span><input name="email" type="email" placeholder="you@example.com" required /></label>
          </div>
          <label><span>Subject</span><input name="subject" type="text" placeholder="How can we help?" required /></label>
          <label><span>Your message</span><textarea name="message" rows="6" placeholder="Tell us about the stone or collection you are interested in." required></textarea></label>
          <div className="form-submit">
            {contactError && <p className="payment-error" role="alert">{contactError}</p>}
            {contactSent && <p className="form-success">Thank you. Your message is ready for the Gems Insider team.</p>}
            <button type="submit">Send message <span aria-hidden="true">↗</span></button>
          </div>
        </form>
      </section> : <section className="about-page" id={currentPage}>
        <div className="about-heading">
          <div>
            <p className="eyebrow">Gems Insider: Inside the world of rare gems.</p>
            <h1>Our story,<br /><em>with substance.</em></h1>
          </div>
          <p className="about-lead">GEMS INSIDER is a trusted gemstone company dedicated to quality natural stones, transparent sourcing, and lasting relationships.</p>
        </div>
        <div className="about-facts" aria-label="Gems Insider facts">
          <div><strong>2021</strong><span>Established</span></div>
          <div><strong>Natural</strong><span>Gemstones only</span></div>
          <div><strong>03</strong><span>Industry affiliations</span></div>
        </div>
        <div className="about-content">
          <p>GEMS INSIDER is a trusted gemstone company dedicated to sourcing, evaluating, and supplying quality natural gemstones to clients, collectors, and jewelry professionals. Established in 2021, we have built our business around a commitment to quality, authenticity, transparency, and customer satisfaction.</p>
          <p>Since our establishment, we have actively participated in gemstone shows, exhibitions, and industry events. These connections bring us together with professionals, collectors, traders, and enthusiasts from around the world while continuously expanding our knowledge and network within the industry.</p>
          <p>GEMS INSIDER is registered with respected industry and business organizations, including the Sarhad Chamber of Commerce &amp; Industry (<strong>SCCI</strong>), All Pakistan Commercial Exporters Association (<strong>APCEA</strong>), and the Pakistan Gems &amp; Minerals Manufacturers &amp; Exporters Association (<strong>PGMMA</strong>).</p>
          <p>Our mission is to provide carefully selected gemstones while maintaining professional standards and building long-term relationships based on trust, integrity, and quality. We believe every gemstone has its own unique character and story, and our goal is to bring that value to customers around the world.</p>
        </div>
      </section>}

      {currentPage === 'home' && <section className="collection-section" id="featured-collection">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The first edit</p>
            <h2>Stones with<br /><em>a point of view.</em></h2>
          </div>
          <p className="section-note">Eight glimpses into a larger world of colour, clarity, and character.</p>
        </div>
        <div className="gem-grid">
          {gemstones.map((gemstone, index) => (
            <a className={`gem-card gem-card-${index + 1}`} href="#collection" onClick={(event) => handleNavigation(event, '#collection')} key={gemstone.name}>
              <div className="gem-media">
                <LazyVideo src={gemstone.media} label={`${gemstone.name} gemstone video`} />
                <span className="gem-index">0{index + 1}</span>
                <button className="fullscreen-button" type="button" aria-label={`View ${gemstone.name} video fullscreen`} onClick={handleFullscreen}>⛶</button>
              </div>
              <div className="gem-details">
                <h3>{gemstone.name}</h3>
                <p>{gemstone.origin}</p>
                <span aria-hidden="true">↗</span>
              </div>
            </a>
          ))}
        </div>
      </section>}

      <footer className="site-footer" id="contact">
        <div className="footer-brand">
          <img src={theme === 'light' ? '/logo-gems-insider-light.png' : logo} alt="Gems Insider" />
          <p>Natural colour. Individual character.</p>
        </div>
        <div className="footer-social">
          <p className="footer-label">Follow &amp; explore</p>
          <a href="https://www.instagram.com/gemsinsider.co" target="_blank" rel="noreferrer">Instagram ↗</a>
          <a href="https://www.tiktok.com/@gems_insider" target="_blank" rel="noreferrer">TikTok ↗</a>
          <a href="#home" onClick={(event) => handleNavigation(event, '#home')}>Back to top ↑</a>
        </div>
        <div className="footer-policies">
          <p className="footer-label">Our policies</p>
          <a href="#privacy" onClick={(event) => handleNavigation(event, '#privacy')}>Privacy</a>
          <a href="#refund" onClick={(event) => handleNavigation(event, '#refund')}>Refunds</a>
          <a href="#terms" onClick={(event) => handleNavigation(event, '#terms')}>Terms</a>
          <a href="#faqs" onClick={(event) => handleNavigation(event, '#faqs')}>FAQs</a>
        </div>
        <div className="footer-store">
          <p className="footer-label">Our shop</p>
          <p>Gems Insider, 4B Salman Market basement near Shah Qabool Masjid, Namak Mandi, Peshawar 25000, Pakistan.</p>
          <a href="https://share.google/CKdBsnFrzFXQtT73i" target="_blank" rel="noreferrer">Open Google Maps ↗</a>
        </div>
        <div className="footer-contact">
          <p className="footer-label">Contact us</p>
          <a href="tel:+923339940220">+92 333 9940220</a>
          <a href="mailto:gemsinsider@gmail.com">gemsinsider@gmail.com</a>
          <a href="https://wa.me/923339940220" target="_blank" rel="noreferrer">WhatsApp ↗</a>
        </div>
        <div className="footer-bottom">
          <p className="footer-caption">© 2026 Gems Insider · Pakistan Registered</p>
        </div>
      </footer>

      {notice && <div className="site-notice" role="status">{notice}</div>}

      {searchOpen && <div className="search-panel"><label htmlFor="global-search">Search the collection</label><input id="global-search" autoFocus type="search" value={globalSearch} onChange={(event) => { setGlobalSearch(event.target.value); if (currentPage !== 'collection') handleNavigation(event, '#collection') }} placeholder="Search by gemstone, category, or color" /><button type="button" onClick={() => { setGlobalSearch(''); setSearchOpen(false) }} aria-label="Close search">×</button></div>}

      {cartOpen && <div className="overlay" role="presentation" onClick={() => setCartOpen(false)}>
        <aside className="cart-drawer" role="dialog" aria-label="Shopping cart" onClick={(event) => event.stopPropagation()}>
          <div className="drawer-heading"><div><p className="eyebrow">Your selection</p><h2>Shopping cart</h2></div><button type="button" onClick={() => setCartOpen(false)} aria-label="Close cart">×</button></div>
          {cart.length ? <>
            <div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><div><strong>{item.name}</strong><span>{item.category} · {item.price}</span></div><button type="button" onClick={() => setCart((currentCart) => currentCart.filter((cartItem) => cartItem.id !== item.id))}>Remove</button></div>)}</div>
            <button className="drawer-buy" type="button" onClick={buyCart}>Buy selected stones ↗</button>
          </> : <p className="empty-state">Your cart is waiting for something exceptional.</p>}
        </aside>
      </div>}

      {authOpen && <div className="overlay" role="presentation" onClick={() => setAuthOpen(false)}>
        <div className="auth-modal" role="dialog" aria-label="Account login" onClick={(event) => event.stopPropagation()}>
          <button className="modal-close" type="button" onClick={() => setAuthOpen(false)} aria-label="Close login">×</button>
          <p className="eyebrow">Gems Insider account</p><h2>{authMode === 'login' ? 'Welcome back.' : 'Create an account.'}</h2>
          <p className="auth-note">{pendingBuy.length ? `Please sign in before buying ${pendingBuy.length === 1 ? 'this gemstone' : `${pendingBuy.length} selected stones`}.` : 'Sign in to manage your cart and orders.'}</p>
          {pendingBuy.length > 1 && <div className="pending-items">{pendingBuy.map((item) => <span key={item.id}>{item.name}</span>)}</div>}
          <form onSubmit={submitAuth} className="auth-form">
            {authMode === 'register' && <label><span>Your name</span><input name="name" type="text" required /></label>}
            <label><span>Email address</span><input name="email" type="email" required /></label>
            <label><span>Password</span><input name="password" type="password" minLength="6" required /></label>
            {authError && <p className="auth-error">{authError}</p>}
            <button type="submit">{authMode === 'login' ? 'Log in' : 'Create account'} ↗</button>
          </form>
          <button className="auth-switch" type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError('') }}>{authMode === 'login' ? 'Need an account? Register' : 'Already registered? Log in'}</button>
        </div>
      </div>}

      {paymentOpen && <div className="overlay" role="presentation" onClick={() => setPaymentOpen(false)}>
        <div className="auth-modal payment-modal" role="dialog" aria-label="Card payment" onClick={(event) => event.stopPropagation()}>
          <button className="modal-close" type="button" onClick={() => setPaymentOpen(false)} aria-label="Close payment">×</button>
          <p className="eyebrow">Card payment</p>
          <h2>Secure your selection.</h2>
          <form onSubmit={submitDemoPayment} className="auth-form">
            <label><span>Cardholder name</span><input name="cardholder" type="text" autoComplete="cc-name" required /></label>
            <label><span>Card number</span><input name="cardNumber" type="text" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" maxLength="19" required onChange={formatCardNumber} /></label>
            <div className="payment-fields">
              <label><span>Expiry</span><input name="expiry" type="text" inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY" maxLength="5" required onChange={formatExpiry} /></label>
              <label><span>CVV</span><input name="cvv" type="password" inputMode="numeric" autoComplete="cc-csc" maxLength="4" required onChange={formatCVV} /></label>
            </div>
            {paymentError && <p className="payment-error" role="alert">{paymentError}</p>}
            <button type="submit">Complete payment ↗</button>
          </form>
        </div>
      </div>}
    </main>
  )
}

export default App
