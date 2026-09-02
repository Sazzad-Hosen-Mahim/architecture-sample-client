import HeroSocialMedia from "@/components/homeComponent/HeroSocialMedia";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSendContactMessageMutation } from "@/redux/api/contactApi";

const EMPTY_FORM = { name: "", email: "", message: "", website: "" };

const Contact = () => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [sendContactMessage, { isLoading }] = useSendContactMessageMutation();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.message.trim().length < 10) {
      toast.error("Please write a little more so we can help you properly.");
      return;
    }

    try {
      const res = await sendContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
        website: formData.website,
      }).unwrap();

      toast.success(res?.message || "Thanks for reaching out!");
      setFormData(EMPTY_FORM);
    } catch (error: any) {
      const detail = error?.data?.message;
      toast.error(
        Array.isArray(detail)
          ? detail[0]?.constraints?.[0] ||
              "Please check the form and try again."
          : detail || "Could not send your message. Please try again.",
      );
    }
  };

  return (
    <div className="flex flex-col">
      <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8 flex-1">
        <h1 className="text-2xl font-light text-center mb-2 md:mb-8">
          Contact Us
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-12 ">
          <div className="flex flex-col justify-between my-0">
            <form onSubmit={handleSubmit} className="space-y-4 ">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:border-black"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:border-black"
                />
              </div>
              <div className="my-0">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:border-black resize-vertical"
                />
              </div>
              {/* Honeypot — hidden from real users, catches naive bots. */}
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />
            </form>
          </div>
          <div className="space-y-4 flex flex-col justify-between">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 mr-3 text-gray-400" />
                    <span className="text-gray-800 font-semibold">
                      contactus@architecturesimple.com
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-600">
                      Please email the contact above. Additional contact
                      information can be given through our response if
                      necessary.
                    </p>
                    <p className="text-gray-800 mt-4">
                      <span className="font-bold">
                        Special Note from the CEO:
                      </span>{" "}
                      I will appreciate notes, tips, or pointers on how to
                      improve this website application. Please also use this
                      form to let me know how we can improve your experience
                      using this site. Thank you.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              onClick={handleSubmit}
              className="w-full bg-black hover:bg-gray-800 cursor-pointer text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* HeroSocialMedia with proper spacing */}
      <div className=" mb-32">
        <HeroSocialMedia />
      </div>
    </div>
  );
};

export default Contact;
