import Navbar from "../../components/Navbar";
import { Briefcase, Users, Building2, CheckCircle, Mail, MapPin } from "lucide-react";
import wcu from "../../assets/hero.jpg";
import herobg from "../../assets/hero.avif";
import partner1 from "./partners/our_partners1.png";
import partner2 from "./partners/our_partners2.png";
import partner3 from "./partners/our_partners3.png";
import partner4 from "./partners/our_partners4.png";
import { Link } from "react-router-dom";
import { TiSocialFacebook, TiSocialInstagram, TiSocialLinkedin } from "react-icons/ti";

export default function Landing() {
  return (
    <div className="bg-[var(--bg-primary)] text-[var(--text-primary)]">

      <Navbar />

      {/* HERO */}
      <section className="relative h-[100vh] flex items-center justify-center text-center">
        <img
          src={herobg}
          alt="Hero background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 max-w-3xl px-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            Your Career Starts Here
          </h1>
          <p className="mt-4 text-lg text-gray-200">
            Connect with top companies and unlock opportunities that shape your future.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <a
              href="/register"
              className="px-6 py-3 bg-[var(--color-accent)] text-black font-semibold rounded-lg hover:opacity-90 transition"
            >
              Get Started
            </a>
            <a
              href="/login"
              className="px-6 py-3 border border-white text-white rounded-lg hover:bg-white/10 transition"
            >
              Login
            </a>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-16 px-6 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">About Our Platform</h2>
        <p className="text-[var(--text-secondary)]">
          We bridge the gap between talented individuals and leading companies.
          Our platform simplifies job search and recruitment with a seamless experience.
        </p>
      </section>

      {/* SERVICES */}
      <section className="py-16 px-6 bg-[var(--bg-secondary)]">
        <h2 className="text-3xl font-bold text-center mb-10">What We Provide</h2>
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">

          {[
            {
              icon: Briefcase,
              title: "Jobs for Everyone",
              desc: "Discover jobs tailored to your skills and interests.",
            },
            {
              icon: Users,
              title: "Easy Hiring",
              desc: "Employers can find and hire the best talent quickly.",
            },
            {
              icon: Building2,
              title: "Trusted Companies",
              desc: "Work with verified companies from various industries.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-6 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-sm hover:shadow-md transition"
            >
              <Icon className="text-[var(--color-primary)] mb-4" />
              <h3 className="font-semibold text-lg text-[var(--text-primary)]">{title}</h3>
              <p className="text-[var(--text-secondary)] mt-2">{desc}</p>
            </div>
          ))}

        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-16 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-3xl font-bold mb-6">Why Choose Us</h2>
          <ul className="space-y-4">
            {[
              "Simple and fast job application process",
              "Verified job listings",
              "Dedicated dashboards for all roles",
              "Seamless communication with employers",
            ].map((item) => (
              <li key={item} className="flex gap-2 items-center text-[var(--text-primary)]">
                <CheckCircle className="text-[var(--color-primary)] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center bg-[var(--color-primary)] text-white">
        <h2 className="text-3xl font-bold mb-4">Take the Next Step in Your Career</h2>
        <p className="mb-6 opacity-90">Join thousands of professionals and companies today.</p>
        <a
          href="/register"
          className="px-6 py-3 bg-[var(--color-accent)] text-black rounded-lg font-semibold hover:opacity-90 transition"
        >
          Join Now
        </a>
      </section>

      {/* FOOTER */}
      <footer className="bg-[var(--bg-secondary)] pt-16 pb-8 border-t border-[var(--border-color)]">

        {/* OUR PARTNERS */}
        <div className="max-w-7xl mx-auto px-6 mb-12 border-b border-[var(--border-color)] pb-12">
          <h3 className="text-center font-bold text-[var(--text-primary)] text-xl mb-8 uppercase tracking-wider">
            Our Partners
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 transition-opacity duration-300">
            <img src={partner1} alt="Partner 1" className="h-12 object-contain opacity-80 hover:opacity-100 transition" />
            <img src={partner2} alt="Partner 2" className="h-12 object-contain opacity-80 hover:opacity-100 transition" />
            <img src={partner3} alt="Partner 3" className="h-12 object-contain opacity-80 hover:opacity-100 transition" />
            <img src={partner4} alt="Partner 4" className="h-12 object-contain opacity-80 hover:opacity-100 transition" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1 bg-[var(--color-primary)] p-6 rounded-2xl shadow-md">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-4">
              Shnoor International
            </h2>
            <p className="text-sm text-white/90 leading-relaxed">
              Connecting top talent with world-class companies. Your next big career move starts right here.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-bold text-[var(--text-primary)] mb-4">Other Services</h3>
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              {["Cloud Management","Enterprise Management","Data & Artificial-Intelligence","Consulting-and-Staffing","Background Verification","Health Care"].map((s) => (
                <li key={s}>
                  <a href="#" className="hover:text-[var(--color-primary)] transition-colors">{s}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* For Candidates */}
          <div>
            <h3 className="font-bold text-[var(--text-primary)] mb-4">For Candidates</h3>
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              <li><a href="/login" className="hover:text-[var(--color-primary)] transition-colors">Browse Jobs</a></li>
              <li><a href="/login" className="hover:text-[var(--color-primary)] transition-colors">Candidate Login</a></li>
              <li><a href="/register" className="hover:text-[var(--color-primary)] transition-colors">Create Resume</a></li>
              <li><a href="#" className="hover:text-[var(--color-primary)] transition-colors">Job Alerts</a></li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h3 className="font-bold text-[var(--text-primary)] mb-4">For Employers</h3>
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              <li><a href="/login" className="hover:text-[var(--color-primary)] transition-colors">Post a Job</a></li>
              <li><a href="/login" className="hover:text-[var(--color-primary)] transition-colors">Employer Login</a></li>
              <li><a href="#" className="hover:text-[var(--color-primary)] transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-[var(--color-primary)] transition-colors">Recruiting Solutions</a></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-bold text-[var(--text-primary)] mb-4">Connect With Us</h3>
            <div className="flex gap-4 mb-6">
              <a href="https://www.linkedin.com/company/shnoor-international/" className="text-[var(--text-secondary)] hover:text-[var(--color-accent)] transition-colors">
                <TiSocialLinkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--color-accent)] transition-colors">
                <TiSocialFacebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--color-accent)] transition-colors">
                <TiSocialInstagram className="w-5 h-5" />
              </a>
            </div>
            <h3 className="font-bold text-[var(--text-primary)] mb-4">Contacts</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              <Mail className="inline w-8 h-4" /> info@shnoor.com
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="max-w-7xl mx-auto px-6 mt-12 flex flex-col items-center text-center">
          <h3 className="font-bold text-[var(--text-primary)] text-lg mb-2">Location</h3>
          <p className="text-[var(--text-secondary)] flex items-center justify-center gap-2">
            <MapPin className="w-5 h-5" />
            <span>10009 Mount Tabor Road, Odessa Missouri, United States.</span>
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-[var(--border-color)] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            © {new Date().getFullYear()} Shnoor International LLC. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-[var(--text-secondary)]">
            <a href="#" className="hover:text-[var(--color-accent)] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--color-accent)] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[var(--color-accent)] transition-colors">Cookie Policy</a>
          </div>
        </div>
      </footer>

    </div>
  );
}