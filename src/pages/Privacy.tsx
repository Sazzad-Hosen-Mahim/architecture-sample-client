import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 mt-5 ">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-5 sm:px-6 lg:px-8 pb-10">
        <h1 className="text-xl  mb-6">Privacy Policy</h1>

        {/* 1. Introduction */}
        <section className="mb-8">
          <h2 className="text-xl  mb-4">1. Introduction</h2>
          <p className="mb-4 text-sm">
            At Architecture Simple, we respect your privacy and are committed to
            protecting your personal data. This privacy policy explains how we
            collect, use, store, and protect your data when you use our website,
            project management dashboard, media platform, and related services.
          </p>
        </section>

        {/* 2. The Data We Collect */}
        <section className="mb-8 ">
          <h2 className="text-xl  mb-4">2. The Data We Collect About You</h2>
          <p className="mb-4 text-sm">
            “Personal data” means any information that can identify an
            individual. We may collect, use, store, and transfer different kinds
            of personal data about you, including:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-sm">
            <li>
              <strong>Identity Data:</strong> first name, middle name, last
              name, username or similar identifier.
            </li>
            <li>
              <strong>Contact Data:</strong> email address, telephone numbers,
              mailing address.
            </li>
            <li>
              <strong>Project Data:</strong> project name, site address, design
              preferences, budget information, uploaded documents (e.g., survey
              maps, photos), and any other details you share via our inquiry
              forms or dashboard.
            </li>
            <li>
              <strong>Appointment Data:</strong> consultation dates, times,
              appointment types, and any notes you provide.
            </li>
            <li>
              <strong>User-Generated Content:</strong> comments, votes, ratings,
              and media you post on our platform.
            </li>
            <li>
              <strong>Technical Data:</strong> IP address, browser type and
              version, time zone, device info, OS, and technologies used to
              access our website.
            </li>
            <li>
              <strong>Usage Data:</strong> how you interact with our website,
              services, and media features.
            </li>
          </ul>
        </section>

        {/* 3. How We Use Your Personal Data */}
        <section className="mb-8">
          <h2 className="text-xl  mb-4">3. How We Use Your Personal Data</h2>
          <p className="mb-4 text-sm">
            We will only use your personal data when the law allows us to. Most
            commonly, we will use your data to:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-sm">
            <li>
              Provide, manage, and improve our architectural services and online
              dashboard.
            </li>
            <li>Deliver design proposals and related services.</li>
            <li>
              Facilitate appointment scheduling and communication with you.
            </li>
            <li>Enable comments, voting, and media uploads on our platform.</li>
            <li>Respond to inquiries and offer customer support.</li>
            <li>Comply with legal and regulatory obligations.</li>
            <li>Ensure the security and integrity of our services.</li>
          </ul>
        </section>

        {/* 4. Data Security */}
        <section className="mb-8">
          <h2 className="text-xl  mb-4">4. Data Security</h2>
          <p className="mb-4 text-sm">
            We implement appropriate technical and organizational security
            measures to protect your data from unauthorized access, loss, or
            misuse. This includes:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-sm">
            <li>Secure storage of project documentation.</li>
            <li>Encrypted communications where appropriate.</li>
            <li>Access limited to those with a business need to know.</li>
          </ul>
        </section>

        {/* 5. Data Retention */}
        <section className="mb-8">
          <h2 className="text-xl  mb-4">5. Data Retention</h2>
          <p className="mb-4 text-sm">
            We will retain your personal data only for as long as necessary to
            fulfill the purposes for which we collected it, including:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-sm">
            <li>Managing active projects and client relationships.</li>
            <li>Complying with legal, tax, and reporting obligations.</li>
            <li>
              Maintaining historical project records in accordance with
              professional standards.
            </li>
          </ul>
        </section>

        {/* 6. Your Legal Rights */}
        <section className="mb-8">
          <h2 className="text-xl  mb-4">6. Your Legal Rights</h2>
          <p className="mb-4 text-sm">
            Under certain data protection laws, you may have rights in relation
            to your personal data, including:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-sm">
            <li>Access your personal data.</li>
            <li>Correct your personal data.</li>
            <li>
              Erase your data (subject to legal or contractual retention).
            </li>
            <li>Object to processing of your data.</li>
            <li>Restrict processing of your data.</li>
            <li>Request data portability.</li>
            <li>Withdraw consent where applicable.</li>
            <li>
              Request removal of user-generated content from our public
              platform.
            </li>
          </ul>
        </section>

        {/* 7. User-Generated Content */}
        <section className="mb-8">
          <h2 className="text-xl  mb-4">7. User-Generated Content</h2>
          <p className="mb-4 text-sm">
            Our platform includes features like comments, voting, and media
            uploads. By submitting content, you agree to:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-sm">
            <li>Ensure your content is lawful, respectful, and accurate.</li>
            <li>Allow us to moderate, remove, or edit content as needed.</li>
            <li>
              Grant Architecture Simple a non-exclusive, worldwide, royalty-free
              license to use and display your content on our platform.
            </li>
          </ul>
        </section>

        {/* 8. Changes to Policy */}
        <section className="mb-8">
          <h2 className="text-xl  mb-4">8. Changes to the Privacy Policy</h2>
          <p className="mb-4 text-sm">
            We may update this policy from time to time. Updates will be posted
            on this page with a revised effective date. You are encouraged to
            review this policy periodically.
          </p>
        </section>

        {/* 9. Contact Us */}
        <section>
          <h2 className="text-xl  mb-4">9. Contact Us</h2>
          <p className="mb-4 text-sm">
            If you have questions about this policy or how we handle your data,
            contact us at:
          </p>
          <p className="mb-2">Email: privacy@architecturesimple.com</p>
          <p className="mb-2">Phone: (925) 922-4374</p>
          {/* <p>
            Architecture Simple LLC
            <br />
            1222 Market St. Suite 400
            <br />
            Oakland, CA 92101
          </p> */}
        </section>
      </div>
    </div>
  );
}
