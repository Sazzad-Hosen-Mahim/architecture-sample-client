import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin } from "lucide-react";

function HeroSocialMedia() {
  return (
    <>
      <hr className="border-t border-gray-300 mt-4" />
      <div className=" my-5">
        {/* Contact Information */}
        <div className="text-center text-sm text-gray-600 space-y-2 mb-4">
          <p className="text-sm font-light text-gray-500">Keep it Simple.</p>
        </div>

        {/* Social Media Icons */}
        <div className="flex justify-center space-x-6">
          <a
            href="https://www.linkedin.com/company/architecture-simple/?viewAsMember=true"
            target="_blank"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Linkedin className="w-6 h-6" />
          </a>
          <a
            href="https://www.facebook.com/profile.php?id=61552013432338&mibextid=wwXIfr&mibextid=wwXIfr"
            target="_blank"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Facebook className="w-6 h-6" />
          </a>
          <Link
            to="https://www.instagram.com/architecturesimple"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Instagram className="w-6 h-6" />
          </Link>
          {/* <Link
          to="#"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </Link> */}
        </div>
        {/* Keep it Simple tagline */}
        <div className="text-center mt-4">
          <p className="text-sm font-light text-gray-500">
            Architecture Simple Inc.
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
    </>
  );
}

export default HeroSocialMedia;
