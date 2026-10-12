import {useEffect, useState} from "react";
import {assets} from "../assets/assets.js";
import {Link, useLocation} from "react-router-dom";
import {Menu, X} from "lucide-react";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const navLinks = [
        { name: 'Home', to: '/home', sectionId: 'home' },
        { name: 'About Us', to: '/home#about', sectionId: 'about' },
        { name: 'Contact Us', to: '/home#contact', sectionId: 'contact' }
    ];

    const handleSectionClick = (sectionId) => {
        setIsMenuOpen(false);
        if (location.pathname !== "/home") return;

        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth";
        if (sectionId === "home") {
            window.scrollTo({top: 0, behavior});
            return;
        }

        document.getElementById(sectionId)?.scrollIntoView({behavior, block: "start"});
    };

    useEffect(() => {
        if (location.pathname !== "/home") return;

        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth";
        const frameId = requestAnimationFrame(() => {
            if (location.hash) {
                const sectionId = decodeURIComponent(location.hash.slice(1));
                document.getElementById(sectionId)?.scrollIntoView({
                    behavior,
                    block: "start",
                });
            } else {
                window.scrollTo({top: 0, behavior});
            }
        });

        return () => cancelAnimationFrame(frameId);
    }, [location.pathname, location.hash]);

    return (
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link to="/home" onClick={() => handleSectionClick("home")} className="flex items-center gap-2">
                        <img src={assets.logo} alt="logo" className="h-10 w-10" />
                        <span className="text-lg font-bold text-black truncate">BudgetAI</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                to={link.to}
                                key={link.name}
                                onClick={() => handleSectionClick(link.sectionId)}
                                className="text-gray-600 hover:text-purple-600 transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Action Buttons & Hamburger Menu */}
                    <div className="flex items-center space-x-4">
                        <div className="hidden sm:flex items-center space-x-4">
                            <Link to="/login" className="text-gray-600 hover:text-purple-600 transition-colors">
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                            >
                                Get Started
                            </Link>
                        </div>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
                            aria-label="Toggle menu"
                            aria-expanded={isMenuOpen}
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="lg:hidden bg-white border-t border-gray-200">
                    <div className="container mx-auto px-4 py-4">
                        <nav className="flex flex-col space-y-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.to}
                                    onClick={() => handleSectionClick(link.sectionId)}
                                    className="text-gray-600 hover:text-purple-600 transition-colors"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="flex flex-col space-y-3 pt-4 border-t border-gray-100">
                                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-gray-600 hover:text-purple-600 transition-colors w-full text-left">
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-center"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;