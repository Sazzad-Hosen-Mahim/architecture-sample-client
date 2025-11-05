import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, X } from "lucide-react";

function HeroSocialMedia() {
  return (
    <div className=" mb-3">
      {/* Contact Information */}
      <div className="text-center text-sm text-gray-600 space-y-2 mb-4">
        <p className="text-sm font-light text-gray-500">Keep it Simple.</p>
      </div>

      {/* Social Media Icons */}
      <div className="flex justify-center space-x-6">
        <Link
          to="#"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Linkedin className="w-6 h-6" />
        </Link>
        <Link
          to="#"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Facebook className="w-6 h-6" />
        </Link>
        <Link
          to="https://www.instagram.com/architecturesimple"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Instagram className="w-6 h-6" />
        </Link>
        <Link
          to="#"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </Link>
      </div>
      {/* Keep it Simple tagline */}
      <div className="text-center mt-4">
        <p className="text-sm font-light text-gray-500">
          Architecture Simple LLC
        </p>
      </div>
      <div className="text-center mt-2 space-x-4">
        <div className="block md:hidden">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
            Mobile
          </Link>
          <Link
            to="/"
            className="text-sm ml-2 text-gray-500 hover:text-gray-700"
          >
            Desktop
          </Link>
        </div>
        <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-700">
          Terms of Service
        </Link>
        <Link
          to="/privacy"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}

export default HeroSocialMedia;
