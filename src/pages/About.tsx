import HeroSocialMedia from "@/components/homeComponent/HeroSocialMedia";
// import { ArrowLeft } from "lucide-react";
// import { CiInstagram } from "react-icons/ci";
// import { FaFacebook } from "react-icons/fa";
import { Link } from "react-router-dom";

const About = () => {
  // const navigate = useNavigate();
  return (
    <div className="h-screen">
      {/* <Button>About Us Page</Button> */}
      {/* <div className="max-w-7xl mx-auto pt-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>
      </div> */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-center mx-auto w-6/7 md:w-2/3">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="space-y-6 text-gray-600 text-justify">
              <p className="text-sm">
                Welcome to Architecture Simple. Established in 2023, we are a
                Architecture Media Company and Design Firm dedicated to sharing,
                exploring, and creating Architecture that embodies our care for
                the practice.
              </p>
              <p className="text-sm">
                Through our media platform, we present Architecture from around
                the world to celebrate the achievements of other respected
                Architects who share our regard for the land and built world and
                grapple with the challenges of bringing those two worlds
                together. We look at Architecture through its ideas, its
                context, and the way it shapes the places we inhabit.
              </p>
              <p className="text-sm">
                Through our design practice, we provide Architectural
                Professional Services across residential and commercial
                projects. Each project beginning with an understanding of its
                place, purpose, and people to develop a clear Architectural
                response from those conditions.
              </p>
              <p className="text-sm">
                We believe Architecture is in service to people first, because
                it is the people that give identity to a place. Climate,
                culture, history, native material, structure, and craft all
                contribute to that identity. These ideas should carry through
                every scale of a project, from the whole to the detail and from
                what is immediately perceived to what is experienced over time.
              </p>
              <p className="text-sm">
                At its core, Architecture Simple exist to purely share
                Architecture and contribute to it. Our media informs our
                perspective and our practice puts that perspective into action.
                It is no more complicated than that.
              </p>
              <p className="text-sm">Keep it Simple.</p>
              <h1 className="text-md font-semibold">
                Eric Rivera <br />
                <p className="italic font-light">- Founder & Principal</p>
              </h1>
            </div>
            <div className="mt-auto">
              <Link to="/contact" className="block">
                <button className="w-full py-4 px-8 text-black text-lg cursor-pointer font-light tracking-wider uppercase transition-all duration-300 ease-in-out hover:bg-black hover:text-white rounded-md border-2 border-black relative focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50">
                  <span className="relative z-10">Contact Us</span>
                  <span className="absolute inset-2 border border-black rounded-md pointer-events-none"></span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer section */}
        <div className="mb-32 mt-12">
          <HeroSocialMedia />
        </div>
      </div>
    </div>
  );
};

export default About;
